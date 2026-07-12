import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

/**
 * A public repository as last observed on GitHub for a given user. Raw
 * synchronised data only — difficulty, clarity, and health scoring belong to
 * the repository/issue domain (a later milestone), not this sync table.
 */
export const githubRepositories = pgTable(
  "github_repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    githubRepositoryId: bigint("github_repository_id", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    description: text("description"),
    primaryLanguage: text("primary_language"),
    stargazersCount: integer("stargazers_count").notNull(),
    forksCount: integer("forks_count").notNull(),
    isFork: boolean("is_fork").notNull(),
    htmlUrl: text("html_url").notNull(),
    pushedAt: timestamp("pushed_at", { withTimezone: true }),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("github_repositories_user_repo_idx").on(table.userId, table.githubRepositoryId),
    index("github_repositories_user_id_idx").on(table.userId),
  ],
);

export type GithubRepositoryRecord = typeof githubRepositories.$inferSelect;
export type NewGithubRepositoryRecord = typeof githubRepositories.$inferInsert;
