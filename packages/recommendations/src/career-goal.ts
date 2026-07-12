import type { CareerGoalOption } from "@issuefit/skills";

/**
 * Representative technologies for each career goal, feeding the
 * recommendation engine's 5%-weight careerGoalMatch component (ADR-0012).
 * Deliberately coarse: a fixed, documented simplification, not a claim
 * about what any specific issue needs. "open_source_collaboration" and
 * "other" get no technologies because neither implies a technology bias.
 */
export const careerGoalTechnologies: Record<CareerGoalOption, string[]> = {
  backend_developer: ["Node.js", "Python", "Go", "Java", "PostgreSQL"],
  frontend_developer: ["TypeScript", "JavaScript", "React", "Vue", "CSS"],
  fullstack_developer: ["TypeScript", "JavaScript", "React", "Node.js", "PostgreSQL"],
  devops: ["Docker", "Shell", "HCL", "Go", "Python"],
  mobile_developer: ["Swift", "Kotlin", "Dart", "Java"],
  open_source_collaboration: [],
  other: [],
};
