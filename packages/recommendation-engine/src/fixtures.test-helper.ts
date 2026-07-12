import type { DeveloperProfile, IssueCandidate } from "./types.js";

export const EVALUATED_AT = new Date("2026-07-01T12:00:00Z");

export function daysBefore(days: number, reference: Date = EVALUATED_AT): Date {
  return new Date(reference.getTime() - days * 86_400_000);
}

const MEANINGFUL_DESCRIPTION =
  "The development container is missing Docker support. Add a Dockerfile and a compose service " +
  "so contributors can run the full stack locally without installing PostgreSQL themselves.";

export function makeProfile(overrides: Partial<DeveloperProfile> = {}): DeveloperProfile {
  return {
    skills: [
      { name: "JavaScript", level: "advanced" },
      { name: "React", level: "intermediate" },
      { name: "Node.js", level: "intermediate" },
    ],
    preferredTechnologies: ["React", "Docker"],
    careerGoalTechnologies: ["Docker"],
    difficulty: { preferred: "intermediate", min: "beginner", max: "advanced" },
    ...overrides,
  };
}

export function makeIssue(overrides: Partial<IssueCandidate> = {}): IssueCandidate {
  return {
    id: "issue-1",
    title: "Add Docker support to the development environment",
    description: MEANINGFUL_DESCRIPTION,
    technologies: ["Node.js", "Docker"],
    maintainerPreferredSkills: [],
    difficulty: "intermediate",
    state: "open",
    isAssigned: false,
    isBlocked: false,
    hasActivePullRequest: false,
    allowsExternalContributors: true,
    updatedAt: daysBefore(5),
    clarityScore: 0.8,
    repository: {
      isActive: true,
      activityScore: 0.9,
      maintainerResponsivenessScore: 0.75,
      hasContributionManifest: false,
    },
    ...overrides,
  };
}
