import { describe, expect, it } from "vitest";

import { assessRepositoryHealth } from "./assess-repository-health.js";
import { RepositoryHealthConfigError, defaultRepositoryHealthConfig } from "./config.js";
import type { RawRepositoryMetadata } from "./types.js";

const EVALUATED_AT = new Date("2026-07-01T00:00:00Z");

function daysBefore(days: number): Date {
  return new Date(EVALUATED_AT.getTime() - days * 86_400_000);
}

function metadata(overrides: Partial<RawRepositoryMetadata> = {}): RawRepositoryMetadata {
  return {
    pushedAt: daysBefore(5),
    archived: false,
    disabled: false,
    hasContributingGuide: true,
    ...overrides,
  };
}

const at = { evaluatedAt: EVALUATED_AT };

describe("assessRepositoryHealth", () => {
  it("marks a recently pushed, non-archived repository active with no warnings", () => {
    const result = assessRepositoryHealth(metadata(), at);

    expect(result.isActive).toBe(true);
    expect(result.curationWarnings).toEqual([]);
    expect(result.activityScore).toBeCloseTo(1 - 5 / defaultRepositoryHealthConfig.staleAfterDays);
  });

  it("gives full activity score for a push at evaluation time", () => {
    const result = assessRepositoryHealth(metadata({ pushedAt: EVALUATED_AT }), at);
    expect(result.activityScore).toBe(1);
  });

  it("gives zero activity score and a stale warning past the threshold", () => {
    const { staleAfterDays } = defaultRepositoryHealthConfig;
    const result = assessRepositoryHealth(
      metadata({ pushedAt: daysBefore(staleAfterDays + 30) }),
      at,
    );

    expect(result.activityScore).toBe(0);
    expect(result.isActive).toBe(false);
    expect(result.curationWarnings).toContain("stale");
  });

  it("is not stale exactly at the threshold", () => {
    const { staleAfterDays } = defaultRepositoryHealthConfig;
    const result = assessRepositoryHealth(metadata({ pushedAt: daysBefore(staleAfterDays) }), at);

    expect(result.curationWarnings).not.toContain("stale");
    expect(result.isActive).toBe(true);
  });

  it("treats a repository that has never been pushed to as stale and inactive", () => {
    const result = assessRepositoryHealth(metadata({ pushedAt: null }), at);

    expect(result.activityScore).toBe(0);
    expect(result.isActive).toBe(false);
    expect(result.curationWarnings).toContain("stale");
  });

  it("marks an archived repository inactive regardless of recent pushes", () => {
    const result = assessRepositoryHealth(metadata({ archived: true }), at);

    expect(result.isActive).toBe(false);
    expect(result.curationWarnings).toContain("archived");
  });

  it("marks a disabled repository inactive and warns", () => {
    const result = assessRepositoryHealth(metadata({ disabled: true }), at);

    expect(result.isActive).toBe(false);
    expect(result.curationWarnings).toContain("disabled");
  });

  it("warns when there is no contributing guide, without affecting isActive", () => {
    const result = assessRepositoryHealth(metadata({ hasContributingGuide: false }), at);

    expect(result.curationWarnings).toContain("no_contributing_guide");
    expect(result.isActive).toBe(true);
  });

  it("reports every applicable warning at once", () => {
    const result = assessRepositoryHealth(
      metadata({ archived: true, disabled: true, hasContributingGuide: false, pushedAt: null }),
      at,
    );

    expect(result.curationWarnings).toEqual(
      expect.arrayContaining(["archived", "disabled", "no_contributing_guide", "stale"]),
    );
    expect(result.curationWarnings).toHaveLength(4);
  });

  it("rejects an invalid configuration", () => {
    expect(() =>
      assessRepositoryHealth(metadata(), {
        ...at,
        config: { ...defaultRepositoryHealthConfig, staleAfterDays: -1 },
      }),
    ).toThrow(RepositoryHealthConfigError);
  });

  it("is deterministic for identical inputs", () => {
    expect(assessRepositoryHealth(metadata(), at)).toEqual(assessRepositoryHealth(metadata(), at));
  });
});
