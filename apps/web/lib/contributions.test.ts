import type { IssueWithRepository, UserSkillWithName } from "@issuefit/database";
import { describe, expect, it } from "vitest";

import {
  contributionDetailsInputSchema,
  contributionStatusInputSchema,
  skillsDemonstratedFor,
  startContributionInputSchema,
} from "./contributions.js";
import { buildDeveloperProfile } from "./recommendations.js";

function makeUserSkill(
  name: string,
  overrides: Partial<UserSkillWithName> = {},
): UserSkillWithName {
  return {
    id: `row-${name}`,
    userId: "user-1",
    skillId: `skill-${name}`,
    name,
    level: "intermediate",
    confidenceScore: 1,
    source: "manual",
    userConfirmed: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeIssueWithRepository(primaryLanguage: string | null): IssueWithRepository {
  return {
    issue: {
      id: "issue-1",
      repositoryId: "repo-1",
      githubIssueId: 42,
      number: 42,
      title: "Add Docker support",
      description: "A sufficiently detailed description of the problem and the expected behaviour.",
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
    },
    repository: {
      id: "repo-1",
      githubRepositoryId: 1,
      owner: "octocat",
      name: "hello-world",
      fullName: "octocat/hello-world",
      description: "A repository",
      primaryLanguage,
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

describe("skillsDemonstratedFor", () => {
  it("returns the profile skills whose technology matches the issue, normalised", () => {
    const profile = buildDeveloperProfile(
      [makeUserSkill("Node.js"), makeUserSkill("Python")],
      null,
    );

    expect(skillsDemonstratedFor(profile, makeIssueWithRepository("nodejs"))).toEqual(["Node.js"]);
  });

  it("returns nothing when no skill matches, or the repository has no language", () => {
    const profile = buildDeveloperProfile([makeUserSkill("Python")], null);

    expect(skillsDemonstratedFor(profile, makeIssueWithRepository("Rust"))).toEqual([]);
    expect(skillsDemonstratedFor(profile, makeIssueWithRepository(null))).toEqual([]);
  });
});

describe("startContributionInputSchema", () => {
  it("accepts a positive integer issue id", () => {
    expect(startContributionInputSchema.safeParse({ githubIssueId: 42 }).success).toBe(true);
  });

  it.each([0, -1, 1.5, "42", null])("rejects githubIssueId %j", (githubIssueId) => {
    expect(startContributionInputSchema.safeParse({ githubIssueId }).success).toBe(false);
  });
});

describe("contributionStatusInputSchema", () => {
  it("accepts a known status", () => {
    expect(
      contributionStatusInputSchema.safeParse({ githubIssueId: 42, status: "working" }).success,
    ).toBe(true);
  });

  it.each(["unknown", "", "Working", null])("rejects status %j", (status) => {
    expect(contributionStatusInputSchema.safeParse({ githubIssueId: 42, status }).success).toBe(
      false,
    );
  });
});

describe("contributionDetailsInputSchema", () => {
  it("accepts a valid GitHub pull request URL and a branch", () => {
    const parsed = contributionDetailsInputSchema.safeParse({
      githubIssueId: 42,
      prUrl: "https://github.com/facebook/react/pull/12345",
      branchName: "fix/issue-42",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.prUrl).toBe("https://github.com/facebook/react/pull/12345");
      expect(parsed.data.branchName).toBe("fix/issue-42");
    }
  });

  it("treats blank PR URL and branch as cleared (null)", () => {
    const parsed = contributionDetailsInputSchema.safeParse({
      githubIssueId: 42,
      prUrl: "   ",
      branchName: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.prUrl).toBeNull();
      expect(parsed.data.branchName).toBeNull();
    }
  });

  it.each([
    "https://github.com/facebook/react/issues/12345",
    "https://github.com/facebook/react",
    "https://gitlab.com/owner/repo/pull/1",
    "not-a-url",
  ])("rejects a non-GitHub-PR URL %j", (prUrl) => {
    expect(
      contributionDetailsInputSchema.safeParse({ githubIssueId: 42, prUrl, branchName: null })
        .success,
    ).toBe(false);
  });
});
