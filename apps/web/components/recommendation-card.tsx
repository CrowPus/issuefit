import Link from "next/link";

import type { Recommendation } from "../lib/recommendations";
import { repositoryHasMaintainerApprovedManifest } from "../lib/manifest-policy";
import { LanguageDot } from "./language-icon";
import { MatchScoreBadge } from "./match-score-badge";
import { RecommendationFeedbackButtons } from "./recommendation-feedback-buttons";

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { score, issue, repository } = recommendation;
  const hasMaintainerApprovedManifest = repositoryHasMaintainerApprovedManifest(repository);

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:bg-zinc-900/40">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/recommendations/${issue.githubIssueId}`}
          className="font-semibold text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          {issue.title}
        </Link>
        <MatchScoreBadge score={score.total} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <a
          href={repository.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {repository.fullName}
        </a>
        <a
          href={issue.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          View on GitHub
        </a>
        {repository.primaryLanguage !== null && (
          <span className="inline-flex items-center gap-1.5">
            <LanguageDot language={repository.primaryLanguage} />
            {repository.primaryLanguage}
          </span>
        )}
        {hasMaintainerApprovedManifest && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Maintainer-approved
          </span>
        )}
        <span className="capitalize">{issue.difficulty}</span>
      </div>

      {score.reasons.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          {score.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span aria-hidden className="text-emerald-500">
                ✓
              </span>
              {reason}
            </li>
          ))}
        </ul>
      )}

      <RecommendationFeedbackButtons
        githubIssueId={issue.githubIssueId}
        initialVerdict={recommendation.verdict}
      />
    </li>
  );
}
