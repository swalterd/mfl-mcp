export type StarterRule = {
  name: string;
  min: number;
  max: number;
};

export type Candidate = {
  playerId: string;
  position: string;
  score: number;
};

export function parseStarterRules(
  raw: Array<{ name: string; limit: string }>,
): StarterRule[] {
  return raw.map((r) => {
    const [minS, maxS] = r.limit.split("-");
    return {
      name: r.name,
      min: Number(minS),
      max: Number(maxS ?? minS),
    };
  });
}

export function optimizeLineup(
  candidates: Candidate[],
  rules: StarterRule[],
  total: number,
): Candidate[] {
  const selected: Candidate[] = [];
  const byPos = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const list = byPos.get(c.position) ?? [];
    list.push(c);
    byPos.set(c.position, list);
  }
  for (const [pos, list] of byPos) {
    byPos.set(
      pos,
      list.sort((a, b) => b.score - a.score),
    );
  }

  // Fill required minimums.
  for (const rule of rules) {
    const list = byPos.get(rule.name) ?? [];
    selected.push(...list.slice(0, rule.min));
    byPos.set(rule.name, list.slice(rule.min));
  }

  while (selected.length < total) {
    let best: Candidate | null = null;
    let bestPos = "";
    for (const rule of rules) {
      const usedAtPos = selected.filter((s) => s.position === rule.name).length;
      if (usedAtPos >= rule.max) continue;
      const next = (byPos.get(rule.name) ?? [])[0];
      if (!next) continue;
      if (!best || next.score > best.score) {
        best = next;
        bestPos = rule.name;
      }
    }
    if (!best) break;
    selected.push(best);
    byPos.set(bestPos, (byPos.get(bestPos) ?? []).slice(1));
  }
  return selected;
}
