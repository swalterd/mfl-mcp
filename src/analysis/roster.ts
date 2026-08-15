import type { StarterRule } from "./lineup.js";

export type RosterNeed = {
  position: string;
  minRequired: number;
  currentlyRostered: number;
  deficit: number;
};

export function computeRosterNeeds(
  rosterPositions: string[],
  rules: StarterRule[],
): RosterNeed[] {
  return rules.map((rule) => {
    const count = rosterPositions.filter((p) => p === rule.name).length;
    return {
      position: rule.name,
      minRequired: rule.min,
      currentlyRostered: count,
      deficit: Math.max(0, rule.min - count),
    };
  });
}
