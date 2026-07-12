import { parseEnv, webEnvSchema } from "@issuefit/config";
import {
  listGithubTopRepositories,
  replaceGithubTopRepositories,
  type GithubTopRepositoryRecord,
} from "@issuefit/database";

import { getDb } from "./db";
import { gitHubClient } from "./github-client";

const TOP_REPOSITORY_COUNT = 10;
const STALE_AFTER_HOURS = 24;
const MILLISECONDS_PER_HOUR = 3_600_000;

/** Pure staleness rule for the cached GitHub top list (ADR-0021). */
export function isTopListStale(fetchedAt: Date | null, now: Date): boolean {
  if (fetchedAt === null) {
    return true;
  }
  return now.getTime() - fetchedAt.getTime() > STALE_AFTER_HOURS * MILLISECONDS_PER_HOUR;
}

export interface GithubTopList {
  repositories: GithubTopRepositoryRecord[];
  /** When the list was fetched from GitHub; null when never fetched. */
  fetchedAt: Date | null;
}

/**
 * The cached "most starred on GitHub" list, lazily refreshed on view when
 * older than 24 hours — one search API call per day, no worker needed yet
 * (M7's weekly job takes this over, ADR-0021). A failed refresh keeps
 * serving the previous list with its honest `fetchedAt`; if nothing was
 * ever fetched, the caller shows "not available yet", never made-up data.
 */
export async function getGithubTopRepositories(): Promise<GithubTopList> {
  const db = getDb();
  const existing = await listGithubTopRepositories(db);
  const existingFetchedAt = existing[0]?.fetchedAt ?? null;
  if (!isTopListStale(existingFetchedAt, new Date())) {
    return { repositories: existing, fetchedAt: existingFetchedAt };
  }

  try {
    const { GITHUB_SERVICE_TOKEN } = parseEnv(webEnvSchema, process.env);
    const mostStarred = await gitHubClient.listMostStarredRepositories(
      GITHUB_SERVICE_TOKEN,
      TOP_REPOSITORY_COUNT,
    );
    const fetchedAt = new Date();
    await replaceGithubTopRepositories(
      db,
      mostStarred.map((repository, index) => ({
        rank: index + 1,
        githubRepositoryId: repository.id,
        fullName: repository.fullName,
        description: repository.description,
        primaryLanguage: repository.primaryLanguage,
        starsCount: repository.stargazersCount,
        htmlUrl: repository.htmlUrl,
        fetchedAt,
      })),
    );
    return { repositories: await listGithubTopRepositories(db), fetchedAt };
  } catch (error) {
    console.error("github_top_repositories_refresh_failed", { error });
    return { repositories: existing, fetchedAt: existingFetchedAt };
  }
}
