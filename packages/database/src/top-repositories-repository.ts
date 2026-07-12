import { asc } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  githubTopRepositories,
  type GithubTopRepositoryRecord,
  type NewGithubTopRepositoryRecord,
} from "./schema/index.js";

/**
 * Replaces the cached GitHub top list wholesale in one transaction
 * (ADR-0021) — ranks are only meaningful as a complete set.
 */
export async function replaceGithubTopRepositories(
  db: Database,
  rows: readonly NewGithubTopRepositoryRecord[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(githubTopRepositories);
    if (rows.length > 0) {
      await tx.insert(githubTopRepositories).values([...rows]);
    }
  });
}

export async function listGithubTopRepositories(
  db: Database,
): Promise<GithubTopRepositoryRecord[]> {
  return db.select().from(githubTopRepositories).orderBy(asc(githubTopRepositories.rank));
}
