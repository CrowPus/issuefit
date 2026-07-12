import {
  findRecommendationDigestDelivery,
  listWeeklyDigestRecipients,
  saveRecommendationDigestDelivery,
  type Database,
  type RecommendationDigestDeliveryRecord,
  type SaveRecommendationDigestDeliveryInput,
} from "@issuefit/database";
import {
  getRecommendationsForUser,
  type Recommendation,
  type RecommendationsResult,
} from "@issuefit/recommendations";

import type { EmailDelivery, EmailMessage } from "./email-delivery.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const COMPLETE_DELIVERY_STATUSES = new Set(["sent", "skipped"]);

export interface WeeklyDigestPeriod {
  periodStartedAt: Date;
  periodEndedAt: Date;
}

export interface DigestRecommendation {
  title: string;
  repositoryFullName: string;
  issueHtmlUrl: string;
  matchScore: number;
  reasons: string[];
}

export interface WeeklyDigestRecipient {
  id: string;
  email: string;
  name: string;
}

export interface WeeklyDigestPorts {
  listRecipients(): Promise<WeeklyDigestRecipient[]>;
  findDelivery(
    userId: string,
    periodStartedAt: Date,
  ): Promise<Pick<RecommendationDigestDeliveryRecord, "status"> | null>;
  getRecommendations(userId: string): Promise<RecommendationsResult>;
  saveDelivery(input: SaveRecommendationDigestDeliveryInput): Promise<void>;
  sendEmail(message: EmailMessage): Promise<void>;
}

export interface WeeklyDigestRunOptions {
  now?: Date;
  recommendationLimit?: number;
  deliveryMode: string;
  from: string;
}

export interface WeeklyDigestRunSummary {
  period: WeeklyDigestPeriod;
  recipients: number;
  sent: number;
  skipped: number;
  failed: number;
  alreadyDelivered: number;
}

export function getWeeklyDigestPeriod(now = new Date()): WeeklyDigestPeriod {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return {
    periodStartedAt: start,
    periodEndedAt: new Date(start.getTime() + WEEK_MS),
  };
}

export function toDigestRecommendations(
  result: RecommendationsResult,
  limit = 5,
): DigestRecommendation[] {
  return result.topRecommendations.slice(0, limit).map(recommendationToDigestRecommendation);
}

export function composeWeeklyDigestEmail({
  recipientName,
  recommendations,
  period,
}: {
  recipientName: string;
  recommendations: readonly DigestRecommendation[];
  period: WeeklyDigestPeriod;
}): Pick<EmailMessage, "subject" | "text" | "html"> {
  const periodLabel = `${period.periodStartedAt.toISOString().slice(0, 10)} to ${period.periodEndedAt
    .toISOString()
    .slice(0, 10)}`;
  const subject = `Your IssueFit weekly recommendations (${period.periodStartedAt
    .toISOString()
    .slice(0, 10)})`;
  const intro = `Hi ${recipientName}, here are your IssueFit recommendations for ${periodLabel}.`;
  const textItems = recommendations
    .map((recommendation, index) => {
      const reasons =
        recommendation.reasons.length === 0
          ? "No dominant reason available."
          : recommendation.reasons.join("; ");
      return `${index + 1}. ${recommendation.title}
   ${recommendation.repositoryFullName} — ${recommendation.matchScore}% match
   ${recommendation.issueHtmlUrl}
   Why: ${reasons}`;
    })
    .join("\n\n");
  const htmlItems = recommendations
    .map((recommendation) => {
      const reasons =
        recommendation.reasons.length === 0
          ? "No dominant reason available."
          : recommendation.reasons.join("; ");
      return `<li><p><a href="${escapeHtml(recommendation.issueHtmlUrl)}">${escapeHtml(
        recommendation.title,
      )}</a><br><strong>${escapeHtml(recommendation.repositoryFullName)}</strong> — ${
        recommendation.matchScore
      }% match<br><span>${escapeHtml(reasons)}</span></p></li>`;
    })
    .join("");

  return {
    subject,
    text: `${intro}

${textItems}

You can turn this digest off from your IssueFit profile.`,
    html: `<p>${escapeHtml(intro)}</p><ol>${htmlItems}</ol><p>You can turn this digest off from your IssueFit profile.</p>`,
  };
}

export function createDatabaseWeeklyDigestPorts(
  db: Database,
  emailDelivery: EmailDelivery,
): WeeklyDigestPorts {
  return {
    listRecipients: () => listWeeklyDigestRecipients(db),
    findDelivery: (userId, periodStartedAt) =>
      findRecommendationDigestDelivery(db, userId, periodStartedAt),
    getRecommendations: (userId) => getRecommendationsForUser(db, userId),
    saveDelivery: (input) => saveRecommendationDigestDelivery(db, input),
    sendEmail: (message) => emailDelivery.send(message),
  };
}

export async function runWeeklyRecommendationDigest(
  ports: WeeklyDigestPorts,
  options: WeeklyDigestRunOptions,
): Promise<WeeklyDigestRunSummary> {
  const now = options.now ?? new Date();
  const recommendationLimit = options.recommendationLimit ?? 5;
  const period = getWeeklyDigestPeriod(now);
  const recipients = await ports.listRecipients();
  const summary: WeeklyDigestRunSummary = {
    period,
    recipients: recipients.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    alreadyDelivered: 0,
  };

  for (const recipient of recipients) {
    const existing = await ports.findDelivery(recipient.id, period.periodStartedAt);
    if (existing !== null && COMPLETE_DELIVERY_STATUSES.has(existing.status)) {
      summary.alreadyDelivered += 1;
      continue;
    }

    try {
      const recommendations = toDigestRecommendations(
        await ports.getRecommendations(recipient.id),
        recommendationLimit,
      );
      if (recommendations.length === 0) {
        await ports.saveDelivery({
          userId: recipient.id,
          periodStartedAt: period.periodStartedAt,
          periodEndedAt: period.periodEndedAt,
          deliveryMode: options.deliveryMode,
          recommendationCount: 0,
          status: "skipped",
          errorMessage: null,
          deliveredAt: now,
        });
        summary.skipped += 1;
        continue;
      }

      const email = composeWeeklyDigestEmail({
        recipientName: recipient.name,
        recommendations,
        period,
      });
      await ports.sendEmail({
        from: options.from,
        to: recipient.email,
        toName: recipient.name,
        ...email,
      });
      await ports.saveDelivery({
        userId: recipient.id,
        periodStartedAt: period.periodStartedAt,
        periodEndedAt: period.periodEndedAt,
        deliveryMode: options.deliveryMode,
        recommendationCount: recommendations.length,
        status: "sent",
        errorMessage: null,
        deliveredAt: now,
      });
      summary.sent += 1;
    } catch (error) {
      await ports.saveDelivery({
        userId: recipient.id,
        periodStartedAt: period.periodStartedAt,
        periodEndedAt: period.periodEndedAt,
        deliveryMode: options.deliveryMode,
        recommendationCount: 0,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown digest failure",
        deliveredAt: null,
      });
      summary.failed += 1;
    }
  }

  return summary;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function recommendationToDigestRecommendation(
  recommendation: Recommendation,
): DigestRecommendation {
  return {
    title: recommendation.issue.title,
    repositoryFullName: recommendation.repository.fullName,
    issueHtmlUrl: recommendation.issue.htmlUrl,
    matchScore: recommendation.score.total,
    reasons: recommendation.score.reasons,
  };
}
