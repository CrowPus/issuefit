import { parseEnv, workerEnvSchema } from "@issuefit/config";
import { createDatabaseClient } from "@issuefit/database";
import { pino } from "pino";

import { createEmailDelivery } from "./email-delivery.js";
import { createDatabaseWeeklyDigestPorts, runWeeklyRecommendationDigest } from "./weekly-digest.js";

const HEARTBEAT_INTERVAL_MS = 60_000;

const env = parseEnv(workerEnvSchema, process.env);
const logger = pino({ level: env.LOG_LEVEL });
const database = createDatabaseClient(env.DATABASE_URL);
const emailDelivery = createEmailDelivery(env, logger);

function start(): void {
  logger.info(
    {
      event: "worker.started",
      nodeEnv: env.NODE_ENV,
      weeklyDigestEnabled: env.WEEKLY_DIGEST_ENABLED,
      emailDeliveryMode: emailDelivery.mode,
    },
    "worker started",
  );

  const intervals: NodeJS.Timeout[] = [];
  let digestRunning = false;

  async function runDigest(): Promise<void> {
    if (digestRunning) {
      logger.warn(
        { event: "weekly_digest.skipped_concurrent_run" },
        "weekly digest already running",
      );
      return;
    }

    digestRunning = true;
    logger.info({ event: "weekly_digest.started" }, "weekly digest started");
    try {
      const summary = await runWeeklyRecommendationDigest(
        createDatabaseWeeklyDigestPorts(database.db, emailDelivery),
        {
          deliveryMode: emailDelivery.mode,
          from: env.EMAIL_FROM,
        },
      );
      logger.info({ event: "weekly_digest.completed", ...summary }, "weekly digest completed");
    } catch (error) {
      logger.error(
        { event: "weekly_digest.failed", error },
        "weekly digest failed before completing",
      );
    } finally {
      digestRunning = false;
    }
  }

  const heartbeat = setInterval(() => {
    logger.debug({ event: "worker.heartbeat" }, "worker heartbeat");
  }, HEARTBEAT_INTERVAL_MS);
  intervals.push(heartbeat);

  if (env.WEEKLY_DIGEST_ENABLED) {
    const digestInterval = setInterval(
      () => {
        void runDigest();
      },
      env.WEEKLY_DIGEST_INTERVAL_HOURS * 60 * 60 * 1000,
    );
    intervals.push(digestInterval);

    if (env.WEEKLY_DIGEST_RUN_ON_START) {
      void runDigest();
    }
  }

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info({ event: "worker.stopping", signal }, "worker shutting down");
    for (const interval of intervals) {
      clearInterval(interval);
    }
    void database.close();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

start();
