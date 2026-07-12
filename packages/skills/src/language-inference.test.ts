import { describe, expect, it } from "vitest";

import { SkillInferenceConfigError, defaultSkillInferenceConfig } from "./config.js";
import { inferSkillsFromRepositories } from "./language-inference.js";
import type { RepositoryLanguageSample } from "./types.js";

function repos(...languages: (string | null)[]): RepositoryLanguageSample[] {
  return languages.map((primaryLanguage) => ({ primaryLanguage, isFork: false }));
}

describe("inferSkillsFromRepositories", () => {
  it("returns an empty list for no repositories", () => {
    expect(inferSkillsFromRepositories([])).toEqual([]);
  });

  it("ignores repositories with no primary language", () => {
    expect(inferSkillsFromRepositories(repos(null, null))).toEqual([]);
  });

  it("proposes beginner below the intermediate threshold", () => {
    const [proposal] = inferSkillsFromRepositories(repos("Rust"));
    expect(proposal).toMatchObject({ name: "Rust", level: "beginner", repositoryCount: 1 });
  });

  it("proposes intermediate at the intermediate threshold", () => {
    const [proposal] = inferSkillsFromRepositories(repos("Go", "Go"), defaultSkillInferenceConfig);
    expect(proposal).toMatchObject({ level: "intermediate", repositoryCount: 2 });
  });

  it("proposes advanced at the advanced threshold, not before", () => {
    const belowThreshold = inferSkillsFromRepositories(repos(...Array(4).fill("TypeScript")));
    expect(belowThreshold[0]?.level).toBe("intermediate");

    const atThreshold = inferSkillsFromRepositories(repos(...Array(5).fill("TypeScript")));
    expect(atThreshold[0]?.level).toBe("advanced");
  });

  it("caps confidenceScore at 1 for counts beyond the advanced threshold", () => {
    const [proposal] = inferSkillsFromRepositories(repos(...Array(20).fill("Python")));
    expect(proposal?.confidenceScore).toBe(1);
  });

  it("excludes forks by default", () => {
    const repositories: RepositoryLanguageSample[] = [
      { primaryLanguage: "Java", isFork: true },
      { primaryLanguage: "Java", isFork: true },
    ];
    expect(inferSkillsFromRepositories(repositories)).toEqual([]);
  });

  it("includes forks when configured to", () => {
    const repositories: RepositoryLanguageSample[] = [{ primaryLanguage: "Java", isFork: true }];
    const [proposal] = inferSkillsFromRepositories(repositories, {
      ...defaultSkillInferenceConfig,
      includeForks: true,
    });
    expect(proposal?.repositoryCount).toBe(1);
  });

  it("sorts by repository count descending, then name ascending", () => {
    const proposals = inferSkillsFromRepositories(repos("Python", "Zig", "Zig", "Ada", "Ada"));
    expect(proposals.map((p) => p.name)).toEqual(["Ada", "Zig", "Python"]);
  });

  it("rejects an invalid configuration", () => {
    expect(() =>
      inferSkillsFromRepositories(repos("Go"), {
        ...defaultSkillInferenceConfig,
        advancedThreshold: -1,
      }),
    ).toThrow(SkillInferenceConfigError);
  });
});
