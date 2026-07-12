import {
  defaultRepositoryHealthConfig,
  validateRepositoryHealthConfig,
  type RepositoryHealthConfig,
} from "./config.js";
import type {
  CurationWarning,
  RawRepositoryMetadata,
  RepositoryHealthAssessment,
} from "./types.js";

const MILLISECONDS_PER_DAY = 86_400_000;

function daysSince(date: Date, evaluatedAt: Date): number {
  return Math.max(0, Math.floor((evaluatedAt.getTime() - date.getTime()) / MILLISECONDS_PER_DAY));
}

function clampToUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export interface AssessRepositoryHealthOptions {
  config?: RepositoryHealthConfig;
  /** Reference time for staleness; defaults to now. Inject in tests. */
  evaluatedAt?: Date;
}

/**
 * Assesses a repository's health from raw GitHub metadata. Deterministic
 * and testable without GitHub or a database — see ADR-0010.
 */
export function assessRepositoryHealth(
  metadata: RawRepositoryMetadata,
  options: AssessRepositoryHealthOptions = {},
): RepositoryHealthAssessment {
  const config = options.config ?? defaultRepositoryHealthConfig;
  const evaluatedAt = options.evaluatedAt ?? new Date();
  validateRepositoryHealthConfig(config);

  const warnings: CurationWarning[] = [];
  if (metadata.archived) {
    warnings.push("archived");
  }
  if (metadata.disabled) {
    warnings.push("disabled");
  }
  if (!metadata.hasContributingGuide) {
    warnings.push("no_contributing_guide");
  }

  const isStale =
    metadata.pushedAt === null || daysSince(metadata.pushedAt, evaluatedAt) > config.staleAfterDays;
  if (isStale) {
    warnings.push("stale");
  }

  const activityScore =
    metadata.pushedAt === null
      ? 0
      : clampToUnit(1 - daysSince(metadata.pushedAt, evaluatedAt) / config.staleAfterDays);

  return {
    isActive: !metadata.archived && !metadata.disabled && !isStale,
    activityScore,
    curationWarnings: warnings,
  };
}
