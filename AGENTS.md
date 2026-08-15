# Agent Notes

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Test: `npm test`
- Fixtures: `npm run record:fixtures`

## Architecture

- `src/index.ts` — MCP tool registration and stdio transport
- `src/app.ts` — service orchestration used by MCP tools
- `src/mfl/` — API client, auth, caching, normalization
- `src/data/` — external connectors and player store
- `src/analysis/` — lineup optimization, roster needs, draft scoring, draft-status summarization

## Draft / availability behavior

- Prefer `available_players` for ranked available pools.
- `draft_recommend` always filters to available players.
- `draft_status` returns a compact on-the-clock summary, not the full league/draft dump.
- Use `draft_results` only when the full board is required.

## Safety

- Write tools are two-step (`confirm: true` required).
- `MFL_MCP_READ_ONLY=true` disables all mutation tools.
- Private-league reads generally require `MFL_USERNAME`/`MFL_PASSWORD` or `MFL_APIKEY`.
- Never commit `.env` or credentials.

## Open-source docs

- `LICENSE` (MIT)
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`

## Docs to keep in sync

When changing tools or response shapes, update:

- `README.md`
- `docs/tools.md`
- `docs/drafting.md`
- `docs/team-management.md`
- `docs/data-sources.md`
- `docs/api-gotchas.md`
- `CONTRIBUTING.md` if contributor workflow changes
