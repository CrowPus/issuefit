import { count, desc, eq, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  issues,
  repositories,
  type NewRepositoryRecord,
  type RepositoryRecord,
} from "./schema/index.js";

/**
 * Metadata add/refresh deliberately cannot write the responsiveness fields:
 * they are measured only during issue sync (ADR-0015), so a refresh must
 * never clobber a measured value — the type excludes them entirely.
 */
export type UpsertCuratedRepository = Omit<
  NewRepositoryRecord,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "maintainerResponsivenessScore"
  | "medianFirstResponseDays"
  | "firstResponseRate"
>;

export async function upsertCuratedRepository(
  db: Database,
  repository: UpsertCuratedRepository,
): Promise<RepositoryRecord> {
  // Unlisting is sticky: `approved` applies on first insert but is omitted
  // from the conflict update, so a metadata refresh can never silently
  // relist a repository an admin unlisted (ADR-0020).
  const { approved: _approved, ...refreshableFields } = repository;
  const [row] = await db
    .insert(repositories)
    .values(repository)
    .onConflictDoUpdate({
      target: repositories.githubRepositoryId,
      set: { ...refreshableFields, updatedAt: new Date() },
    })
    .returning();
  if (row === undefined) {
    throw new Error("upsertCuratedRepository did not return a row");
  }
  return row;
}

export interface RepositoryResponsivenessUpdate {
  /** Null everywhere means "not measured" — stored as-is (ADR-0015). */
  maintainerResponsivenessScore: number | null;
  medianFirstResponseDays: number | null;
  firstResponseRate: number | null;
}

/** Written only by issue sync, the single producer of these signals (ADR-0015). */
export async function updateRepositoryResponsiveness(
  db: Database,
  repositoryId: string,
  update: RepositoryResponsivenessUpdate,
): Promise<void> {
  await db
    .update(repositories)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(repositories.id, repositoryId));
}

export async function listCuratedRepositories(db: Database): Promise<RepositoryRecord[]> {
  return db.select().from(repositories).orderBy(desc(repositories.starsCount));
}

export async function findCuratedRepositoryById(
  db: Database,
  id: string,
): Promise<RepositoryRecord | null> {
  const [row] = await db.select().from(repositories).where(eq(repositories.id, id)).limit(1);
  return row ?? null;
}

export async function deleteCuratedRepository(db: Database, id: string): Promise<void> {
  await db.delete(repositories).where(eq(repositories.id, id));
}

/** Admin moderation switch: gates the public directory and the recommendation pool (ADR-0020). */
export async function setRepositoryApproved(
  db: Database,
  id: string,
  approved: boolean,
): Promise<void> {
  await db
    .update(repositories)
    .set({ approved, updatedAt: new Date() })
    .where(eq(repositories.id, id));
}

/** Case-insensitive lookup by "owner/name" (GitHub treats slugs case-insensitively). */
export async function findRepositoryByFullName(
  db: Database,
  owner: string,
  name: string,
): Promise<RepositoryRecord | null> {
  const fullName = `${owner}/${name}`;
  const [row] = await db
    .select()
    .from(repositories)
    .where(sql`lower(${repositories.fullName}) = lower(${fullName})`)
    .limit(1);
  return row ?? null;
}

export interface PublicProjectListing {
  repository: RepositoryRecord;
  openIssueCount: number;
}

/**
 * Every approved repository with its synced-issue count — the public
 * /projects directory (ADR-0020). Ordering by contributor readiness happens
 * in the app layer, where the readiness assessment lives.
 */
export async function listPublicProjects(db: Database): Promise<PublicProjectListing[]> {
  const rows = await db
    .select({ repository: repositories, openIssueCount: count(issues.id) })
    .from(repositories)
    .leftJoin(issues, eq(issues.repositoryId, repositories.id))
    .where(eq(repositories.approved, true))
    .groupBy(repositories.id)
    .orderBy(desc(repositories.starsCount));
  return rows;
}
