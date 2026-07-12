import { GitHubApiError } from "@issuefit/github";
import { describe, expect, it } from "vitest";

import { messageForError, toSyncedRepository } from "./github-sync.js";

describe("toSyncedRepository", () => {
  it("maps every GithubRepository field onto the persisted shape", () => {
    const syncedAt = new Date("2026-07-11T00:00:00Z");
    const record = toSyncedRepository(
      "user-1",
      {
        id: 42,
        name: "issuefit",
        fullName: "octocat/issuefit",
        description: "A platform",
        primaryLanguage: "TypeScript",
        stargazersCount: 10,
        forksCount: 2,
        isFork: false,
        htmlUrl: "https://github.com/octocat/issuefit",
        pushedAt: new Date("2026-07-01T00:00:00Z"),
      },
      syncedAt,
    );

    expect(record).toEqual({
      userId: "user-1",
      githubRepositoryId: 42,
      name: "issuefit",
      fullName: "octocat/issuefit",
      description: "A platform",
      primaryLanguage: "TypeScript",
      stargazersCount: 10,
      forksCount: 2,
      isFork: false,
      htmlUrl: "https://github.com/octocat/issuefit",
      pushedAt: new Date("2026-07-01T00:00:00Z"),
      syncedAt,
    });
  });
});

describe("messageForError", () => {
  it("gives a distinct, actionable message per error category", () => {
    const categories = [
      "authentication",
      "authorization",
      "rate_limit",
      "temporary_provider",
      "permanent_provider",
      "internal",
    ] as const;

    const messages = categories.map((category) =>
      messageForError(new GitHubApiError("x", category)),
    );

    expect(new Set(messages).size).toBeLessThanOrEqual(categories.length);
    expect(messages.every((message) => message.length > 0)).toBe(true);
    expect(messageForError(new GitHubApiError("x", "authentication"))).toMatch(/sign in again/);
  });
});
