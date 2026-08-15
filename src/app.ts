import { z } from "zod";
import {
  buildDraftBoard,
  type DraftCandidate,
  type DraftSort,
  filterAvailablePlayers,
  sortDraftCandidates,
} from "./analysis/draft.js";
import {
  parseDraftSlots,
  summarizeDraftStatus,
} from "./analysis/draft-status.js";
import { parseStarterRules } from "./analysis/lineup.js";
import { computeRosterNeeds } from "./analysis/roster.js";
import type { AppConfig } from "./config.js";
import { fetchCrosswalk } from "./data/crosswalk.js";
import { fetchDpValues } from "./data/dynastyprocess.js";
import type { PlayerStore } from "./data/players.js";
import { fetchTrendingAdds } from "./data/sleeper.js";
import type { MflClient } from "./mfl/client.js";
import { toArray } from "./mfl/normalize.js";

type PlayerRecord = {
  id: string;
  status?: string;
};

type AvailableOptions = {
  position?: string;
  limit?: number;
  offset?: number;
  sortBy?: DraftSort;
};

function collectPlayerRecords(value: unknown): PlayerRecord[] {
  if (!value || typeof value !== "object") return [];
  const records: PlayerRecord[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (key === "player") {
      if (typeof child === "string") {
        records.push({ id: child });
        continue;
      }
      for (const player of toArray(child as PlayerRecord | PlayerRecord[])) {
        if (
          player &&
          typeof player === "object" &&
          typeof player.id === "string"
        ) {
          records.push({ id: player.id, status: player.status });
        }
      }
    } else if (key === "player_id" && typeof child === "string") {
      records.push({ id: child });
    } else {
      records.push(...collectPlayerRecords(child));
    }
  }
  return records;
}

export class MflService {
  constructor(
    public readonly config: AppConfig,
    private readonly client: MflClient,
    private readonly players: PlayerStore,
  ) {}

  async leagueInfo() {
    return this.client.export("league");
  }

  async scoringRules() {
    return this.client.export("rules");
  }

  async roster(franchiseId?: string) {
    const params: Record<string, string> = {};
    if (franchiseId) params.FRANCHISE = franchiseId;
    return this.client.export("rosters", params);
  }

  async standings() {
    return this.client.export("leagueStandings", {}, true);
  }

  async schedule(week?: string, franchiseId?: string) {
    const params: Record<string, string> = {};
    if (week) params.W = week;
    if (franchiseId) params.F = franchiseId;
    return this.client.export("schedule", params, true);
  }

  private async rankedPlayerPool(): Promise<DraftCandidate[]> {
    const [ranks, adp, players, crosswalk, values] = await Promise.all([
      this.client.export<any>("playerRanks"),
      this.client.export<any>("adp"),
      this.players.all(),
      fetchCrosswalk(),
      fetchDpValues(),
    ]);
    const rankMap = new Map(
      toArray(ranks.player_ranks?.player).map((record: any) => [
        record.id,
        Number(record.rank),
      ]),
    );
    const adpMap = new Map(
      toArray(adp.adp?.player).map((record: any) => [
        record.id,
        Number(record.averagePick),
      ]),
    );
    return buildDraftBoard(
      players.map((player) => {
        const crosswalkRecord = crosswalk.get(player.id);
        const value = crosswalkRecord?.fantasypros_id
          ? values.get(crosswalkRecord.fantasypros_id)
          : undefined;
        return {
          id: player.id,
          name: player.name,
          position: player.position ?? "UNK",
          team: player.team,
          rank: rankMap.get(player.id),
          adp: adpMap.get(player.id),
          value2qb: value ? Number(value.value_2qb) : undefined,
        };
      }),
    );
  }

  private async availablePlayerIds(
    position?: string,
  ): Promise<Map<string, string>> {
    const params: Record<string, string> = {};
    if (position) params.POSITION = position;
    const payload = await this.client.export("freeAgents", params, true);
    return new Map(
      collectPlayerRecords(payload).map((player) => [
        player.id,
        player.status ?? "free_agent",
      ]),
    );
  }

