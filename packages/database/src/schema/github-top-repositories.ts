import { bigint, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Cached "most starred on GitHub" list for the public rankings page
 * (ADR-0021). Replaced wholesale by a lazy refresh when older than the
 * documented staleness window; `fetchedAt` is shown to visitors so the
 * data's age is never hidden. M7's weekly worker will take over the
 * refresh.
 */
export const githubTopRepositories = pgTable(
  "github_top_repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rank: integer("rank").notNull(),
    githubRepositoryId: bigint("github_repository_id", { mode: "number" }).notNull(),
    fullName: text("full_name").notNull(),
    description: text("description"),
    primaryLanguage: text("primary_language"),
    starsCount: integer("stars_count").notNull(),
    htmlUrl: text("html_url").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("github_top_repositories_rank_idx").on(table.rank)],
);

export type GithubTopRepositoryRecord = typeof githubTopRepositories.$inferSelect;
export type NewGithubTopRepositoryRecord = typeof githubTopRepositories.$inferInsert;
