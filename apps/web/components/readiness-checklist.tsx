import type { ContributorReadinessAssessment } from "@issuefit/repository-health";

import { READINESS_ITEM_LABELS } from "../lib/projects";

/**
 * The public contributor-readiness checklist (ADR-0020). "Not measured yet"
 * is shown honestly for signals that have never been checked — it never
 * counts as a failure (ADR-0015).
 */
export function ReadinessChecklist({ readiness }: { readiness: ContributorReadinessAssessment }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Contributor readiness:{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {readiness.score}/100 (grade {readiness.grade})
        </span>
      </p>
      <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {readiness.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            {item.state === "met" ? (
              <span aria-hidden className="text-emerald-600 dark:text-emerald-400">
                ✓
              </span>
            ) : item.state === "missing" ? (
              <span aria-hidden className="text-zinc-400 dark:text-zinc-500">
                ✗
              </span>
            ) : (
              <span aria-hidden className="text-zinc-400 dark:text-zinc-500">
                ?
              </span>
            )}
            <span
              className={
                item.state === "met"
                  ? "text-zinc-800 dark:text-zinc-200"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            >
              {READINESS_ITEM_LABELS[item.id]}
              {item.state === "unknown" && (
                <span className="text-zinc-400 dark:text-zinc-500"> — not measured yet</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
