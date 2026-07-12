import {
  findCareerGoalByUserId,
  findSyncedIssueByGithubIssueId,
  listUserSkillsWithNames,
  recommendationFeedbackVerdictEnum,
  saveRecommendationFeedback,
  type IssueWithRepository,
  type RecommendationFeedbackVerdict,
} from "@issuefit/database";
import { rankIssues, type DeveloperProfile } from "@issuefit/recommendation-engine";
import { z } from "zod";

import { getDb } from "./db";
import { buildDeveloperProfile, toIssueCandidate } from "./recommendations";

export type { RecommendationFeedbackVerdict };

/** The only two things the client is trusted to assert — ADR-0014. */
export const feedbackInputSchema = z.object({
  githubIssueId: z.number().int().positive(),
  verdict: z.enum(recommendationFeedbackVerdictEnum.enumValues),
});

export interface FeedbackSnapshot {
  matchScore: number | null;
  matchReasons: string[];
  scoreVersion: string | null;
}

/**
 * Recomputes what the recommendation card showed by ranking the single
 * issue against the user's current profile — the engine is deterministic,
 * so this reproduces the displayed score without trusting the client.
 * Null score means the issue is excluded or unscorable right now, which
 * is recorded as-is (ADR-0014).
 */
export function buildFeedbackSnapshot(
  profile: DeveloperProfile,
  item: IssueWithRepository,
  evaluatedAt?: Date,
): FeedbackSnapshot {
  const ranked = rankIssues(
    profile,
    [toIssueCandidate(item)],
    evaluatedAt === undefined ? {} : { evaluatedAt },
  );
  const scored = ranked.recommendations[0];
  if (scored === undefined) {
    return { matchScore: null, matchReasons: [], scoreVersion: null };
  }
  return {
    matchScore: scored.score.total,
    matchReasons: scored.score.reasons,
    scoreVersion: scored.score.version,
  };
}

export type SubmitFeedbackResult = { status: "success" } | { status: "error"; message: string };

export async function submitFeedback(
  userId: string,
  githubIssueId: number,
  verdict: RecommendationFeedbackVerdict,
): Promise<SubmitFeedbackResult> {
  const db = getDb();
  const item = await findSyncedIssueByGithubIssueId(db, githubIssueId);
  if (item === null) {
    return {
      status: "error",
      message: "This issue is no longer in the catalogue, so it cannot be rated.",
    };
  }

  const [userSkills, careerGoal] = await Promise.all([
    listUserSkillsWithNames(db, userId),
    findCareerGoalByUserId(db, userId),
  ]);
  const snapshot = buildFeedbackSnapshot(buildDeveloperProfile(userSkills, careerGoal), item);

  await saveRecommendationFeedback(db, {
    userId,
    githubIssueId,
    repositoryFullName: item.repository.fullName,
    issueTitle: item.issue.title,
    issueHtmlUrl: item.issue.htmlUrl,
    matchScore: snapshot.matchScore,
    matchReasons: snapshot.matchReasons,
    scoreVersion: snapshot.scoreVersion,
    verdict,
  });
  return { status: "success" };
}
