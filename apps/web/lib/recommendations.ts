import {
  getRecommendationsForUser as getRecommendationsForUserFromDatabase,
  type RecommendationsResult,
} from "@issuefit/recommendations";

import { getDb } from "./db";
export {
  buildDeveloperProfile,
  excludeNegativelyRated,
  toIssueCandidate,
} from "@issuefit/recommendations";
export type { Recommendation, RecommendationsResult } from "@issuefit/recommendations";

/**
 * Computed live on every call — the engine is pure and in-memory, so unlike
 * GitHub/issue sync there is no API cost to justify caching or a manual
 * "Generate" action (see ADR-0012). Always reflects the latest skills,
 * career goal, and curated issues.
 */
export async function getRecommendationsForUser(userId: string): Promise<RecommendationsResult> {
  return getRecommendationsForUserFromDatabase(getDb(), userId);
}
