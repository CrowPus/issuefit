import { describe, expect, it } from "vitest";

import { ScoringConfigError, defaultScoringConfig } from "./config.js";
import { EVALUATED_AT, daysBefore, makeIssue, makeProfile } from "./fixtures.test-helper.js";
import { ProfileValidationError, rankIssues, scoreIssue } from "./scoring.js";

const at = { evaluatedAt: EVALUATED_AT };

describe("scoreIssue", () => {
  it("scores a perfect candidate at 100", () => {
    const profile = makeProfile({
      skills: [{ name: "TypeScript", level: "advanced" }],
      preferredTechnologies: ["TypeScript"],
      careerGoalTechnologies: ["TypeScript"],
      difficulty: { preferred: "intermediate", min: "beginner", max: "advanced" },
    });
    const issue = makeIssue({
      technologies: ["TypeScript"],
      difficulty: "intermediate",
      updatedAt: EVALUATED_AT,
      clarityScore: 1,
      repository: {
        isActive: true,
        activityScore: 1,
        maintainerResponsivenessScore: 1,
        hasContributionManifest: false,
      },
    });

    const score = scoreIssue(profile, issue, at);

    expect(score.total).toBe(100);
    expect(score.exclusions).toEqual([]);
    expect(score.components).toEqual({
      skillMatch: 100,
      technologyPreference: 100,
      difficultyMatch: 100,
      freshness: 100,
      repositoryActivity: 100,
      maintainerResponsiveness: 100,
      issueClarity: 100,
      careerGoalMatch: 100,
    });
  });

  it("scores a complete mismatch at 0", () => {
    const profile = makeProfile({
      skills: [{ name: "Python", level: "beginner" }],
      preferredTechnologies: ["Python"],
      careerGoalTechnologies: ["Python"],
      difficulty: { preferred: "beginner", min: "beginner", max: "advanced" },
    });
    const issue = makeIssue({
      technologies: ["Rust"],
      difficulty: "advanced",
      updatedAt: daysBefore(defaultScoringConfig.staleAfterDays),
      clarityScore: 0,
      repository: {
        isActive: true,
        activityScore: 0,
        maintainerResponsivenessScore: 0,
        hasContributionManifest: false,
      },
    });

    expect(scoreIssue(profile, issue, at).total).toBe(0);
  });

  it("computes the weighted total from documented weights", () => {
    const profile = makeProfile({
      skills: [{ name: "React", level: "intermediate" }],
      preferredTechnologies: ["Vue"],
      careerGoalTechnologies: [],
      difficulty: { preferred: "intermediate", min: "beginner", max: "advanced" },
    });
    const issue = makeIssue({
      technologies: ["React"],
      difficulty: "beginner",
      updatedAt: daysBefore(45),
      clarityScore: 0.6,
      repository: {
        isActive: true,
        activityScore: 0.8,
        maintainerResponsivenessScore: 0.4,
        hasContributionManifest: false,
      },
    });

    const score = scoreIssue(profile, issue, at);

    // skill 1×30 + techPref 0×15 + difficulty 0.5×10 + freshness 0.5×10
    // + activity 0.8×10 + responsiveness 0.4×10 + clarity 0.6×10 + career 0.5×5
    // = 60.5, rounded to the nearest integer
    expect(score.total).toBe(61);
    expect(score.components.difficultyMatch).toBe(50);
    expect(score.components.freshness).toBe(50);
  });

  it("matches technologies regardless of case, dots, hyphens, and spaces", () => {
    const profile = makeProfile({
      skills: [{ name: "Node.js", level: "intermediate" }],
      preferredTechnologies: [],
      careerGoalTechnologies: [],
    });
    const issue = makeIssue({ technologies: ["NODE JS", "node-js", "nodejs"] });

    expect(scoreIssue(profile, issue, at).components.skillMatch).toBe(100);
  });

  it("scores signals without data as neutral instead of penalising", () => {
    const score = scoreIssue(makeProfile(), makeIssue({ technologies: [] }), at);

    expect(score.components.skillMatch).toBe(defaultScoringConfig.unknownSignalScore * 100);
    expect(score.components.technologyPreference).toBe(
      defaultScoringConfig.unknownSignalScore * 100,
    );
    expect(score.components.careerGoalMatch).toBe(defaultScoringConfig.unknownSignalScore * 100);
  });

  it("explains strong signals with human-readable reasons", () => {
    const profile = makeProfile({
      skills: [
        { name: "Node.js", level: "intermediate" },
        { name: "Docker", level: "beginner" },
      ],
      preferredTechnologies: ["Node.js", "Docker"],
      careerGoalTechnologies: ["Node.js", "Docker"],
    });

    const score = scoreIssue(profile, makeIssue(), at);

    expect(score.reasons).toEqual([
      "You already work with Node.js, Docker",
      "Uses technologies you want to practise: Node.js, Docker",
      "Matches your preferred difficulty (intermediate)",
      "Recently active: updated 5 days ago",
      "The repository is actively maintained",
      "Maintainers respond quickly to contributors",
      "The issue is clearly described",
      "Advances your career goal: Node.js, Docker",
    ]);
  });

  it("omits match reasons when too few of the issue's technologies overlap", () => {
    // Default fixture: only 1 of the issue's 2 technologies matches each list,
    // which is below the 0.7 reason threshold.
    const { reasons } = scoreIssue(makeProfile(), makeIssue(), at);

    expect(reasons.some((reason) => reason.startsWith("You already work with"))).toBe(false);
    expect(reasons.some((reason) => reason.startsWith("Advances your career goal"))).toBe(false);
  });

  it("omits reasons for signals below the reason threshold", () => {
    const issue = makeIssue({
      clarityScore: 0.2,
      repository: {
        isActive: true,
        activityScore: 0.2,
        maintainerResponsivenessScore: 0.2,
        hasContributionManifest: false,
      },
    });

    const { reasons } = scoreIssue(makeProfile(), issue, at);

    expect(reasons).not.toContain("The issue is clearly described");
    expect(reasons).not.toContain("The repository is actively maintained");
    expect(reasons).not.toContain("Maintainers respond quickly to contributors");
  });

  it("scores an unmeasured (null) maintainer responsiveness as the unknown signal, without a reason", () => {
    const issue = makeIssue({
      repository: {
        isActive: true,
        activityScore: 0.9,
        maintainerResponsivenessScore: null,
        hasContributionManifest: false,
      },
    });

    const { components, reasons } = scoreIssue(makeProfile(), issue, at);

    expect(components.maintainerResponsiveness).toBe(defaultScoringConfig.unknownSignalScore * 100);
    expect(reasons).not.toContain("Maintainers respond quickly to contributors");
  });

  it("adds bounded boosts and reasons for maintainer-approved manifests", () => {
    const profile = makeProfile({
      skills: [{ name: "TypeScript", level: "advanced" }],
      preferredTechnologies: [],
      careerGoalTechnologies: [],
    });
    const issue = makeIssue({
      maintainerPreferredSkills: ["TypeScript", "PostgreSQL"],
      repository: {
        isActive: true,
        activityScore: 0.5,
        maintainerResponsivenessScore: null,
        hasContributionManifest: true,
      },
    });
    const config = {
      ...defaultScoringConfig,
      manifestPresenceBoost: 0.05,
      manifestPreferredSkillBoost: 0.1,
    };

    const withoutManifest = scoreIssue(
      profile,
      {
        ...issue,
        maintainerPreferredSkills: [],
        repository: { ...issue.repository, hasContributionManifest: false },
      },
      { ...at, config },
    );
    const withManifest = scoreIssue(profile, issue, { ...at, config });

    expect(withManifest.total).toBe(withoutManifest.total + 10);
    expect(withManifest.reasons).toContain(
      "Maintainers publish IssueFit contribution requirements",
    );
    expect(withManifest.reasons).toContain("Maintainers prefer your skills: TypeScript");
  });

  it("clamps out-of-range external signals instead of overflowing", () => {
    const issue = makeIssue({
      clarityScore: 1.7,
      repository: {
        isActive: true,
        activityScore: -0.5,
        maintainerResponsivenessScore: 2,
        hasContributionManifest: false,
      },
    });

    const { components } = scoreIssue(makeProfile(), issue, at);

    expect(components.issueClarity).toBe(100);
    expect(components.repositoryActivity).toBe(0);
    expect(components.maintainerResponsiveness).toBe(100);
  });

  it("treats future update timestamps as fresh", () => {
    const issue = makeIssue({ updatedAt: new Date(EVALUATED_AT.getTime() + 60_000) });

    const score = scoreIssue(makeProfile(), issue, at);

    expect(score.components.freshness).toBe(100);
    expect(score.exclusions).not.toContain("stale");
  });

  it("is deterministic for identical inputs", () => {
    expect(scoreIssue(makeProfile(), makeIssue(), at)).toEqual(
      scoreIssue(makeProfile(), makeIssue(), at),
    );
  });

  it("stamps results with the configuration version", () => {
    const config = { ...defaultScoringConfig, version: "2-experimental" };

    expect(scoreIssue(makeProfile(), makeIssue(), { ...at, config }).version).toBe(
      "2-experimental",
    );
  });

  it("still reports components and exclusions together for excluded issues", () => {
    const score = scoreIssue(makeProfile(), makeIssue({ isAssigned: true }), at);

    expect(score.exclusions).toEqual(["already_assigned"]);
    expect(score.total).toBeGreaterThan(0);
  });

  it("rejects an inverted difficulty range", () => {
    const profile = makeProfile({
      difficulty: { preferred: "beginner", min: "advanced", max: "beginner" },
    });

    expect(() => scoreIssue(profile, makeIssue(), at)).toThrow(ProfileValidationError);
  });

  it("rejects invalid configurations", () => {
    const config = {
      ...defaultScoringConfig,
      weights: { ...defaultScoringConfig.weights, skillMatch: 0.9 },
    };

    expect(() => scoreIssue(makeProfile(), makeIssue(), { ...at, config })).toThrow(
      ScoringConfigError,
    );
  });
});

