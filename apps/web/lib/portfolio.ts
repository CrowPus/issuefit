import {
  findPublicPortfolioByUsername,
  listPortfolioEntriesForUser,
  setPortfolioEntryPublic,
  setProfileVisibility,
  updatePortfolioEntry,
  type PortfolioEntryDetail,
  type PublicPortfolio,
} from "@issuefit/database";
import { z } from "zod";

import { getDb } from "./db";

export type { PortfolioEntryDetail, PublicPortfolio };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable();

export const portfolioEntryUpdateSchema = z.object({
  entryId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  summary: optionalText(2000),
  skillsDemonstrated: z.array(z.string().trim().min(1).max(60)).max(30),
  reviewRounds: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export const entryVisibilitySchema = z.object({
  entryId: z.string().uuid(),
  isPublic: z.boolean(),
});

export const profileVisibilitySchema = z.object({
  visibility: z.enum(["private", "public"]),
});

export type MutationResult = { status: "success" } | { status: "error"; message: string };

const NOT_FOUND = "That portfolio entry was not found.";

export function getPortfolioForUser(userId: string): Promise<PortfolioEntryDetail[]> {
  return listPortfolioEntriesForUser(getDb(), userId);
}

export function getPublicPortfolio(username: string): Promise<PublicPortfolio | null> {
  return findPublicPortfolioByUsername(getDb(), username);
}

export async function editPortfolioEntry(
  userId: string,
  input: {
    entryId: string;
    title: string;
    summary: string | null;
    skillsDemonstrated: string[];
    reviewRounds: number | null;
  },
): Promise<MutationResult> {
  const updated = await updatePortfolioEntry(getDb(), userId, input.entryId, {
    title: input.title,
    summary: input.summary,
    skillsDemonstrated: input.skillsDemonstrated,
    reviewRounds: input.reviewRounds,
  });
  return updated ? { status: "success" } : { status: "error", message: NOT_FOUND };
}

export async function setEntryVisibility(
  userId: string,
  entryId: string,
  isPublic: boolean,
): Promise<MutationResult> {
  const updated = await setPortfolioEntryPublic(getDb(), userId, entryId, isPublic);
  return updated ? { status: "success" } : { status: "error", message: NOT_FOUND };
}

export async function setProfileVisibilityForUser(
  userId: string,
  visibility: "private" | "public",
): Promise<MutationResult> {
  await setProfileVisibility(getDb(), userId, visibility);
  return { status: "success" };
}
