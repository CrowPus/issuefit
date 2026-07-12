import { count, desc, eq } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  issues,
  repositories,
  type IssueRecord,
  type NewIssueRecord,
  type RepositoryRecord,
} from "./schema/index.js";

export type NewSyncedIssue = Omit<NewIssueRecord, "id" | "createdAt" | "updatedAt">;

/**
 * Replaces a repository's synced issues with the given set inside one
 * transaction, so a sync never leaves stale rows for issues that were
 * closed, unassigned-then-assigned, or relabeled since the last sync.
 */
export async function replaceIssuesForRepository(
  db: Database,
  repositoryId: string,
  newIssues: readonly NewSyncedIssue[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(issues).where(eq(issues.repositoryId, repositoryId));
    if (newIssues.length > 0) {
      await tx.insert(issues).values([...newIssues]);
    }
  });
}

export async function listIssuesByRepositoryId(
  db: Database,
  repositoryId: string,
): Promise<IssueRecord[]> {
  return db
    .select()
    .from(issues)
    .where(eq(issues.repositoryId, repositoryId))
    .orderBy(desc(issues.githubUpdatedAt));
}

export async function countIssuesByRepositoryId(
  db: Database,
  repositoryId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(issues)
    .where(eq(issues.repositoryId, repositoryId));
  return row?.count ?? 0;
}

export interface IssueWithRepository {
  issue: IssueRecord;
  repository: RepositoryRecord;
}

/**
 * Every synced issue from an approved curated repository, paired with its
 * repository. This is the candidate pool the recommendation engine scores
 * against a developer's profile — nothing here is pre-filtered by
 * eligibility (open/assigned/etc.); that is the engine's job (ADR-0004).
 */
export async function listSyncedIssuesWithRepositories(
  db: Database,
): Promise<IssueWithRepository[]> {
  const rows = await db
    .select({ issue: issues, repository: repositories })
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(eq(repositories.approved, true));
  return rows;
}
