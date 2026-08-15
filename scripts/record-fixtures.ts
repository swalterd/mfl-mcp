import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const year = process.env.MFL_YEAR ?? "2026";
const leagueId = process.env.MFL_LEAGUE_ID;
const host = process.env.MFL_HOST;
const outDir = "tests/fixtures";

if (!leagueId) {
  throw new Error("MFL_LEAGUE_ID is required to record fixtures.");
}
if (!host) {
  throw new Error(
    "MFL_HOST is required to record fixtures (example: www12.myfantasyleague.com).",
  );
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "mfl-mcp-fixtures/0.1.0" },
  });
  return res.json();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const endpoints: Record<string, string> = {
    league: `https://${host}/${year}/export?TYPE=league&L=${leagueId}&JSON=1`,
    rules: `https://${host}/${year}/export?TYPE=rules&L=${leagueId}&JSON=1`,
    rosters: `https://${host}/${year}/export?TYPE=rosters&L=${leagueId}&JSON=1`,
    players: `https://api.myfantasyleague.com/${year}/export?TYPE=players&JSON=1&DETAILS=1`,
    adp: `https://api.myfantasyleague.com/${year}/export?TYPE=adp&JSON=1`,
    ranks: `https://api.myfantasyleague.com/${year}/export?TYPE=playerRanks&JSON=1`,
  };
  for (const [name, url] of Object.entries(endpoints)) {
    const payload = await fetchJson(url);
    await writeFile(
      join(outDir, `${name}.json`),
      JSON.stringify(payload, null, 2),
      "utf8",
    );
  }
}

void main();
