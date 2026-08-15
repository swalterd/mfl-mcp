import { ofetch } from "ofetch";

export type IdCrosswalk = {
  mfl_id: string;
  fantasypros_id: string;
  sleeper_id: string;
  espn_id: string;
  cbs_id: string;
};

function csvToRows(csv: string): string[][] {
  const lines = csv.trim().split("\n");
  return lines.map((line) =>
    line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((v) => v.replaceAll(/^"|"$/g, "")),
  );
}

export async function fetchCrosswalk(): Promise<Map<string, IdCrosswalk>> {
  const csv = await ofetch<string>(
    "https://raw.githubusercontent.com/dynastyprocess/data/master/files/db_playerids.csv",
  );
  const rows = csvToRows(csv);
  const [header, ...data] = rows;
  const idx = Object.fromEntries(header.map((k, i) => [k, i]));
  const map = new Map<string, IdCrosswalk>();
  for (const row of data) {
    const mfl = row[idx.mfl_id];
    if (!mfl) continue;
    map.set(mfl, {
      mfl_id: mfl,
      fantasypros_id: row[idx.fantasypros_id],
      sleeper_id: row[idx.sleeper_id],
      espn_id: row[idx.espn_id],
      cbs_id: row[idx.cbs_id],
    });
  }
  return map;
}
