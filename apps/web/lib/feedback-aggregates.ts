import type { FeedbackWithRecommendation, RecommendationFeedbackVerdict } from "@issuefit/database";

export const VERDICT_LABELS: Record<RecommendationFeedbackVerdict, string> = {
  good_match: "Good match",
  too_difficult: "Too difficult",
  too_easy: "Too easy",
  not_interested: "Not interested",
  wrong_technology: "Wrong technology",
  issue_unavailable: "Issue unavailable",
};

export const VERDICT_ORDER: readonly RecommendationFeedbackVerdict[] = [
  "good_match",
  "too_difficult",
  "too_easy",
  "not_interested",
  "wrong_technology",
  "issue_unavailable",
];

/** Verdict totals for the admin view; every verdict is present, zero included. */
export function countFeedbackVerdicts(
  rows: readonly Pick<FeedbackWithRecommendation, "verdict">[],
): Record<RecommendationFeedbackVerdict, number> {
  const counts = Object.fromEntries(VERDICT_ORDER.map((verdict) => [verdict, 0])) as Record<
    RecommendationFeedbackVerdict,
    number
  >;
  for (const row of rows) {
    counts[row.verdict] += 1;
  }
  return counts;
}
