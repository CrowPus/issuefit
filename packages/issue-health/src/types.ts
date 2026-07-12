export type IssueDifficulty = "beginner" | "intermediate" | "advanced";

/** Raw signals as read from GitHub's issue list API. */
export interface RawIssueMetadata {
  title: string;
  /** GitHub calls this "body"; null for issues opened with no description. */
  description: string | null;
  labels: string[];
}

export interface IssueHealthAssessment {
  /** Estimated from label keywords; falls back to "intermediate" when no label matches. */
  difficulty: IssueDifficulty;
  /** 0..1, based on description length and structure. */
  clarityScore: number;
  /** True when a label matches a configured "blocked" keyword. */
  isBlocked: boolean;
}
