import { describe, expect, it } from "vitest";
import {
  buildDraftBoard,
  filterAvailablePlayers,
  scoreDraftCandidate,
  sortDraftCandidates,
} from "../src/analysis/draft.js";

describe("draft board", () => {
  it("scores and sorts candidates", () => {
    const a = {
      id: "1",
      name: "A",
      position: "RB",
      rank: 1,
      adp: 2,
      value2qb: 9000,
    };
    const b = {
      id: "2",
      name: "B",
      position: "WR",
      rank: 50,
      adp: 55,
      value2qb: 2000,
    };
    expect(scoreDraftCandidate(a)).toBeGreaterThan(scoreDraftCandidate(b));
    const board = buildDraftBoard([b, a]);
    expect(board[0].id).toBe("1");
    expect(board[0].valueOverAdp).toBe(1);
    expect(board[0].draftScore).toBeTypeOf("number");
  });

  it("filters to available players and enriches their status", () => {
    const board = buildDraftBoard([
      { id: "1", name: "Taken", position: "RB", rank: 1, adp: 2 },
      { id: "2", name: "Available RB", position: "RB", rank: 2, adp: 10 },
      { id: "3", name: "Available WR", position: "WR", rank: 3, adp: 12 },
    ]);
    const available = new Map([
      ["2", "FA"],
      ["3", "FA"],
    ]);

    const result = filterAvailablePlayers(board, available, "RB");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "2",
      name: "Available RB",
      available: true,
      status: "FA",
    });
  });

  it("sorts value picks by ADP versus rank delta", () => {
    const board = buildDraftBoard([
      { id: "1", name: "Small value", position: "RB", rank: 8, adp: 10 },
      { id: "2", name: "Large value", position: "WR", rank: 10, adp: 30 },
    ]);

    expect(sortDraftCandidates(board, "value")[0].id).toBe("2");
  });
});
