import { defaultScoringConfig, validateScoringConfig, type ScoringConfig } from "./config.js";
import { evaluateExclusions } from "./exclusions.js";
import type {
  DeveloperProfile,
  IssueCandidate,
  RankedIssues,
  RecommendationScore,
  RecommendationScoreComponents,
  ScoredIssue,
} from "./types.js";
import {
  MAX_DIFFICULTY_DISTANCE,
  clampToUnit,
  compareDifficulty,
  daysBetween,
  difficultyDistance,
  technologyKey,
} from "./units.js";

export interface ScoreIssueOptions {
  config?: ScoringConfig;
  /** Reference time for freshness; defaults to now. Inject in tests. */
  evaluatedAt?: Date;
}

export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileValidationError";
  }
}

interface ComponentResult {
  /** Normalised sub-score, 0..1. */
  value: number;
  /** Explanation offered when the sub-score passes the reason threshold. */
  reason: string | null;
}

/** Fixed evaluation and reporting order for components and reasons. */
const COMPONENT_ORDER = [
  "skillMatch",
  "technologyPreference",
  "difficultyMatch",
  "freshness",
  "repositoryActivity",
  "maintainerResponsiveness",
  "issueClarity",
  "careerGoalMatch",
] as const satisfies readonly (keyof RecommendationScoreComponents)[];

/** Deduplicates technologies by comparison key, keeping the first spelling. */
function uniqueTechnologies(names: readonly string[]): Map<string, string> {
  const byKey = new Map<string, string>();
  for (const name of names) {
    const key = technologyKey(name);
    if (key !== "" && !byKey.has(key)) {
      byKey.set(key, name.trim());
    }
  }
  return byKey;
}

function overlap(
  issueTechnologies: Map<string, string>,
  otherKeys: ReadonlySet<string>,
): { matchedNames: string[]; fraction: number } {
  const matchedNames: string[] = [];
  for (const [key, displayName] of issueTechnologies) {
    if (otherKeys.has(key)) {
      matchedNames.push(displayName);
    }
  }
  return {
    matchedNames,
    fraction: issueTechnologies.size === 0 ? 0 : matchedNames.length / issueTechnologies.size,
  };
}

function keySet(names: readonly string[]): Set<string> {
  return new Set(names.map(technologyKey));
}

function scoreSkillMatch(
  profile: DeveloperProfile,
  issueTechnologies: Map<string, string>,
  config: ScoringConfig,
): ComponentResult {
  if (issueTechnologies.size === 0) {
    return { value: config.unknownSignalScore, reason: null };
  }
  const { matchedNames, fraction } = overlap(
    issueTechnologies,
    keySet(profile.skills.map((skill) => skill.name)),
  );
  return {
    value: fraction,
    reason: matchedNames.length > 0 ? `You already work with ${matchedNames.join(", ")}` : null,
  };
}

function scoreTechnologyPreference(
  profile: DeveloperProfile,
  issueTechnologies: Map<string, string>,
  config: ScoringConfig,
): ComponentResult {
  if (issueTechnologies.size === 0 || profile.preferredTechnologies.length === 0) {
    return { value: config.unknownSignalScore, reason: null };
  }
  const { matchedNames, fraction } = overlap(
    issueTechnologies,
    keySet(profile.preferredTechnologies),
  );
  return {
    value: fraction,
    reason:
      matchedNames.length > 0
        ? `Uses technologies you want to practise: ${matchedNames.join(", ")}`
        : null,
  };
}

function scoreDifficultyMatch(profile: DeveloperProfile, issue: IssueCandidate): ComponentResult {
  const distance = difficultyDistance(issue.difficulty, profile.difficulty.preferred);
  return {
    value: 1 - distance / MAX_DIFFICULTY_DISTANCE,
    reason:
      distance === 0 ? `Matches your preferred difficulty (${profile.difficulty.preferred})` : null,
  };
}

function scoreFreshness(
  issue: IssueCandidate,
  config: ScoringConfig,
  evaluatedAt: Date,
): ComponentResult {
  const ageDays = daysBetween(issue.updatedAt, evaluatedAt);
  return {
    value: clampToUnit(1 - ageDays / config.staleAfterDays),
    reason: `Recently active: updated ${ageDays === 1 ? "1 day" : `${ageDays} days`} ago`,
  };
}

function scoreCareerGoalMatch(
  profile: DeveloperProfile,
  issueTechnologies: Map<string, string>,
  config: ScoringConfig,
): ComponentResult {
  if (issueTechnologies.size === 0 || profile.careerGoalTechnologies.length === 0) {
    return { value: config.unknownSignalScore, reason: null };
  }
  const { matchedNames, fraction } = overlap(
    issueTechnologies,
    keySet(profile.careerGoalTechnologies),
  );
  return {
    value: fraction,
    reason:
      matchedNames.length > 0 ? `Advances your career goal: ${matchedNames.join(", ")}` : null,
  };
}

function manifestPreferredSkillMatch(
  profile: DeveloperProfile,
  preferredSkills: Map<string, string>,
): { matchedNames: string[]; fraction: number } {
  return overlap(preferredSkills, keySet(profile.skills.map((skill) => skill.name)));
}

