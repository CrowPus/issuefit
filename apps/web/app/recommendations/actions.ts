"use server";

import { revalidatePath } from "next/cache";
import { headers as nextHeaders } from "next/headers";

import {
  feedbackInputSchema,
  submitFeedback,
  type SubmitFeedbackResult,
} from "../../lib/recommendation-feedback";
import { getSessionUserId } from "../../lib/session";

export type ActionResult = SubmitFeedbackResult;

export async function submitRecommendationFeedbackAction(input: unknown): Promise<ActionResult> {
  const userId = await getSessionUserId(await nextHeaders());
  if (userId === null) {
    return { status: "error", message: "Your session has expired. Please sign in again." };
  }

  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid feedback." };
  }

  const result = await submitFeedback(userId, parsed.data.githubIssueId, parsed.data.verdict);
  if (result.status === "success") {
    // Negative verdicts remove the issue from the user's candidates, so the
    // list must recompute (ADR-0014). The dashboard shows a teaser of the
    // same data.
    revalidatePath("/recommendations");
    revalidatePath("/dashboard");
  }
  return result;
}
