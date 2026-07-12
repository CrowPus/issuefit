import { and, eq, ne, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  careerGoals,
  contributions,
  portfolioEntries,
  recommendationFeedback,
  recommendations,
  repositories,
  users,
} from "./schema/index.js";

export interface BetaAnalytics {
  totalUsers: number;
  onboardingCompleteUsers: number;
  usersWithPersistedRecommendations: number;
  usersWithUsefulFeedback: number;
  usersWithSelectedContribution: number;
  usersWorking: number;
  usersWithPullRequest: number;
  usersMerged: number;
  publicPortfolioEntries: number;
  maintainerApprovedRepositories: number;
}

async function countRows(statement: PromiseLike<readonly { count: number }[]>): Promise<number> {
  const [row] = await statement;
  return row?.count ?? 0;
}

export async function getBetaAnalytics(db: Database): Promise<BetaAnalytics> {
  const [
    totalUsers,
    onboardingCompleteUsers,
    usersWithPersistedRecommendations,
    usersWithUsefulFeedback,
    usersWithSelectedContribution,
    usersWorking,
    usersWithPullRequest,
    usersMerged,
    publicPortfolioEntries,
    maintainerApprovedRepositories,
  ] = await Promise.all([
    countRows(db.select({ count: sql<number>`count(*)::int` }).from(users)),
    countRows(
      db
        .select({ count: sql<number>`count(distinct ${users.id})::int` })
        .from(users)
        .innerJoin(careerGoals, eq(careerGoals.userId, users.id))
        .where(sql`exists (select 1 from user_skills where user_skills.user_id = ${users.id})`),
    ),
    countRows(
      db
        .select({ count: sql<number>`count(distinct ${recommendations.userId})::int` })
        .from(recommendations),
    ),
    countRows(
      db
        .select({ count: sql<number>`count(distinct ${recommendations.userId})::int` })
        .from(recommendationFeedback)
        .innerJoin(recommendations, eq(recommendationFeedback.recommendationId, recommendations.id))
        .where(eq(recommendationFeedback.verdict, "good_match")),
    ),
    countRows(
      db
        .select({ count: sql<number>`count(distinct ${recommendations.userId})::int` })
        .from(contributions)
        .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id)),
    ),
    countRows(
      db
        .select({ count: sql<number>`count(distinct ${recommendations.userId})::int` })
        .from(contributions)
        .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
        .where(ne(contributions.status, "selected")),
    ),
    countRows(
      db
        .select({ count: sql<number>`count(distinct ${recommendations.userId})::int` })
        .from(contributions)
        .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
        .where(
          sql`${contributions.prUrl} is not null or ${contributions.status} in ('pr_opened', 'changes_requested', 'merged')`,
        ),
    ),
    countRows(
      db
        .select({ count: sql<number>`count(distinct ${recommendations.userId})::int` })
        .from(contributions)
        .innerJoin(recommendations, eq(contributions.recommendationId, recommendations.id))
        .where(eq(contributions.status, "merged")),
    ),
    countRows(
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(portfolioEntries)
        .where(eq(portfolioEntries.isPublic, true)),
    ),
    countRows(
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(repositories)
        .where(
          and(
            eq(repositories.manifestStatus, "valid"),
            eq(repositories.manifestExternalContributions, true),
            eq(repositories.manifestAcceptingContributors, true),
            eq(repositories.approved, true),
          ),
        ),
    ),
  ]);

  return {
    totalUsers,
    onboardingCompleteUsers,
    usersWithPersistedRecommendations,
    usersWithUsefulFeedback,
    usersWithSelectedContribution,
    usersWorking,
    usersWithPullRequest,
    usersMerged,
    publicPortfolioEntries,
    maintainerApprovedRepositories,
  };
}
