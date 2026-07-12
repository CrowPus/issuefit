import type { IssueDifficulty } from "./types.js";

const MILLISECONDS_PER_DAY = 86_400_000;

const difficultyOrder: Record<IssueDifficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/** Widest possible distance on the difficulty scale (beginner ↔ advanced). */
export const MAX_DIFFICULTY_DISTANCE = 2;

export function compareDifficulty(a: IssueDifficulty, b: IssueDifficulty): number {
  return difficultyOrder[a] - difficultyOrder[b];
}

export function difficultyDistance(a: IssueDifficulty, b: IssueDifficulty): number {
  return Math.abs(compareDifficulty(a, b));
}

/** Whole days from `from` to `to`; never negative (future dates count as 0). */
export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / MILLISECONDS_PER_DAY));
}

export function clampToUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/**
 * Case-, punctuation-, and whitespace-insensitive technology comparison key,
 * so "Node.js", "nodejs", and "NODE JS" all refer to the same technology.
 */
export function technologyKey(name: string): string {
  return name.toLowerCase().replace(/[\s.\-_]/g, "");
}
