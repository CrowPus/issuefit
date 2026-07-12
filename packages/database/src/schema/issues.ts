import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { issueDifficultyEnum } from "./career-goals.js";
import { repositories } from "./repositories.js";

export const issueStateEnum = pgEnum("issue_state", ["open", "closed"]);

/**
 * A synced issue from a curated repository. `difficulty` and
 * `clarityScore` come from @issuefit/issue-health's label/description
 * heuristics; `hasActivePullRequest` is measured from the issue's
 * timeline cross-references during sync (ADR-0015).
 * `allowsExternalContributors` falls back to admin curation when no valid
 * manifest exists; valid manifests make the signal maintainer-declared
 * during issue sync and recommendation mapping (ADR-0016).
 */
export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    githubIssueId: bigint("github_issue_id", { mode: "number" }).notNull().unique(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    labels: text("labels").array().notNull().default([]),
    state: issueStateEnum("state").notNull(),
    difficulty: issueDifficultyEnum("difficulty").notNull(),
    clarityScore: real("clarity_score").notNull(),
    isBlocked: boolean("is_blocked").notNull(),
    isAssigned: boolean("is_assigned").notNull(),
    hasActivePullRequest: boolean("has_active_pull_request").notNull().default(false),
    allowsExternalContributors: boolean("allows_external_contributors").notNull().default(true),
    commentsCount: integer("comments_count").notNull(),
    htmlUrl: text("html_url").notNull(),
    githubCreatedAt: timestamp("github_created_at", { withTimezone: true }).notNull(),
    githubUpdatedAt: timestamp("github_updated_at", { withTimezone: true }).notNull(),
    githubClosedAt: timestamp("github_closed_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("issues_repository_id_idx").on(table.repositoryId)],
);

export type IssueRecord = typeof issues.$inferSelect;
export type NewIssueRecord = typeof issues.$inferInsert;
