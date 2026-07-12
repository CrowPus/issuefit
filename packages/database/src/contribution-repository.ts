import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  upsertRecommendationSnapshot,
  type RecommendationSnapshotInput,
} from "./recommendation-repository.js";
import {
  contributions,
  portfolioEntries,
  recommendations,
  type ContributionRecord,
  type ContributionStatus,
  type RecommendationRecord,
} from "./schema/index.js";

/** Statuses that end a contribution and stamp `completedAt` (ADR-0018). */
const TERMINAL_STATUSES: ReadonlySet<ContributionStatus> = new Set<ContributionStatus>([
  "merged",
  "closed",
  "abandoned",
]);

export function isTerminalContributionStatus(status: ContributionStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Starts (or returns the existing) contribution on a recommended issue.
 * Persists the recommendation snapshot like feedback does, then inserts a
 * contribution at `selected`. Idempotent: a second start on the same issue
 * leaves the existing status untouched (ADR-0018).
 */
export async function startContribution(
  db: Database,
  input: RecommendationSnapshotInput,
  skillsDemonstrated: readonly string[],
): Promise<ContributionRecord> {
  const now = new Date();
  return db.transaction(async (tx) => {
    const recommendationId = await upsertRecommendationSnapshot(tx, input, now);
    await tx
      .insert(contributions)
      .values({
        recommendationId,
        status: "selected",
        skillsDemonstrated: [...skillsDemonstrated],
        startedAt: now,
      })
      .onConflictDoNothing({ target: contributions.recommendationId });
    const [row] = await tx
      .select()
      .from(contributions)
      .where(eq(contributions.recommendationId, recommendationId))
      .limit(1);
    if (row === undefined) {
      throw new Error("Failed to start contribution");
    }
    return row;
  });
}

/** The recommendation ids owned by this user for one issue (0 or 1 rows). */
function ownedRecommendationIds(db: Database, userId: string, githubIssueId: number) {
  return db
    .select({ id: recommendations.id })
    .from(recommendations)
    .where(
      and(eq(recommendations.userId, userId), eq(recommendations.githubIssueId, githubIssueId)),
    );
}

/** This user's contribution on one issue, or null if they have not started one. */
export async function findContributionForUserAndIssue(
  db: Database,
  userId: string,
  githubIssueId: number,
): Promise<ContributionRecord | null> {
  const rows = await db
    .select({ contribution: contributions })
    .from(contributions)
    .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
    .where(
      and(eq(recommendations.userId, userId), eq(recommendations.githubIssueId, githubIssueId)),
    )
    .limit(1);
  return rows[0]?.contribution ?? null;
}

/**
 * Updates the status of this user's contribution on one issue. Ownership is
 * enforced by scoping the update to recommendations owned by the user;
 * `completedAt` is set for terminal statuses and cleared otherwise (ADR-0018).
 * Reaching `merged` generates a portfolio entry from structured data in the
 * same transaction, idempotently (ADR-0019). Returns false when the user has
 * no contribution on the issue.
 */
export async function updateContributionStatus(
  db: Database,
  userId: string,
  githubIssueId: number,
  status: ContributionStatus,
): Promise<boolean> {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(contributions)
      .set({
        status,
        completedAt: isTerminalContributionStatus(status) ? now : null,
        updatedAt: now,
      })
      .where(
        inArray(contributions.recommendationId, ownedRecommendationIds(tx, userId, githubIssueId)),
      )
      .returning({ id: contributions.id, skillsDemonstrated: contributions.skillsDemonstrated });
    if (updated === undefined) {
      return false;
    }

    if (status === "merged") {
      const [snapshot] = await tx
        .select({ issueTitle: recommendations.issueTitle })
        .from(contributions)
        .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
        .where(eq(contributions.id, updated.id))
        .limit(1);
      await tx
        .insert(portfolioEntries)
        .values({
          contributionId: updated.id,
          title: snapshot?.issueTitle ?? "Merged contribution",
          skillsDemonstrated: updated.skillsDemonstrated,
        })
        .onConflictDoNothing({ target: portfolioEntries.contributionId });
    }
    return true;
  });
}

export interface ContributionDetailsUpdate {
  /** Null clears the stored value. */
  prUrl: string | null;
  branchName: string | null;
}

/** Updates the PR URL and branch of this user's contribution on one issue. */
export async function updateContributionDetails(
  db: Database,
  userId: string,
  githubIssueId: number,
  details: ContributionDetailsUpdate,
): Promise<boolean> {
  const updated = await db
    .update(contributions)
    .set({ prUrl: details.prUrl, branchName: details.branchName, updatedAt: new Date() })
    .where(
      inArray(contributions.recommendationId, ownedRecommendationIds(db, userId, githubIssueId)),
    )
    .returning({ id: contributions.id });
  return updated.length > 0;
}

export interface ContributionWithRecommendation {
  contribution: ContributionRecord;
  recommendation: RecommendationRecord;
}

/** All of this user's contributions with their recommendation snapshot, newest first. */
export async function listContributionsForUser(
  db: Database,
  userId: string,
): Promise<ContributionWithRecommendation[]> {
  return db
    .select({ contribution: contributions, recommendation: recommendations })
    .from(contributions)
    .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
    .where(eq(recommendations.userId, userId))
    .orderBy(desc(contributions.startedAt));
}

export interface RepositoryContributionCounts {
  /** Lower-cased "owner/name" — GitHub slugs compare case-insensitively. */
  repositoryFullName: string;
  startedCount: number;
  mergedCount: number;
}

/**
 * How many contributions were started and merged through IssueFit per
 * repository, keyed by the recommendation's snapshotted full name — the
 * platform-activity input to the IssueFit top-projects ranking (ADR-0021).
 */
export async function listContributionCountsByRepository(
  db: Database,
): Promise<RepositoryContributionCounts[]> {
  const rows = await db
    .select({
      repositoryFullName: sql<string>`lower(${recommendations.repositoryFullName})`,
      startedCount: sql<number>`count(*)::int`,
      mergedCount: sql<number>`count(*) filter (where ${contributions.status} = 'merged')::int`,
    })
    .from(contributions)
    .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
    .groupBy(sql`lower(${recommendations.repositoryFullName})`);
  return rows;
}
