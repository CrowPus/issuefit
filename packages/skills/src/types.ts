export type SkillLevel = "beginner" | "intermediate" | "advanced";

/** Where a user_skills row's level came from — never trust "manual" data as GitHub-derived. */
export type SkillSource = "github_sync" | "manual";

/** The subset of a synced repository the inference algorithm needs. */
export interface RepositoryLanguageSample {
  primaryLanguage: string | null;
  isFork: boolean;
}

export interface ProposedSkill {
  name: string;
  level: SkillLevel;
  /** 0..1; how many repositories support this proposal, relative to the advanced threshold. */
  confidenceScore: number;
  repositoryCount: number;
}

export type CareerGoalOption =
  | "backend_developer"
  | "frontend_developer"
  | "fullstack_developer"
  | "devops"
  | "mobile_developer"
  | "open_source_collaboration"
  | "other";

export type IssueTypePreference = "bug_fix" | "feature" | "documentation" | "testing" | "refactor";

export type IssueDifficultyPreference = "beginner" | "intermediate" | "advanced";
