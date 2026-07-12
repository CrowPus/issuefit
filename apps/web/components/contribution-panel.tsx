"use client";

import { useState, useTransition } from "react";

import {
  startContributionAction,
  updateContributionDetailsAction,
  updateContributionStatusAction,
} from "../app/contributions/actions";
import {
  CONTRIBUTION_STATUS_LABELS,
  CONTRIBUTION_STATUS_ORDER,
  type ContributionStatus,
} from "../lib/contribution-status";

interface ContributionState {
  status: ContributionStatus;
  prUrl: string;
  branchName: string;
}

export function ContributionPanel({
  githubIssueId,
  initial,
}: {
  githubIssueId: number;
  /** Null when the user has not started a contribution on this issue yet. */
  initial: {
    status: ContributionStatus;
    prUrl: string | null;
    branchName: string | null;
  } | null;
}) {
  const [state, setState] = useState<ContributionState | null>(
    initial === null
      ? null
      : {
          status: initial.status,
          prUrl: initial.prUrl ?? "",
          branchName: initial.branchName ?? "",
        },
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const result = await startContributionAction({ githubIssueId });
      if (result.status === "success") {
        const { status, prUrl, branchName } = result.contribution;
        setState({ status, prUrl: prUrl ?? "", branchName: branchName ?? "" });
        setMessage("Contribution started. Track your progress with the status below.");
      } else {
        setMessage(result.message);
      }
    });
  }

  function handleStatusChange(status: ContributionStatus) {
    setState((current) => (current === null ? current : { ...current, status }));
    startTransition(async () => {
      const result = await updateContributionStatusAction({ githubIssueId, status });
      setMessage(
        result.status === "success"
          ? `Status updated to “${CONTRIBUTION_STATUS_LABELS[status]}”.`
          : result.message,
      );
    });
  }

  function handleDetailsSave() {
    if (state === null) {
      return;
    }
    startTransition(async () => {
      const result = await updateContributionDetailsAction({
        githubIssueId,
        prUrl: state.prUrl,
        branchName: state.branchName,
      });
      setMessage(result.status === "success" ? "Saved." : result.message);
    });
  }

  if (state === null) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ready to work on this issue? Start a contribution to track it from selected through to
          merged.
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className="self-start rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          Start contribution
        </button>
        {message !== null && (
          <p aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Status</span>
        <select
          value={state.status}
          disabled={isPending}
          onChange={(event) => handleStatusChange(event.target.value as ContributionStatus)}
          className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {CONTRIBUTION_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {CONTRIBUTION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Pull request URL</span>
        <input
          type="url"
          inputMode="url"
          placeholder="https://github.com/owner/repo/pull/123"
          value={state.prUrl}
          disabled={isPending}
          onChange={(event) =>
            setState((current) =>
              current === null ? current : { ...current, prUrl: event.target.value },
            )
          }
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Branch name</span>
        <input
          type="text"
          placeholder="fix/issue-123"
          value={state.branchName}
          disabled={isPending}
          onChange={(event) =>
            setState((current) =>
              current === null ? current : { ...current, branchName: event.target.value },
            )
          }
          className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <button
        type="button"
        onClick={handleDetailsSave}
        disabled={isPending}
        className="self-start rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
      >
        Save PR &amp; branch
      </button>

      {message !== null && (
        <p aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
}
