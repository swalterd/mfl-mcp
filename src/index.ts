#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MflService } from "./app.js";
import { loadConfig } from "./config.js";
import { PlayerStore } from "./data/players.js";
import { DiskCache } from "./mfl/cache.js";
import { MflClient } from "./mfl/client.js";

const config = loadConfig();
const cache = new DiskCache(config.cacheDir);
const client = new MflClient(config, cache);
const players = new PlayerStore(client, cache);
const service = new MflService(config, client, players);

const server = new McpServer({
  name: "mfl-mcp",
  version: "0.1.0",
});

const draftSortSchema = z
  .enum(["rank", "adp", "value", "draft_score"])
  .default("rank");

function asText(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

server.tool(
  "league_info",
  "Return league metadata and configuration.",
  {},
  async () => asText(await service.leagueInfo()),
);
server.tool(
  "scoring_rules",
  "Return league scoring and lineup rules.",
  {},
  async () => asText(await service.scoringRules()),
);
server.tool(
  "roster",
  "Return roster(s).",
  { franchise_id: z.string().optional() },
  async ({ franchise_id }) => asText(await service.roster(franchise_id)),
);
server.tool("standings", "Return current league standings.", {}, async () =>
  asText(await service.standings()),
);
server.tool(
  "schedule",
  "Return league schedule or specific matchup schedule.",
  { week: z.string().optional(), franchise_id: z.string().optional() },
  async ({ week, franchise_id }) =>
    asText(await service.schedule(week, franchise_id)),
);
server.tool(
  "transactions",
  "Return recent league transactions.",
  { days: z.string().optional() },
  async ({ days }) => asText(await service.transactions(days)),
);
server.tool(
  "free_agents",
  "Return enriched, ranked free agents with names, positions, ADP, rank, and value metrics.",
  {
    position: z.string().optional(),
    limit: z.number().int().positive().max(200).default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: draftSortSchema,
  },
  async ({ position, limit, offset, sort_by }) =>
    asText(
      await service.freeAgents({
        position,
        limit,
        offset,
        sortBy: sort_by,
      }),
    ),
);
server.tool(
  "available_players",
  "Return ranked players who are actually available in this league.",
  {
    position: z.string().optional(),
    limit: z.number().int().positive().max(200).default(20),
    offset: z.number().int().nonnegative().default(0),
    sort_by: draftSortSchema,
  },
  async ({ position, limit, offset, sort_by }) =>
    asText(
      await service.availablePlayers({
        position,
        limit,
        offset,
        sortBy: sort_by,
      }),
    ),
);
server.tool(
  "my_team",
  "Return roster and positional needs for a team.",
  { franchise_id: z.string() },
  async ({ franchise_id }) => asText(await service.myTeam(franchise_id)),
);
server.tool(
  "matchup",
  "Return schedule data for one team/week.",
  { week: z.string(), franchise_id: z.string() },
  async ({ week, franchise_id }) =>
    asText(await service.matchup(week, franchise_id)),
);

server.tool(
  "player_search",
  "Search players by name/id.",
  { query: z.string() },
  async ({ query }) => asText(await service.playerSearch(query)),
);
server.tool(
  "player_research",
  "Unified player research view.",
  { player_id: z.string() },
  async ({ player_id }) => asText(await service.playerResearch(player_id)),
);
server.tool(
  "rankings",
  "Return player rankings.",
  { position: z.string().optional() },
  async ({ position }) => asText(await service.rankings(position)),
);
server.tool(
  "compare_players",
  "Compare several players side-by-side.",
  { player_ids: z.array(z.string()).min(2) },
  async ({ player_ids }) => asText(await service.comparePlayers(player_ids)),
);
server.tool(
  "projected_scores",
  "Return projected scores for week.",
  { week: z.string().default("1") },
  async ({ week }) => asText(await service.projectedScores(week)),
);
server.tool(
  "injuries",
  "Return the injury report. Optionally filter to specific player IDs.",
  { player_ids: z.array(z.string()).min(1).optional() },
  async ({ player_ids }) => asText(await service.injuries(player_ids)),
);
server.tool("bye_weeks", "Return NFL bye week table.", {}, async () =>
  asText(await service.byeWeeks()),
);
server.tool("trending", "Return sleeper trending adds.", {}, async () =>
  asText(await service.trending()),
);

server.tool(
  "draft_status",
  "Return compact draft status: who is on the clock, upcoming picks, and optionally your next pick.",
  {
    next_picks: z.number().int().positive().max(30).default(5),
    franchise_id: z.string().optional(),
  },
  async ({ next_picks, franchise_id }) =>
    asText(
      await service.draftStatus({
        nextPicks: next_picks,
        franchiseId: franchise_id,
      }),
    ),
);
server.tool("draft_results", "Return draft results.", {}, async () =>
  asText(await service.draftResults()),
);
server.tool(
  "draft_board",
  "Return ranked draft board, optionally filtered to players actually available in this league.",
  {
    available_only: z.boolean().default(false),
    position: z.string().optional(),
    limit: z.number().int().positive().max(200).default(100),
    offset: z.number().int().nonnegative().default(0),
    sort_by: z
      .enum(["rank", "adp", "value", "draft_score"])
      .default("draft_score"),
  },
  async ({ available_only, position, limit, offset, sort_by }) =>
    asText(
      await service.draftBoard({
        availableOnly: available_only,
        position,
        limit,
        offset,
        sortBy: sort_by,
      }),
    ),
);
server.tool(
  "draft_recommend",
  "Return top recommendations filtered to players actually available in this league.",
  {
    limit: z.number().int().positive().max(50).default(10),
    position: z.string().optional(),
  },
  async ({ limit, position }) =>
    asText(await service.draftRecommend(limit, position)),
);
server.tool(
  "research_available",
  "Return enriched research for the top available players, including injury status.",
  {
    position: z.string().optional(),
    limit: z.number().int().positive().max(50).default(10),
    offset: z.number().int().nonnegative().default(0),
    sort_by: draftSortSchema,
  },
  async ({ position, limit, offset, sort_by }) =>
    asText(
      await service.researchAvailable({
        position,
        limit,
        offset,
        sortBy: sort_by,
      }),
    ),
);
server.tool("draft_list_get", "Return current My Draft List.", {}, async () =>
  asText(await service.myDraftList()),
);
server.tool("keepers_get", "Return selected keepers.", {}, async () =>
  asText(await service.keepers()),
);

server.tool(
  "set_lineup",
  "Set lineup (preview unless confirm=true).",
  {
    franchise_id: z.string().optional(),
    week: z.string(),
    player_ids: z.array(z.string()).min(1),
    confirm: z.boolean().default(false),
  },
  async ({ franchise_id, week, player_ids, confirm }) =>
    asText(
      await service.setLineup({
        franchiseId: franchise_id,
        week,
        playerIds: player_ids,
        confirm,
      }),
    ),
);
server.tool(
  "add_drop",
  "Add/drop using FCFS waiver endpoint.",
  {
    add: z.string(),
    drop: z.string(),
    franchise_id: z.string().optional(),
    confirm: z.boolean().default(false),
  },
  async ({ add, drop, franchise_id, confirm }) =>
    asText(
      await service.addDrop({ add, drop, franchiseId: franchise_id, confirm }),
    ),
);
server.tool(
  "blind_bid_waiver",
  "Submit blind bid waiver request.",
  {
    add: z.string(),
    drop: z.string().optional(),
    bid: z.string(),
    franchise_id: z.string().optional(),
    confirm: z.boolean().default(false),
  },
  async ({ add, drop, bid, franchise_id, confirm }) =>
    asText(
      await service.blindBidWaiver({
        add,
        drop,
        bid,
        franchiseId: franchise_id,
        confirm,
      }),
    ),
);
server.tool(
  "ir_move",
  "Activate/deactivate player on IR.",
  {
    player_id: z.string(),
    activate: z.boolean(),
    franchise_id: z.string().optional(),
    confirm: z.boolean().default(false),
  },
  async ({ player_id, activate, franchise_id, confirm }) =>
    asText(
      await service.irMove({
        playerId: player_id,
        activate,
        franchiseId: franchise_id,
        confirm,
      }),
    ),
);
server.tool(
  "propose_trade",
  "Propose trade with MFL asset syntax.",
  {
    to_franchise: z.string(),
    will_give_up: z.array(z.string()),
    will_receive: z.array(z.string()),
    confirm: z.boolean().default(false),
  },
  async ({ to_franchise, will_give_up, will_receive, confirm }) =>
    asText(
      await service.proposeTrade({
        toFranchise: to_franchise,
        willGiveUp: will_give_up,
        willReceive: will_receive,
        confirm,
      }),
    ),
);
server.tool(
  "respond_trade",
  "Accept or reject trade offer.",
  {
    trade_id: z.string(),
    action: z.enum(["ACCEPT", "REJECT"]),
    confirm: z.boolean().default(false),
  },
  async ({ trade_id, action, confirm }) =>
    asText(await service.respondTrade({ tradeId: trade_id, action, confirm })),
);
server.tool(
  "trade_bait",
  "Set trade bait list.",
  { players: z.array(z.string()), confirm: z.boolean().default(false) },
  async ({ players: p, confirm }) =>
    asText(await service.tradeBait({ players: p, confirm })),
);
server.tool(
  "watch_list",
  "Set watch list.",
  { players: z.array(z.string()), confirm: z.boolean().default(false) },
  async ({ players: p, confirm }) =>
    asText(await service.watchList({ players: p, confirm })),
);
server.tool(
  "draft_list_set",
  "Set My Draft List.",
  { players: z.array(z.string()), confirm: z.boolean().default(false) },
  async ({ players: p, confirm }) =>
    asText(await service.draftListSet({ players: p, confirm })),
);
server.tool(
  "keepers_set",
  "Set keeper selections.",
  {
    players: z.array(z.string()),
    franchise_id: z.string().optional(),
    confirm: z.boolean().default(false),
  },
  async ({ players: p, franchise_id, confirm }) =>
    asText(
      await service.keepersSet({
        players: p,
        franchiseId: franchise_id,
        confirm,
      }),
    ),
);
server.tool(
  "make_draft_pick",
  "Submit live draft pick.",
  {
    franchise_id: z.string().optional(),
    round: z.string(),
    pick: z.string(),
    player_id: z.string(),
    confirm: z.boolean().default(false),
  },
  async ({ franchise_id, round, pick, player_id, confirm }) =>
    asText(
      await service.makeDraftPick({
        franchiseId: franchise_id,
        round,
        pick,
        playerId: player_id,
        confirm,
      }),
    ),
);

const transport = new StdioServerTransport();
await server.connect(transport);
