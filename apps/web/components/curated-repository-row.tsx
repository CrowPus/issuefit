"use client";

import type { RepositoryRecord } from "@issuefit/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  deleteRepositoryAction,
  refreshRepositoryAction,
  setRepositoryApprovedAction,
  syncIssuesAction,
} from "../app/admin/repositories/actions";
import { repositoryHasMaintainerApprovedManifest } from "../lib/manifest-policy";
import { CurationWarningBadge } from "./curation-warning-badge";
import { LanguageDot } from "./language-icon";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/**
 * Renders whichever responsiveness details were actually measured — a
 * repository whose sampled issues got zero responses has a real 0% score
 * and rate, but no median to show (ADR-0015).
 */
function formatResponsiveness(
  score: number,
  medianDays: number | null,
  responseRate: number | null,
): string {
  const details: string[] = [];
  if (medianDays !== null) {
    details.push(`~${medianDays < 1 ? "<1" : Math.round(medianDays)}d median first response`);
  }
  if (responseRate !== null) {
    details.push(`${Math.round(responseRate * 100)}% answered`);
  }
  const suffix = details.length > 0 ? ` (${details.join(", ")})` : "";
  return `Responsiveness ${Math.round(score * 100)}%${suffix}`;
}

type RowStatus = "idle" | "refreshing" | "syncingIssues" | "deleting" | "listing" | "error";

export function CuratedRepositoryRow({
  repository,
  syncedIssueCount,
}: {
  repository: RepositoryRecord;
  syncedIssueCount: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<RowStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isBusy =
    status === "refreshing" ||
    status === "syncingIssues" ||
    status === "deleting" ||
    status === "listing";
  const hasMaintainerApprovedManifest = repositoryHasMaintainerApprovedManifest(repository);

  async function refresh() {
    setStatus("refreshing");
    setMessage(null);
    const result = await refreshRepositoryAction(repository.id);
    if (result.status === "error") {
      setStatus("error");
      setMessage(result.message);
      return;
    }
    setStatus("idle");
    router.refresh();
  }

  async function syncIssues() {
    setStatus("syncingIssues");
    setMessage(null);
    const result = await syncIssuesAction(repository.id);
    if (result.status === "error") {
      setStatus("error");
      setMessage(result.message);
      return;
    }
    setStatus("idle");
    router.refresh();
  }

  async function toggleListed() {
    setStatus("listing");
    setMessage(null);
    const result = await setRepositoryApprovedAction(repository.id, !repository.approved);
    if (result.status === "error") {
      setStatus("error");
      setMessage(result.message);
      return;
    }
    setStatus("idle");
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Remove ${repository.fullName} from the curated list?`)) {
      return;
    }
    setStatus("deleting");
    setMessage(null);
    await deleteRepositoryAction(repository.id);
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <a
            href={repository.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline-offset-2 hover:underline"
          >
            {repository.fullName}
          </a>
          {hasMaintainerApprovedManifest && (
            <span className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              Maintainer-approved
            </span>
          )}
          {repository.source === "submitted" && (
            <span className="ml-2 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300">
              Maintainer-submitted
            </span>
          )}
          {!repository.approved && (
            <span className="ml-2 rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Unlisted
            </span>
          )}
          {repository.description !== null && (
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {repository.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void syncIssues()}
            disabled={isBusy}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {status === "syncingIssues" ? "Syncing issues…" : "Sync issues"}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isBusy}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {status === "refreshing" ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => void toggleListed()}
            disabled={isBusy}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {status === "listing" ? "Saving…" : repository.approved ? "Unlist" : "Relist"}
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={isBusy}
            className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
          >
            {status === "deleting" ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        {repository.primaryLanguage !== null && (
          <span className="inline-flex items-center gap-1.5">
            <LanguageDot language={repository.primaryLanguage} />
            {repository.primaryLanguage}
          </span>
        )}
        <span>★ {repository.starsCount}</span>
        <span>{repository.openIssuesCount} open on GitHub</span>
        <span>{syncedIssueCount} synced</span>
        <span>
          Activity {Math.round(repository.activityScore * 100)}%
          {!repository.isActive && " (inactive)"}
        </span>
        {repository.maintainerResponsivenessScore === null ? (
          <span title="Measured from first-response times during issue sync (ADR-0015)">
            Responsiveness: not yet measured — sync issues to compute
          </span>
        ) : (
          <span title="Median time to the first non-author comment across recently updated issues, and the share of sampled issues that got any response (ADR-0015)">
            {formatResponsiveness(
              repository.maintainerResponsivenessScore,
              repository.medianFirstResponseDays,
              repository.firstResponseRate,
            )}
          </span>
        )}
        {repository.manifestStatus === "valid" &&
          repository.manifestExpectedResponseDays !== null && (
            <span>Manifest response target {repository.manifestExpectedResponseDays}d</span>
          )}
      </div>

      {repository.manifestStatus === "invalid" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-medium">Invalid contribution manifest</p>
          <ul className="mt-1 flex flex-col gap-1">
            {repository.manifestValidationErrors.slice(0, 3).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {repository.curationWarnings.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repository.curationWarnings.map((warning) => (
            <CurationWarningBadge key={warning} warning={warning} />
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Last synced {dateFormatter.format(repository.syncedAt)}
      </p>

      {status === "error" && message !== null && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {message}
        </p>
      )}
    </li>
  );
}
