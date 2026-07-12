import {
  bigint,
  index,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const recommendationFeedbackVerdictEnum = pgEnum("recommendation_feedback_verdict", [
  "good_match",
  "too_difficult",
  "too_easy",
  "not_interested",
  "wrong_technology",
  "issue_unavailable",
]);

export type RecommendationFeedbackVerdict =
  (typeof recommendationFeedbackVerdictEnum.enumValues)[number];

/**
 * A recommendation the user acted on, persisted at feedback time (later
 * also at "start contribution" time) — never at render time; live
 * computation stays as in ADR-0012. Keys on the stable GitHub issue id
 * and snapshots display fields because issue sync replaces `issues` rows
 * wholesale, so their UUIDs do not survive a re-sync (ADR-0014).
 */
export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    githubIssueId: bigint("github_issue_id", { mode: "number" }).notNull(),
    repositoryFullName: text("repository_full_name").notNull(),
    issueTitle: text("issue_title").notNull(),
    issueHtmlUrl: text("issue_html_url").notNull(),
    /** Null when the issue was excluded or unscorable at persist time (ADR-0014). */
    matchScore: real("match_score"),
    matchReasons: text("match_reasons").array().notNull().default([]),
    /** Engine scoring-config version that produced `matchScore`; null with it. */
    scoreVersion: text("score_version"),
    recommendedAt: timestamp("recommended_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("recommendations_user_issue_idx").on(table.userId, table.githubIssueId),
    index("recommendations_user_id_idx").on(table.userId),
  ],
);

/**
 * The user's verdict on one persisted recommendation. One row per
 * recommendation; a changed verdict overwrites the previous one
 * (no verdict history in the MVP — ADR-0014).
 */
export const recommendationFeedback = pgTable(
  "recommendation_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recommendationId: uuid("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    verdict: recommendationFeedbackVerdictEnum("verdict").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("recommendation_feedback_recommendation_idx").on(table.recommendationId)],
);

export type RecommendationRecord = typeof recommendations.$inferSelect;
export type NewRecommendationRecord = typeof recommendations.$inferInsert;
export type RecommendationFeedbackRecord = typeof recommendationFeedback.$inferSelect;
export type NewRecommendationFeedbackRecord = typeof recommendationFeedback.$inferInsert;
