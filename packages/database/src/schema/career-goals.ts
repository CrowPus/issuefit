import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const careerGoalOptionEnum = pgEnum("career_goal_option", [
  "backend_developer",
  "frontend_developer",
  "fullstack_developer",
  "devops",
  "mobile_developer",
  "open_source_collaboration",
  "other",
]);

/**
 * Separate from `skill_level`: on `career_goals` this represents a
 * preference, not an assessed skill, even though the values happen to
 * coincide. Also reused on `issues.difficulty`, where it represents an
 * actual (heuristically estimated) rating — same concept, different role.
 */
export const issueDifficultyEnum = pgEnum("issue_difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

/**
 * One row per user (an editable settings form, not a history). Array
 * columns are validated at the API boundary with Zod
 * (@issuefit/skills' careerGoalInputSchema) rather than as Postgres enum
 * arrays, keeping the schema simple.
 */
export const careerGoals = pgTable("career_goals", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  goal: careerGoalOptionEnum("goal").notNull(),
  goalDetails: text("goal_details"),
  preferredLanguages: text("preferred_languages").array().notNull().default([]),
  preferredIssueTypes: text("preferred_issue_types").array().notNull().default([]),
  hoursPerWeek: integer("hours_per_week").notNull(),
  difficulty: issueDifficultyEnum("difficulty").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CareerGoalRecord = typeof careerGoals.$inferSelect;
export type NewCareerGoalRecord = typeof careerGoals.$inferInsert;
