import FuzzySet from "fuzzyset.js";
import type { DiskCache } from "../mfl/cache.js";
import type { MflClient } from "../mfl/client.js";
import { toArray } from "../mfl/normalize.js";

const PLAYERS_CACHE_KEY = "players_details";
const DAY_MS = 1000 * 60 * 60 * 24;

export type MflPlayer = {
  id: string;
  name: string;
  team?: string;
  position?: string;
  fantasypros_id?: string;
  espn_id?: string;
  cbs_id?: string;
  rotowire_id?: string;
};

export class PlayerStore {
  constructor(
    private readonly client: MflClient,
    private readonly cache: DiskCache,
  ) {}

  async all(): Promise<MflPlayer[]> {
    const cached = await this.cache.get<MflPlayer[]>(PLAYERS_CACHE_KEY);
    if (cached) return cached;
    const payload = await this.client.export<{
      players: { player: MflPlayer[] | MflPlayer };
    }>("players", {
      DETAILS: "1",
    });
    const players = toArray(payload.players.player);
    await this.cache.set(PLAYERS_CACHE_KEY, players, DAY_MS);
    return players;
  }

  async search(term: string): Promise<MflPlayer[]> {
    const players = await this.all();
    const byId = new Map(players.map((p) => [p.id, p]));
    const fuzzy = FuzzySet(players.map((p) => p.name));
    const fuzzyMatches = fuzzy.get(term, [], 0.3) ?? [];
    const selected = new Set<MflPlayer>();
    for (const [, name] of fuzzyMatches) {
      const match = players.find((p) => p.name === name);
      if (match) selected.add(match);
    }
    for (const player of players) {
      if (
        player.id === term ||
        player.name.toLowerCase().includes(term.toLowerCase())
      ) {
        selected.add(player);
      }
    }
    return [...selected].map((p) => byId.get(p.id) ?? p).slice(0, 25);
  }
}
