import { ofetch } from "ofetch";
import type { AppConfig } from "../config.js";
import { getAuthCookie, missingAuthMessage } from "./auth.js";
import type { DiskCache } from "./cache.js";
import { mflError, toArray } from "./normalize.js";

const GLOBAL_TYPES = new Set([
  "players",
  "playerProfile",
  "playerRanks",
  "adp",
  "aav",
  "injuries",
  "topAdds",
  "nflByeWeeks",
  "myleagues",
]);

const HOST_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

type JsonObject = Record<string, unknown>;

function hostFromBaseUrl(baseURL: string): string | null {
  try {
    return new URL(baseURL).host;
  } catch {
    return null;
  }
}

export class MflClient {
  private lastRequestTs = 0;
  private leagueHost: string | null;

  constructor(
    private readonly config: AppConfig,
    private readonly cache: DiskCache,
  ) {
    this.leagueHost = config.host ?? null;
  }

  private hostCacheKey(): string {
    return `league_host_${this.config.leagueId}`;
  }

  private async throttle(): Promise<void> {
    const minInterval = 1000;
    const elapsed = Date.now() - this.lastRequestTs;
    if (elapsed < minInterval) {
      await new Promise((r) => setTimeout(r, minInterval - elapsed));
    }
    this.lastRequestTs = Date.now();
  }

  private async discoverHostFromMyLeagues(): Promise<string | null> {
    if (!this.config.username && !this.config.apiKey) return null;
    try {
      const payload = await this.export<any>("myleagues", {}, true);
      const leagues = toArray(payload.leagues?.league ?? payload.league);
      const match = leagues.find(
        (league: any) => String(league.id) === this.config.leagueId,
      );
      if (!match) return null;
      if (typeof match.host === "string" && match.host.includes(".")) {
        return match.host;
      }
      if (typeof match.host === "string") {
        return `${match.host}.myfantasyleague.com`;
      }
      if (typeof match.url === "string") {
        return hostFromBaseUrl(match.url);
      }
    } catch {
      return null;
    }
    return null;
  }

  private async ensureLeagueHost(): Promise<string> {
    if (this.leagueHost) return this.leagueHost;

    const cached = await this.cache.get<string>(this.hostCacheKey());
    if (cached) {
      this.leagueHost = cached;
      return cached;
    }

    const discovered = await this.discoverHostFromMyLeagues();
    if (discovered) {
      this.leagueHost = discovered;
      await this.cache.set(this.hostCacheKey(), discovered, HOST_CACHE_TTL_MS);
      return discovered;
    }

    throw new Error(
      "MFL_HOST is required when the league host is not cached. " +
        "Set MFL_HOST to the host from your league URL " +
        "(for example www12.myfantasyleague.com).",
    );
  }

  private rememberHostFromPayload(type: string, payload: JsonObject): void {
    if (type !== "league") return;
    const league = payload.league as { baseURL?: string } | undefined;
    if (!league?.baseURL) return;
    const host = hostFromBaseUrl(league.baseURL);
    if (!host) return;
    this.leagueHost = host;
    void this.cache.set(this.hostCacheKey(), host, HOST_CACHE_TTL_MS);
  }

  private routeHost(type: string): string | Promise<string> {
    if (GLOBAL_TYPES.has(type)) return "api.myfantasyleague.com";
    return this.ensureLeagueHost();
  }

  async export<T extends JsonObject>(
    type: string,
    params: Record<string, string> = {},
    needsAuth = false,
  ): Promise<T> {
    const host = await this.routeHost(type);
    const search = new URLSearchParams({
      TYPE: type,
      JSON: "1",
      ...params,
    });
    if (!GLOBAL_TYPES.has(type)) {
      search.set("L", this.config.leagueId);
    }

    const headers: Record<string, string> = {
      "User-Agent": this.config.userAgent,
    };

    if (needsAuth) {
      if (this.config.apiKey) {
        search.set("APIKEY", this.config.apiKey);
      } else {
        const cookie = await getAuthCookie(this.config, this.cache);
        if (!cookie) throw new Error(missingAuthMessage());
        headers.Cookie = `MFL_USER_ID=${encodeURIComponent(cookie)}`;
      }
    }

    await this.throttle();
    const url = `https://${host}/${this.config.year}/export?${search.toString()}`;

    try {
      const payload = await ofetch<T>(url, { headers, retry: 0 });
      const err = mflError(payload);
      if (err) throw new Error(err);
      this.rememberHostFromPayload(type, payload);
      return payload;
    } catch (error) {
      if (String(error).includes("429")) {
        await new Promise((r) => setTimeout(r, 1200));
      }
      throw error;
    }
  }

  async import(
    type: string,
    params: Record<string, string>,
  ): Promise<JsonObject> {
    const host = await this.ensureLeagueHost();
    const cookie = await getAuthCookie(this.config, this.cache);
    if (!cookie)
      throw new Error("No credentials available for import request.");
    await this.throttle();
    return ofetch(`https://${host}/${this.config.year}/import`, {
      method: "POST",
      body: new URLSearchParams({
        TYPE: type,
        L: this.config.leagueId,
        ...params,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this.config.userAgent,
        Cookie: `MFL_USER_ID=${encodeURIComponent(cookie)}`,
      },
      retry: 0,
    });
  }
}
