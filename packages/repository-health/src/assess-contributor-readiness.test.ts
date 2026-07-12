import { describe, expect, it } from "vitest";

import {
  assessContributorReadiness,
  type ContributorReadinessInput,
} from "./assess-contributor-readiness.js";

function fullyReadyInput(): ContributorReadinessInput {
  return {
    isActive: true,
    hasReadme: true,
    hasContributingGuide: true,
    hasCodeOfConduct: true,
    hasCiWorkflows: true,
    manifestStatus: "valid",
    manifestAcceptingContributors: true,
    medianFirstResponseDays: 2,
  };
}

describe("assessContributorReadiness", () => {
  it("scores 100 with grade A when every signal is met", () => {
    const assessment = assessContributorReadiness(fullyReadyInput());
    expect(assessment.score).toBe(100);
    expect(assessment.grade).toBe("A");
    expect(assessment.items.every((item) => item.state === "met")).toBe(true);
  });

  it("scores 0 with grade E when nothing is in place", () => {
    const assessment = assessContributorReadiness({
      isActive: false,
      hasReadme: false,
      hasContributingGuide: false,
      hasCodeOfConduct: false,
      hasCiWorkflows: false,
      manifestStatus: "missing",
      manifestAcceptingContributors: null,
      medianFirstResponseDays: 30,
    });
    expect(assessment.score).toBe(0);
    expect(assessment.grade).toBe("E");
  });

  it("item weights sum to exactly 100", () => {
    const assessment = assessContributorReadiness(fullyReadyInput());
    expect(assessment.items.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });

  it("marks unmeasured CI and responsiveness as unknown, scoring zero without failing them", () => {
    const assessment = assessContributorReadiness({
      ...fullyReadyInput(),
      hasCiWorkflows: null,
      medianFirstResponseDays: null,
    });
    const ci = assessment.items.find((item) => item.id === "ci_workflows");
    const responsiveness = assessment.items.find((item) => item.id === "responsive_maintainers");
    expect(ci?.state).toBe("unknown");
    expect(responsiveness?.state).toBe("unknown");
    expect(assessment.score).toBe(75);
  });

  it("treats never-measured community signals as unknown, not missing", () => {
    const assessment = assessContributorReadiness({
      ...fullyReadyInput(),
      hasReadme: null,
      hasContributingGuide: null,
      hasCodeOfConduct: null,
      hasCiWorkflows: null,
    });
    const unknownIds = assessment.items
      .filter((item) => item.state === "unknown")
      .map((item) => item.id);
    expect(unknownIds).toEqual(["readme", "contributing_guide", "code_of_conduct", "ci_workflows"]);
    expect(assessment.score).toBe(55);
  });

  it("requires the manifest to be valid AND accepting for its 25 points", () => {
    const validButClosed = assessContributorReadiness({
      ...fullyReadyInput(),
      manifestAcceptingContributors: false,
    });
    const invalid = assessContributorReadiness({
      ...fullyReadyInput(),
      manifestStatus: "invalid",
      manifestAcceptingContributors: null,
    });
    for (const assessment of [validButClosed, invalid]) {
      const manifest = assessment.items.find((item) => item.id === "contribution_manifest");
      expect(manifest?.state).toBe("missing");
      expect(assessment.score).toBe(75);
    }
  });

  it("treats a median first response over seven days as missing, not unknown", () => {
    const assessment = assessContributorReadiness({
      ...fullyReadyInput(),
      medianFirstResponseDays: 7.5,
    });
    const responsiveness = assessment.items.find((item) => item.id === "responsive_maintainers");
    expect(responsiveness?.state).toBe("missing");
    expect(assessment.score).toBe(85);
  });

  it("maps score boundaries to grades", () => {
    const cases: readonly (readonly [Partial<ContributorReadinessInput>, string])[] = [
      // 100 - 15 (responsiveness missing) = 85 → still A.
      [{ medianFirstResponseDays: 30 }, "A"],
      // 100 - 25 (manifest missing) = 75 → B.
      [{ manifestStatus: "missing", manifestAcceptingContributors: null }, "B"],
      // 75 - 15 - 15 = 45 → C.
      [
        {
          manifestStatus: "missing",
          manifestAcceptingContributors: null,
          isActive: false,
          medianFirstResponseDays: 30,
        },
        "C",
      ],
    ];
    for (const [overrides, grade] of cases) {
      expect(assessContributorReadiness({ ...fullyReadyInput(), ...overrides }).grade).toBe(grade);
    }
  });
});
