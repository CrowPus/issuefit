import type { CareerGoalRecord } from "@issuefit/database";
import { careerGoalTechnologies } from "@issuefit/recommendations/career-goal";
import { issueTypePreferenceSchema } from "@issuefit/skills";
import type {
  CareerGoalOption,
  IssueDifficultyPreference,
  IssueTypePreference,
} from "@issuefit/skills";

export const careerGoalLabels: Record<CareerGoalOption, string> = {
  backend_developer: "Become a backend developer",
  frontend_developer: "Become a frontend developer",
  fullstack_developer: "Become a full-stack developer",
  devops: "Improve DevOps skills",
  mobile_developer: "Become a mobile developer",
  open_source_collaboration: "Learn open-source collaboration",
  other: "Other",
};

export const issueTypeLabels: Record<IssueTypePreference, string> = {
  bug_fix: "Bug fixes",
  feature: "New features",
  documentation: "Documentation",
  testing: "Testing",
  refactor: "Refactoring",
};

export { careerGoalTechnologies };

/** Presentation-layer shape for the form — never pass the ORM record directly into components. */
export interface CareerGoalFormValue {
  goal: CareerGoalOption;
  goalDetails: string;
  preferredLanguages: string[];
  preferredIssueTypes: IssueTypePreference[];
  hoursPerWeek: number;
  difficulty: IssueDifficultyPreference;
}

/** Defensively re-validates array columns read back from Postgres. */
function parseStoredIssueTypes(values: readonly string[]): IssueTypePreference[] {
  return values.filter(
    (value): value is IssueTypePreference => issueTypePreferenceSchema.safeParse(value).success,
  );
}

export function toCareerGoalFormValue(record: CareerGoalRecord | null): CareerGoalFormValue {
  if (record === null) {
    return {
      goal: "open_source_collaboration",
      goalDetails: "",
      preferredLanguages: [],
      preferredIssueTypes: [],
      hoursPerWeek: 5,
      difficulty: "beginner",
    };
  }
  return {
    goal: record.goal,
    goalDetails: record.goalDetails ?? "",
    preferredLanguages: record.preferredLanguages,
    preferredIssueTypes: parseStoredIssueTypes(record.preferredIssueTypes),
    hoursPerWeek: record.hoursPerWeek,
    difficulty: record.difficulty,
  };
}
