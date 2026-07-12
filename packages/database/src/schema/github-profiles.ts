import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users.js";

/**
 * Synchronised snapshot of a user's public GitHub profile, kept separate
 * from `users` (the auth model) so auth stays independent of sync data.
 * `syncedAt` records when this snapshot was taken, per GUIDLINE.md §11.
 */
export const githubProfiles = pgTable("github_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  company: text("company"),
  location: text("location"),
  blog: text("blog"),
  publicRepos: integer("public_repos").notNull(),
  followers: integer("followers").notNull(),
  following: integer("following").notNull(),
  githubCreatedAt: timestamp("github_created_at", { withTimezone: true }),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
});

export type GithubProfileRecord = typeof githubProfiles.$inferSelect;
export type NewGithubProfileRecord = typeof githubProfiles.$inferInsert;
