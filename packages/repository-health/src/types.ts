/** Raw signals as read from GitHub's repository and community-profile APIs. */
export interface RawRepositoryMetadata {
  pushedAt: Date | null;
  archived: boolean;
  disabled: boolean;
  hasContributingGuide: boolean;
}

export type CurationWarning = "archived" | "disabled" | "stale" | "no_contributing_guide";

export interface RepositoryHealthAssessment {
  isActive: boolean;
  /** 0..1, based purely on push recency. */
  activityScore: number;
  /** Informational, non-blocking — the admin decides whether to curate anyway. */
  curationWarnings: CurationWarning[];
}

/**
 * One sampled issue for responsiveness measurement: when it was opened and
 * when it first received a comment from someone other than its author
 * (null = never answered). See ADR-0015.
 */
export interface FirstResponseSample {
  issueCreatedAt: Date;
  firstRespondedAt: Date | null;
}

/**
 * Local setup signals detected from repository file listings at curation
 * time (ADR-0017). Values describe a measured snapshot: `null` /
 * `false` / `[]` mean "checked and not found", while a repository that was
 * never checked has no signals row at all (a null `setupSignalsCheckedAt`).
 */
export interface RepositorySetupSignals {
  /** Package manager implied by the root lockfile; null = none detected. */
  packageManager: string | null;
  hasDockerCompose: boolean;
  /** Trimmed `.nvmrc` contents; null = no usable version file. */
  nodeVersion: string | null;
  /** Workflow file names under `.github/workflows`. */
  ciWorkflowNames: string[];
}

/**
 * Measured maintainer responsiveness. All fields are null when the sample
 * was empty — "not measured" is an explicit state, never a neutral number
 * dressed up as data (ADR-0015).
 */
export interface MaintainerResponsivenessAssessment {
  /** 0..1: latency score scaled by response rate; null = not measured. */
  score: number | null;
  /** Median days from issue creation to first non-author response. */
  medianResponseDays: number | null;
  /** Fraction (0..1) of sampled issues that received a response. */
  responseRate: number | null;
}
