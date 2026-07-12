import {
  defaultRepositoryHealthConfig,
  validateRepositoryHealthConfig,
  type RepositoryHealthConfig,
} from "./config.js";
import type { FirstResponseSample, MaintainerResponsivenessAssessment } from "./types.js";

const MILLISECONDS_PER_DAY = 86_400_000;

function clampToUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  if (sorted.length % 2 === 0 && lower !== undefined && upper !== undefined) {
    return (lower + upper) / 2;
  }
  return upper ?? 0;
}

export interface AssessMaintainerResponsivenessOptions {
  config?: RepositoryHealthConfig;
}

/**
 * Measures maintainer responsiveness from sampled first-response times
 * (ADR-0015). Deterministic and testable without GitHub or a database:
 *
 * - empty sample → all fields null ("not measured", an explicit state);
 * - sampled issues but zero responses → score 0, rate 0, median null;
 * - otherwise → median latency over answered issues, response rate over
 *   the whole sample, and `score = clamp(1 − median/maxResponseDays) × rate`.
 */
export function assessMaintainerResponsiveness(
  samples: readonly FirstResponseSample[],
  options: AssessMaintainerResponsivenessOptions = {},
): MaintainerResponsivenessAssessment {
  const config = options.config ?? defaultRepositoryHealthConfig;
  validateRepositoryHealthConfig(config);

  if (samples.length === 0) {
    return { score: null, medianResponseDays: null, responseRate: null };
  }

  const latenciesDays = samples
    .filter(
      (sample): sample is FirstResponseSample & { firstRespondedAt: Date } =>
        sample.firstRespondedAt !== null,
    )
    .map(
      (sample) =>
        Math.max(0, sample.firstRespondedAt.getTime() - sample.issueCreatedAt.getTime()) /
        MILLISECONDS_PER_DAY,
    );

  const responseRate = latenciesDays.length / samples.length;
  if (latenciesDays.length === 0) {
    return { score: 0, medianResponseDays: null, responseRate };
  }

  const medianResponseDays = median(latenciesDays);
  const latencyScore = clampToUnit(1 - medianResponseDays / config.maxResponseDays);
  return {
    score: latencyScore * responseRate,
    medianResponseDays,
    responseRate,
  };
}

/**
 * The first comment by someone other than the issue's author, given the
 * issue's earliest comments oldest-first. Author self-replies don't count
 * as a response; a ghost (deleted) commenter counts only when the issue
 * author is known — two unknowns can't be told apart honestly.
 */
export function firstNonAuthorResponseAt(
  comments: readonly { authorLogin: string | null; createdAt: Date }[],
  issueAuthorLogin: string | null,
): Date | null {
  for (const comment of comments) {
    if (comment.authorLogin === null && issueAuthorLogin === null) {
      continue;
    }
    if (comment.authorLogin !== issueAuthorLogin) {
      return comment.createdAt;
    }
  }
  return null;
}