describe("rankIssues", () => {
  it("sorts eligible issues by total and separates excluded ones", () => {
    const profile = makeProfile();
    const strong = makeIssue({ id: "strong" });
    const weak = makeIssue({
      id: "weak",
      technologies: ["Rust"],
      clarityScore: 0.1,
      repository: {
        isActive: true,
        activityScore: 0.1,
        maintainerResponsivenessScore: 0.1,
        hasContributionManifest: false,
      },
    });
    const assigned = makeIssue({ id: "assigned", isAssigned: true });

    const ranked = rankIssues(profile, [weak, assigned, strong], at);

    expect(ranked.recommendations.map(({ issue }) => issue.id)).toEqual(["strong", "weak"]);
    expect(ranked.excluded.map(({ issue }) => issue.id)).toEqual(["assigned"]);
  });

  it("breaks ties deterministically by issue id", () => {
    const twin = makeIssue({ id: "b" });
    const otherTwin = makeIssue({ id: "a" });

    const ranked = rankIssues(makeProfile(), [twin, otherTwin], at);

    expect(ranked.recommendations.map(({ issue }) => issue.id)).toEqual(["a", "b"]);
  });

  it("returns empty groups for no candidates", () => {
    expect(rankIssues(makeProfile(), [], at)).toEqual({ recommendations: [], excluded: [] });
  });
});
