"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import {
  submitProjectAction,
  type SubmitProjectActionResult,
} from "../app/projects/submit/actions";

export function ProjectSubmitForm() {
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitProjectActionResult | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    setResult(await submitProjectAction(slug));
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={(event) => void onSubmit(event)} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="project-slug" className="text-xs text-zinc-500 dark:text-zinc-400">
            Your repository
          </label>
          <input
            id="project-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            required
            placeholder="owner/name, e.g. my-org/my-project"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || slug.trim() === ""}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Checking your repository…" : "Submit project"}
        </button>
      </form>

      {result?.status === "success" && (
        <div
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <p>
            Your project is live.{" "}
            <Link
              href={`/projects/${result.owner}/${result.name}`}
              className="font-medium underline underline-offset-2"
            >
              View its public page
            </Link>{" "}
            — its open issues {result.issuesSynced ? "were synced and" : "will"} start reaching
            developers whose skills match.
          </p>
          {!result.issuesSynced && (
            <p className="mt-1">
              Issue sync did not finish on the first try; it will be retried on the next refresh.
            </p>
          )}
        </div>
      )}

      {result?.status === "manifest_missing" && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          This repository has no contribution manifest yet. The manifest proves you control the
          repository and welcome contributors — build yours below, commit it, and submit again.
        </div>
      )}

      {result?.status === "manifest_invalid" && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          <p className="font-medium">The contribution manifest did not validate:</p>
          <ul className="mt-1 list-disc pl-5">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {result?.status === "error" && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {result.message}
        </p>
      )}
    </div>
  );
}
