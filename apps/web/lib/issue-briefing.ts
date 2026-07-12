import {
  findCareerGoalByUserId,
  findFeedbackVerdictForUser,
  findSyncedIssueByGithubIssueId,
  listUserSkillsWithNames,
  type IssueRecord,
  type IssueWithRepository,
  type RecommendationFeedbackVerdict,
  type RepositoryRecord,
} from "@issuefit/database";
import {
  scoreIssue,
  type DeveloperProfile,
  type ExclusionReason,
  type RecommendationScore,
  type RecommendationScoreComponents,
} from "@issuefit/recommendation-engine";
import { z } from "zod";

import { getDb } from "./db";
import { buildDeveloperProfile, toIssueCandidate } from "./recommendations";

/** Route parameter: the stable GitHub issue id (ADR-0014, ADR-0017). */
export const briefingGithubIssueIdSchema = z.coerce.number().int().positive();

export interface IssueBriefing {
  issue: IssueRecord;
  repository: RepositoryRecord;
  /** Recomputed live for this user — includes exclusions when no longer eligible. */
  score: RecommendationScore;
  /** This user's existing verdict on the issue, or null if unrated (ADR-0014). */
  verdict: RecommendationFeedbackVerdict | null;
}

/**
 * Builds the deterministic briefing for one synced issue: the stored
 * snapshot plus a fresh engine score for this profile (ADR-0017). Pure
 * given an injected `evaluatedAt`, like buildFeedbackSnapshot (ADR-0014).
 */
export function buildIssueBriefing(
  profile: DeveloperProfile,
  item: IssueWithRepository,
  verdict: RecommendationFeedbackVerdict | null,
  evaluatedAt?: Date,
): IssueBriefing {
  return {
    issue: item.issue,
    repository: item.repository,
    score: scoreIssue(
      profile,
      toIssueCandidate(item),
      evaluatedAt === undefined ? {} : { evaluatedAt },
    ),
    verdict,
  };
}

/** Null when the issue is not in the synced catalogue (deleted, re-synced away, or never curated). */
export async function getIssueBriefingForUser(
  userId: string,
  githubIssueId: number,
): Promise<IssueBriefing | null> {
  const db = getDb();
  const [item, userSkills, careerGoal, verdict] = await Promise.all([
    findSyncedIssueByGithubIssueId(db, githubIssueId),
    listUserSkillsWithNames(db, userId),
    findCareerGoalByUserId(db, userId),
    findFeedbackVerdictForUser(db, userId, githubIssueId),
  ]);
  if (item === null) {
    return null;
  }
  return buildIssueBriefing(buildDeveloperProfile(userSkills, careerGoal), item, verdict);
}

export const componentLabels: Record<keyof RecommendationScoreComponents, string> = {
  skillMatch: "Skill match",
  technologyPreference: "Technology preference",
  difficultyMatch: "Difficulty match",
  freshness: "Freshness",
  repositoryActivity: "Repository activity",
  maintainerResponsiveness: "Maintainer responsiveness",
  issueClarity: "Issue clarity",
  careerGoalMatch: "Career goal match",
};

export const exclusionLabels: Record<ExclusionReason, string> = {
  already_assigned: "Someone is already assigned to this issue",
  closed: "The issue has been closed",
  blocked: "The issue is marked as blocked",
  stale: "The issue has not been updated for a long time",
  active_pull_request: "A pull request is already linked to this issue",
  inactive_repository: "The repository is no longer active",
  insufficient_description: "The issue description is too short to work from",
  difficulty_out_of_range: "The difficulty is outside your configured range",
  external_contributions_not_accepted: "The maintainers are not accepting outside contributions",
};
