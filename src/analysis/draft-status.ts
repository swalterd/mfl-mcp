import { toArray } from "../mfl/normalize.js";

export type DraftPickSlot = {
  round: number;
  pick: number;
  overall: number;
  franchise: string;
  franchiseName?: string;
  playerId?: string;
  playerName?: string;
  position?: string;
  timestamp?: string;
};

export type DraftStatusSummary = {
  currentPick: DraftPickSlot | null;
  nextPicks: DraftPickSlot[];
  picksMade: number;
  totalPicks: number;
  myNextPick: {
    round: number;
    pick: number;
    overall: number;
    franchise: string;
    franchiseName?: string;
    picksUntilMyTurn: number;
  } | null;
};

type RawDraftPick = {
  franchise?: string;
  player?: string;
  round?: string | number;
  pick?: string | number;
  timestamp?: string | number;
};

function isPicked(playerId?: string): boolean {
  return Boolean(playerId && playerId !== "0" && playerId !== "");
}

function extractDraftPicks(results: unknown): RawDraftPick[] {
  if (!results || typeof results !== "object") return [];
  const draftResults = (results as { draftResults?: unknown }).draftResults;
  if (!draftResults || typeof draftResults !== "object") return [];

  const unit = (draftResults as { draftUnit?: unknown }).draftUnit;
  if (!unit) return [];

  const units = Array.isArray(unit) ? unit : [unit];
  const picks: RawDraftPick[] = [];
  for (const draftUnit of units) {
    if (!draftUnit || typeof draftUnit !== "object") continue;
    const draftPick = (
      draftUnit as { draftPick?: RawDraftPick | RawDraftPick[] }
    ).draftPick;
    picks.push(...toArray(draftPick));
  }
  return picks;
}

export function parseDraftSlots(
  results: unknown,
  franchiseNames: Map<string, string> = new Map(),
  playerMeta: Map<string, { name?: string; position?: string }> = new Map(),
): DraftPickSlot[] {
  return extractDraftPicks(results).map((raw, index) => {
    const franchise = String(raw.franchise ?? "");
    const playerId = raw.player ? String(raw.player) : undefined;
    const meta = playerId ? playerMeta.get(playerId) : undefined;
    return {
      round: Number(raw.round ?? 0),
      pick: Number(raw.pick ?? 0),
      overall: index + 1,
      franchise,
      franchiseName: franchiseNames.get(franchise),
      playerId: isPicked(playerId) ? playerId : undefined,
      playerName: isPicked(playerId) ? meta?.name : undefined,
      position: isPicked(playerId) ? meta?.position : undefined,
      timestamp:
        raw.timestamp !== undefined ? String(raw.timestamp) : undefined,
    };
  });
}

export function summarizeDraftStatus(
  slots: DraftPickSlot[],
  options: { nextPicks?: number; franchiseId?: string } = {},
): DraftStatusSummary {
  const nextCount = options.nextPicks ?? 5;
  const currentIndex = slots.findIndex((slot) => !slot.playerId);
  const currentPick = currentIndex >= 0 ? slots[currentIndex] : null;
  const remainingStart = currentIndex >= 0 ? currentIndex : slots.length;
  const nextPicks = slots
    .slice(
      remainingStart + (currentPick ? 1 : 0),
      remainingStart + (currentPick ? 1 : 0) + nextCount,
    )
    .map(
      ({
        playerId: _playerId,
        playerName: _playerName,
        position: _position,
        timestamp: _timestamp,
        ...pick
      }) => pick,
    );

  const currentPickSummary = currentPick
    ? {
        round: currentPick.round,
        pick: currentPick.pick,
        overall: currentPick.overall,
        franchise: currentPick.franchise,
        franchiseName: currentPick.franchiseName,
      }
    : null;

  let myNextPick: DraftStatusSummary["myNextPick"] = null;
  if (options.franchiseId) {
    const myIndex = slots.findIndex(
      (slot, index) =>
        index >= remainingStart &&
        slot.franchise === options.franchiseId &&
        !slot.playerId,
    );
    if (myIndex >= 0) {
      const slot = slots[myIndex];
      myNextPick = {
        round: slot.round,
        pick: slot.pick,
        overall: slot.overall,
        franchise: slot.franchise,
        franchiseName: slot.franchiseName,
        picksUntilMyTurn: myIndex - remainingStart,
      };
    }
  }

  return {
    currentPick: currentPickSummary,
    nextPicks,
    picksMade: slots.filter((slot) => Boolean(slot.playerId)).length,
    totalPicks: slots.length,
    myNextPick,
  };
}
