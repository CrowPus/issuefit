import {
  boolean,
  index,
  pgEnum,
  pgTable,
  real,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { skills } from "./skills.js";
import { users } from "./users.js";

export const skillLevelEnum = pgEnum("skill_level", ["beginner", "intermediate", "advanced"]);
export const skillSourceEnum = pgEnum("skill_source", ["github_sync", "manual"]);
export type SkillLevelValue = (typeof skillLevelEnum.enumValues)[number];

/**
 * A developer's level in one skill. Rows proposed by the GitHub-derived
 * inference (source "github_sync") are safe to overwrite on the next sync;
 * once a user edits a row (source becomes "manual", userConfirmed true) it
 * must never be silently overwritten again — see ADR-0008.
 */
export const userSkills = pgTable(
  "user_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    level: skillLevelEnum("level").notNull(),
    confidenceScore: real("confidence_score").notNull(),
    source: skillSourceEnum("source").notNull(),
    userConfirmed: boolean("user_confirmed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_skills_user_skill_idx").on(table.userId, table.skillId),
    index("user_skills_user_id_idx").on(table.userId),
  ],
);

export type UserSkillRecord = typeof userSkills.$inferSelect;
export type NewUserSkillRecord = typeof userSkills.$inferInsert;
