const HIGH_MATCH_THRESHOLD = 80;
const MEDIUM_MATCH_THRESHOLD = 60;

function styleForScore(score: number): string {
  if (score >= HIGH_MATCH_THRESHOLD) {
    return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  }
  if (score >= MEDIUM_MATCH_THRESHOLD) {
    return "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300";
  }
  return "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
}

export function MatchScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-sm font-semibold ${styleForScore(score)}`}
    >
      {score}% match
    </span>
  );
}
