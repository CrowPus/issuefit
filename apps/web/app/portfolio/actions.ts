"use server";

import { revalidatePath } from "next/cache";
import { headers as nextHeaders } from "next/headers";

import {
  editPortfolioEntry,
  entryVisibilitySchema,
  portfolioEntryUpdateSchema,
  profileVisibilitySchema,
  setEntryVisibility,
  setProfileVisibilityForUser,
  type MutationResult,
} from "../../lib/portfolio";
import { getSessionUserId } from "../../lib/session";

const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

export async function updatePortfolioEntryAction(input: unknown): Promise<MutationResult> {
  const userId = await getSessionUserId(await nextHeaders());
  if (userId === null) {
    return { status: "error", message: SESSION_EXPIRED };
  }
  const parsed = portfolioEntryUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const result = await editPortfolioEntry(userId, {
    entryId: parsed.data.entryId,
    title: parsed.data.title,
    summary: parsed.data.summary,
    skillsDemonstrated: parsed.data.skillsDemonstrated,
    reviewRounds: parsed.data.reviewRounds,
  });
  if (result.status === "success") {
    revalidatePath("/portfolio");
  }
  return result;
}

export async function setEntryVisibilityAction(input: unknown): Promise<MutationResult> {
  const userId = await getSessionUserId(await nextHeaders());
  if (userId === null) {
    return { status: "error", message: SESSION_EXPIRED };
  }
  const parsed = entryVisibilitySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const result = await setEntryVisibility(userId, parsed.data.entryId, parsed.data.isPublic);
  if (result.status === "success") {
    revalidatePath("/portfolio");
  }
  return result;
}

export async function setProfileVisibilityAction(input: unknown): Promise<MutationResult> {
  const userId = await getSessionUserId(await nextHeaders());
  if (userId === null) {
    return { status: "error", message: SESSION_EXPIRED };
  }
  const parsed = profileVisibilitySchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const result = await setProfileVisibilityForUser(userId, parsed.data.visibility);
  if (result.status === "success") {
    revalidatePath("/portfolio");
  }
  return result;
}
