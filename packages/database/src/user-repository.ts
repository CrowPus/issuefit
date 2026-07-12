import { eq, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import { users, type ProfileVisibility, type UserRecord } from "./schema/users.js";

export async function findUserById(db: Database, id: string): Promise<UserRecord | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

/** Case-insensitive lookup by GitHub username (usernames are unique on GitHub). */
export async function findUserByGithubUsername(
  db: Database,
  githubUsername: string,
): Promise<UserRecord | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.githubUsername}) = lower(${githubUsername})`)
    .limit(1);
  return user ?? null;
}

/** Sets whether the user's public profile page is visible at all (ADR-0019). */
export async function setProfileVisibility(
  db: Database,
  userId: string,
  visibility: ProfileVisibility,
): Promise<void> {
  await db
    .update(users)
    .set({ profileVisibility: visibility, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Enables or disables the weekly recommendation digest email for one user (ADR-0022). */
export async function setWeeklyDigestEmailPreference(
  db: Database,
  userId: string,
  enabled: boolean,
): Promise<void> {
  await db
    .update(users)
    .set({ weeklyDigestEmailEnabled: enabled, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Every user who explicitly opted into weekly recommendation digests. */
export async function listWeeklyDigestRecipients(db: Database): Promise<UserRecord[]> {
  return db
    .select()
    .from(users)
    .where(eq(users.weeklyDigestEmailEnabled, true))
    .orderBy(users.createdAt);
}
