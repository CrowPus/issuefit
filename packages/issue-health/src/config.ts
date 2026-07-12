export interface IssueHealthConfig {
  /** Identifies the scoring rules that produced a result; bump on changes. */
  version: string;
  /** Label keywords (case-insensitive, hyphen/underscore-insensitive) implying "beginner". */
  beginnerLabelKeywords: string[];
  /** Label keywords implying "advanced". */
  advancedLabelKeywords: string[];
  /**
   * Label keywords implying the issue is not currently viable to work on
   * (genuinely blocked, or the maintainers have decided not to act on it).
   */
  blockedLabelKeywords: string[];
  /** Description length, in characters, at or above which clarityScore reaches 1. */
  fullClarityDescriptionLength: number;
}

export const defaultIssueHealthConfig: IssueHealthConfig = {
  version: "1",
  beginnerLabelKeywords: [
    "good first issue",
    "good first bug",
    "beginner",
    "easy",
    "starter",
    "first timers only",
    "low hanging fruit",
  ],
  advancedLabelKeywords: ["advanced", "hard", "expert", "complex", "difficult"],
  blockedLabelKeywords: ["blocked", "on hold", "wontfix", "duplicate", "invalid"],
  fullClarityDescriptionLength: 200,
};

export class IssueHealthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IssueHealthConfigError";
  }
}

/**
 * Rejects configurations that would silently distort issue assessments.
 * Called on every evaluation, so a bad config fails loudly instead of
 * producing plausible-looking but wrong results.
 */
export function validateIssueHealthConfig(config: IssueHealthConfig): void {
  if (
    !Number.isInteger(config.fullClarityDescriptionLength) ||
    config.fullClarityDescriptionLength <= 0
  ) {
    throw new IssueHealthConfigError("fullClarityDescriptionLength must be a positive integer");
  }
  if (config.version.trim() === "") {
    throw new IssueHealthConfigError("version must not be empty");
  }
}
