# Tool Reference

## Shared sorting

Availability and board tools accept `sort_by`:

- `rank` — FantasySharks overall rank (default for availability tools)
- `adp` — average draft position
- `value` — ADP minus rank (higher = better value)
- `draft_score` — blended score used by recommendations

Enriched player objects commonly include:

- `id`, `name`, `position`, `team`
- `rank`, `adp`, `value2qb`
- `valueOverAdp`, `draftScore`
- `available`, `status` when availability-filtered

## League and Team

| Tool | Purpose | Key params |
| --- | --- | --- |
| `league_info` | League metadata and setup | none |
| `scoring_rules` | Scoring and lineup rules | none |
| `roster` | Raw roster export | `franchise_id?` |
| `standings` | League standings | none (auth) |
| `schedule` | Schedule / matchups | `week?`, `franchise_id?` (auth) |
| `transactions` | Recent transactions | `days?` (auth) |
| `free_agents` | Enriched available players | `position?`, `limit=20`, `offset=0`, `sort_by=rank` (auth) |
| `available_players` | Same enriched available pool | `position?`, `limit=20`, `offset=0`, `sort_by=rank` (auth) |
| `my_team` | Roster + positional needs | `franchise_id` (required) |
| `matchup` | One team/week schedule view | `week`, `franchise_id` |

`free_agents` and `available_players` join MFL free-agent IDs with player metadata and rankings server-side. They never return raw `{id,status}`-only dumps.

## Research

| Tool | Purpose | Key params |
| --- | --- | --- |
| `player_search` | Fuzzy name / ID search | `query` |
| `player_research` | Single-player fused research | `player_id` |
| `rankings` | FantasySharks ranks | `position?` |
| `compare_players` | Side-by-side research | `player_ids[]` |
| `research_available` | Batch research for top available players | `position?`, `limit=10`, `offset=0`, `sort_by=rank` |
| `projected_scores` | League projections | `week=1` (auth) |
| `injuries` | Injury report | `player_ids?` |
| `bye_weeks` | NFL bye weeks | none |
| `trending` | Sleeper trending adds | none |

`player_research` fuses MFL profile, injury, ADP, ranks, DynastyProcess value, and Sleeper trending, with `as_of` dates where available.

`injuries` without params returns the full report. With `player_ids`, it returns only those players, enriched with name/position/team, plus a `notOnReport` list for IDs that are healthy or absent from the report.

## Draft

| Tool | Purpose | Key params |
| --- | --- | --- |
| `draft_status` | Compact on-the-clock status | `next_picks=5`, `franchise_id?` (auth) |
| `draft_results` | Full draft board export | none (auth) |
| `draft_board` | Ranked board | `available_only=false`, `position?`, `limit=100`, `offset=0`, `sort_by=draft_score` |
| `draft_recommend` | Top available recommendations | `limit=10`, `position?` |
| `research_available` | Available players + injury context | see Research |
| `draft_list_get` | Current My Draft List | none (auth) |
| `keepers_get` | Selected keepers | none (auth) |

### `draft_status` response shape

```json
{
  "currentPick": {
    "round": 4,
    "pick": 1,
    "overall": 31,
    "franchise": "0006",
    "franchiseName": "Example Franchise"
  },
  "nextPicks": [
    {
      "round": 4,
      "pick": 2,
      "overall": 32,
      "franchise": "0007",
      "franchiseName": "..."
    }
  ],
  "picksMade": 30,
  "totalPicks": 160,
  "myNextPick": {
    "round": 4,
    "pick": 4,
    "overall": 34,
    "franchise": "0001",
    "franchiseName": "...",
    "picksUntilMyTurn": 3
  }
}
```

Notes:

- Does **not** return full league metadata or all empty future slots.
- `nextPicks` are the upcoming picks after the current on-the-clock pick.
- `myNextPick` is only populated when `franchise_id` is provided.
- Use `draft_results` when you need the full pick board.

### Availability-aware draft tools

- `draft_recommend` always filters to currently available players.
- `draft_board` with `available_only: true` is equivalent to an availability-filtered board.
- Prefer `available_players` for the common “top available by rank/ADP/value” query.

## Writes (preview-then-confirm)

All write tools return a preview unless `confirm: true`.

| Tool | Purpose |
| --- | --- |
| `set_lineup` | Set starters |
| `add_drop` | FCFS add/drop |
| `blind_bid_waiver` | Blind bid waiver |
| `ir_move` | IR activate/deactivate |
| `propose_trade` | Propose trade |
| `respond_trade` | Accept / reject trade |
| `trade_bait` | Set trade bait |
| `watch_list` | Set watch list |
| `draft_list_set` | Overwrite My Draft List |
| `keepers_set` | Set keepers |
| `make_draft_pick` | Submit live draft pick |

Safety:

- Omit `confirm` or set `confirm: false` to preview.
- `MFL_MCP_READ_ONLY=true` hard-disables all writes.

Trade asset syntax:

- Current-year picks: `DP_02_05` (round/pick are zero-based)
- Future picks: `FP_0005_2027_2`
- Blind-bid dollars: `BB_10.50`
