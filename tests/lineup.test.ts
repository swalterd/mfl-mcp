import { describe, expect, it } from "vitest";
import { optimizeLineup, parseStarterRules } from "../src/analysis/lineup.js";

describe("lineup optimizer", () => {
  it("fills starters while respecting min/max limits", () => {
    const rules = parseStarterRules([
      { name: "QB", limit: "1" },
      { name: "RB", limit: "2-3" },
      { name: "WR", limit: "2-3" },
      { name: "TE", limit: "1-2" },
      { name: "PK", limit: "1" },
      { name: "Def", limit: "1" },
    ]);
    const players = [
      { playerId: "q1", position: "QB", score: 20 },
      { playerId: "r1", position: "RB", score: 18 },
      { playerId: "r2", position: "RB", score: 17 },
      { playerId: "r3", position: "RB", score: 16 },
      { playerId: "w1", position: "WR", score: 15 },
      { playerId: "w2", position: "WR", score: 14 },
      { playerId: "w3", position: "WR", score: 13 },
      { playerId: "t1", position: "TE", score: 12 },
      { playerId: "k1", position: "PK", score: 9 },
      { playerId: "d1", position: "Def", score: 8 },
    ];
    const selected = optimizeLineup(players, rules, 9);
    expect(selected).toHaveLength(9);
  });
});
