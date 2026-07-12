import { parseEnv, webEnvSchema } from "@issuefit/config";
import {
  findCuratedRepositoryById,
  replaceIssuesForRepository,
  updateRepositoryResponsiveness,
  type NewSyncedIssue,
  type RepositoryRecord,
} from "@issuefit/database";
import { GitHubApiError, type GithubIssue } from "@issuefit/github";
import { assessIssueHealth } from "@issuefit/issue-health";
import {
  assessMaintainerResponsiveness,
  defaultRepositoryHealthConfig,
  firstNonAuthorResponseAt,
  type FirstResponseSample,
} from "@issuefit/repository-health";

import { getDb } from "./db";
import { gitHubClient } from "./github-client";
import { repositoryAllowsExternalContributors } from "./manifest-policy";

export type SyncIssuesResult =
  { status: "success"; issueCount: number } | { status: "error"; message: string };

/**
 * Per-issue API calls (timelines, first comments) run this many at a time —
 * enough to keep a 100-issue sync to seconds, low enough to stay polite to
 * GitHub's secondary rate limits (ADR-0015).
 */
const PER_ISSUE_CONCURRENCY = 10;

/** How many earliest comments to scan for the first non-author response. */
const FIRST_COMMENTS_TO_SCAN = 10;

function messageForError(error: GitHubApiError): string {
  switch (error.category) {
    case "authentication":
      return "The platform's GitHub service token is invalid or expired.";
    case "authorization":
      return "GitHub denied this request for the service token.";
    case "rate_limit":
      return "GitHub's rate limit was reached. Please try again in a few minutes.";
    case "temporary_provider":
      return "GitHub is temporarily unavailable. Please try again shortly.";
    case "permanent_provider":
      return "This repository could not be found on GitHub anymore.";
    case "internal":
      return "Could not sync issues for this repository. Please try again later.";
  }
}

/** Order-preserving concurrent map with a fixed worker pool. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const queue = items.map((item, index) => ({ item, index }));
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (;;) {
      const entry = queue[cursor];
      cursor += 1;
      if (entry === undefined) {
        return;
      }
      results[entry.index] = await task(entry.item);
    }
  });
  await Promise.all(workers);
  return results;
}

function toSyncedIssue(
  repository: RepositoryRecord,
  issue: GithubIssue,
  hasActivePullRequest: boolean,
  syncedAt: Date,
): NewSyncedIssue {
  const health = assessIssueHealth({
    title: issue.title,
    description: issue.description,
    labels: issue.labels,
  });
  return {
    repositoryId: repository.id,
    githubIssueId: issue.id,
    number: issue.number,
    title: issue.title,
    description: issue.description,
    labels: issue.labels,
    state: issue.state,
    difficulty: health.difficulty,
    clarityScore: health.clarityScore,
    isBlocked: health.isBlocked,
    isAssigned: issue.isAssigned,
    hasActivePullRequest,
    allowsExternalContributors: repositoryAllowsExternalContributors(repository),
    commentsCount: issue.commentsCount,
    htmlUrl: issue.htmlUrl,
    githubCreatedAt: issue.createdAt,
    githubUpdatedAt: issue.updatedAt,
    githubClosedAt: issue.closedAt,
    syncedAt,
  };
}

/**
 * Fetches a curated repository's open issues with the platform's service
 * token and measures both ADR-0015 signals in the same pass:
 *
 * - `hasActivePullRequest` per issue, from timeline cross-references
 *   (one API call per issue);
 * - maintainer responsiveness for the repository, from first-response
 *   sampling of the most recently updated issues (one API call per
 *   sampled issue that has comments).
 *
 * A full 100-issue sync therefore costs on the order of 120 API calls —
 * a deliberate, documented per-click budget (ADR-0015).
 */
export async function syncIssuesForRepository(repositoryId: string): Promise<SyncIssuesResult> {
  const db = getDb();
  const repository = await findCuratedRepositoryById(db, repositoryId);
  if (repository === null) {
    return { status: "error", message: "This repository is no longer curated." };
  }

  try {
    const { GITHUB_SERVICE_TOKEN } = parseEnv(webEnvSchema, process.env);
    const githubIssues = await gitHubClient.listRepositoryIssues(
      GITHUB_SERVICE_TOKEN,
      repository.owner,
      repository.name,
    );

    const linkedPullRequestStates = await mapWithConcurrency(
      githubIssues,
      PER_ISSUE_CONCURRENCY,
      (issue) =>
        gitHubClient.listIssueLinkedPullRequestStates(
          GITHUB_SERVICE_TOKEN,
          repository.owner,
          repository.name,
          issue.number,
        ),
    );

    const sampledIssues = githubIssues.slice(0, defaultRepositoryHealthConfig.responseSampleSize);
    const responseSamples: FirstResponseSample[] = await mapWithConcurrency(
      sampledIssues,
      PER_ISSUE_CONCURRENCY,
      async (issue) => {
        if (issue.commentsCount === 0) {
          return { issueCreatedAt: issue.createdAt, firstRespondedAt: null };
        }
        const comments = await gitHubClient.listIssueFirstComments(
          GITHUB_SERVICE_TOKEN,
          repository.owner,
          repository.name,
          issue.number,
          FIRST_COMMENTS_TO_SCAN,
        );
        return {
          issueCreatedAt: issue.createdAt,
          firstRespondedAt: firstNonAuthorResponseAt(comments, issue.authorLogin),
        };
      },
    );
    const responsiveness = assessMaintainerResponsiveness(responseSamples);

    const syncedAt = new Date();
    await replaceIssuesForRepository(
      db,
      repositoryId,
      githubIssues.map((issue, index) =>
        toSyncedIssue(
          repository,
          issue,
          linkedPullRequestStates[index]?.includes("open") ?? false,
          syncedAt,
        ),
      ),
    );
    await updateRepositoryResponsiveness(db, repositoryId, {
      maintainerResponsivenessScore: responsiveness.score,
      medianFirstResponseDays: responsiveness.medianResponseDays,
      firstResponseRate: responsiveness.responseRate,
    });

    return { status: "success", issueCount: githubIssues.length };
  } catch (error) {
    console.error("issue_sync_failed", { repositoryId, error });
    const message =
      error instanceof GitHubApiError
        ? messageForError(error)
        : "Could not sync issues for this repository. Please try again later.";
    return { status: "error", message };
  }
}
