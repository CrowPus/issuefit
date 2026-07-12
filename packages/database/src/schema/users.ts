import { bigint, boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profileVisibilityEnum = pgEnum("profile_visibility", ["private", "public"]);

export type ProfileVisibility = (typeof profileVisibilityEnum.enumValues)[number];

/**
 * One row per developer. Also serves as the better-auth user model; the
 * `name`, `email`, `emailVerified`, and `image` properties follow better-auth's
 * required field names (columns stay snake_case). GitHub identity fields are
 * populated at sign-in from the GitHub profile.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubUserId: bigint("github_user_id", { mode: "number" }).notNull().unique(),
  githubUsername: text("github_username").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("avatar_url"),
  profileVisibility: profileVisibilityEnum("profile_visibility").notNull().default("private"),
  weeklyDigestEmailEnabled: boolean("weekly_digest_email_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
