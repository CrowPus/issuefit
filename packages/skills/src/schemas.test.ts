import { describe, expect, it } from "vitest";

import {
  addSkillInputSchema,
  careerGoalInputSchema,
  updateSkillLevelInputSchema,
} from "./schemas.js";

describe("updateSkillLevelInputSchema", () => {
  it("accepts a valid skill id and level", () => {
    expect(
      updateSkillLevelInputSchema.safeParse({
        skillId: "550e8400-e29b-41d4-a716-446655440000",
        level: "advanced",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid level", () => {
    expect(
      updateSkillLevelInputSchema.safeParse({
        skillId: "550e8400-e29b-41d4-a716-446655440000",
        level: "expert",
      }).success,
    ).toBe(false);
  });
});

describe("addSkillInputSchema", () => {
  it("rejects a blank name", () => {
    expect(addSkillInputSchema.safeParse({ name: "   ", level: "beginner" }).success).toBe(false);
  });

  it("rejects a name over 50 characters", () => {
    expect(addSkillInputSchema.safeParse({ name: "a".repeat(51), level: "beginner" }).success).toBe(
      false,
    );
  });
});

describe("careerGoalInputSchema", () => {
  const base = {
    goal: "backend_developer" as const,
    preferredLanguages: ["TypeScript"],
    preferredIssueTypes: ["bug_fix"] as const,
    hoursPerWeek: 5,
    difficulty: "intermediate" as const,
  };

  it("accepts a well-formed goal without goalDetails", () => {
    expect(careerGoalInputSchema.safeParse(base).success).toBe(true);
  });

  it('requires goalDetails when goal is "other"', () => {
    const result = careerGoalInputSchema.safeParse({ ...base, goal: "other" });
    expect(result.success).toBe(false);
  });

  it('accepts "other" once goalDetails is provided', () => {
    const result = careerGoalInputSchema.safeParse({
      ...base,
      goal: "other",
      goalDetails: "Learn embedded systems",
    });
    expect(result.success).toBe(true);
  });

  it("rejects hoursPerWeek outside 1-80", () => {
    expect(careerGoalInputSchema.safeParse({ ...base, hoursPerWeek: 0 }).success).toBe(false);
    expect(careerGoalInputSchema.safeParse({ ...base, hoursPerWeek: 81 }).success).toBe(false);
  });

  it("rejects an unknown issue type preference", () => {
    expect(
      careerGoalInputSchema.safeParse({ ...base, preferredIssueTypes: ["rewrite_everything"] })
        .success,
    ).toBe(false);
  });
});
