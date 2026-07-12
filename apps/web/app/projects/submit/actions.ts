"use server";

import { revalidatePath } from "next/cache";
import { headers as nextHeaders } from "next/headers";

import { submitProject } from "../../../lib/project-submission";
import { getSessionUserId } from "../../../lib/session";

/** Client-facing result: only what the form needs, never a raw DB row. */
export type SubmitProjectActionResult =
  | { status: "success"; owner: string; name: string; issuesSynced: boolean }
  | { status: "manifest_missing" }
  | { status: "manifest_invalid"; errors: string[] }
  | { status: "error"; message: string };

export async function submitProjectAction(input: unknown): Promise<SubmitProjectActionResult> {
  const requestHeaders = await nextHeaders();
  const userId = await getSessionUserId(requestHeaders);
  if (userId === null) {
    return { status: "error", message: "Please sign in to submit a project." };
  }
  if (typeof input !== "string") {
    return { status: "error", message: "Invalid repository." };
  }

  const result = await submitProject(userId, requestHeaders, input);
  if (result.status !== "success") {
    return result;
  }
  revalidatePath("/projects");
  return {
    status: "success",
    owner: result.repository.owner,
    name: result.repository.name,
    issuesSynced: result.issuesSynced,
  };
}
