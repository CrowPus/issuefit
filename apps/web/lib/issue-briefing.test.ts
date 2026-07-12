import type { IssueWithRepository } from "@issuefit/database";
import { describe, expect, it } from "vitest";

import {
  briefingGithubIssueIdSchema,
  buildIssueBriefing,
  componentLabels,
  exclusionLabels,
} from "./issue-briefing.js";
import { buildDeveloperProfile } from "./recommendations.js";

const EVALUATED_AT = new Date("2026-02-10T00:00:00Z");

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
      ...repositoryOverrides,
    },
  };
}

describe("briefingGithubIssueIdSchema", () => {
  it("coerces a numeric route segment to a positive integer", () => {
    expect(briefingGithubIssueIdSchema.parse("42")).toBe(42);
  });

  it.each(["0", "-1", "1.5", "abc", ""])("rejects %j", (raw) => {
    expect(briefingGithubIssueIdSchema.safeParse(raw).success).toBe(false);
  });
});

describe("buildIssueBriefing", () => {
  const profile = buildDeveloperProfile([], null);

  it("returns the stored snapshot with a fresh engine score", () => {
    const item = makeIssueWithRepository();

    const briefing = buildIssueBriefing(profile, item, null, EVALUATED_AT);

    expect(briefing.issue).toBe(item.issue);
    expect(briefing.repository).toBe(item.repository);
    expect(briefing.score.total).toBeGreaterThan(0);
    expect(briefing.score.total).toBeLessThanOrEqual(100);
    expect(briefing.score.exclusions).toEqual([]);
  });

  it("is deterministic for the same inputs and evaluation time", () => {
    expect(buildIssueBriefing(profile, makeIssueWithRepository(), null, EVALUATED_AT)).toEqual(
      buildIssueBriefing(profile, makeIssueWithRepository(), null, EVALUATED_AT),
    );
  });

  it("keeps the briefing but reports exclusions when the issue is no longer eligible", () => {
    const briefing = buildIssueBriefing(
      profile,
      makeIssueWithRepository({ isAssigned: true }),
      null,
      EVALUATED_AT,
    );

    expect(briefing.score.exclusions).toEqual(["already_assigned"]);
  });

  it("reports the manifest opt-out as an exclusion, mirroring the recommendation list", () => {
    const briefing = buildIssueBriefing(
      profile,
      makeIssueWithRepository(
        {},
        {
          manifestStatus: "valid",
          manifestExternalContributions: false,
          manifestAcceptingContributors: true,
        },
      ),
      null,
      EVALUATED_AT,
    );

    expect(briefing.score.exclusions).toEqual(["external_contributions_not_accepted"]);
  });

  it("carries the user's existing verdict through to the briefing", () => {
    expect(
      buildIssueBriefing(profile, makeIssueWithRepository(), "good_match", EVALUATED_AT).verdict,
    ).toBe("good_match");
    expect(
      buildIssueBriefing(profile, makeIssueWithRepository(), null, EVALUATED_AT).verdict,
    ).toBeNull();
  });

  it("labels every score component and exclusion code", () => {
    const briefing = buildIssueBriefing(profile, makeIssueWithRepository(), null, EVALUATED_AT);

    for (const component of Object.keys(briefing.score.components)) {
      expect(componentLabels[component as keyof typeof componentLabels]).toBeTruthy();
    }
    expect(Object.values(exclusionLabels).every((label) => label.length > 0)).toBe(true);
  });
});
