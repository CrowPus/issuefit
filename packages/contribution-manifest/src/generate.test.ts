import { describe, expect, it } from "vitest";

import { generateContributionManifestYaml } from "./generate.js";
import { parseContributionManifestYaml } from "./parse.js";

const validInput = {
  version: 1,
  project: {
    externalContributions: true,
    aiPolicy: "disclosed-assistance",
    contributionGuide: "CONTRIBUTING.md",
  },
  maintainerCapacity: {
    acceptingContributors: true,
    mentorshipAvailable: "limited",
    expectedResponseDays: 5,
  },
  opportunities: {
    allowedTypes: ["bug", "documentation"],
    preferredSkills: ["typescript", "c++"],
    difficulty: ["beginner", "intermediate"],
  },
  qualityRequirements: {
    testsRequired: true,
    issueDiscussionRequired: true,
    draftPullRequestFirst: false,
  },
};

describe("generateContributionManifestYaml", () => {
  it("emits YAML that parses back to the exact same valid manifest", () => {
    const generated = generateContributionManifestYaml(validInput);
    expect(generated.status).toBe("generated");
    if (generated.status !== "generated") {
      return;
    }

    const reparsed = parseContributionManifestYaml(generated.yaml);
    expect(reparsed.status).toBe("valid");
    if (reparsed.status !== "valid") {
      return;
    }
    expect(reparsed.manifest).toEqual(validInput);
  });

  it("rejects invalid form input with the schema's error messages", () => {
    const generated = generateContributionManifestYaml({
      ...validInput,
      maintainerCapacity: { ...validInput.maintainerCapacity, expectedResponseDays: 0 },
    });
    expect(generated.status).toBe("invalid");
    if (generated.status !== "invalid") {
      return;
    }
    expect(generated.errors.some((error) => error.includes("expectedResponseDays"))).toBe(true);
  });

  it("handles an empty preferred-skills list", () => {
    const generated = generateContributionManifestYaml({
      ...validInput,
      opportunities: { ...validInput.opportunities, preferredSkills: [] },
    });
    expect(generated.status).toBe("generated");
    if (generated.status !== "generated") {
      return;
    }
    expect(parseContributionManifestYaml(generated.yaml).status).toBe("valid");
  });
});