  async availablePlayers(options: AvailableOptions = {}) {
    const { position, limit = 20, offset = 0, sortBy = "rank" } = options;
    const [pool, available] = await Promise.all([
      this.rankedPlayerPool(),
      this.availablePlayerIds(position),
    ]);
    const filtered = filterAvailablePlayers(pool, available, position);
    const sorted = sortDraftCandidates(filtered, sortBy);
    return {
      total: sorted.length,
      offset,
      limit,
      sortBy,
      players: sorted.slice(offset, offset + limit),
    };
  }

  async freeAgents(options: AvailableOptions = {}) {
    return this.availablePlayers(options);
  }

  async transactions(days?: string) {
    const params: Record<string, string> = {};
    if (days) params.DAYS = days;
    return this.client.export("transactions", params, true);
  }

  async playerSearch(query: string) {
    return this.players.search(query);
  }

  async playerResearch(playerId: string) {
    const [profile, injuries, ranks, adp, crosswalk, values, trending] =
      await Promise.all([
        this.client.export("playerProfile", { P: playerId }),
        this.client.export("injuries"),
        this.client.export("playerRanks"),
        this.client.export("adp"),
        fetchCrosswalk(),
        fetchDpValues(),
        fetchTrendingAdds(200),
      ]);

    const cw = crosswalk.get(playerId);
    const dp = cw?.fantasypros_id ? values.get(cw.fantasypros_id) : undefined;
    const trendingRecord = trending.find((t) => t.player_id === cw?.sleeper_id);
    const rankRecord = toArray((ranks as any).player_ranks?.player).find(
      (r: any) => r.id === playerId,
    );
    const adpRecord = toArray((adp as any).adp?.player).find(
      (r: any) => r.id === playerId,
    );
    const injury = toArray((injuries as any).injuries?.injury).find(
      (r: any) => r.id === playerId,
    );

    return {
      playerId,
      profile,
      injury,
      rankRecord,
      adpRecord,
      dynastyProcess: dp ?? null,
      trendingAdds: trendingRecord?.count ?? 0,
      as_of: {
        dynastyProcess: dp?.scrape_date ?? null,
      },
    };
  }

  async rankings(position?: string) {
    const ranks = await this.client.export<any>("playerRanks");
    const players = toArray(ranks.player_ranks?.player);
    return position
      ? players.filter((p: any) => p.position === position)
      : players;
  }

  async comparePlayers(playerIds: string[]) {
    const rows = await Promise.all(
      playerIds.map((id) => this.playerResearch(id)),
    );
    return rows;
  }

  async projectedScores(week = "1") {
    return this.client.export("projectedScores", { W: week }, true);
  }

  async injuries(playerIds?: string[]) {
    const [payload, players] = await Promise.all([
      this.client.export<any>("injuries"),
      playerIds?.length ? this.players.all() : Promise.resolve([]),
    ]);
    const allInjuries = toArray(payload.injuries?.injury).map(
      (injury: any) => ({
        id: String(injury.id),
        status: injury.status,
        details: injury.details,
        exp_return: injury.exp_return,
      }),
    );

    if (!playerIds?.length) {
      return {
        total: allInjuries.length,
        filtered: false,
        injuries: allInjuries,
      };
    }

    const requested = [...new Set(playerIds.map(String))];
    const requestedSet = new Set(requested);
    const playerMeta = new Map(players.map((player) => [player.id, player]));
    const matched = allInjuries
      .filter((injury) => requestedSet.has(injury.id))
      .map((injury) => {
        const meta = playerMeta.get(injury.id);
        return {
          ...injury,
          name: meta?.name,
          position: meta?.position,
          team: meta?.team,
        };
      });
    const injuredIds = new Set(matched.map((injury) => injury.id));

    return {
      total: matched.length,
      filtered: true,
      requested: requested.length,
      injuries: matched,
      notOnReport: requested
        .filter((id) => !injuredIds.has(id))
        .map((id) => {
          const meta = playerMeta.get(id);
          return {
            id,
            name: meta?.name,
            position: meta?.position,
            team: meta?.team,
            status: "not_on_injury_report",
          };
        }),
    };
  }

