import type { ScoringConfig } from "./config.js";
import type { DeveloperProfile, ExclusionReason, IssueCandidate } from "./types.js";
import { compareDifficulty, daysBetween } from "./units.js";

/**
 * Returns every reason the issue must not be recommended, in a stable order.
 * An empty array means the issue is eligible for scoring-based ranking.
 */
export function evaluateExclusions(
  profile: DeveloperProfile,
  issue: IssueCandidate,
  config: ScoringConfig,
  evaluatedAt: Date,
): ExclusionReason[] {
  const exclusions: ExclusionReason[] = [];

  if (issue.state === "closed") {
    exclusions.push("closed");
  }
  if (issue.isAssigned) {
    exclusions.push("already_assigned");
  }
  if (issue.isBlocked) {
    exclusions.push("blocked");
  }
  if (issue.hasActivePullRequest) {
    exclusions.push("active_pull_request");
  }
  if (!issue.allowsExternalContributors) {
    exclusions.push("external_contributions_not_accepted");
  }
  if (!issue.repository.isActive) {
    exclusions.push("inactive_repository");
  }
  if (daysBetween(issue.updatedAt, evaluatedAt) > config.staleAfterDays) {
    exclusions.push("stale");
  }
  if (issue.description.trim().length < config.minDescriptionLength) {
    exclusions.push("insufficient_description");
  }
  if (
    compareDifficulty(issue.difficulty, profile.difficulty.min) < 0 ||
    compareDifficulty(issue.difficulty, profile.difficulty.max) > 0
  ) {
    exclusions.push("difficulty_out_of_range");
  }

  return exclusions;
}
