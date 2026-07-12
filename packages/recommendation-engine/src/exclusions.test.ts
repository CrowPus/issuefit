import { describe, expect, it } from "vitest";

import { defaultScoringConfig } from "./config.js";
import { evaluateExclusions } from "./exclusions.js";
import { EVALUATED_AT, daysBefore, makeIssue, makeProfile } from "./fixtures.test-helper.js";

function exclusionsFor(issue = makeIssue(), profile = makeProfile()) {
  return evaluateExclusions(profile, issue, defaultScoringConfig, EVALUATED_AT);
}

describe("evaluateExclusions", () => {
  it("returns no exclusions for a healthy candidate", () => {
    expect(exclusionsFor()).toEqual([]);
  });

  it("excludes closed issues", () => {
    expect(exclusionsFor(makeIssue({ state: "closed" }))).toContain("closed");
  });

  it("excludes assigned issues", () => {
    expect(exclusionsFor(makeIssue({ isAssigned: true }))).toContain("already_assigned");
  });

  it("excludes blocked issues", () => {
    expect(exclusionsFor(makeIssue({ isBlocked: true }))).toContain("blocked");
  });

  it("excludes issues with an active pull request", () => {
    expect(exclusionsFor(makeIssue({ hasActivePullRequest: true }))).toContain(
      "active_pull_request",
    );
  });

  it("excludes issues that do not accept external contributions", () => {
    expect(exclusionsFor(makeIssue({ allowsExternalContributors: false }))).toContain(
      "external_contributions_not_accepted",
    );
  });

  it("excludes issues from inactive repositories", () => {
    const issue = makeIssue({
      repository: {
        isActive: false,
        activityScore: 0,
        maintainerResponsivenessScore: 0,
        hasContributionManifest: false,
      },
    });
    expect(exclusionsFor(issue)).toContain("inactive_repository");
  });

  it("excludes issues older than the stale threshold, but not at the threshold", () => {
    const { staleAfterDays } = defaultScoringConfig;
    expect(exclusionsFor(makeIssue({ updatedAt: daysBefore(staleAfterDays + 1) }))).toContain(
      "stale",
    );
    expect(exclusionsFor(makeIssue({ updatedAt: daysBefore(staleAfterDays) }))).not.toContain(
      "stale",
    );
  });

  it("excludes issues whose trimmed description is too short", () => {
    const padded = `   ${"x".repeat(defaultScoringConfig.minDescriptionLength - 1)}   `;
    expect(exclusionsFor(makeIssue({ description: padded }))).toContain("insufficient_description");
  });

  it("excludes issues outside the developer's difficulty range, boundaries included", () => {
    const profile = makeProfile({
      difficulty: { preferred: "beginner", min: "beginner", max: "intermediate" },
    });
    expect(exclusionsFor(makeIssue({ difficulty: "advanced" }), profile)).toContain(
      "difficulty_out_of_range",
    );
    expect(exclusionsFor(makeIssue({ difficulty: "intermediate" }), profile)).toEqual([]);
    expect(exclusionsFor(makeIssue({ difficulty: "beginner" }), profile)).toEqual([]);
  });

  it("reports every applicable exclusion at once", () => {
    const issue = makeIssue({ state: "closed", isAssigned: true, isBlocked: true });
    const result = exclusionsFor(issue);
    expect(result).toEqual(expect.arrayContaining(["closed", "already_assigned", "blocked"]));
    expect(result).toHaveLength(3);
  });
});