  async byeWeeks() {
    return this.client.export("nflByeWeeks");
  }

  async trending() {
    return fetchTrendingAdds();
  }

  async draftResults() {
    return this.client.export("draftResults", {}, true);
  }

  async draftStatus(
    options: { nextPicks?: number; franchiseId?: string } = {},
  ) {
    const [results, league, players] = await Promise.all([
      this.draftResults(),
      this.leagueInfo(),
      this.players.all(),
    ]);

    const franchiseNames = new Map(
      toArray((league as any).league?.franchises?.franchise).map(
        (franchise: any) => [String(franchise.id), String(franchise.name)],
      ),
    );
    const playerMeta = new Map(
      players.map((player) => [
        player.id,
        { name: player.name, position: player.position },
      ]),
    );

    const slots = parseDraftSlots(results, franchiseNames, playerMeta);
    return summarizeDraftStatus(slots, {
      nextPicks: options.nextPicks ?? 5,
      franchiseId: options.franchiseId,
    });
  }

  async draftBoard(
    options: AvailableOptions & { availableOnly?: boolean } = {},
  ) {
    const {
      availableOnly = false,
      position,
      limit = 100,
      offset = 0,
      sortBy = "draft_score",
    } = options;
    if (availableOnly) {
      return this.availablePlayers({ position, limit, offset, sortBy });
    }
    const pool = (await this.rankedPlayerPool()).filter(
      (player) =>
        !position || player.position.toUpperCase() === position.toUpperCase(),
    );
    const sorted = sortDraftCandidates(pool, sortBy);
    return {
      total: sorted.length,
      offset,
      limit,
      sortBy,
      players: sorted.slice(offset, offset + limit),
    };
  }

  async draftRecommend(limit = 10, position?: string) {
    const available = await this.availablePlayers({
      position,
      limit,
      sortBy: "draft_score",
    });
    return {
      ...available,
      availabilityFiltered: true,
    };
  }

  async researchAvailable(options: AvailableOptions = {}) {
    const [available, injuries] = await Promise.all([
      this.availablePlayers(options),
      this.client.export<any>("injuries"),
    ]);
    const injuryMap = new Map(
      toArray(injuries.injuries?.injury).map((injury: any) => [
        injury.id,
        injury,
      ]),
    );
    return {
      ...available,
      players: available.players.map((player) => ({
        ...player,
        injury: injuryMap.get(player.id) ?? null,
      })),
    };
  }

  async myDraftList() {
    return this.client.export("myDraftList", {}, true);
  }

  async keepers() {
    return this.client.export("selectedKeepers", {}, true);
  }

  async myTeam(franchiseId: string) {
    const [roster, league] = await Promise.all([
      this.roster(franchiseId),
      this.leagueInfo(),
    ]);
    const starters = parseStarterRules(
      toArray((league as any).league.starters.position),
    );
    const rosterPlayers = toArray(
      (roster as any).rosters?.franchise?.[0]?.player,
    );
    const needs = computeRosterNeeds(
      rosterPlayers.map((p: any) => p.position).filter(Boolean),
      starters,
    );
    return { roster, needs };
  }

  async matchup(week: string, franchiseId: string) {
    const schedule = await this.schedule(week, franchiseId);
    return schedule;
  }

