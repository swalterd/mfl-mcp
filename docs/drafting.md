# Drafting Workflow

## Recommended flow

1. Call `draft_status` with your `franchise_id` to see:
   - who is on the clock
   - the next few picks (`next_picks`, default 5)
   - when you pick next (`myNextPick.picksUntilMyTurn`)
2. Call `available_players` for the ranked available pool.
   - Useful sorts: `rank`, `adp`, `value`, `draft_score`
   - Optional `position`, `limit`, `offset`
3. Call `draft_recommend` for a short availability-filtered shortlist.
4. Call `research_available` when you want injury context on the top available options.
5. Optionally update your queue with `draft_list_set` (`confirm: true` to apply).
6. Submit with `make_draft_pick` (`confirm: true` to apply).

## Tool choices

| Need | Use |
| --- | --- |
| Who is on the clock / when do I pick? | `draft_status` |
| Top available players | `available_players` or `draft_board` with `available_only: true` |
| Quick recommendation | `draft_recommend` |
| Full historical/future pick board | `draft_results` |
| Player detail before picking | `player_research` or `research_available` |

## Example prompts

- “Call `draft_status` with franchise_id `0006` and next_picks 5.”
- “Show top 20 available RBs sorted by value.”
- “Recommend 8 available players for my next pick.”
- “Research the top 5 available players and flag injuries.”

## Notes

- Availability joins happen server-side. Prefer `available_players` over manually joining `free_agents` + rankings.
- `draft_status` is intentionally compact; it does not dump league metadata or empty future slots.
- Authenticated `draftResults` is the canonical draft-state source used by `draft_status`.
- Live drafts may still lag slightly depending on MFL refresh timing.
