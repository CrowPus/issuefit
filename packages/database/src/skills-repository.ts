import { and, eq, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  careerGoals,
  skills,
  userSkills,
  type CareerGoalRecord,
  type NewCareerGoalRecord,
  type SkillLevelValue,
  type UserSkillRecord,
} from "./schema/index.js";

/**
 * Finds or creates a skill row per name in one round trip, returning each
 * name's id. Safe to call with names that already exist.
 */
export async function ensureSkills(
  db: Database,
  names: readonly string[],
): Promise<Map<string, string>> {
  if (names.length === 0) {
    return new Map();
  }
  const rows = await db
    .insert(skills)
    .values(names.map((name) => ({ name })))
    .onConflictDoUpdate({ target: skills.name, set: { name: sql`excluded.name` } })
    .returning({ id: skills.id, name: skills.name });
  return new Map(rows.map((row) => [row.name, row.id]));
}

export interface ProposedUserSkill {
  skillId: string;
  level: SkillLevelValue;
  confidenceScore: number;
}

/**
 * Inserts or refreshes GitHub-derived skill proposals. A row the user has
 * already confirmed (edited manually) is never overwritten by this call —
 * see ADR-0008.
 */
export async function upsertProposedUserSkills(
  db: Database,
  userId: string,
  proposals: readonly ProposedUserSkill[],
): Promise<void> {
  if (proposals.length === 0) {
    return;
  }
  await db
    .insert(userSkills)
    .values(
      proposals.map((proposal) => ({
        userId,
        skillId: proposal.skillId,
        level: proposal.level,
        confidenceScore: proposal.confidenceScore,
        source: "github_sync" as const,
        userConfirmed: false,
      })),
    )
    .onConflictDoUpdate({
      target: [userSkills.userId, userSkills.skillId],
      set: {
        level: sql`excluded.level`,
        confidenceScore: sql`excluded.confidence_score`,
        source: "github_sync",
        updatedAt: sql`now()`,
      },
      setWhere: eq(userSkills.userConfirmed, false),
    });
}

/** A user explicitly setting or confirming a skill level always wins. */
export async function setUserSkillLevel(
  db: Database,
  userId: string,
  skillId: string,
  level: SkillLevelValue,
): Promise<void> {
  await db
    .insert(userSkills)
    .values({
      userId,
      skillId,
      level,
      confidenceScore: 1,
      source: "manual",
      userConfirmed: true,
    })
    .onConflictDoUpdate({
      target: [userSkills.userId, userSkills.skillId],
      set: {
        level,
        confidenceScore: 1,
        source: "manual",
        userConfirmed: true,
        updatedAt: sql`now()`,
      },
    });
}

export interface UserSkillWithName extends UserSkillRecord {
  name: string;
}

export async function listUserSkillsWithNames(
  db: Database,
  userId: string,
): Promise<UserSkillWithName[]> {
  const rows = await db
    .select({ userSkill: userSkills, name: skills.name })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, userId))
    .orderBy(skills.name);
  return rows.map((row) => ({ ...row.userSkill, name: row.name }));
}

export async function findUserSkillById(
  db: Database,
  userId: string,
  skillId: string,
): Promise<UserSkillRecord | null> {
  const [row] = await db
    .select()
    .from(userSkills)
    .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)))
    .limit(1);
  return row ?? null;
}

export async function upsertCareerGoal(db: Database, goal: NewCareerGoalRecord): Promise<void> {
  await db
    .insert(careerGoals)
    .values(goal)
    .onConflictDoUpdate({ target: careerGoals.userId, set: { ...goal, updatedAt: sql`now()` } });
}

export async function findCareerGoalByUserId(
  db: Database,
  userId: string,
): Promise<CareerGoalRecord | null> {
  const [row] = await db.select().from(careerGoals).where(eq(careerGoals.userId, userId)).limit(1);
  return row ?? null;
}
