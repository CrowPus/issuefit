import {
  defaultIssueHealthConfig,
  validateIssueHealthConfig,
  type IssueHealthConfig,
} from "./config.js";
import type { IssueDifficulty, IssueHealthAssessment, RawIssueMetadata } from "./types.js";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[-_]/g, " ").trim();
}

function matchesAnyKeyword(labels: readonly string[], keywords: readonly string[]): boolean {
  const normalizedLabels = labels.map(normalize);
  return keywords.some((keyword) => {
    const normalizedKeyword = normalize(keyword);
    return normalizedLabels.some((label) => label.includes(normalizedKeyword));
  });
}

function clampToUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function estimateDifficulty(labels: readonly string[], config: IssueHealthConfig): IssueDifficulty {
  if (matchesAnyKeyword(labels, config.beginnerLabelKeywords)) {
    return "beginner";
  }
  if (matchesAnyKeyword(labels, config.advancedLabelKeywords)) {
    return "advanced";
  }
  return "intermediate";
}

export interface AssessIssueHealthOptions {
  config?: IssueHealthConfig;
}

/**
 * Assesses an issue's difficulty, description clarity, and blocked status
 * from raw GitHub metadata. Deterministic and testable without GitHub or a
 * database — see ADR-0011.
 */
export function assessIssueHealth(
  metadata: RawIssueMetadata,
  options: AssessIssueHealthOptions = {},
): IssueHealthAssessment {
  const config = options.config ?? defaultIssueHealthConfig;
  validateIssueHealthConfig(config);

  const descriptionLength = metadata.description?.trim().length ?? 0;

  return {
    difficulty: estimateDifficulty(metadata.labels, config),
    clarityScore: clampToUnit(descriptionLength / config.fullClarityDescriptionLength),
    isBlocked: matchesAnyKeyword(metadata.labels, config.blockedLabelKeywords),
  };
}
