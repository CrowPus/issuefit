import type { RecommendationScoreComponents } from "./types.js";

export type ScoringWeights = RecommendationScoreComponents;

export interface ScoringConfig {
  /** Identifies the scoring rules that produced a result; bump on changes. */
  version: string;
  /** Relative weight of each component; must sum to exactly 1. */
  weights: ScoringWeights;
  /** Issues not updated for more than this many days are excluded as stale. */
  staleAfterDays: number;
  /** Descriptions shorter than this (after trimming) are excluded. */
  minDescriptionLength: number;
  /**
   * Score used when a signal has no data to judge (for example an issue with
   * no extracted technologies): neither reward nor penalty.
   */
  unknownSignalScore: number;
  /** Sub-scores at or above this (0..1) produce a human-readable reason. */
  reasonThreshold: number;
  /** Additive boost for valid, accepting Contribution Manifest v0 repositories. */
  manifestPresenceBoost: number;
  /** Maximum additive boost when a developer's confirmed skills match manifest preferred skills. */
  manifestPreferredSkillBoost: number;
}

export const defaultScoringConfig: ScoringConfig = {
  // Bumped to "3" when Contribution Manifest v0 added bounded maintainer-
  // approval and preferred-skill boosts (ADR-0016).
  version: "3",
  weights: {
    skillMatch: 0.3,
    technologyPreference: 0.15,
    difficultyMatch: 0.1,
    freshness: 0.1,
    repositoryActivity: 0.1,
    maintainerResponsiveness: 0.1,
    issueClarity: 0.1,
    careerGoalMatch: 0.05,
  },
  staleAfterDays: 90,
  minDescriptionLength: 100,
  unknownSignalScore: 0.5,
  reasonThreshold: 0.7,
  manifestPresenceBoost: 0.03,
  manifestPreferredSkillBoost: 0.03,
};

export class ScoringConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScoringConfigError";
  }
}

const WEIGHT_SUM_TOLERANCE = 1e-9;

/**
 * Rejects configurations that would silently distort scores.
 * Called by the engine on every evaluation, so a bad config fails loudly
 * instead of producing plausible-looking but wrong recommendations.
 */
export function validateScoringConfig(config: ScoringConfig): void {
  const weightEntries = Object.entries(config.weights);
  for (const [component, weight] of weightEntries) {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new ScoringConfigError(`weight "${component}" must be a non-negative number`);
    }
  }
  const weightSum = weightEntries.reduce((sum, [, weight]) => sum + weight, 0);
  if (Math.abs(weightSum - 1) > WEIGHT_SUM_TOLERANCE) {
    throw new ScoringConfigError(`weights must sum to 1, got ${weightSum}`);
  }
  if (!Number.isFinite(config.staleAfterDays) || config.staleAfterDays <= 0) {
    throw new ScoringConfigError("staleAfterDays must be a positive number");
  }
  if (!Number.isInteger(config.minDescriptionLength) || config.minDescriptionLength < 0) {
    throw new ScoringConfigError("minDescriptionLength must be a non-negative integer");
  }
  if (config.unknownSignalScore < 0 || config.unknownSignalScore > 1) {
    throw new ScoringConfigError("unknownSignalScore must be between 0 and 1");
  }
  if (config.reasonThreshold < 0 || config.reasonThreshold > 1) {
    throw new ScoringConfigError("reasonThreshold must be between 0 and 1");
  }
  if (config.manifestPresenceBoost < 0 || config.manifestPresenceBoost > 0.1) {
    throw new ScoringConfigError("manifestPresenceBoost must be between 0 and 0.1");
  }
  if (config.manifestPreferredSkillBoost < 0 || config.manifestPreferredSkillBoost > 0.1) {
    throw new ScoringConfigError("manifestPreferredSkillBoost must be between 0 and 0.1");
  }
  if (config.version.trim() === "") {
    throw new ScoringConfigError("version must not be empty");
  }
}