function validateProfile(profile: DeveloperProfile): void {
  if (compareDifficulty(profile.difficulty.min, profile.difficulty.max) > 0) {
    throw new ProfileValidationError(
      `difficulty range is inverted: min "${profile.difficulty.min}" is above max "${profile.difficulty.max}"`,
    );
  }
}

function toPercentage(value: number): number {
  return Math.round(clampToUnit(value) * 100);
}

/**
 * Scores one issue for one developer. Fully deterministic: identical inputs
 * (including `evaluatedAt`) always produce the identical result, so every
 * recommendation shown to a user can be reproduced and explained.
 */
export function scoreIssue(
  profile: DeveloperProfile,
  issue: IssueCandidate,
  options: ScoreIssueOptions = {},
): RecommendationScore {
  const config = options.config ?? defaultScoringConfig;
  const evaluatedAt = options.evaluatedAt ?? new Date();
  validateScoringConfig(config);
  validateProfile(profile);

  const issueTechnologies = uniqueTechnologies(issue.technologies);
  const manifestPreferredSkills = uniqueTechnologies(issue.maintainerPreferredSkills);

  const results: Record<keyof RecommendationScoreComponents, ComponentResult> = {
    skillMatch: scoreSkillMatch(profile, issueTechnologies, config),
    technologyPreference: scoreTechnologyPreference(profile, issueTechnologies, config),
    difficultyMatch: scoreDifficultyMatch(profile, issue),
    freshness: scoreFreshness(issue, config, evaluatedAt),
    repositoryActivity: {
      value: clampToUnit(issue.repository.activityScore),
      reason: "The repository is actively maintained",
    },
    maintainerResponsiveness:
      issue.repository.maintainerResponsivenessScore === null
        ? { value: config.unknownSignalScore, reason: null }
        : {
            value: clampToUnit(issue.repository.maintainerResponsivenessScore),
            reason: "Maintainers respond quickly to contributors",
          },
    issueClarity: {
      value: clampToUnit(issue.clarityScore),
      reason: "The issue is clearly described",
    },
    careerGoalMatch: scoreCareerGoalMatch(profile, issueTechnologies, config),
  };

  const weightedTotal = COMPONENT_ORDER.reduce(
    (sum, component) => sum + config.weights[component] * clampToUnit(results[component].value),
    0,
  );
  const { matchedNames: manifestMatchedSkills, fraction: manifestPreferredSkillFraction } =
    manifestPreferredSkillMatch(profile, manifestPreferredSkills);
  const manifestPresenceBoost = issue.repository.hasContributionManifest
    ? config.manifestPresenceBoost
    : 0;
  const manifestPreferredSkillBoost =
    manifestPreferredSkills.size === 0
      ? 0
      : config.manifestPreferredSkillBoost * manifestPreferredSkillFraction;
  const boostedTotal = weightedTotal + manifestPresenceBoost + manifestPreferredSkillBoost;

  const components: RecommendationScoreComponents = {
    skillMatch: toPercentage(results.skillMatch.value),
    technologyPreference: toPercentage(results.technologyPreference.value),
    difficultyMatch: toPercentage(results.difficultyMatch.value),
    freshness: toPercentage(results.freshness.value),
    repositoryActivity: toPercentage(results.repositoryActivity.value),
    maintainerResponsiveness: toPercentage(results.maintainerResponsiveness.value),
    issueClarity: toPercentage(results.issueClarity.value),
    careerGoalMatch: toPercentage(results.careerGoalMatch.value),
  };

  const reasons = COMPONENT_ORDER.flatMap((component) => {
    const { value, reason } = results[component];
    return reason !== null && value >= config.reasonThreshold ? [reason] : [];
  });
  if (manifestPresenceBoost > 0) {
    reasons.push("Maintainers publish IssueFit contribution requirements");
  }
  if (manifestMatchedSkills.length > 0 && manifestPreferredSkillBoost > 0) {
    reasons.push(`Maintainers prefer your skills: ${manifestMatchedSkills.join(", ")}`);
  }

  return {
    total: toPercentage(boostedTotal),
    version: config.version,
    components,
    reasons,
    exclusions: evaluateExclusions(profile, issue, config, evaluatedAt),
  };
}

function compareScoredIssues(a: ScoredIssue, b: ScoredIssue): number {
  if (a.score.total !== b.score.total) {
    return b.score.total - a.score.total;
  }
  if (a.issue.id === b.issue.id) {
    return 0;
  }
  return a.issue.id < b.issue.id ? -1 : 1;
}

/**
 * Scores all candidates and separates eligible recommendations (sorted by
 * total, ties broken by issue id for a stable order) from excluded issues.
 */
export function rankIssues(
  profile: DeveloperProfile,
  issues: readonly IssueCandidate[],
  options: ScoreIssueOptions = {},
): RankedIssues {
  const recommendations: ScoredIssue[] = [];
  const excluded: ScoredIssue[] = [];

  for (const issue of issues) {
    const scored: ScoredIssue = { issue, score: scoreIssue(profile, issue, options) };
    if (scored.score.exclusions.length === 0) {
      recommendations.push(scored);
    } else {
      excluded.push(scored);
    }
  }

  recommendations.sort(compareScoredIssues);
  return { recommendations, excluded };
}
