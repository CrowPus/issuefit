"use server";

import { revalidatePath } from "next/cache";
import { headers as nextHeaders } from "next/headers";

import {
  contributionDetailsInputSchema,
  contributionStatusInputSchema,
  setContributionDetails,
  setContributionStatus,
  startContributionForUser,
  startContributionInputSchema,
  type StartContributionResult,
  type UpdateContributionResult,
} from "../../lib/contributions";
import { getSessionUserId } from "../../lib/session";

const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

function revalidateContributionViews(githubIssueId: number): void {
  revalidatePath("/contributions");
  revalidatePath(`/recommendations/${githubIssueId}`);
}

export async function startContributionAction(input: unknown): Promise<StartContributionResult> {
  const userId = await getSessionUserId(await nextHeaders());
  if (userId === null) {
    return { status: "error", message: SESSION_EXPIRED };
  }
  const parsed = startContributionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const result = await startContributionForUser(userId, parsed.data.githubIssueId);
  if (result.status === "success") {
    revalidateContributionViews(parsed.data.githubIssueId);
  }
  return result;
}

export async function updateContributionStatusAction(
  input: unknown,
): Promise<UpdateContributionResult> {
  const userId = await getSessionUserId(await nextHeaders());
  if (userId === null) {
    return { status: "error", message: SESSION_EXPIRED };
  }
  const parsed = contributionStatusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const result = await setContributionStatus(userId, parsed.data.githubIssueId, parsed.data.status);
  if (result.status === "success") {
    revalidateContributionViews(parsed.data.githubIssueId);
  }
  return result;
}

export async function updateContributionDetailsAction(
  input: unknown,
): Promise<UpdateContributionResult> {
  const userId = await getSessionUserId(await nextHeaders());
  if (userId === null) {
    return { status: "error", message: SESSION_EXPIRED };
  }
  const parsed = contributionDetailsInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  const result = await setContributionDetails(userId, parsed.data.githubIssueId, {
    prUrl: parsed.data.prUrl,
    branchName: parsed.data.branchName,
  });
  if (result.status === "success") {
    revalidateContributionViews(parsed.data.githubIssueId);
  }
  return result;
}
