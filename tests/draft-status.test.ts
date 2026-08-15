import { describe, expect, it } from "vitest";
import {
  parseDraftSlots,
  summarizeDraftStatus,
} from "../src/analysis/draft-status.js";

const sampleResults = {
  draftResults: {
    draftUnit: {
      unit: "LEAGUE",
      draftPick: [
        {
          round: "1",
          pick: "1",
          franchise: "0001",
          player: "16161",
          timestamp: "1",
        },
        {
          round: "1",
          pick: "2",
          franchise: "0002",
          player: "16162",
          timestamp: "2",
        },
        { round: "1", pick: "3", franchise: "0003", player: "", timestamp: "" },
        {
          round: "1",
          pick: "4",
          franchise: "0004",
          player: "0",
          timestamp: "",
        },
        { round: "1", pick: "5", franchise: "0005", player: "", timestamp: "" },
        { round: "1", pick: "6", franchise: "0006", player: "", timestamp: "" },
        { round: "1", pick: "7", franchise: "0001", player: "", timestamp: "" },
      ],
    },
  },
};

describe("draft status summary", () => {
  it("parses picks and ignores empty future slots as made", () => {
    const slots = parseDraftSlots(
      sampleResults,
      new Map([
        ["0001", "Team A"],
        ["0003", "Team C"],
      ]),
      new Map([
        ["16161", { name: "Chase", position: "WR" }],
        ["16162", { name: "Gibbs", position: "RB" }],
      ]),
    );

    expect(slots).toHaveLength(7);
    expect(slots[0]).toMatchObject({
      playerId: "16161",
      playerName: "Chase",
      franchiseName: "Team A",
    });
    expect(slots[2].playerId).toBeUndefined();
  });

  it("returns compact on-the-clock status with next picks", () => {
    const slots = parseDraftSlots(
      sampleResults,
      new Map([
        ["0003", "Team C"],
        ["0001", "Team A"],
      ]),
    );

    const summary = summarizeDraftStatus(slots, {
      nextPicks: 3,
      franchiseId: "0001",
    });

    expect(summary).toEqual({
      currentPick: {
        round: 1,
        pick: 3,
        overall: 3,
        franchise: "0003",
        franchiseName: "Team C",
      },
      nextPicks: [
        {
          round: 1,
          pick: 4,
          overall: 4,
          franchise: "0004",
          franchiseName: undefined,
        },
        {
          round: 1,
          pick: 5,
          overall: 5,
          franchise: "0005",
          franchiseName: undefined,
        },
        {
          round: 1,
          pick: 6,
          overall: 6,
          franchise: "0006",
          franchiseName: undefined,
        },
      ],
      picksMade: 2,
      totalPicks: 7,
      myNextPick: {
        round: 1,
        pick: 7,
        overall: 7,
        franchise: "0001",
        franchiseName: "Team A",
        picksUntilMyTurn: 4,
      },
    });
  });

  it("sets picksUntilMyTurn to 0 when franchise is on the clock", () => {
    const slots = parseDraftSlots(sampleResults);
    const summary = summarizeDraftStatus(slots, { franchiseId: "0003" });
    expect(summary.myNextPick?.picksUntilMyTurn).toBe(0);
  });
});
