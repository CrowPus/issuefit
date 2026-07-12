import type { IssueWithRepository } from "@issuefit/database";
import { describe, expect, it } from "vitest";

import {
  manifestAllowsIssueOpportunity,
  repositoryAllowsExternalContributors,
  repositoryHasMaintainerApprovedManifest,
} from "./manifest-policy.js";

function makeIssueWithRepository(
  issueOverrides: Partial<IssueWithRepository["issue"]> = {},
  repositoryOverrides: Partial<IssueWithRepository["repository"]> = {},
): IssueWithRepository {
  return {
    issue: {
      id: "issue-1",
      repositoryId: "repo-1",
      githubIssueId: 42,
      number: 42,
      title: "Fix cache bug",
      description: "A detailed issue description",
      labels: ["type: bug"],
      state: "open",
      difficulty: "beginner",
      clarityScore: 0.8,
      isBlocked: false,
      isAssigned: false,
      hasActivePullRequest: false,
      allowsExternalContributors: true,
      commentsCount: 0,
      htmlUrl: "https://github.com/octocat/hello-world/issues/42",
      githubCreatedAt: new Date("2026-01-01T00:00:00Z"),
      githubUpdatedAt: new Date("2026-01-02T00:00:00Z"),
      githubClosedAt: null,
      syncedAt: new Date("2026-01-02T00:00:00Z"),
      createdAt: new Date("2026-01-02T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
      ...issueOverrides,
    },
    repository: {
      id: "repo-1",
      githubRepositoryId: 1,
      owner: "octocat",
      name: "hello-world",
      fullName: "octocat/hello-world",
      description: "A repository",
      primaryLanguage: "TypeScript",
      starsCount: 1,
      openIssuesCount: 1,
      isActive: true,
      activityScore: 1,
      maintainerResponsivenessScore: null,
      medianFirstResponseDays: null,
      firstResponseRate: null,
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
      syncedAt: new Date("2026-01-02T00:00:00Z"),
      createdAt: new Date("2026-01-02T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
      ...repositoryOverrides,
    },
  };
}

describe("repositoryAllowsExternalContributors", () => {
  it("falls back to admin curation when no valid manifest exists", () => {
    expect(repositoryAllowsExternalContributors(makeIssueWithRepository().repository)).toBe(true);
  });

  it("requires a valid manifest to accept both external contributions and contributor capacity", () => {
    const repository = makeIssueWithRepository(
      {},
      {
        manifestStatus: "valid",
        manifestExternalContributions: true,
        manifestAcceptingContributors: false,
      },
    ).repository;

    expect(repositoryAllowsExternalContributors(repository)).toBe(false);
    expect(repositoryHasMaintainerApprovedManifest(repository)).toBe(false);
  });

  it("treats a valid accepting manifest as maintainer-approved", () => {
    const repository = makeIssueWithRepository(
      {},
      {
        manifestStatus: "valid",
        manifestExternalContributions: true,
        manifestAcceptingContributors: true,
      },
    ).repository;

    expect(repositoryAllowsExternalContributors(repository)).toBe(true);
    expect(repositoryHasMaintainerApprovedManifest(repository)).toBe(true);
  });
});

describe("manifestAllowsIssueOpportunity", () => {
  it("allows every issue when the repository has no valid manifest", () => {
    expect(
      manifestAllowsIssueOpportunity(
        makeIssueWithRepository({ labels: [], difficulty: "advanced" }),
      ),
    ).toBe(true);
  });

  it("matches allowed issue types from labels", () => {
    expect(
      manifestAllowsIssueOpportunity(
        makeIssueWithRepository(
          { labels: ["kind: docs"], difficulty: "intermediate" },
          {
            manifestStatus: "valid",
            manifestAllowedTypes: ["documentation"],
            manifestDifficulty: ["beginner", "intermediate"],
          },
        ),
      ),
    ).toBe(true);
  });

  it("rejects issue types outside the manifest allowed list", () => {
    expect(
      manifestAllowsIssueOpportunity(
        makeIssueWithRepository(
          { labels: ["type: feature"], difficulty: "beginner" },
          {
            manifestStatus: "valid",
            manifestAllowedTypes: ["bug"],
            manifestDifficulty: ["beginner"],
          },
        ),
      ),
    ).toBe(false);
  });

  it("rejects difficulties outside the manifest allowed list", () => {
    expect(
      manifestAllowsIssueOpportunity(
        makeIssueWithRepository(
          { labels: ["type: bug"], difficulty: "advanced" },
          {
            manifestStatus: "valid",
            manifestAllowedTypes: ["bug"],
            manifestDifficulty: ["beginner", "intermediate"],
          },
        ),
      ),
    ).toBe(false);
  });
});
