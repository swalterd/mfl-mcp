# mfl-mcp

TypeScript [MCP](https://modelcontextprotocol.io/) server for [MyFantasyLeague](https://www.myfantasyleague.com/) focused on:

- Team management
- Draft support
- Player rankings and research (MFL + free external sources)

Works with Cursor and Claude Desktop over stdio.

> Unofficial project. Not affiliated with MyFantasyLeague, First Pick Labs, Genius Sports, or the NFL.

## Features

- Availability-aware draft tools (`available_players`, `draft_recommend`, `draft_board`)
- Enriched free-agent responses with names, ranks, ADP, and value-over-ADP
- Compact `draft_status` (on the clock, next picks, optional `myNextPick`)
- Preview-then-confirm writes, plus `MFL_MCP_READ_ONLY`
- Docs and automated tests included

## Requirements

- Node.js `22+`
- npm `11+`

## Quick start

```bash
git clone https://github.com/swalterd/mfl-mcp.git
cd mfl-mcp
npm install
cp .env.example .env
# edit .env with your MFL credentials, league id, and host
npm run build
npm test
```

## Configuration

Copy `.env.example` to `.env` and set:

| Variable | Required | Description |
| --- | --- | --- |
| `MFL_LEAGUE_ID` | yes | Your league ID (from the MFL league URL) |
| `MFL_HOST` | recommended | League host from the URL, e.g. `www12.myfantasyleague.com` |
| `MFL_YEAR` | no | Season year (default `2026`) |
| `MFL_USERNAME` | for private leagues | MFL account username/email |
| `MFL_PASSWORD` | for private leagues | MFL account password |
| `MFL_APIKEY` | optional | Read-only owner API key |
| `MFL_USER_AGENT` | recommended | Client user agent string |
| `MFL_MCP_READ_ONLY` | no | `true` to disable write tools |
| `MFL_CACHE_DIR` | no | Disk cache directory |

`MFL_HOST` is the hostname in your league URL:

`https://www12.myfantasyleague.com/2026/home/12345` → host `www12.myfantasyleague.com`, league id `12345`.

If `MFL_HOST` is omitted, the client will try to discover/cache it after a successful `league` fetch or via authenticated `myleagues`. Setting it explicitly is the most reliable setup.

Important:

- Use your **MFL account** credentials, not a franchise access code.
- Many private-league endpoints require auth.
- Writes require username/password login.
- Never commit `.env`.

## Run

```bash
npm run dev
```

or

```bash
npm run build
node dist/index.js
```

Cursor and Claude launch the MCP process themselves. You usually do not need a separate terminal session once MCP config is set.

## Cursor config

Project file: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "mfl": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/mfl-mcp",
      "env": {
        "MFL_YEAR": "2026",
        "MFL_LEAGUE_ID": "YOUR_LEAGUE_ID",
        "MFL_HOST": "wwwXX.myfantasyleague.com",
        "MFL_USERNAME": "your_username",
        "MFL_PASSWORD": "your_password",
        "MFL_USER_AGENT": "mfl-mcp/0.1.0"
      }
    }
  }
}
```

After building, you can use `node` + `dist/index.js` instead of `tsx`.

## Claude Desktop config

Edit `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mfl": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/mfl-mcp",
      "env": {
        "MFL_YEAR": "2026",
        "MFL_LEAGUE_ID": "YOUR_LEAGUE_ID",
        "MFL_HOST": "wwwXX.myfantasyleague.com",
        "MFL_USERNAME": "your_username",
        "MFL_PASSWORD": "your_password",
        "MFL_USER_AGENT": "mfl-mcp/0.1.0"
      }
    }
  }
}
```

Fully quit and reopen Claude Desktop after changing config.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run MCP via tsx |
| `npm run build` | Compile TypeScript |
| `npm run typecheck` | Typecheck only |
| `npm run lint` | Biome lint |
| `npm run format` | Biome format |
| `npm test` | Vitest |
| `npm run record:fixtures` | Capture public MFL fixtures |

## Documentation

- [`docs/tools.md`](docs/tools.md) — tool reference and response shapes
- [`docs/drafting.md`](docs/drafting.md) — draft workflow
- [`docs/team-management.md`](docs/team-management.md) — roster / waiver / trade workflow
- [`docs/data-sources.md`](docs/data-sources.md) — MFL + external enrichment
- [`docs/api-gotchas.md`](docs/api-gotchas.md) — auth, routing, payload quirks
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to contribute
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — community standards
- [`SECURITY.md`](SECURITY.md) — vulnerability reporting

## License

[MIT](LICENSE)

## Disclaimer

This software is provided as-is. It is not affiliated with, endorsed by, or licensed by MyFantasyLeague, First Pick Labs, Genius Sports, the National Football League, any NFL team, or the NFLPA. Use of the MyFantasyLeague API is subject to MFL's own terms and developer guidelines.
