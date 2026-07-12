import { desc, eq, ne, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  issues,
  recommendationFeedback,
  recommendations,
  repositories,
  type IssueRecord,
  type RecommendationFeedbackVerdict,
  type RecommendationRecord,
  type RepositoryRecord,
} from "./schema/index.js";

/**
 * The stable snapshot of a recommendation a user acted on, persisted when
 * they give feedback or start a contribution (ADR-0014, ADR-0018).
 */
export interface RecommendationSnapshotInput {
  userId: string;
  githubIssueId: number;
  repositoryFullName: string;
  issueTitle: string;
  issueHtmlUrl: string;
  /** Null when the issue was excluded or unscorable at persist time (ADR-0014). */
  matchScore: number | null;
  matchReasons: string[];
  scoreVersion: string | null;
}

/**
 * Upserts the `recommendations` snapshot for a (user, GitHub issue) and
 * returns its id. Shared by feedback and contribution persistence so both
 * key on the same stable row. Must run inside a transaction.
 */
export async function upsertRecommendationSnapshot(
  tx: Database,
  input: RecommendationSnapshotInput,
  now: Date,
): Promise<string> {
  const [recommendation] = await tx
    .insert(recommendations)
    .values({
      userId: input.userId,
      githubIssueId: input.githubIssueId,
      repositoryFullName: input.repositoryFullName,
      issueTitle: input.issueTitle,
      issueHtmlUrl: input.issueHtmlUrl,
      matchScore: input.matchScore,
      matchReasons: input.matchReasons,
      scoreVersion: input.scoreVersion,
      recommendedAt: now,
    })
    .onConflictDoUpdate({
      target: [recommendations.userId, recommendations.githubIssueId],
      set: {
        repositoryFullName: input.repositoryFullName,
        issueTitle: input.issueTitle,
        issueHtmlUrl: input.issueHtmlUrl,
        matchScore: input.matchScore,
        matchReasons: input.matchReasons,
        scoreVersion: input.scoreVersion,
        recommendedAt: now,
        updatedAt: now,
      },
    })
    .returning({ id: recommendations.id });
  if (recommendation === undefined) {
    throw new Error("Failed to persist recommendation snapshot");
  }
  return recommendation.id;
}

export interface SaveRecommendationFeedbackInput extends RecommendationSnapshotInput {
  verdict: RecommendationFeedbackVerdict;
}

/**
 * Persists a recommendation snapshot and the user's verdict on it in one
 * transaction. Upserts on (user, GitHub issue): a user may change their
 * verdict later, and the new verdict overwrites the previous one (ADR-0014).
 */
export async function saveRecommendationFeedback(
  db: Database,
  input: SaveRecommendationFeedbackInput,
): Promise<void> {
  const now = new Date();
  await db.transaction(async (tx) => {
    const recommendationId = await upsertRecommendationSnapshot(tx, input, now);
    await tx
      .insert(recommendationFeedback)
      .values({ recommendationId, verdict: input.verdict })
      .onConflictDoUpdate({
        target: recommendationFeedback.recommendationId,
        set: { verdict: input.verdict, updatedAt: now },
      });
  });
}

/**
 * GitHub issue ids this user rated with any verdict except `good_match`.
 * These are removed from the user's recommendation candidates before
 * ranking (ADR-0014).
 */
export async function listNegativelyRatedGithubIssueIds(
  db: Database,
  userId: string,
): Promise<number[]> {
  const rows = await db
    .select({ githubIssueId: recommendations.githubIssueId })
    .from(recommendationFeedback)
    .innerJoin(recommendations, eq(recommendationFeedback.recommendationId, recommendations.id))
    .where(
      sql`${recommendations.userId} = ${userId} and ${ne(recommendationFeedback.verdict, "good_match")}`,
    );
  return rows.map((row) => row.githubIssueId);
}

export interface UserIssueVerdict {
  githubIssueId: number;
  verdict: RecommendationFeedbackVerdict;
}

/**
 * Every issue this user has already rated, with the verdict. Used to lock
 * the feedback controls so an issue is rated once per user (ADR-0014).
 */
export async function listFeedbackVerdictsForUser(
  db: Database,
  userId: string,
): Promise<UserIssueVerdict[]> {
  return db
    .select({
      githubIssueId: recommendations.githubIssueId,
      verdict: recommendationFeedback.verdict,
    })
    .from(recommendationFeedback)
    .innerJoin(recommendations, eq(recommendationFeedback.recommendationId, recommendations.id))
    .where(eq(recommendations.userId, userId));
}

/** This user's existing verdict on one issue, or null if they have not rated it. */
export async function findFeedbackVerdictForUser(
  db: Database,
  userId: string,
  githubIssueId: number,
): Promise<RecommendationFeedbackVerdict | null> {
  const rows = await db
    .select({ verdict: recommendationFeedback.verdict })
    .from(recommendationFeedback)
    .innerJoin(recommendations, eq(recommendationFeedback.recommendationId, recommendations.id))
    .where(
      sql`${recommendations.userId} = ${userId} and ${recommendations.githubIssueId} = ${githubIssueId}`,
    )
    .limit(1);
  return rows[0]?.verdict ?? null;
}

/**
 * A synced issue looked up by its stable GitHub id, with its repository —
 * used to rebuild the recommendation snapshot server-side at feedback
 * time. Only approved curated repositories qualify, mirroring
 * listSyncedIssuesWithRepositories.
 */
export async function findSyncedIssueByGithubIssueId(
  db: Database,
  githubIssueId: number,
): Promise<{ issue: IssueRecord; repository: RepositoryRecord } | null> {
  const rows = await db
    .select({ issue: issues, repository: repositories })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(sql`${issues.githubIssueId} = ${githubIssueId} and ${eq(repositories.approved, true)}`)
    .limit(1);
  return rows[0] ?? null;
}

export interface FeedbackWithRecommendation {
  verdict: RecommendationFeedbackVerdict;
  updatedAt: Date;
  recommendation: RecommendationRecord;
}

/** Every feedback row with its recommendation snapshot, newest first (admin view). */
export async function listFeedbackWithRecommendations(
  db: Database,
): Promise<FeedbackWithRecommendation[]> {
  return db
    .select({
      verdict: recommendationFeedback.verdict,
      updatedAt: recommendationFeedback.updatedAt,
      recommendation: recommendations,
    })
    .from(recommendationFeedback)
    .innerJoin(recommendations, eq(recommendationFeedback.recommendationId, recommendations.id))
    .orderBy(desc(recommendationFeedback.updatedAt));
}
