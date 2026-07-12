import { pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

/**
 * Every skill name currently comes from GitHub's per-repository primary
 * language field ("language"), or from a user typing one in manually.
 * Broader categories (frameworks, practices such as Testing or
 * Documentation) require deeper repository analysis not yet implemented.
 */
export const skillCategoryEnum = pgEnum("skill_category", ["language"]);

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  category: skillCategoryEnum("category").notNull().default("language"),
});

export type SkillRecord = typeof skills.$inferSelect;
export type NewSkillRecord = typeof skills.$inferInsert;
