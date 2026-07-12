import type { PublicProjectListing, RepositoryRecord } from "@issuefit/database";
import { describe, expect, it } from "vitest";

import {
  rankIssueFitTopProjects,
  readinessForRepository,
  toDirectoryProjects,
} from "./projects.js";

function makeRepository(overrides: Partial<RepositoryRecord> = {}): RepositoryRecord {
  return {
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
    contributingUrl: "https://github.com/octocat/hello-world/blob/main/CONTRIBUTING.md",
    codeOfConductUrl: null,
    readmeUrl: "https://github.com/octocat/hello-world/blob/main/README.md",
    packageManager: "pnpm",
    hasDockerCompose: false,
    nodeVersion: null,
    ciWorkflowNames: ["ci.yml"],
    setupSignalsCheckedAt: new Date("2026-07-01T00:00:00Z"),
    manifestStatus: "valid",
    manifestRaw: "version: 1",
    manifestFetchedAt: new Date("2026-07-01T00:00:00Z"),
    manifestValidationErrors: [],
    manifestExternalContributions: true,
    manifestAiPolicy: "disclosed-assistance",
    manifestContributionGuide: "CONTRIBUTING.md",
    manifestAcceptingContributors: true,
    manifestMentorshipAvailable: "limited",
    manifestExpectedResponseDays: 5,
    manifestAllowedTypes: ["bug"],
    manifestPreferredSkills: [],
    manifestDifficulty: ["beginner"],
    manifestTestsRequired: true,
    manifestIssueDiscussionRequired: true,
    manifestDraftPullRequestFirst: false,
    source: "curated" as const,
    submittedByUserId: null,
    submittedAt: null,
    curationWarnings: [],
    approved: true,
    htmlUrl: "https://github.com/octocat/hello-world",
    syncedAt: new Date("2026-07-01T00:00:00Z"),
    createdAt: new Date("2026-07-01T00:00:00Z"),
    updatedAt: new Date("2026-07-01T00:00:00Z"),
    ...overrides,
  };
}

describe("readinessForRepository", () => {
  it("grades a fully measured, manifest-accepting repository", () => {
    const readiness = readinessForRepository(makeRepository({ codeOfConductUrl: "https://x" }));
    expect(readiness.score).toBe(100);
    expect(readiness.grade).toBe("A");
  });

  it("treats community signals as unknown when never measured (ADR-0017 honesty)", () => {
    const readiness = readinessForRepository(
      makeRepository({
        setupSignalsCheckedAt: null,
        readmeUrl: null,
        contributingUrl: null,
        codeOfConductUrl: null,
        ciWorkflowNames: null,
      }),
    );
    const states = new Map(readiness.items.map((item) => [item.id, item.state]));
    expect(states.get("readme")).toBe("unknown");
    expect(states.get("contributing_guide")).toBe("unknown");
    expect(states.get("code_of_conduct")).toBe("unknown");
    expect(states.get("ci_workflows")).toBe("unknown");
  });

  it("reports a measured absence as missing, not unknown", () => {
    const readiness = readinessForRepository(makeRepository({ codeOfConductUrl: null }));
    const codeOfConduct = readiness.items.find((item) => item.id === "code_of_conduct");
    expect(codeOfConduct?.state).toBe("missing");
  });
});

describe("toDirectoryProjects", () => {
  it("orders by readiness score, breaking ties with stars", () => {
    const listings: PublicProjectListing[] = [
      {
        repository: makeRepository({ id: "low", manifestStatus: "missing", starsCount: 9999 }),
        openIssueCount: 5,
      },
      {
        repository: makeRepository({ id: "high-few-stars", starsCount: 10 }),
        openIssueCount: 2,
      },
      {
        repository: makeRepository({ id: "high-many-stars", starsCount: 500 }),
        openIssueCount: 1,
      },
    ];

    const ordered = toDirectoryProjects(listings).map((project) => project.repository.id);
    expect(ordered).toEqual(["high-many-stars", "high-few-stars", "low"]);
  });
});

describe("rankIssueFitTopProjects", () => {
  it("adds platform-activity points and matches counts case-insensitively", () => {
    const listings: PublicProjectListing[] = [
      {
        // Readiness 75 (manifest missing) + 1 merged (10) + 2 started (4) = 89.
        repository: makeRepository({
          id: "active",
          fullName: "Octocat/Active-Repo",
          manifestStatus: "missing",
          manifestAcceptingContributors: null,
          codeOfConductUrl: "https://x",
        }),
        openIssueCount: 3,
      },
      {
        // Readiness 100, no platform activity.
        repository: makeRepository({
          id: "ready-but-quiet",
          fullName: "octocat/quiet-repo",
          codeOfConductUrl: "https://x",
        }),
        openIssueCount: 1,
      },
    ];
    const ranked = rankIssueFitTopProjects(
      listings,
      [{ repositoryFullName: "octocat/active-repo", startedCount: 2, mergedCount: 1 }],
      10,
    );

    expect(ranked.map((project) => project.repository.id)).toEqual(["ready-but-quiet", "active"]);
    expect(ranked[1]?.topScore).toBe(89);
    expect(ranked[1]?.startedCount).toBe(2);
    expect(ranked[1]?.mergedCount).toBe(1);
    expect(ranked[0]?.topScore).toBe(100);
  });

  it("caps the list at the requested limit", () => {
    const listings: PublicProjectListing[] = Array.from({ length: 12 }, (_, index) => ({
      repository: makeRepository({ id: `repo-${index}`, fullName: `octocat/repo-${index}` }),
      openIssueCount: 0,
    }));
    expect(rankIssueFitTopProjects(listings, [], 10)).toHaveLength(10);
  });
});
