import { describe, expect, it } from "vitest";

import { CONTRIBUTION_MANIFEST_PATH } from "./schemas.js";
import { parseContributionManifestObject, parseContributionManifestYaml } from "./parse.js";

const validManifestYaml = `
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
  allowedTypes: [bug, testing, documentation, performance]
  preferredSkills: [typescript, postgresql, docker]
  difficulty: [beginner, intermediate]

qualityRequirements:
  testsRequired: true
  issueDiscussionRequired: true
  draftPullRequestFirst: true
`;

describe("parseContributionManifestYaml", () => {
  it("parses the v0 example manifest", () => {
    const parsed = parseContributionManifestYaml(validManifestYaml);

    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.manifest.version).toBe(1);
      expect(parsed.manifest.project.aiPolicy).toBe("disclosed-assistance");
      expect(parsed.manifest.opportunities.allowedTypes).toEqual([
        "bug",
        "testing",
        "documentation",
        "performance",
      ]);
    }
  });

  it("rejects unsupported manifest versions", () => {
    const parsed = parseContributionManifestYaml(
      validManifestYaml.replace("version: 1", "version: 2"),
    );

    expect(parsed).toMatchObject({
      status: "invalid",
      errors: expect.arrayContaining([expect.stringContaining("version")]),
    });
  });

  it("rejects malformed YAML without throwing", () => {
    const parsed = parseContributionManifestYaml("version: [");

    expect(parsed.status).toBe("invalid");
    if (parsed.status === "invalid") {
      expect(parsed.errors[0]).toContain("YAML");
    }
  });

  it("rejects absolute contribution guide URLs", () => {
    const parsed = parseContributionManifestYaml(
      validManifestYaml.replace("CONTRIBUTING.md", "https://example.com/CONTRIBUTING.md"),
    );

    expect(parsed).toMatchObject({
      status: "invalid",
      errors: expect.arrayContaining([expect.stringContaining("project.contributionGuide")]),
    });
  });

  it("rejects unknown top-level fields", () => {
    const parsed = parseContributionManifestYaml(`${validManifestYaml}\nunknown: true\n`);

    expect(parsed).toMatchObject({
      status: "invalid",
      errors: expect.arrayContaining([expect.stringContaining("Unrecognized key")]),
    });
  });
});

describe("parseContributionManifestObject", () => {
  it("trims preferred skill names", () => {
    const parsed = parseContributionManifestObject({
      version: 1,
      project: {
        externalContributions: true,
        aiPolicy: "none",
        contributionGuide: "docs/CONTRIBUTING.md",
      },
      maintainerCapacity: {
        acceptingContributors: true,
        mentorshipAvailable: "available",
        expectedResponseDays: 3,
      },
      opportunities: {
        allowedTypes: ["feature"],
        preferredSkills: [" TypeScript "],
        difficulty: ["advanced"],
      },
      qualityRequirements: {
        testsRequired: true,
        issueDiscussionRequired: false,
        draftPullRequestFirst: false,
      },
    });

    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.manifest.opportunities.preferredSkills).toEqual(["TypeScript"]);
    }
  });

  it("exports the canonical manifest path", () => {
    expect(CONTRIBUTION_MANIFEST_PATH).toBe(".github/contribution-manifest.yml");
  });
});
