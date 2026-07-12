import { GitHubApiError, type GithubRepository } from "@issuefit/github";
import {
  replaceGithubRepositories,
  upsertGithubProfile,
  type NewSyncedRepository,
} from "@issuefit/database";

import { getAuth } from "./auth";
import { getDb } from "./db";
import { gitHubClient } from "./github-client";

export type SyncResult =
  { status: "success"; repositoryCount: number } | { status: "error"; message: string };

export function messageForError(error: GitHubApiError): string {
  switch (error.category) {
    case "authentication":
      return "Your GitHub connection has expired. Please sign out and sign in again.";
    case "authorization":
      return "GitHub denied this request. Please reconnect your account.";
    case "rate_limit":
      return "GitHub's rate limit was reached. Please try again in a few minutes.";
    case "temporary_provider":
      return "GitHub is temporarily unavailable. Please try again shortly.";
    case "permanent_provider":
    case "internal":
      return "Could not sync your GitHub data. Please try again later.";
  }
}

export function toSyncedRepository(
  userId: string,
  repository: GithubRepository,
  syncedAt: Date,
): NewSyncedRepository {
  return {
    userId,
    githubRepositoryId: repository.id,
    name: repository.name,
    fullName: repository.fullName,
    description: repository.description,
    primaryLanguage: repository.primaryLanguage,
    stargazersCount: repository.stargazersCount,
    forksCount: repository.forksCount,
    isFork: repository.isFork,
    htmlUrl: repository.htmlUrl,
    pushedAt: repository.pushedAt,
    syncedAt,
  };
}

/**
 * Fetches the signed-in user's public GitHub profile and repositories with
 * their own OAuth token, then replaces the stored snapshot. Raw sync only —
 * no skill or difficulty inference happens here.
 */
export async function syncGithubData(userId: string, requestHeaders: Headers): Promise<SyncResult> {
  try {
    const { accessToken } = await getAuth().api.getAccessToken({
      body: { providerId: "github", userId },
      headers: requestHeaders,
    });

    const [profile, repositories] = await Promise.all([
      gitHubClient.getAuthenticatedProfile(accessToken),
      gitHubClient.listPublicRepositories(accessToken),
    ]);

    const syncedAt = new Date();
    const db = getDb();

    await upsertGithubProfile(db, {
      userId,
      bio: profile.bio,
      company: profile.company,
      location: profile.location,
      blog: profile.blog,
      publicRepos: profile.publicRepos,
      followers: profile.followers,
      following: profile.following,
      githubCreatedAt: profile.createdAt,
      syncedAt,
    });
    await replaceGithubRepositories(
      db,
      userId,
      repositories.map((repository) => toSyncedRepository(userId, repository, syncedAt)),
    );

    return { status: "success", repositoryCount: repositories.length };
  } catch (error) {
    const category = error instanceof GitHubApiError ? error.category : "internal";
    console.error("github_sync_failed", { userId, category, error });
    const message =
      error instanceof GitHubApiError
        ? messageForError(error)
        : "Could not sync your GitHub data. Please try again later.";
    return { status: "error", message };
  }
}
