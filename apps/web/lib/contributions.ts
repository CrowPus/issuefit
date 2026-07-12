import {
  contributionStatusEnum,
  findCareerGoalByUserId,
  findContributionForUserAndIssue,
  findSyncedIssueByGithubIssueId,
  listContributionsForUser,
  listUserSkillsWithNames,
  startContribution,
  updateContributionDetails,
  updateContributionStatus,
  type ContributionRecord,
  type ContributionStatus,
  type ContributionWithRecommendation,
  type IssueWithRepository,
} from "@issuefit/database";
import { technologyKey, type DeveloperProfile } from "@issuefit/recommendation-engine";
import { z } from "zod";

import { getDb } from "./db";
import { buildFeedbackSnapshot } from "./recommendation-feedback";
import { buildDeveloperProfile, toIssueCandidate } from "./recommendations";

/**
 * The user's confirmed profile skills that the issue's technologies exercise,
 * matched with the engine's normalisation so it agrees with scoring
 * (ADR-0019). Captured at start because the issue usually leaves sync (open
 * issues only) before the contribution merges.
 */
export function skillsDemonstratedFor(
  profile: DeveloperProfile,
  item: IssueWithRepository,
): string[] {
  const issueTechnologyKeys = new Set(
    toIssueCandidate(item)
      .technologies.map(technologyKey)
      .filter((key) => key !== ""),
  );
  return profile.skills
    .map((skill) => skill.name)
    .filter((name) => issueTechnologyKeys.has(technologyKey(name)));
}

export type { ContributionRecord, ContributionStatus, ContributionWithRecommendation };

/** Only the stable GitHub issue id is trusted from the client (as in ADR-0014). */
export const startContributionInputSchema = z.object({
  githubIssueId: z.number().int().positive(),
});

export const contributionStatusInputSchema = z.object({
  githubIssueId: z.number().int().positive(),
  status: z.enum(contributionStatusEnum.enumValues),
});

const githubPullRequestUrl = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(value),
    "Enter a GitHub pull request URL, e.g. https://github.com/owner/repo/pull/123.",
  );

/** Blank fields clear the stored value; a PR URL, when present, must be a GitHub PR URL. */
export const contributionDetailsInputSchema = z.object({
  githubIssueId: z.number().int().positive(),
  prUrl: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .refine(
      (value) => value === null || githubPullRequestUrl.safeParse(value).success,
      "Enter a GitHub pull request URL, e.g. https://github.com/owner/repo/pull/123.",
    ),
  branchName: z
    .string()
    .trim()
    .max(255)
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});

export type StartContributionResult =
  { status: "success"; contribution: ContributionRecord } | { status: "error"; message: string };

export type UpdateContributionResult = { status: "success" } | { status: "error"; message: string };

const NOT_STARTED_MESSAGE = "You have not started a contribution on this issue.";

export async function startContributionForUser(
  userId: string,
  githubIssueId: number,
): Promise<StartContributionResult> {
  const db = getDb();
  const item = await findSyncedIssueByGithubIssueId(db, githubIssueId);
  if (item === null) {
    return {
      status: "error",
      message: "This issue is no longer in the catalogue, so a contribution cannot be started.",
    };
  }

  const [userSkills, careerGoal] = await Promise.all([
    listUserSkillsWithNames(db, userId),
    findCareerGoalByUserId(db, userId),
  ]);
  const profile = buildDeveloperProfile(userSkills, careerGoal);
  const snapshot = buildFeedbackSnapshot(profile, item);

  const contribution = await startContribution(
    db,
    {
      userId,
      githubIssueId,
      repositoryFullName: item.repository.fullName,
      issueTitle: item.issue.title,
      issueHtmlUrl: item.issue.htmlUrl,
      matchScore: snapshot.matchScore,
      matchReasons: snapshot.matchReasons,
      scoreVersion: snapshot.scoreVersion,
    },
    skillsDemonstratedFor(profile, item),
  );
  return { status: "success", contribution };
}

export async function setContributionStatus(
  userId: string,
  githubIssueId: number,
  status: ContributionStatus,
): Promise<UpdateContributionResult> {
  const updated = await updateContributionStatus(getDb(), userId, githubIssueId, status);
  return updated ? { status: "success" } : { status: "error", message: NOT_STARTED_MESSAGE };
}

export async function setContributionDetails(
  userId: string,
  githubIssueId: number,
  details: { prUrl: string | null; branchName: string | null },
): Promise<UpdateContributionResult> {
  const updated = await updateContributionDetails(getDb(), userId, githubIssueId, details);
  return updated ? { status: "success" } : { status: "error", message: NOT_STARTED_MESSAGE };
}

export function getContributionForUser(
  userId: string,
  githubIssueId: number,
): Promise<ContributionRecord | null> {
  return findContributionForUserAndIssue(getDb(), userId, githubIssueId);
}

export function getContributionsForUser(userId: string): Promise<ContributionWithRecommendation[]> {
  return listContributionsForUser(getDb(), userId);
}
