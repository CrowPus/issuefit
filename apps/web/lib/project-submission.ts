import { parseEnv, webEnvSchema } from "@issuefit/config";
import {
  CONTRIBUTION_MANIFEST_PATH,
  parseContributionManifestYaml,
} from "@issuefit/contribution-manifest";
import { findRepositoryByFullName, type RepositoryRecord } from "@issuefit/database";
import { GitHubApiError } from "@issuefit/github";

import { getAuth } from "./auth";
import { addCuratedRepository } from "./curated-repositories";
import { getDb } from "./db";
import { gitHubClient } from "./github-client";
import { syncIssuesForRepository } from "./issue-sync";
import { parseRepositorySlug } from "./repository-slug";

export type SubmitProjectResult =
  | { status: "success"; repository: RepositoryRecord; issuesSynced: boolean }
  | { status: "manifest_missing" }
  | { status: "manifest_invalid"; errors: string[] }
  | { status: "error"; message: string };

/**
 * The pure submission gate (ADR-0020): a repository may only be submitted
 * when its contribution manifest exists, validates, and explicitly welcomes
 * outside contributors. `null` content means the file is absent.
 */
export type SubmissionManifestGate =
  | { status: "accepted" }
  | { status: "manifest_missing" }
  | { status: "manifest_invalid"; errors: string[] }
  | { status: "not_accepting"; message: string };

export function evaluateSubmissionManifest(fileContent: string | null): SubmissionManifestGate {
  if (fileContent === null) {
    return { status: "manifest_missing" };
  }
  const parsed = parseContributionManifestYaml(fileContent);
  if (parsed.status === "invalid") {
    return { status: "manifest_invalid", errors: parsed.errors };
  }
  if (!parsed.manifest.project.externalContributions) {
    return {
      status: "not_accepting",
      message:
        "This repository's manifest sets project.externalContributions to false — it opts out of outside contributions.",
    };
  }
  if (!parsed.manifest.maintainerCapacity.acceptingContributors) {
    return {
      status: "not_accepting",
      message:
        "This repository's manifest sets maintainerCapacity.acceptingContributors to false — flip it to true when you are ready for contributors.",
    };
  }
  return { status: "accepted" };
}

function messageForError(error: GitHubApiError): string {
  switch (error.category) {
    case "authentication":
      return "Your GitHub connection has expired. Please sign out and sign in again.";
    case "authorization":
      return "GitHub denied this request. Please reconnect your account.";
    case "rate_limit":
      return "GitHub's rate limit was reached. Please try again in a few minutes.";
    case "permanent_provider":
      return "Repository not found. Check the owner and name.";
    case "temporary_provider":
      return "GitHub is temporarily unavailable. Please try again shortly.";
    case "internal":
      return "Could not submit this repository. Please try again later.";
  }
}

/**
 * Maintainer self-submission (ADR-0020). Two proofs gate it: the signed-in
 * user must have push access to the repository (checked with their own
 * OAuth token), and the repository must carry a valid, accepting
 * contribution manifest (only someone who can commit could have added it).
 * On success the repository joins the same pipeline as admin-curated ones —
 * public directory, issue sync, and the recommendation pool.
 */
export async function submitProject(
  userId: string,
  requestHeaders: Headers,
  input: string,
): Promise<SubmitProjectResult> {
  const slug = parseRepositorySlug(input);
  if (slug === null) {
    return {
      status: "error",
      message: 'Enter a repository as "owner/name", e.g. "my-org/my-project".',
    };
  }

  try {
    const { accessToken } = await getAuth().api.getAccessToken({
      body: { providerId: "github", userId },
      headers: requestHeaders,
    });
    const canPush = await gitHubClient.getRepositoryViewerCanPush(
      accessToken,
      slug.owner,
      slug.name,
    );
    if (!canPush) {
      return {
        status: "error",
        message:
          "Only maintainers with push access can submit a repository. Ask a maintainer to submit it, or to add you as a collaborator.",
      };
    }

    const { GITHUB_SERVICE_TOKEN } = parseEnv(webEnvSchema, process.env);
    const manifestFile = await gitHubClient.getRepositoryFile(
      GITHUB_SERVICE_TOKEN,
      slug.owner,
      slug.name,
      CONTRIBUTION_MANIFEST_PATH,
    );
    const gate = evaluateSubmissionManifest(manifestFile?.content ?? null);
    if (gate.status === "manifest_missing" || gate.status === "manifest_invalid") {
      return gate;
    }
    if (gate.status === "not_accepting") {
      return { status: "error", message: gate.message };
    }

    const existing = await findRepositoryByFullName(getDb(), slug.owner, slug.name);
    if (existing !== null && !existing.approved) {
      return {
        status: "error",
        message: "This repository was unlisted by the platform admins and cannot be resubmitted.",
      };
    }

    const added = await addCuratedRepository(slug.owner, slug.name, {
      submittedByUserId: userId,
      submittedAt: new Date(),
    });
    if (added.status === "error") {
      return added;
    }

    // Best effort: a fresh project page is far more useful with issues and
    // measured responsiveness. A sync failure does not undo the submission.
    const sync = await syncIssuesForRepository(added.repository.id);
    return {
      status: "success",
      repository: added.repository,
      issuesSynced: sync.status === "success",
    };
  } catch (error) {
    console.error("project_submission_failed", {
      userId,
      owner: slug.owner,
      name: slug.name,
      error,
    });
    const message =
      error instanceof GitHubApiError
        ? messageForError(error)
        : "Could not submit this repository. Please try again later.";
    return { status: "error", message };
  }
}
