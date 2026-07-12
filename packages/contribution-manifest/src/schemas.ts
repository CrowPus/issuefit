import { z } from "zod";

export const CONTRIBUTION_MANIFEST_PATH = ".github/contribution-manifest.yml";

export const aiPolicySchema = z.enum(["none", "disclosed-assistance", "unrestricted"]);
export const mentorshipAvailabilitySchema = z.enum(["none", "limited", "available"]);
export const opportunityTypeSchema = z.enum([
  "bug",
  "documentation",
  "feature",
  "maintenance",
  "performance",
  "refactor",
  "testing",
]);
export const manifestDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

const relativeRepositoryPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((value) => !value.startsWith("/"), "must be a relative repository path")
  .refine((value) => !value.includes(".."), "must not contain parent-directory segments")
  .refine((value) => !/^[a-z][a-z0-9+.-]*:/i.test(value), "must not be an absolute URL");

const trimmedNameSchema = z.string().trim().min(1).max(50);

export const contributionManifestSchema = z
  .object({
    version: z.literal(1),
    project: z.object({
      externalContributions: z.boolean(),
      aiPolicy: aiPolicySchema,
      contributionGuide: relativeRepositoryPathSchema,
    }),
    maintainerCapacity: z.object({
      acceptingContributors: z.boolean(),
      mentorshipAvailable: mentorshipAvailabilitySchema,
      expectedResponseDays: z.number().int().min(1).max(365),
    }),
    opportunities: z.object({
      allowedTypes: z.array(opportunityTypeSchema).min(1).max(10),
      preferredSkills: z.array(trimmedNameSchema).max(20),
      difficulty: z.array(manifestDifficultySchema).min(1).max(3),
    }),
    qualityRequirements: z.object({
      testsRequired: z.boolean(),
      issueDiscussionRequired: z.boolean(),
      draftPullRequestFirst: z.boolean(),
    }),
  })
  .strict();

export type AiPolicy = z.infer<typeof aiPolicySchema>;
export type MentorshipAvailability = z.infer<typeof mentorshipAvailabilitySchema>;
export type OpportunityType = z.infer<typeof opportunityTypeSchema>;
export type ManifestDifficulty = z.infer<typeof manifestDifficultySchema>;
export type ContributionManifest = z.infer<typeof contributionManifestSchema>;
