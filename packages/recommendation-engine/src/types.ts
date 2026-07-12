export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type IssueDifficulty = "beginner" | "intermediate" | "advanced";

export interface DeveloperSkill {
  name: string;
  level: SkillLevel;
}

export interface DifficultyPreference {
  /** The difficulty the developer wants most; scored highest. */
  preferred: IssueDifficulty;
  /** Issues below `min` or above `max` are excluded entirely. */
  min: IssueDifficulty;
  max: IssueDifficulty;
}

/**
 * Everything the engine knows about a developer. The application layer builds
 * this from the confirmed skill profile and career goals; empty arrays mean
 * "no data", never undefined.
 */
export interface DeveloperProfile {
  skills: DeveloperSkill[];
  /** Technologies the developer wants to work with or improve. */
  preferredTechnologies: string[];
  /** Technologies associated with the developer's career goal. */
  careerGoalTechnologies: string[];
  difficulty: DifficultyPreference;
}

/**
 * Signals owned by the repository-health domain, normalised to 0..1
 * before they reach the engine.
 */
export interface RepositorySignals {
  isActive: boolean;
  activityScore: number;
  /**
   * Null means "not measured yet" (ADR-0015) and scores as the config's
   * unknownSignalScore with no reason — never a substituted fake value.
   */
  maintainerResponsivenessScore: number | null;
  /**
   * True when a repository publishes a valid Contribution Manifest v0 and is
   * currently accepting outside contributors. Adds a bounded maintainer-
   * approved boost (ADR-0016).
   */
  hasContributionManifest: boolean;
}

/**
 * An issue candidate as prepared by the issue-synchronisation pipeline.
 * The engine never talks to GitHub; every field is already synchronised data.
 */
export interface IssueCandidate {
  id: string;
  title: string;
  description: string;
  /** Technologies and skills the issue involves, as extracted during sync. */
  technologies: string[];
  /** Maintainer-declared preferred skills from the Contribution Manifest v0. */
  maintainerPreferredSkills: string[];
  difficulty: IssueDifficulty;
  state: "open" | "closed";
  isAssigned: boolean;
  isBlocked: boolean;
  hasActivePullRequest: boolean;
  allowsExternalContributors: boolean;
  updatedAt: Date;
  /** Issue-description clarity, normalised to 0..1 by the issue pipeline. */
  clarityScore: number;
  repository: RepositorySignals;
}

export type ExclusionReason =
  | "already_assigned"
  | "closed"
  | "blocked"
  | "stale"
  | "active_pull_request"
  | "inactive_repository"
  | "insufficient_description"
  | "difficulty_out_of_range"
  | "external_contributions_not_accepted";

export interface RecommendationScoreComponents {
  skillMatch: number;
  technologyPreference: number;
  difficultyMatch: number;
  freshness: number;
  repositoryActivity: number;
  maintainerResponsiveness: number;
  issueClarity: number;
  careerGoalMatch: number;
}

export interface RecommendationScore {
  /** Weighted total, 0..100. Meaningful only when `exclusions` is empty. */
  total: number;
  /** Version of the scoring configuration that produced this result. */
  version: string;
  /** Unweighted sub-scores, each 0..100, for transparency in the UI. */
  components: RecommendationScoreComponents;
  /** Human-readable explanations for the strongest signals. */
  reasons: string[];
  /** Non-empty means the issue must not be recommended. */
  exclusions: ExclusionReason[];
}

export interface ScoredIssue {
  issue: IssueCandidate;
  score: RecommendationScore;
}

export interface RankedIssues {
  /** Eligible issues, highest total first; ties broken by issue id. */
  recommendations: ScoredIssue[];
  /** Issues with at least one exclusion reason, in input order. */
  excluded: ScoredIssue[];
}
