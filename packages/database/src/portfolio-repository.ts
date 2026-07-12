import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  contributions,
  portfolioEntries,
  recommendations,
  users,
  type ContributionRecord,
  type PortfolioEntryRecord,
  type RecommendationRecord,
  type UserRecord,
} from "./schema/index.js";

export interface PortfolioEntryDetail {
  entry: PortfolioEntryRecord;
  contribution: ContributionRecord;
  recommendation: RecommendationRecord;
}

/** Portfolio-entry ids owned by this user (entry → contribution → recommendation.userId). */
function ownedEntryIds(db: Database, userId: string, entryId: string) {
  return db
    .select({ id: portfolioEntries.id })
    .from(portfolioEntries)
    .innerJoin(contributions, eq(portfolioEntries.contributionId, contributions.id))
    .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
    .where(and(eq(portfolioEntries.id, entryId), eq(recommendations.userId, userId)));
}

/** All of this user's portfolio entries with their contribution and snapshot, newest first. */
export async function listPortfolioEntriesForUser(
  db: Database,
  userId: string,
): Promise<PortfolioEntryDetail[]> {
  return db
    .select({
      entry: portfolioEntries,
      contribution: contributions,
      recommendation: recommendations,
    })
    .from(portfolioEntries)
    .innerJoin(contributions, eq(portfolioEntries.contributionId, contributions.id))
    .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
    .where(eq(recommendations.userId, userId))
    .orderBy(desc(portfolioEntries.createdAt));
}

export interface PortfolioEntryUpdate {
  title: string;
  summary: string | null;
  skillsDemonstrated: string[];
  reviewRounds: number | null;
}

/** Edits a portfolio entry the user owns. Returns false when not owned or missing. */
export async function updatePortfolioEntry(
  db: Database,
  userId: string,
  entryId: string,
  update: PortfolioEntryUpdate,
): Promise<boolean> {
  const updated = await db
    .update(portfolioEntries)
    .set({ ...update, updatedAt: new Date() })
    .where(inArray(portfolioEntries.id, ownedEntryIds(db, userId, entryId)))
    .returning({ id: portfolioEntries.id });
  return updated.length > 0;
}

/** Toggles a single entry's public visibility (owner only). */
export async function setPortfolioEntryPublic(
  db: Database,
  userId: string,
  entryId: string,
  isPublic: boolean,
): Promise<boolean> {
  const updated = await db
    .update(portfolioEntries)
    .set({ isPublic, updatedAt: new Date() })
    .where(inArray(portfolioEntries.id, ownedEntryIds(db, userId, entryId)))
    .returning({ id: portfolioEntries.id });
  return updated.length > 0;
}

export interface PublicPortfolio {
  user: UserRecord;
  entries: PortfolioEntryDetail[];
}

/**
 * The public portfolio for a username: null unless the user exists AND has
 * opted their profile public. Lists only entries the user marked public, so
 * both opt-in levels must be satisfied (ADR-0019).
 */
export async function findPublicPortfolioByUsername(
  db: Database,
  githubUsername: string,
): Promise<PublicPortfolio | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.githubUsername}) = lower(${githubUsername})`)
    .limit(1);
  if (user === undefined || user.profileVisibility !== "public") {
    return null;
  }

  const entries = await db
    .select({
      entry: portfolioEntries,
      contribution: contributions,
      recommendation: recommendations,
    })
    .from(portfolioEntries)
    .innerJoin(contributions, eq(portfolioEntries.contributionId, contributions.id))
    .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
    .where(and(eq(recommendations.userId, user.id), eq(portfolioEntries.isPublic, true)))
    .orderBy(desc(portfolioEntries.createdAt));
  return { user, entries };
}
