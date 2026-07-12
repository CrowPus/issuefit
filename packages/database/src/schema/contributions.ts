import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { recommendations } from "./recommendations.js";

/**
 * The contribution lifecycle, in order.
 * `merged`, `closed`, and `abandoned` are terminal — reaching one stamps
 * `completedAt` (ADR-0018). The MVP is manual-first: statuses are set by
 * the developer with no enforced transition graph; webhooks automate this
 * later without a schema change.
 */
export const contributionStatusEnum = pgEnum("contribution_status", [
  "selected",
  "preparing",
  "working",
  "pr_opened",
  "changes_requested",
  "merged",
  "closed",
  "abandoned",
]);

export type ContributionStatus = (typeof contributionStatusEnum.enumValues)[number];

/**
 * A contribution a developer has started on a recommended issue. One row
 * per persisted recommendation (unique `recommendationId`), so the stable
 * snapshot — repository, issue title/URL, score — lives on the linked
 * `recommendations` row keyed by the stable GitHub issue id (ADR-0014,
 * ADR-0018).
 */
export const contributions = pgTable(
  "contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recommendationId: uuid("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    status: contributionStatusEnum("status").notNull().default("selected"),
    /**
     * The user's profile skills that the issue's technologies exercise,
     * captured at start time — the issue is usually gone from sync by merge
     * (open-issues-only sync), so demonstrated skills must be frozen early
     * for the portfolio entry (ADR-0019).
     */
    skillsDemonstrated: text("skills_demonstrated").array().notNull().default([]),
    /** The contributor's pull request, once opened; null until then. */
    prUrl: text("pr_url"),
    /** The working branch name, if the developer records one; null otherwise. */
    branchName: text("branch_name"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    /** Set when the status becomes terminal (merged/closed/abandoned); null otherwise. */
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("contributions_recommendation_idx").on(table.recommendationId)],
);

export type ContributionRecord = typeof contributions.$inferSelect;
export type NewContributionRecord = typeof contributions.$inferInsert;
