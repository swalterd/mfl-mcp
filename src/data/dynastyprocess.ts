import { ofetch } from "ofetch";

export type DpPlayerValue = {
  player: string;
  pos: string;
  team: string;
  ecr_1qb: string;
  ecr_2qb: string;
  value_1qb: string;
  value_2qb: string;
  scrape_date: string;
  fp_id: string;
};

function csvToRows(csv: string): string[][] {
  const lines = csv.trim().split("\n");
  return lines.map((line) =>
    line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((v) => v.replaceAll(/^"|"$/g, "")),
  );
}

export async function fetchDpValues(): Promise<Map<string, DpPlayerValue>> {
  const csv = await ofetch<string>(
    "https://raw.githubusercontent.com/dynastyprocess/data/master/files/values-players.csv",
  );
  const rows = csvToRows(csv);
  const [header, ...data] = rows;
  const idx = Object.fromEntries(header.map((k, i) => [k, i]));
  const map = new Map<string, DpPlayerValue>();
  for (const row of data) {
    const fp = row[idx.fp_id];
    if (!fp) continue;
    map.set(fp, {
      player: row[idx.player],
      pos: row[idx.pos],
      team: row[idx.team],
      ecr_1qb: row[idx.ecr_1qb],
      ecr_2qb: row[idx.ecr_2qb],
      value_1qb: row[idx.value_1qb],
      value_2qb: row[idx.value_2qb],
      scrape_date: row[idx.scrape_date],
      fp_id: fp,
    });
  }
  return map;
}
