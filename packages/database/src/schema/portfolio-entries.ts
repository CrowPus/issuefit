import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { contributions } from "./contributions.js";

/**
 * A verified portfolio entry generated from a merged contribution
 * (ADR-0019). One row per contribution; created automatically when the
 * contribution reaches `merged`, from structured data only — never written
 * by an AI. `isPublic` and the user's `profileVisibility` together gate what
 * a public profile shows (both must opt in).
 */
export const portfolioEntries = pgTable(
  "portfolio_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contributionId: uuid("contribution_id")
      .notNull()
      .references(() => contributions.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** Developer-written summary; null until they add one (no AI text). */
    summary: text("summary"),
    /** Skills the contribution demonstrated, copied from the contribution at merge. */
    skillsDemonstrated: text("skills_demonstrated").array().notNull().default([]),
    /**
     * Number of review rounds. Developer-entered: the MVP keeps no status
     * history to derive it from (ADR-0019); null until set.
     */
    reviewRounds: integer("review_rounds"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("portfolio_entries_contribution_idx").on(table.contributionId)],
);

export type PortfolioEntryRecord = typeof portfolioEntries.$inferSelect;
export type NewPortfolioEntryRecord = typeof portfolioEntries.$inferInsert;
