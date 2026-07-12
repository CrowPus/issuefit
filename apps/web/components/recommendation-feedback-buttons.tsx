"use client";

import { useState, useTransition } from "react";

import { submitRecommendationFeedbackAction } from "../app/recommendations/actions";
import type { RecommendationFeedbackVerdict } from "../lib/recommendation-feedback";

/** The six recommendation feedback verdicts, in display order. */
const VERDICT_OPTIONS: ReadonlyArray<{ verdict: RecommendationFeedbackVerdict; label: string }> = [
  { verdict: "good_match", label: "Good match" },
  { verdict: "too_difficult", label: "Too difficult" },
  { verdict: "too_easy", label: "Too easy" },
  { verdict: "not_interested", label: "Not interested" },
  { verdict: "wrong_technology", label: "Wrong technology" },
  { verdict: "issue_unavailable", label: "Issue unavailable" },
];

function verdictMessage(verdict: RecommendationFeedbackVerdict): string {
  return verdict === "good_match"
    ? "Thanks — noted as a good match. You can change your rating any time."
    : "Noted — this issue won't be recommended to you again. You can change your rating any time.";
}

export function RecommendationFeedbackButtons({
  githubIssueId,
  initialVerdict = null,
}: {
  githubIssueId: number;
  /** This user's existing verdict on the issue; pre-selects it and stays changeable. */
  initialVerdict?: RecommendationFeedbackVerdict | null;
}) {
  const [verdict, setVerdict] = useState<RecommendationFeedbackVerdict | null>(initialVerdict);
  const [message, setMessage] = useState<string | null>(
    initialVerdict === null ? null : "Your current rating is shown below. You can change it.",
  );
  const [isPending, startTransition] = useTransition();

  function handleClick(chosen: RecommendationFeedbackVerdict) {
    if (chosen === verdict) {
      return;
    }
    startTransition(async () => {
      const result = await submitRecommendationFeedbackAction({ githubIssueId, verdict: chosen });
      if (result.status === "success") {
        setVerdict(chosen);
        setMessage(verdictMessage(chosen));
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-900">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        How is this match?
      </span>
      <div className="flex flex-wrap gap-2">
        {VERDICT_OPTIONS.map(({ verdict: optionVerdict, label }) => {
          const isChosen = verdict === optionVerdict;
          return (
            <button
              key={optionVerdict}
              type="button"
              disabled={isPending}
              onClick={() => handleClick(optionVerdict)}
              aria-pressed={isChosen}
              className={`rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                isChosen
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {message !== null && (
        <p aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
}
