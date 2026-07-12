import type { CareerGoalRecord, IssueWithRepository, UserSkillWithName } from "@issuefit/database";
import { describe, expect, it } from "vitest";

import {
  buildDeveloperProfile,
  excludeNegativelyRated,
  toIssueCandidate,
} from "./recommendations.js";

function makeUserSkill(overrides: Partial<UserSkillWithName> = {}): UserSkillWithName {
  return {
    id: "skill-row-1",
    userId: "user-1",
    skillId: "skill-1",
    name: "TypeScript",
    level: "advanced",
    confidenceScore: 1,
    source: "manual",
    userConfirmed: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeCareerGoal(overrides: Partial<CareerGoalRecord> = {}): CareerGoalRecord {
  return {
    userId: "user-1",
    goal: "backend_developer",
    goalDetails: null,
    preferredLanguages: ["Docker"],
    preferredIssueTypes: ["bug_fix"],
    hoursPerWeek: 5,
    difficulty: "intermediate",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeIssueWithRepository(
  overrides: Partial<IssueWithRepository["issue"]> = {},
  repositoryOverrides: Partial<IssueWithRepository["repository"]> = {},
): IssueWithRepository {
  return {
    issue: {
      id: "issue-1",
      repositoryId: "repo-1",
      githubIssueId: 42,
      number: 42,
      title: "Add Docker support",
      description: "A detailed description",
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
      ...repositoryOverrides,
    },
  };
}

describe("buildDeveloperProfile", () => {
  it("maps skills and career goal fields directly", () => {
    const profile = buildDeveloperProfile([makeUserSkill()], makeCareerGoal());

    expect(profile.skills).toEqual([{ name: "TypeScript", level: "advanced" }]);
    expect(profile.preferredTechnologies).toEqual(["Docker"]);
    expect(profile.difficulty.preferred).toBe("intermediate");
  });

  it("looks up career-goal technologies from the static mapping", () => {
    const profile = buildDeveloperProfile([], makeCareerGoal({ goal: "frontend_developer" }));
    expect(profile.careerGoalTechnologies).toContain("React");
  });

  it("never hard-excludes by difficulty: min/max stay permissive regardless of preference", () => {
    const profile = buildDeveloperProfile([], makeCareerGoal({ difficulty: "advanced" }));
    expect(profile.difficulty).toEqual({ preferred: "advanced", min: "beginner", max: "advanced" });
  });

  it("defaults sensibly when the user has no career goal yet", () => {
    const profile = buildDeveloperProfile([], null);

    expect(profile.preferredTechnologies).toEqual([]);
    expect(profile.careerGoalTechnologies).toEqual([]);
    expect(profile.difficulty).toEqual({ preferred: "beginner", min: "beginner", max: "advanced" });
  });

  it("gives no career-goal technologies for open_source_collaboration or other", () => {
    expect(
      buildDeveloperProfile([], makeCareerGoal({ goal: "open_source_collaboration" }))
        .careerGoalTechnologies,
    ).toEqual([]);
    expect(
      buildDeveloperProfile([], makeCareerGoal({ goal: "other" })).careerGoalTechnologies,
    ).toEqual([]);
  });
});

describe("toIssueCandidate", () => {
  it("maps issue and repository fields directly", () => {
    const candidate = toIssueCandidate(makeIssueWithRepository());

    expect(candidate).toMatchObject({
      id: "issue-1",
      title: "Add Docker support",
      description: "A detailed description",
      difficulty: "beginner",
      state: "open",
      isAssigned: false,
      isBlocked: false,
      hasActivePullRequest: false,
      allowsExternalContributors: true,
      clarityScore: 0.8,
      maintainerPreferredSkills: [],
      repository: {
        isActive: true,
        activityScore: 0.9,
        maintainerResponsivenessScore: 0.5,
        hasContributionManifest: false,
      },
    });
    expect(candidate.updatedAt).toEqual(new Date("2026-02-01T00:00:00Z"));
  });

  it("uses the repository's primary language as the sole technology signal", () => {
    const candidate = toIssueCandidate(makeIssueWithRepository({}, { primaryLanguage: "Rust" }));
    expect(candidate.technologies).toEqual(["Rust"]);
  });

  it("gives an empty technologies list when the repository has no primary language", () => {
    const candidate = toIssueCandidate(makeIssueWithRepository({}, { primaryLanguage: null }));
    expect(candidate.technologies).toEqual([]);
  });

  it("maps a null description to an empty string, never null", () => {
    const candidate = toIssueCandidate(makeIssueWithRepository({ description: null }));
    expect(candidate.description).toBe("");
  });

  it("maps valid manifest fields into maintainer signals", () => {
    const candidate = toIssueCandidate(
      makeIssueWithRepository(
        {},
        {
          manifestStatus: "valid",
          manifestExternalContributions: true,
          manifestAcceptingContributors: true,
          manifestPreferredSkills: ["TypeScript", "PostgreSQL"],
        },
      ),
    );

    expect(candidate.maintainerPreferredSkills).toEqual(["TypeScript", "PostgreSQL"]);
    expect(candidate.repository.hasContributionManifest).toBe(true);
    expect(candidate.allowsExternalContributors).toBe(true);
  });

  it("applies valid manifest external-contribution opt-out immediately", () => {
    const candidate = toIssueCandidate(
      makeIssueWithRepository(
        {},
        {
          manifestStatus: "valid",
          manifestExternalContributions: false,
          manifestAcceptingContributors: true,
        },
      ),
    );

    expect(candidate.allowsExternalContributors).toBe(false);
    expect(candidate.repository.hasContributionManifest).toBe(false);
  });
});

describe("excludeNegativelyRated", () => {
  it("removes issues whose GitHub id was rated negatively", () => {
    const kept = makeIssueWithRepository({ id: "issue-1", githubIssueId: 42 });
    const rated = makeIssueWithRepository({ id: "issue-2", githubIssueId: 43 });

    expect(excludeNegativelyRated([kept, rated], [43])).toEqual([kept]);
  });

  it("keeps everything when the user has no negative feedback", () => {
    const items = [makeIssueWithRepository()];
    expect(excludeNegativelyRated(items, [])).toEqual(items);
  });

  it("matches on the stable GitHub id, not the volatile row id", () => {
    // Same GitHub issue re-synced under a new row UUID must stay excluded.
    const resynced = makeIssueWithRepository({ id: "issue-new-uuid", githubIssueId: 42 });
    expect(excludeNegativelyRated([resynced], [42])).toEqual([]);
  });
});
