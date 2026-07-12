import { eq } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  githubProfiles,
  githubRepositories,
  type GithubProfileRecord,
  type GithubRepositoryRecord,
  type NewGithubProfileRecord,
  type NewGithubRepositoryRecord,
} from "./schema/index.js";

export async function upsertGithubProfile(
  db: Database,
  profile: NewGithubProfileRecord,
): Promise<void> {
  await db
    .insert(githubProfiles)
    .values(profile)
    .onConflictDoUpdate({ target: githubProfiles.userId, set: profile });
}

export type NewSyncedRepository = Omit<NewGithubRepositoryRecord, "id" | "createdAt" | "updatedAt">;

/**
 * Replaces a user's synchronised repositories with the given set inside one
 * transaction, so a sync never leaves stale rows for repositories that were
 * deleted, renamed, or made private since the last sync.
 */
export async function replaceGithubRepositories(
  db: Database,
  userId: string,
  repositories: readonly NewSyncedRepository[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(githubRepositories).where(eq(githubRepositories.userId, userId));
    if (repositories.length > 0) {
      await tx.insert(githubRepositories).values([...repositories]);
    }
  });
}

export async function findGithubProfileByUserId(
  db: Database,
  userId: string,
): Promise<GithubProfileRecord | null> {
  const [profile] = await db
    .select()
    .from(githubProfiles)
    .where(eq(githubProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function listGithubRepositoriesByUserId(
  db: Database,
  userId: string,
): Promise<GithubRepositoryRecord[]> {
  return db
    .select()
    .from(githubRepositories)
    .where(eq(githubRepositories.userId, userId))
    .orderBy(githubRepositories.pushedAt);
}
