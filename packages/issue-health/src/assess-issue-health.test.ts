import { describe, expect, it } from "vitest";

import { assessIssueHealth } from "./assess-issue-health.js";
import { IssueHealthConfigError, defaultIssueHealthConfig } from "./config.js";
import type { RawIssueMetadata } from "./types.js";

function issue(overrides: Partial<RawIssueMetadata> = {}): RawIssueMetadata {
  return {
    title: "Add Docker support",
    description: "A reasonably detailed description of the problem and how to fix it.",
    labels: [],
    ...overrides,
  };
}

describe("assessIssueHealth", () => {
  it("defaults to intermediate difficulty with no matching labels", () => {
    expect(assessIssueHealth(issue()).difficulty).toBe("intermediate");
  });

  it("detects beginner difficulty from a 'good first issue' label", () => {
    expect(assessIssueHealth(issue({ labels: ["good first issue"] })).difficulty).toBe("beginner");
  });

  it("matches beginner labels regardless of hyphenation or case", () => {
    expect(assessIssueHealth(issue({ labels: ["Good-First-Issue"] })).difficulty).toBe("beginner");
  });

  it("detects advanced difficulty from an 'advanced' label", () => {
    expect(assessIssueHealth(issue({ labels: ["advanced"] })).difficulty).toBe("advanced");
  });

  it("prefers beginner when both beginner and advanced labels are present", () => {
    const result = assessIssueHealth(issue({ labels: ["good first issue", "hard"] }));
    expect(result.difficulty).toBe("beginner");
  });

  it("ignores unrelated labels", () => {
    expect(assessIssueHealth(issue({ labels: ["frontend", "css"] })).difficulty).toBe(
      "intermediate",
    );
  });

  it("detects a blocked issue from a matching label", () => {
    expect(assessIssueHealth(issue({ labels: ["blocked"] })).isBlocked).toBe(true);
    expect(assessIssueHealth(issue({ labels: ["wontfix"] })).isBlocked).toBe(true);
    expect(assessIssueHealth(issue({ labels: ["enhancement"] })).isBlocked).toBe(false);
  });

  it("gives a zero clarity score for a null description", () => {
    expect(assessIssueHealth(issue({ description: null })).clarityScore).toBe(0);
  });

  it("gives a zero clarity score for a blank description", () => {
    expect(assessIssueHealth(issue({ description: "   " })).clarityScore).toBe(0);
  });

  it("scales clarity score with description length up to the configured threshold", () => {
    const { fullClarityDescriptionLength } = defaultIssueHealthConfig;
    const halfLength = "x".repeat(Math.floor(fullClarityDescriptionLength / 2));
    expect(assessIssueHealth(issue({ description: halfLength })).clarityScore).toBeCloseTo(0.5);
  });

  it("caps clarity score at 1 for long descriptions", () => {
    const longDescription = "x".repeat(defaultIssueHealthConfig.fullClarityDescriptionLength * 3);
    expect(assessIssueHealth(issue({ description: longDescription })).clarityScore).toBe(1);
  });

  it("rejects an invalid configuration", () => {
    expect(() =>
      assessIssueHealth(issue(), {
        config: { ...defaultIssueHealthConfig, fullClarityDescriptionLength: -1 },
      }),
    ).toThrow(IssueHealthConfigError);
  });

  it("is deterministic for identical inputs", () => {
    expect(assessIssueHealth(issue())).toEqual(assessIssueHealth(issue()));
  });
});
