"use server";

import {
  deleteCuratedRepository,
  listCuratedRepositories,
  setRepositoryApproved,
} from "@issuefit/database";
import { revalidatePath } from "next/cache";
import { headers as nextHeaders } from "next/headers";

import { isAdminUserId } from "../../../lib/admin";
import {
  addCuratedRepository,
  refreshCuratedRepository,
  type CuratedRepositoryResult,
} from "../../../lib/curated-repositories";
import { getDb } from "../../../lib/db";
import { syncIssuesForRepository, type SyncIssuesResult } from "../../../lib/issue-sync";
import { parseRepositorySlug } from "../../../lib/repository-slug";
import { getSessionUserId } from "../../../lib/session";

export type ActionResult = { status: "success" } | { status: "error"; message: string };
export type RefreshAllResult =
  | { status: "success"; refreshedCount: number; failedCount: number }
  | { status: "error"; message: string };

function notAuthorized(): { status: "error"; message: string } {
  return { status: "error", message: "You do not have access to this page." };
}

/** Every admin action re-checks authorization itself — never trust the UI alone. */
async function requireAdminUserId(): Promise<string | null> {
  const userId = await getSessionUserId(await nextHeaders());
  if (userId === null || !(await isAdminUserId(userId))) {
    return null;
  }
  return userId;
}

export async function addRepositoryAction(input: unknown): Promise<CuratedRepositoryResult> {
  if ((await requireAdminUserId()) === null) {
    return notAuthorized();
  }
  if (typeof input !== "string") {
    return { status: "error", message: "Invalid repository." };
  }

  const slug = parseRepositorySlug(input);
  if (slug === null) {
    return {
      status: "error",
      message: 'Enter a repository as "owner/name", e.g. "facebook/react".',
    };
  }

  const result = await addCuratedRepository(slug.owner, slug.name);
  if (result.status === "success") {
    revalidatePath("/admin/repositories");
  }
  return result;
}

export async function refreshRepositoryAction(id: string): Promise<CuratedRepositoryResult> {
  if ((await requireAdminUserId()) === null) {
    return notAuthorized();
  }

  const result = await refreshCuratedRepository(id);
  if (result.status === "success") {
    revalidatePath("/admin/repositories");
  }
  return result;
}

export async function refreshAllRepositoriesAction(): Promise<RefreshAllResult> {
  if ((await requireAdminUserId()) === null) {
    return notAuthorized();
  }

  const repositories = await listCuratedRepositories(getDb());
  let refreshedCount = 0;
  let failedCount = 0;
  for (const repository of repositories) {
    const result = await refreshCuratedRepository(repository.id);
    if (result.status === "success") {
      refreshedCount += 1;
    } else {
      failedCount += 1;
    }
  }
  revalidatePath("/admin/repositories");
  return { status: "success", refreshedCount, failedCount };
}

export async function deleteRepositoryAction(id: string): Promise<ActionResult> {
  if ((await requireAdminUserId()) === null) {
    return notAuthorized();
  }

  await deleteCuratedRepository(getDb(), id);
  revalidatePath("/admin/repositories");
  return { status: "success" };
}

/**
 * Moderation switch for the public directory (ADR-0020): unlisting removes
 * the repository from /projects and the recommendation pool without
 * deleting its data, and blocks maintainer resubmission until relisted.
 */
export async function setRepositoryApprovedAction(
  id: string,
  approved: boolean,
): Promise<ActionResult> {
  if ((await requireAdminUserId()) === null) {
    return notAuthorized();
  }

  await setRepositoryApproved(getDb(), id, approved);
  revalidatePath("/admin/repositories");
  revalidatePath("/projects");
  return { status: "success" };
}

export async function syncIssuesAction(repositoryId: string): Promise<SyncIssuesResult> {
  if ((await requireAdminUserId()) === null) {
    return notAuthorized();
  }

  const result = await syncIssuesForRepository(repositoryId);
  if (result.status === "success") {
    revalidatePath("/admin/repositories");
  }
  return result;
}
