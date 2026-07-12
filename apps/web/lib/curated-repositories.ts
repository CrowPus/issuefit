import { parseEnv, webEnvSchema } from "@issuefit/config";
import {
  CONTRIBUTION_MANIFEST_PATH,
  parseContributionManifestYaml,
  type ContributionManifest,
} from "@issuefit/contribution-manifest";
import {
  findCuratedRepositoryById,
  upsertCuratedRepository,
  type RepositoryRecord,
  type UpsertCuratedRepository,
} from "@issuefit/database";
import { GitHubApiError } from "@issuefit/github";
import {
  assessRepositoryHealth,
  detectSetupSignals,
  type RepositorySetupSignals,
} from "@issuefit/repository-health";

import { getDb } from "./db";
import { gitHubClient } from "./github-client";

export type CuratedRepositoryResult =
  { status: "success"; repository: RepositoryRecord } | { status: "error"; message: string };

function messageForError(error: GitHubApiError): string {
  switch (error.category) {
    case "authentication":
      return "The platform's GitHub service token is invalid or expired.";
    case "authorization":
      return "GitHub denied this request for the service token.";
    case "rate_limit":
      return "GitHub's rate limit was reached. Please try again in a few minutes.";
    case "temporary_provider":
      return "GitHub is temporarily unavailable. Please try again shortly.";
    case "permanent_provider":
      return "Repository not found. Check the owner and name.";
    case "internal":
      return "Could not fetch this repository. Please try again later.";
  }
}

type ManifestFields = Pick<
  UpsertCuratedRepository,
  | "manifestStatus"
  | "manifestRaw"
  | "manifestFetchedAt"
  | "manifestValidationErrors"
  | "manifestExternalContributions"
  | "manifestAiPolicy"
  | "manifestContributionGuide"
  | "manifestAcceptingContributors"
  | "manifestMentorshipAvailable"
  | "manifestExpectedResponseDays"
  | "manifestAllowedTypes"
  | "manifestPreferredSkills"
  | "manifestDifficulty"
  | "manifestTestsRequired"
  | "manifestIssueDiscussionRequired"
  | "manifestDraftPullRequestFirst"
>;

function emptyManifestFields(
  status: "missing" | "invalid",
  raw: string | null,
  errors: readonly string[],
  fetchedAt: Date,
): ManifestFields {
  return {
    manifestStatus: status,
    manifestRaw: raw,
    manifestFetchedAt: fetchedAt,
    manifestValidationErrors: [...errors],
    manifestExternalContributions: null,
    manifestAiPolicy: null,
    manifestContributionGuide: null,
    manifestAcceptingContributors: null,
    manifestMentorshipAvailable: null,
    manifestExpectedResponseDays: null,
    manifestAllowedTypes: [],
    manifestPreferredSkills: [],
    manifestDifficulty: [],
    manifestTestsRequired: null,
    manifestIssueDiscussionRequired: null,
    manifestDraftPullRequestFirst: null,
  };
}

function validManifestFields(
  raw: string,
  manifest: ContributionManifest,
  fetchedAt: Date,
): ManifestFields {
  return {
    manifestStatus: "valid",
    manifestRaw: raw,
    manifestFetchedAt: fetchedAt,
    manifestValidationErrors: [],
    manifestExternalContributions: manifest.project.externalContributions,
    manifestAiPolicy: manifest.project.aiPolicy,
    manifestContributionGuide: manifest.project.contributionGuide,
    manifestAcceptingContributors: manifest.maintainerCapacity.acceptingContributors,
    manifestMentorshipAvailable: manifest.maintainerCapacity.mentorshipAvailable,
    manifestExpectedResponseDays: manifest.maintainerCapacity.expectedResponseDays,
    manifestAllowedTypes: manifest.opportunities.allowedTypes,
    manifestPreferredSkills: manifest.opportunities.preferredSkills,
    manifestDifficulty: manifest.opportunities.difficulty,
    manifestTestsRequired: manifest.qualityRequirements.testsRequired,
    manifestIssueDiscussionRequired: manifest.qualityRequirements.issueDiscussionRequired,
    manifestDraftPullRequestFirst: manifest.qualityRequirements.draftPullRequestFirst,
  };
}

async function fetchContributionManifest(
  serviceToken: string,
  owner: string,
  name: string,
): Promise<ManifestFields> {
  const fetchedAt = new Date();
  const file = await gitHubClient.getRepositoryFile(
    serviceToken,
    owner,
    name,
    CONTRIBUTION_MANIFEST_PATH,
  );
  if (file === null) {
    return emptyManifestFields("missing", null, [], fetchedAt);
  }

  const parsed = parseContributionManifestYaml(file.content);
  if (parsed.status === "invalid") {
    return emptyManifestFields("invalid", file.content, parsed.errors, fetchedAt);
  }
  return validManifestFields(file.content, parsed.manifest, fetchedAt);
}

