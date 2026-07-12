import { and, eq } from "drizzle-orm";

import type { Database } from "./client.js";
import {
  recommendationDigestDeliveries,
  type NewRecommendationDigestDeliveryRecord,
  type RecommendationDigestDeliveryRecord,
} from "./schema/index.js";

export type SaveRecommendationDigestDeliveryInput = Omit<
  NewRecommendationDigestDeliveryRecord,
  "id" | "createdAt" | "updatedAt"
>;

/** Existing delivery record for this user and weekly period, if any. */
export async function findRecommendationDigestDelivery(
  db: Database,
  userId: string,
  periodStartedAt: Date,
): Promise<RecommendationDigestDeliveryRecord | null> {
  const [row] = await db
    .select()
    .from(recommendationDigestDeliveries)
    .where(
      and(
        eq(recommendationDigestDeliveries.userId, userId),
        eq(recommendationDigestDeliveries.periodStartedAt, periodStartedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Upserts a weekly digest delivery outcome. Failed attempts can be replaced
 * by a later sent/skipped outcome for the same period; sent/skipped records
 * are what the worker treats as complete (ADR-0022).
 */
export async function saveRecommendationDigestDelivery(
  db: Database,
  input: SaveRecommendationDigestDeliveryInput,
): Promise<void> {
  const now = new Date();
  await db
    .insert(recommendationDigestDeliveries)
    .values(input)
    .onConflictDoUpdate({
      target: [
        recommendationDigestDeliveries.userId,
        recommendationDigestDeliveries.periodStartedAt,
      ],
      set: {
        periodEndedAt: input.periodEndedAt,
        deliveryMode: input.deliveryMode,
        recommendationCount: input.recommendationCount,
        status: input.status,
        errorMessage: input.errorMessage,
        deliveredAt: input.deliveredAt,
        updatedAt: now,
      },
    });
}