  async setLineup(payload: {
    franchiseId?: string;
    week: string;
    playerIds: string[];
    confirm: boolean;
  }) {
    const preview = {
      type: "lineup",
      franchiseId: payload.franchiseId,
      week: payload.week,
      playerIds: payload.playerIds,
    };
    if (!payload.confirm) return { preview, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("lineup", {
      WEEK: payload.week,
      FRANCHISE_ID: payload.franchiseId ?? "",
      PLAYERS: payload.playerIds.join(","),
    });
  }

  async addDrop(payload: {
    add: string;
    drop: string;
    franchiseId?: string;
    confirm: boolean;
  }) {
    const preview = { type: "fcfsWaiver", ...payload };
    if (!payload.confirm) return { preview, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("fcfsWaiver", {
      ADD: payload.add,
      DROP: payload.drop,
      FRANCHISE_ID: payload.franchiseId ?? "",
    });
  }

  async blindBidWaiver(payload: {
    add: string;
    drop?: string;
    bid: string;
    franchiseId?: string;
    confirm: boolean;
  }) {
    const preview = { type: "blindBidWaiverRequest", ...payload };
    if (!payload.confirm) return { preview, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("blindBidWaiverRequest", {
      ADD: payload.add,
      DROP: payload.drop ?? "",
      AMOUNT: payload.bid,
      FRANCHISE_ID: payload.franchiseId ?? "",
    });
  }

  async irMove(payload: {
    playerId: string;
    activate: boolean;
    franchiseId?: string;
    confirm: boolean;
  }) {
    if (!payload.confirm) return { preview: payload, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("ir", {
      PLAYER: payload.playerId,
      ACTIVATE: payload.activate ? "1" : "0",
      FRANCHISE_ID: payload.franchiseId ?? "",
    });
  }

  async proposeTrade(payload: {
    toFranchise: string;
    willGiveUp: string[];
    willReceive: string[];
    confirm: boolean;
  }) {
    if (!payload.confirm) return { preview: payload, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("tradeProposal", {
      TO_FRANCHISE_ID: payload.toFranchise,
      WILL_GIVE_UP: payload.willGiveUp.join(","),
      WILL_RECEIVE: payload.willReceive.join(","),
    });
  }

  async respondTrade(payload: {
    tradeId: string;
    action: "ACCEPT" | "REJECT";
    confirm: boolean;
  }) {
    if (!payload.confirm) return { preview: payload, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("tradeResponse", {
      TRADE_ID: payload.tradeId,
      RESPONSE: payload.action,
    });
  }

  async tradeBait(payload: { players: string[]; confirm: boolean }) {
    if (!payload.confirm) return { preview: payload, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("tradeBait", {
      PLAYERS: payload.players.join(","),
    });
  }

  async watchList(payload: { players: string[]; confirm: boolean }) {
    if (!payload.confirm) return { preview: payload, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("myWatchList", {
      PLAYERS: payload.players.join(","),
    });
  }

  async draftListSet(payload: { players: string[]; confirm: boolean }) {
    if (!payload.confirm) return { preview: payload, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("myDraftList", {
      PLAYERS: payload.players.join(","),
    });
  }

  async keepersSet(payload: {
    players: string[];
    franchiseId?: string;
    confirm: boolean;
  }) {
    if (!payload.confirm) return { preview: payload, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    return this.client.import("keepers", {
      PLAYERS: payload.players.join(","),
      FRANCHISE_ID: payload.franchiseId ?? "",
    });
  }

  async makeDraftPick(payload: {
    franchiseId?: string;
    round: string;
    pick: string;
    playerId: string;
    confirm: boolean;
  }) {
    if (!payload.confirm) return { preview: payload, requiresConfirm: true };
    if (this.config.readOnly)
      throw new Error("Writes disabled by MFL_MCP_READ_ONLY.");
    const response = await this.client.import("live_draft", {
      CMD: "DRAFT",
      ROUND: payload.round,
      PICK: payload.pick,
      PLAYER_PICK: payload.playerId,
      FRANCHISE_PICK: payload.franchiseId ?? "",
      JSON: "1",
    });
    return response;
  }
}

export const schemas = {
  franchiseId: z.string().regex(/^\d{4}$/),
  week: z.string(),
  playerId: z.string(),
};