/**
 * Reads the three bounded directory/file listings behind the briefing's
 * setup signals (ADR-0017): the repository root, `.github/workflows`, and —
 * only when the root listing shows one — `.nvmrc`.
 */
async function fetchSetupSignals(
  serviceToken: string,
  owner: string,
  name: string,
): Promise<RepositorySetupSignals> {
  const [rootFileNames, workflowFileNames] = await Promise.all([
    gitHubClient.listRepositoryDirectory(serviceToken, owner, name, ""),
    gitHubClient.listRepositoryDirectory(serviceToken, owner, name, ".github/workflows"),
  ]);
  const hasNvmrc = (rootFileNames ?? []).some((fileName) => fileName.toLowerCase() === ".nvmrc");
  const nvmrcFile = hasNvmrc
    ? await gitHubClient.getRepositoryFile(serviceToken, owner, name, ".nvmrc")
    : null;

  return detectSetupSignals({
    rootFileNames: rootFileNames ?? [],
    workflowFileNames,
    nvmrcContent: nvmrcFile?.content ?? null,
  });
}

/** Provenance for maintainer self-submitted repositories (ADR-0020). */
export interface RepositorySubmissionProvenance {
  submittedByUserId: string;
  submittedAt: Date;
}

/**
 * Fetches a repository's metadata and community profile with the
 * platform's service token (not a user's own OAuth token — see ADR-0009),
 * assesses its health, fetches the optional Contribution Manifest v0
 * (ADR-0016) and the briefing's setup signals (ADR-0017), and upserts the
 * curated snapshot. With `submission` set, the row is marked as
 * maintainer-submitted (ADR-0020); without it, an update never touches the
 * existing source fields, so an admin refresh keeps submission provenance.
 */
export async function addCuratedRepository(
  owner: string,
  name: string,
  submission?: RepositorySubmissionProvenance,
): Promise<CuratedRepositoryResult> {
  try {
    const { GITHUB_SERVICE_TOKEN } = parseEnv(webEnvSchema, process.env);
    const setupSignalsCheckedAt = new Date();
    const [details, communityProfile, manifestFields, setupSignals] = await Promise.all([
      gitHubClient.getRepository(GITHUB_SERVICE_TOKEN, owner, name),
      gitHubClient.getRepositoryCommunityProfile(GITHUB_SERVICE_TOKEN, owner, name),
      fetchContributionManifest(GITHUB_SERVICE_TOKEN, owner, name),
      fetchSetupSignals(GITHUB_SERVICE_TOKEN, owner, name),
    ]);
    const health = assessRepositoryHealth({
      pushedAt: details.pushedAt,
      archived: details.archived,
      disabled: details.disabled,
      hasContributingGuide: communityProfile.hasContributingGuide,
    });

    const repository = await upsertCuratedRepository(getDb(), {
      githubRepositoryId: details.id,
      owner: details.owner,
      name: details.name,
      fullName: details.fullName,
      description: details.description,
      primaryLanguage: details.primaryLanguage,
      starsCount: details.stargazersCount,
      openIssuesCount: details.openIssuesCount,
      isActive: health.isActive,
      activityScore: health.activityScore,
      curationWarnings: health.curationWarnings,
      approved: true,
      htmlUrl: details.htmlUrl,
      syncedAt: new Date(),
      contributingUrl: communityProfile.contributingUrl,
      codeOfConductUrl: communityProfile.codeOfConductUrl,
      readmeUrl: communityProfile.readmeUrl,
      packageManager: setupSignals.packageManager,
      hasDockerCompose: setupSignals.hasDockerCompose,
      nodeVersion: setupSignals.nodeVersion,
      ciWorkflowNames: setupSignals.ciWorkflowNames,
      setupSignalsCheckedAt,
      ...manifestFields,
      ...(submission === undefined
        ? {}
        : {
            source: "submitted" as const,
            submittedByUserId: submission.submittedByUserId,
            submittedAt: submission.submittedAt,
          }),
    });
    return { status: "success", repository };
  } catch (error) {
    console.error("curated_repository_add_failed", { owner, name, error });
    const message =
      error instanceof GitHubApiError
        ? messageForError(error)
        : "Could not add this repository. Please try again later.";
    return { status: "error", message };
  }
}

/** Re-fetches and re-assesses an already-curated repository in place. */
export async function refreshCuratedRepository(id: string): Promise<CuratedRepositoryResult> {
  const existing = await findCuratedRepositoryById(getDb(), id);
  if (existing === null) {
    return { status: "error", message: "This repository is no longer curated." };
  }
  return addCuratedRepository(existing.owner, existing.name);
}
