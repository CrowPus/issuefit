import { Octokit } from "@octokit/rest";

import { classifyGitHubError } from "./errors.js";
import {
  mapGithubCommunityProfile,
  mapGithubDirectoryFileNames,
  mapGithubIssue,
  mapGithubIssueComment,
  mapGithubRepositoryFile,
  mapGithubRepository,
  mapGithubRepositoryDetails,
  mapGithubUser,
  mapGithubViewerCanPush,
  mapLinkedPullRequestStates,
  type RawGithubCommunityProfile,
  type RawGithubDirectoryEntry,
  type RawGithubIssue,
  type RawGithubIssueComment,
  type RawGithubRepository,
  type RawGithubRepositoryDetails,
  type RawGithubRepositoryFile,
  type RawGithubTimelineEvent,
  type RawGithubUser,
} from "./mapping.js";
import type { GitHubClient, GithubIssue, GithubRepository } from "./types.js";

/**
 * Hard cap on repositories fetched per sync. Bounds a single "Sync now"
 * request to a handful of GitHub API calls regardless of account size;
 * accounts with more public repositories than this are effectively
 * untested territory for the MVP and can be revisited if they turn out to
 * matter. See ADR-0007.
 */
const MAX_REPOSITORIES = 300;
const REPOSITORIES_PER_PAGE = 100;

/**
 * Hard cap on issues fetched per repository sync — see ADR-0011. Bounds one
 * "Sync issues" click to a handful of API calls regardless of backlog size.
 */
const MAX_ISSUES_PER_REPOSITORY = 100;
const ISSUES_PER_PAGE = 100;

/**
 * Only the first page of an issue's timeline is read for linked-PR
 * detection — a documented bound, not pagination-by-accident: issues with
 * more than 100 timeline events are rare, and each extra page is another
 * API call per issue (ADR-0015).
 */
const TIMELINE_EVENTS_PER_PAGE = 100;

export interface CreateGitHubClientOptions {
  /** Overrides Octokit's fetch implementation; for tests only. */
  fetch?: typeof fetch;
}

export function createGitHubClient(options: CreateGitHubClientOptions = {}): GitHubClient {
  function octokitFor(accessToken: string): Octokit {
    return new Octokit({
      auth: accessToken,
      ...(options.fetch === undefined ? {} : { request: { fetch: options.fetch } }),
    });
  }

  return {
    async getAuthenticatedProfile(accessToken) {
      try {
        const { data } = await octokitFor(accessToken).rest.users.getAuthenticated();
        return mapGithubUser(data as RawGithubUser);
      } catch (error) {
        throw classifyGitHubError(error);
      }
    },

    async listPublicRepositories(accessToken) {
      const octokit = octokitFor(accessToken);
      const repositories: GithubRepository[] = [];
      try {
        const pages = octokit.paginate.iterator(octokit.rest.repos.listForAuthenticatedUser, {
          per_page: REPOSITORIES_PER_PAGE,
          visibility: "public",
          sort: "pushed",
          direction: "desc",
        });
        for await (const { data } of pages) {
          for (const raw of data as RawGithubRepository[]) {
            repositories.push(mapGithubRepository(raw));
            if (repositories.length >= MAX_REPOSITORIES) {
              return repositories;
            }
          }
        }
      } catch (error) {
        throw classifyGitHubError(error);
      }
      return repositories;
    },

    async listMostStarredRepositories(accessToken, count) {
      try {
        const { data } = await octokitFor(accessToken).rest.search.repos({
          q: "stars:>1",
          sort: "stars",
          order: "desc",
          per_page: count,
        });
        return (data.items as RawGithubRepository[]).map(mapGithubRepository);
      } catch (error) {
        throw classifyGitHubError(error);
      }
    },

    async getRepository(accessToken, owner, name) {
      try {
        const { data } = await octokitFor(accessToken).rest.repos.get({ owner, repo: name });
        return mapGithubRepositoryDetails(data as RawGithubRepositoryDetails);
      } catch (error) {
        throw classifyGitHubError(error);
      }
    },

    async getRepositoryViewerCanPush(accessToken, owner, name) {
      try {
        const { data } = await octokitFor(accessToken).rest.repos.get({ owner, repo: name });
        return mapGithubViewerCanPush(data as RawGithubRepositoryDetails);
      } catch (error) {
        throw classifyGitHubError(error);
      }
    },

    async getRepositoryCommunityProfile(accessToken, owner, name) {
      try {
        const { data } = await octokitFor(accessToken).rest.repos.getCommunityProfileMetrics({
          owner,
          repo: name,
        });
        return mapGithubCommunityProfile(data as RawGithubCommunityProfile);
      } catch (error) {
        throw classifyGitHubError(error);
      }
    },

    async getRepositoryFile(accessToken, owner, name, filePath) {
      try {
        const { data } = await octokitFor(accessToken).rest.repos.getContent({
          owner,
          repo: name,
          path: filePath,
        });
        if (Array.isArray(data)) {
          return null;
        }
        return mapGithubRepositoryFile(data as RawGithubRepositoryFile);
      } catch (error) {
        const classified = classifyGitHubError(error);
        if (classified.category === "permanent_provider") {
          return null;
        }
        throw classified;
      }
    },

    async listRepositoryDirectory(accessToken, owner, name, dirPath) {
      try {
        const { data } = await octokitFor(accessToken).rest.repos.getContent({
          owner,
          repo: name,
          path: dirPath,
        });
        if (!Array.isArray(data)) {
          return null;
        }
        return mapGithubDirectoryFileNames(data as RawGithubDirectoryEntry[]);
      } catch (error) {
        const classified = classifyGitHubError(error);
        if (classified.category === "permanent_provider") {
          return null;
        }
        throw classified;
      }
    },

    async listRepositoryIssues(accessToken, owner, name) {
      const octokit = octokitFor(accessToken);
      const issues: GithubIssue[] = [];
      try {
        const pages = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
          owner,
          repo: name,
          state: "open",
          per_page: ISSUES_PER_PAGE,
          sort: "updated",
          direction: "desc",
        });
        for await (const { data } of pages) {
          for (const raw of data as RawGithubIssue[]) {
            // GitHub's issue-list endpoint also returns pull requests.
            if (raw.pull_request !== undefined) {
              continue;
            }
            issues.push(mapGithubIssue(raw));
            if (issues.length >= MAX_ISSUES_PER_REPOSITORY) {
              return issues;
            }
          }
        }
      } catch (error) {
        throw classifyGitHubError(error);
      }
      return issues;
    },

    async listIssueFirstComments(accessToken, owner, name, issueNumber, maxCount) {
      try {
        // GitHub returns issue comments oldest-first by default, which is
        // exactly the order first-response detection needs.
        const { data } = await octokitFor(accessToken).rest.issues.listComments({
          owner,
          repo: name,
          issue_number: issueNumber,
          per_page: maxCount,
        });
        return (data as RawGithubIssueComment[]).map(mapGithubIssueComment);
      } catch (error) {
        throw classifyGitHubError(error);
      }
    },

    async listIssueLinkedPullRequestStates(accessToken, owner, name, issueNumber) {
      try {
        const { data } = await octokitFor(accessToken).rest.issues.listEventsForTimeline({
          owner,
          repo: name,
          issue_number: issueNumber,
          per_page: TIMELINE_EVENTS_PER_PAGE,
        });
        return mapLinkedPullRequestStates(data as RawGithubTimelineEvent[]);
      } catch (error) {
        throw classifyGitHubError(error);
      }
    },
  };
}
