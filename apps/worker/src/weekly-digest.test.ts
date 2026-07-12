import type {
  RecommendationDigestDeliveryRecord,
  SaveRecommendationDigestDeliveryInput,
} from "@issuefit/database";
import type { Recommendation, RecommendationsResult } from "@issuefit/recommendations";
import { describe, expect, it, vi } from "vitest";

import {
  composeWeeklyDigestEmail,
  getWeeklyDigestPeriod,
  runWeeklyRecommendationDigest,
  toDigestRecommendations,
  type WeeklyDigestPorts,
} from "./weekly-digest.js";

const now = new Date("2026-07-12T12:00:00.000Z");

function recommendation({
  title = "Improve docs",
  repositoryFullName = "issuefit/example",
  matchScore = 84,
  reasons = ["You already work with TypeScript"],
}: {
  title?: string;
  repositoryFullName?: string;
  matchScore?: number;
  reasons?: string[];
} = {}): Recommendation {
  return {
    score: {
      total: matchScore,
      version: "test",
      components: {
        skillMatch: 100,
        technologyPreference: 80,
        difficultyMatch: 100,
        freshness: 90,
        repositoryActivity: 80,
        maintainerResponsiveness: 70,
        issueClarity: 80,
        careerGoalMatch: 60,
      },
      reasons,
      exclusions: [],
    },
    issue: {
      title,
      htmlUrl: `https://github.com/${repositoryFullName}/issues/1`,
    } as Recommendation["issue"],
    repository: {
      fullName: repositoryFullName,
    } as Recommendation["repository"],
    verdict: null,
  };
}

function recommendationsResult(recommendations: Recommendation[]): RecommendationsResult {
  return {
    topRecommendations: recommendations,
    eligibleCount: recommendations.length,
    candidateCount: recommendations.length,
    hasSkills: true,
    hasCareerGoal: true,
  };
}

function createPorts(overrides: Partial<WeeklyDigestPorts> = {}): WeeklyDigestPorts & {
  saved: SaveRecommendationDigestDeliveryInput[];
  sent: unknown[];
} {
  const saved: SaveRecommendationDigestDeliveryInput[] = [];
  const sent: unknown[] = [];
  return {
    saved,
    sent,
    listRecipients: async () => [{ id: "user-1", email: "user@example.test", name: "Ada" }],
    findDelivery: async () => null,
    getRecommendations: async () => recommendationsResult([recommendation()]),
    saveDelivery: async (input) => {
      saved.push(input);
    },
    sendEmail: async (message) => {
      sent.push(message);
    },
    ...overrides,
  };
}

describe("getWeeklyDigestPeriod", () => {
  it("uses the current UTC Monday as the weekly period start", () => {
    expect(getWeeklyDigestPeriod(now)).toEqual({
      periodStartedAt: new Date("2026-07-06T00:00:00.000Z"),
      periodEndedAt: new Date("2026-07-13T00:00:00.000Z"),
    });
  });
});

describe("composeWeeklyDigestEmail", () => {
  it("renders text and html without unsafe raw markup", () => {
    const email = composeWeeklyDigestEmail({
      recipientName: "Ada",
      recommendations: [
        {
          title: "Fix <script>",
          repositoryFullName: "owner/repo",
          issueHtmlUrl: "https://github.com/owner/repo/issues/1",
          matchScore: 91,
          reasons: ["Matches <TypeScript>"],
        },
      ],
      period: getWeeklyDigestPeriod(now),
    });

    expect(email.subject).toContain("2026-07-06");
    expect(email.text).toContain("Fix <script>");
    expect(email.html).toContain("Fix &lt;script&gt;");
    expect(email.html).not.toContain("Matches <TypeScript>");
  });
});

describe("toDigestRecommendations", () => {
  it("maps only the configured number of recommendations", () => {
    const mapped = toDigestRecommendations(
      recommendationsResult([
        recommendation({ title: "First" }),
        recommendation({ title: "Second" }),
      ]),
      1,
    );

    expect(mapped).toEqual([
      {
        title: "First",
        repositoryFullName: "issuefit/example",
        issueHtmlUrl: "https://github.com/issuefit/example/issues/1",
        matchScore: 84,
        reasons: ["You already work with TypeScript"],
      },
    ]);
  });
});

describe("runWeeklyRecommendationDigest", () => {
  it("sends and records one digest per opted-in recipient", async () => {
    const ports = createPorts();

    const summary = await runWeeklyRecommendationDigest(ports, {
      now,
      deliveryMode: "log",
      from: "IssueFit <noreply@example.test>",
    });

    expect(summary.sent).toBe(1);
    expect(ports.sent).toHaveLength(1);
    expect(ports.saved).toMatchObject([{ status: "sent", recommendationCount: 1 }]);
  });

  it("skips users already completed for the period", async () => {
    const ports = createPorts({
      findDelivery: async () =>
        ({ status: "sent" }) as Pick<RecommendationDigestDeliveryRecord, "status">,
    });

    const summary = await runWeeklyRecommendationDigest(ports, {
      now,
      deliveryMode: "log",
      from: "IssueFit <noreply@example.test>",
    });

    expect(summary.alreadyDelivered).toBe(1);
    expect(ports.sent).toHaveLength(0);
    expect(ports.saved).toHaveLength(0);
  });

  it("records a skipped delivery when no recommendations are available", async () => {
    const ports = createPorts({
      getRecommendations: async () => recommendationsResult([]),
    });

    const summary = await runWeeklyRecommendationDigest(ports, {
      now,
      deliveryMode: "log",
      from: "IssueFit <noreply@example.test>",
    });

    expect(summary.skipped).toBe(1);
    expect(ports.saved).toMatchObject([{ status: "skipped", recommendationCount: 0 }]);
  });

  it("records a failed delivery and continues", async () => {
    const sendEmail = vi.fn(async () => {
      throw new Error("provider unavailable");
    });
    const ports = createPorts({ sendEmail });

    const summary = await runWeeklyRecommendationDigest(ports, {
      now,
      deliveryMode: "webhook",
      from: "IssueFit <noreply@example.test>",
    });

    expect(summary.failed).toBe(1);
    expect(ports.saved).toMatchObject([
      {
        status: "failed",
        deliveryMode: "webhook",
        errorMessage: "provider unavailable",
      },
    ]);
  });
});
