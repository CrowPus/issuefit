import type { IssueWithRepository } from "@issuefit/database";
import { describe, expect, it } from "vitest";

import { buildFeedbackSnapshot, feedbackInputSchema } from "./recommendation-feedback.js";
import { buildDeveloperProfile } from "./recommendations.js";

const EVALUATED_AT = new Date("2026-02-10T00:00:00Z");

function makeIssueWithRepository(
  overrides: Partial<IssueWithRepository["issue"]> = {},
): IssueWithRepository {
  return {
    issue: {
      id: "issue-1",
      repositoryId: "repo-1",
      githubIssueId: 42,
      number: 42,
      title: "Add Docker support",
      description:
        "A detailed description of the problem, the environment it occurs in, the exact steps " +
        "to reproduce it, and what the expected behaviour should be once it is fixed.",
      labels: ["good first issue"],
      state: "open",
      difficulty: "beginner",
      clarityScore: 0.8,
      isBlocked: false,
      isAssigned: false,
      hasActivePullRequest: false,
      allowsExternalContributors: true,
      commentsCount: 2,
      htmlUrl: "https://github.com/octocat/hello-world/issues/42",
      githubCreatedAt: new Date("2026-01-01T00:00:00Z"),
      githubUpdatedAt: new Date("2026-02-01T00:00:00Z"),
      githubClosedAt: null,
      syncedAt: new Date("2026-02-05T00:00:00Z"),
      createdAt: new Date("2026-02-05T00:00:00Z"),
      updatedAt: new Date("2026-02-05T00:00:00Z"),
      ...overrides,
    },
    repository: {
      id: "repo-1",
      githubRepositoryId: 1,
      owner: "octocat",
      name: "hello-world",
      fullName: "octocat/hello-world",
      description: "A repository",
      primaryLanguage: "TypeScript",
      starsCount: 100,
      openIssuesCount: 10,
      isActive: true,
      activityScore: 0.9,
      maintainerResponsivenessScore: 0.5,
      medianFirstResponseDays: 3,
      firstResponseRate: 0.8,
      contributingUrl: null,
      codeOfConductUrl: null,
      readmeUrl: null,
      packageManager: null,
      hasDockerCompose: null,
      nodeVersion: null,
      ciWorkflowNames: null,
      setupSignalsCheckedAt: null,
      manifestStatus: "missing",
      manifestRaw: null,
      manifestFetchedAt: null,
      manifestValidationErrors: [],
      manifestExternalContributions: null,
      manifestAiPolicy: null,
      manifestContributionGuide: null,
      manifestAcceptingContributors: null,
      manifestMentorshipAvailable: null,
      manifestExpectedResponseDays: null,
      manifestAllowedTypes: [],
      manifestPreferredSkills: [],
      manifestDifficulty: [],
      manifestTestsRequired: null,
      manifestIssueDiscussionRequired: null,
      manifestDraftPullRequestFirst: null,
      curationWarnings: [],
      source: "curated" as const,
      submittedByUserId: null,
      submittedAt: null,
      approved: true,
      htmlUrl: "https://github.com/octocat/hello-world",
      syncedAt: new Date("2026-02-05T00:00:00Z"),
      createdAt: new Date("2026-02-05T00:00:00Z"),
      updatedAt: new Date("2026-02-05T00:00:00Z"),
    },
  };
}

describe("feedbackInputSchema", () => {
  it("accepts a positive integer issue id and a known verdict", () => {
    const parsed = feedbackInputSchema.safeParse({ githubIssueId: 42, verdict: "good_match" });
    expect(parsed.success).toBe(true);
  });

  it.each(["unknown", "", 42, null])("rejects verdict %j", (verdict) => {
    expect(feedbackInputSchema.safeParse({ githubIssueId: 42, verdict }).success).toBe(false);
  });

  it.each([0, -1, 1.5, "42", null])("rejects githubIssueId %j", (githubIssueId) => {
    expect(feedbackInputSchema.safeParse({ githubIssueId, verdict: "good_match" }).success).toBe(
      false,
    );
  });
});

describe("buildFeedbackSnapshot", () => {
  const profile = buildDeveloperProfile([], null);

  it("captures the engine's score, reasons, and config version for a rankable issue", () => {
    const snapshot = buildFeedbackSnapshot(profile, makeIssueWithRepository(), EVALUATED_AT);

    expect(snapshot.matchScore).not.toBeNull();
    expect(snapshot.matchScore).toBeGreaterThan(0);
    expect(snapshot.matchScore).toBeLessThanOrEqual(100);
    expect(snapshot.scoreVersion).toBeTruthy();
    expect(Array.isArray(snapshot.matchReasons)).toBe(true);
  });

  it("is deterministic for the same inputs and evaluation time", () => {
    const first = buildFeedbackSnapshot(profile, makeIssueWithRepository(), EVALUATED_AT);
    const second = buildFeedbackSnapshot(profile, makeIssueWithRepository(), EVALUATED_AT);
    expect(second).toEqual(first);
  });

  it("returns a null score, not a fake one, when the issue is excluded", () => {
    const snapshot = buildFeedbackSnapshot(
      profile,
      makeIssueWithRepository({ isAssigned: true }),
      EVALUATED_AT,
    );
    expect(snapshot).toEqual({ matchScore: null, matchReasons: [], scoreVersion: null });
  });
});
