export type DraftCandidate = {
  id: string;
  name: string;
  position: string;
  team?: string;
  status?: string;
  available?: boolean;
  adp?: number;
  rank?: number;
  value2qb?: number;
  valueOverAdp?: number;
  draftScore?: number;
};

export function scoreDraftCandidate(c: DraftCandidate): number {
  const rankScore = c.rank ? Math.max(0, 300 - c.rank) : 0;
  const adpScore = c.adp ? Math.max(0, 300 - c.adp) : 0;
  const valueScore = c.value2qb ?? 0;
  return rankScore * 0.45 + adpScore * 0.35 + valueScore * 0.2;
}

export function buildDraftBoard(players: DraftCandidate[]): DraftCandidate[] {
  return players
    .map((player) => ({
      ...player,
      valueOverAdp:
        player.adp !== undefined && player.rank !== undefined
          ? Number((player.adp - player.rank).toFixed(2))
          : undefined,
      draftScore: Number(scoreDraftCandidate(player).toFixed(2)),
    }))
    .sort((a, b) => (b.draftScore ?? 0) - (a.draftScore ?? 0));
}

export type DraftSort = "rank" | "adp" | "value" | "draft_score";

export function sortDraftCandidates(
  players: DraftCandidate[],
  sortBy: DraftSort,
): DraftCandidate[] {
  const missing = Number.POSITIVE_INFINITY;
  return [...players].sort((a, b) => {
    if (sortBy === "rank") return (a.rank ?? missing) - (b.rank ?? missing);
    if (sortBy === "adp") return (a.adp ?? missing) - (b.adp ?? missing);
    if (sortBy === "value") {
      return (b.valueOverAdp ?? -missing) - (a.valueOverAdp ?? -missing);
    }
    return (b.draftScore ?? 0) - (a.draftScore ?? 0);
  });
}

export function filterAvailablePlayers(
  players: DraftCandidate[],
  available: Map<string, string>,
  position?: string,
): DraftCandidate[] {
  return players
    .filter(
      (player) =>
        available.has(player.id) &&
        (!position || player.position.toUpperCase() === position.toUpperCase()),
    )
    .map((player) => ({
      ...player,
      available: true,
      status: available.get(player.id),
    }));
}
