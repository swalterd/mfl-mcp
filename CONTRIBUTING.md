# Contributing to mfl-mcp

Thanks for helping improve this MCP server.

## Before you start

- Read [`README.md`](README.md) and [`docs/api-gotchas.md`](docs/api-gotchas.md)
- Never commit secrets (`.env`, cookies, API keys, credentials)
- Prefer small, focused PRs over large mixed changes

## Development setup

```bash
npm install
cp .env.example .env
npm run typecheck
npm test
```

Optional live credentials in `.env` are useful for manual smoke tests, but unit tests should not require them.

## Workflow

1. Fork the repository and create a branch from `main`
2. Make your change
3. Add or update tests when behavior changes
4. Update docs if tools, params, or response shapes change
5. Run:

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

6. Open a pull request with:
   - what changed
   - why
   - how you tested it

## Project conventions

- TypeScript ESM, Node 22+
- Keep write tools preview-first (`confirm: true` required)
- Prefer enriched, compact tool responses over raw MFL dumps
- Join availability + rankings server-side when the caller would otherwise have to
- Keep personal paths and league-specific secrets out of docs/examples

## Docs that must stay in sync

If you change tools or response shapes, update:

- `README.md`
- `docs/tools.md`
- `docs/drafting.md`
- `docs/team-management.md`
- `docs/data-sources.md`
- `docs/api-gotchas.md`
- `AGENTS.md` when architecture/commands change

## Reporting issues

Use GitHub Issues and include:

- MCP client (Cursor, Claude Desktop, etc.)
- Node version
- Whether auth is configured
- Exact tool name and sanitized params
- Error text / unexpected response shape

Do **not** paste passwords, API keys, or full auth cookies into issues.

## Code of conduct

By participating, you agree to follow [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
