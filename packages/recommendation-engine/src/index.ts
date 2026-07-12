export { ScoringConfigError, defaultScoringConfig, validateScoringConfig } from "./config.js";
export type { ScoringConfig, ScoringWeights } from "./config.js";
export { evaluateExclusions } from "./exclusions.js";
export { ProfileValidationError, rankIssues, scoreIssue } from "./scoring.js";
export type { ScoreIssueOptions } from "./scoring.js";
export { technologyKey } from "./units.js";
export type {
  DeveloperProfile,
  DeveloperSkill,
  DifficultyPreference,
  ExclusionReason,
  IssueCandidate,
  IssueDifficulty,
  RankedIssues,
  RecommendationScore,
  RecommendationScoreComponents,
  RepositorySignals,
  ScoredIssue,
  SkillLevel,
} from "./types.js";
