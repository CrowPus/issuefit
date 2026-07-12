import { bigint, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users.js";

/**
 * One row per GitHub App installation a user has connected.
 * `permissions` stores the permission set granted at install time
 * (e.g. { "contents": "read" }) so permission changes can be detected on sync.
 */
export const githubInstallations = pgTable("github_installations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  installationId: bigint("installation_id", { mode: "number" }).notNull().unique(),
  permissions: jsonb("permissions").$type<Record<string, string>>().notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GithubInstallationRecord = typeof githubInstallations.$inferSelect;
export type NewGithubInstallationRecord = typeof githubInstallations.$inferInsert;
