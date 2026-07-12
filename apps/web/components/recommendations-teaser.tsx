import type { RecommendationsResult } from "../lib/recommendations";
import { MatchScoreBadge } from "./match-score-badge";

const TEASER_COUNT = 2;

export function RecommendationsTeaser({ result }: { result: RecommendationsResult }) {
  if (result.candidateCount === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No curated issues have been synced yet — recommendations will appear here once they are.
      </p>
    );
  }

  if (result.topRecommendations.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No matches yet from the {result.candidateCount} currently synced issues.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {result.topRecommendations.slice(0, TEASER_COUNT).map(({ score, issue }) => (
        <li key={issue.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate">{issue.title}</span>
          <MatchScoreBadge score={score.total} />
        </li>
      ))}
    </ul>
  );
}
