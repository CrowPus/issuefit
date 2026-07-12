import { z } from "zod";

export const skillLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const updateSkillLevelInputSchema = z.object({
  skillId: z.uuid(),
  level: skillLevelSchema,
});
export type UpdateSkillLevelInput = z.infer<typeof updateSkillLevelInputSchema>;

export const addSkillInputSchema = z.object({
  name: z.string().trim().min(1).max(50),
  level: skillLevelSchema,
});
export type AddSkillInput = z.infer<typeof addSkillInputSchema>;

export const careerGoalOptionSchema = z.enum([
  "backend_developer",
  "frontend_developer",
  "fullstack_developer",
  "devops",
  "mobile_developer",
  "open_source_collaboration",
  "other",
]);

export const issueTypePreferenceSchema = z.enum([
  "bug_fix",
  "feature",
  "documentation",
  "testing",
  "refactor",
]);

export const issueDifficultyPreferenceSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const careerGoalInputSchema = z
  .object({
    goal: careerGoalOptionSchema,
    goalDetails: z.string().trim().max(200).optional(),
    preferredLanguages: z.array(z.string().trim().min(1).max(50)).max(20),
    preferredIssueTypes: z.array(issueTypePreferenceSchema).max(5),
    hoursPerWeek: z.number().int().min(1).max(80),
    difficulty: issueDifficultyPreferenceSchema,
  })
  .refine((data) => data.goal !== "other" || (data.goalDetails?.trim().length ?? 0) > 0, {
    message: 'goalDetails is required when goal is "other"',
    path: ["goalDetails"],
  });
export type CareerGoalInput = z.infer<typeof careerGoalInputSchema>;
