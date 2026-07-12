import { describe, expect, it } from "vitest";

import { evaluateSubmissionManifest } from "./project-submission.js";

const acceptingManifest = `
version: 1
project:
  externalContributions: true
  aiPolicy: disclosed-assistance
  contributionGuide: CONTRIBUTING.md
maintainerCapacity:
  acceptingContributors: true
  mentorshipAvailable: limited
  expectedResponseDays: 5
opportunities:
  allowedTypes: [bug]
  preferredSkills: []
  difficulty: [beginner]
qualityRequirements:
  testsRequired: true
  issueDiscussionRequired: true
  draftPullRequestFirst: false
`;

describe("evaluateSubmissionManifest", () => {
  it("accepts a valid manifest that welcomes contributors", () => {
    expect(evaluateSubmissionManifest(acceptingManifest)).toEqual({ status: "accepted" });
  });

  it("reports a missing manifest file", () => {
    expect(evaluateSubmissionManifest(null)).toEqual({ status: "manifest_missing" });
  });

  it("surfaces validation errors for an invalid manifest", () => {
    const gate = evaluateSubmissionManifest("version: 2\n");
    expect(gate.status).toBe("manifest_invalid");
    if (gate.status !== "manifest_invalid") {
      return;
    }
    expect(gate.errors.length).toBeGreaterThan(0);
  });

  it("rejects a manifest that opts out of external contributions", () => {
    const gate = evaluateSubmissionManifest(
      acceptingManifest.replace("externalContributions: true", "externalContributions: false"),
    );
    expect(gate.status).toBe("not_accepting");
    if (gate.status !== "not_accepting") {
      return;
    }
    expect(gate.message).toContain("externalContributions");
  });

  it("rejects a manifest whose maintainers are not accepting contributors right now", () => {
    const gate = evaluateSubmissionManifest(
      acceptingManifest.replace("acceptingContributors: true", "acceptingContributors: false"),
    );
    expect(gate.status).toBe("not_accepting");
    if (gate.status !== "not_accepting") {
      return;
    }
    expect(gate.message).toContain("acceptingContributors");
  });
});
