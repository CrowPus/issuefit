export interface RepositoryHealthConfig {
  /** Identifies the scoring rules that produced a result; bump on changes. */
  version: string;
  /**
   * Days since the last push beyond which a repository is considered
   * inactive. Deliberately longer than the recommendation engine's
   * issue-freshness threshold (90 days): a mature, stable library can go
   * quiet for a while without being abandoned, whereas a specific issue
   * going quiet for that long usually means it is no longer relevant.
   */
  staleAfterDays: number;
  /**
   * Median first-response latency (days) at or beyond which the latency
   * component of the responsiveness score reaches zero (ADR-0015).
   */
  maxResponseDays: number;
  /**
   * How many of the most recently updated open issues are sampled for
   * first-response measurement — each answered sampled issue costs one
   * extra API call during sync (ADR-0015).
   */
  responseSampleSize: number;
}

export const defaultRepositoryHealthConfig: RepositoryHealthConfig = {
  // Bumped to "2" when the neutral maintainer-responsiveness placeholder
  // was replaced by measured first-response sampling (ADR-0015).
  version: "2",
  staleAfterDays: 180,
  maxResponseDays: 30,
  responseSampleSize: 20,
};

export class RepositoryHealthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryHealthConfigError";
  }
}

/**
 * Rejects configurations that would silently distort health assessments.
 * Called on every evaluation, so a bad config fails loudly instead of
 * producing plausible-looking but wrong results.
 */
export function validateRepositoryHealthConfig(config: RepositoryHealthConfig): void {
  if (!Number.isInteger(config.staleAfterDays) || config.staleAfterDays <= 0) {
    throw new RepositoryHealthConfigError("staleAfterDays must be a positive integer");
  }
  if (!Number.isFinite(config.maxResponseDays) || config.maxResponseDays <= 0) {
    throw new RepositoryHealthConfigError("maxResponseDays must be a positive number");
  }
  if (!Number.isInteger(config.responseSampleSize) || config.responseSampleSize <= 0) {
    throw new RepositoryHealthConfigError("responseSampleSize must be a positive integer");
  }
  if (config.version.trim() === "") {
    throw new RepositoryHealthConfigError("version must not be empty");
  }
}
