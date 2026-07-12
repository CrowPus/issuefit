"use client";

import { useState, useTransition } from "react";

import { setEntryVisibilityAction, updatePortfolioEntryAction } from "../app/portfolio/actions";

export interface PortfolioEntryEditorProps {
  entryId: string;
  initialTitle: string;
  initialSummary: string;
  initialSkills: string[];
  initialReviewRounds: number | null;
  initialIsPublic: boolean;
}

export function PortfolioEntryEditor(props: PortfolioEntryEditorProps) {
  const [title, setTitle] = useState(props.initialTitle);
  const [summary, setSummary] = useState(props.initialSummary);
  const [skills, setSkills] = useState(props.initialSkills.join(", "));
  const [reviewRounds, setReviewRounds] = useState(
    props.initialReviewRounds === null ? "" : String(props.initialReviewRounds),
  );
  const [isPublic, setIsPublic] = useState(props.initialIsPublic);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const parsedRounds = reviewRounds.trim() === "" ? null : Number.parseInt(reviewRounds, 10);
    startTransition(async () => {
      const result = await updatePortfolioEntryAction({
        entryId: props.entryId,
        title: title.trim(),
        summary,
        skillsDemonstrated: skills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0),
        reviewRounds: Number.isNaN(parsedRounds) ? null : parsedRounds,
      });
      setMessage(result.status === "success" ? "Saved." : result.message);
    });
  }

  function handleTogglePublic(next: boolean) {
    setIsPublic(next);
    startTransition(async () => {
      const result = await setEntryVisibilityAction({ entryId: props.entryId, isPublic: next });
      if (result.status === "success") {
        setMessage(
          next ? "Now visible on your public profile." : "Hidden from your public profile.",
        );
      } else {
        setIsPublic(!next);
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Title</span>
        <input
          type="text"
          value={title}
          disabled={isPending}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Summary</span>
        <textarea
          value={summary}
          disabled={isPending}
          rows={3}
          placeholder="What did you build or fix? Written by you — no AI."
          onChange={(event) => setSummary(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">
          Skills demonstrated (comma-separated)
        </span>
        <input
          type="text"
          value={skills}
          disabled={isPending}
          placeholder="TypeScript, PostgreSQL"
          onChange={(event) => setSkills(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Review rounds (optional)</span>
        <input
          type="number"
          min={0}
          value={reviewRounds}
          disabled={isPending}
          onChange={(event) => setReviewRounds(event.target.value)}
          className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
        >
          Save
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={isPublic}
            disabled={isPending}
            onChange={(event) => handleTogglePublic(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-emerald-600 dark:border-zinc-700"
          />
          Show on my public profile
        </label>
      </div>

      {message !== null && (
        <p aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
}
