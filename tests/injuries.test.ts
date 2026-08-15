import { describe, expect, it } from "vitest";

function filterInjuries(
  allInjuries: Array<{ id: string; status: string; details?: string }>,
  playerIds?: string[],
) {
  if (!playerIds?.length) {
    return {
      total: allInjuries.length,
      filtered: false,
      injuries: allInjuries,
    };
  }
  const requested = [...new Set(playerIds.map(String))];
  const requestedSet = new Set(requested);
  const matched = allInjuries.filter((injury) => requestedSet.has(injury.id));
  const injuredIds = new Set(matched.map((injury) => injury.id));
  return {
    total: matched.length,
    filtered: true,
    requested: requested.length,
    injuries: matched,
    notOnReport: requested.filter((id) => !injuredIds.has(id)),
  };
}

describe("injuries filter", () => {
  const report = [
    { id: "1", status: "Out", details: "Knee" },
    { id: "2", status: "Questionable", details: "Ankle" },
    { id: "3", status: "Doubtful", details: "Shoulder" },
  ];

  it("returns the full report when no player_ids are provided", () => {
    expect(filterInjuries(report)).toEqual({
      total: 3,
      filtered: false,
      injuries: report,
    });
  });

  it("filters to requested players and lists those not on the report", () => {
    expect(filterInjuries(report, ["2", "9", "2"])).toEqual({
      total: 1,
      filtered: true,
      requested: 2,
      injuries: [{ id: "2", status: "Questionable", details: "Ankle" }],
      notOnReport: ["9"],
    });
  });
});
