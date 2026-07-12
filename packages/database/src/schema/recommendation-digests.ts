import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const recommendationDigestDeliveryStatusEnum = pgEnum(
  "recommendation_digest_delivery_status",
  ["sent", "skipped", "failed"],
);

export type RecommendationDigestDeliveryStatus =
  (typeof recommendationDigestDeliveryStatusEnum.enumValues)[number];

/**
 * One weekly digest delivery attempt per opted-in user and period. This is
 * the worker's idempotency ledger: a restarted worker can recompute safely
 * without sending duplicate weekly digests for the same period (ADR-0022).
 */
export const recommendationDigestDeliveries = pgTable(
  "recommendation_digest_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodStartedAt: timestamp("period_started_at", { withTimezone: true }).notNull(),
    periodEndedAt: timestamp("period_ended_at", { withTimezone: true }).notNull(),
    deliveryMode: text("delivery_mode").notNull(),
    recommendationCount: integer("recommendation_count").notNull(),
    status: recommendationDigestDeliveryStatusEnum("status").notNull(),
    errorMessage: text("error_message"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("recommendation_digest_user_period_idx").on(table.userId, table.periodStartedAt),
    index("recommendation_digest_user_id_idx").on(table.userId),
  ],
);

export type RecommendationDigestDeliveryRecord = typeof recommendationDigestDeliveries.$inferSelect;
export type NewRecommendationDigestDeliveryRecord =
  typeof recommendationDigestDeliveries.$inferInsert;
