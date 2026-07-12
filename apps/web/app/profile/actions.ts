"use server";

import {
  ensureSkills,
  setUserSkillLevel,
  setWeeklyDigestEmailPreference,
  upsertCareerGoal,
} from "@issuefit/database";
import {
  addSkillInputSchema,
  careerGoalInputSchema,
  updateSkillLevelInputSchema,
} from "@issuefit/skills";
import { revalidatePath } from "next/cache";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";

import { getDb } from "../../lib/db";
import { getSessionUserId } from "../../lib/session";
import { refreshSkillsFromGithub, type RefreshSkillsResult } from "../../lib/skill-profile";

export type ActionResult = { status: "success" } | { status: "error"; message: string };

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";
const SESSION_EXPIRED: ActionResult = { status: "error", message: SESSION_EXPIRED_MESSAGE };
const weeklyDigestPreferenceInputSchema = z.object({ enabled: z.boolean() });

async function requireUserId(): Promise<string | null> {
  return getSessionUserId(await nextHeaders());
}

export async function refreshSkillProfileAction(): Promise<RefreshSkillsResult> {
  const userId = await requireUserId();
  if (userId === null) {
    return { status: "error", message: SESSION_EXPIRED_MESSAGE };
  }

  const result = await refreshSkillsFromGithub(userId);
  if (result.status === "success") {
    revalidatePath("/profile");
  }
  return result;
}

export async function updateSkillLevelAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (userId === null) {
    return SESSION_EXPIRED;
  }

  const parsed = updateSkillLevelInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid skill level." };
  }

  await setUserSkillLevel(getDb(), userId, parsed.data.skillId, parsed.data.level);
  revalidatePath("/profile");
  return { status: "success" };
}

export async function addSkillAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (userId === null) {
    return SESSION_EXPIRED;
  }

  const parsed = addSkillInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid skill." };
  }

  const db = getDb();
  const skillIds = await ensureSkills(db, [parsed.data.name]);
  const skillId = skillIds.get(parsed.data.name);
  if (skillId === undefined) {
    return { status: "error", message: "Could not add this skill. Please try again." };
  }

  await setUserSkillLevel(db, userId, skillId, parsed.data.level);
  revalidatePath("/profile");
  return { status: "success" };
}

export async function updateCareerGoalAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (userId === null) {
    return SESSION_EXPIRED;
  }

  const parsed = careerGoalInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid career goal." };
  }

  await upsertCareerGoal(getDb(), {
    userId,
    goal: parsed.data.goal,
    goalDetails: parsed.data.goalDetails ?? null,
    preferredLanguages: parsed.data.preferredLanguages,
    preferredIssueTypes: parsed.data.preferredIssueTypes,
    hoursPerWeek: parsed.data.hoursPerWeek,
    difficulty: parsed.data.difficulty,
  });
  revalidatePath("/profile");
  return { status: "success" };
}

export async function updateWeeklyDigestPreferenceAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (userId === null) {
    return SESSION_EXPIRED;
  }

  const parsed = weeklyDigestPreferenceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid digest preference." };
  }

  await setWeeklyDigestEmailPreference(getDb(), userId, parsed.data.enabled);
  revalidatePath("/profile");
  return { status: "success" };
}
