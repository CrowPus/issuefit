"use server";

import { headers as nextHeaders } from "next/headers";

import { getSessionUserId } from "../../lib/session";
import { syncGithubData, type SyncResult } from "../../lib/github-sync";

export async function syncGithubDataAction(): Promise<SyncResult> {
  const requestHeaders = await nextHeaders();
  const userId = await getSessionUserId(requestHeaders);
  if (userId === null) {
    return { status: "error", message: "Your session has expired. Please sign in again." };
  }

  return syncGithubData(userId, requestHeaders);
}
