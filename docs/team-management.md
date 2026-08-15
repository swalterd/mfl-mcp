# Team Management Workflow

## Recommended flow

1. Use `league_info` to identify franchise IDs if needed.
2. Use `my_team` with your `franchise_id` for roster + positional needs.
3. Use `free_agents` / `available_players` for replacements (enriched with names, ranks, ADP).
4. Use `player_research` or `research_available` before committing to a move.
5. Update lineup with `set_lineup`.
6. Submit adds/drops with `add_drop` or `blind_bid_waiver`.
7. Manage IR with `ir_move`.
8. Manage trades with `propose_trade` / `respond_trade`.

## Important current limitations

- `my_team` currently requires an explicit `franchise_id`.
- `my_team` currently returns roster IDs plus needs; use `player_research` / player metadata tools when you need detailed names and ranks on every rostered player.

## Write safety

All writes require explicit `confirm: true`.

Without confirmation, tools return a preview payload only.

`MFL_MCP_READ_ONLY=true` disables mutations entirely.

## Example prompts

- “Show free agents at WR, top 15 by rank.”
- “Preview an add of player A and drop of player B without confirming.”
- “Set my week 1 lineup after I confirm.”
