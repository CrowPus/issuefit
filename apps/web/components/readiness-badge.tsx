import type { ReadinessGrade } from "@issuefit/repository-health";

const gradeStyles: Record<ReadinessGrade, string> = {
  A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  B: "bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300",
  C: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
  E: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

/** Contributor-readiness grade chip shown on directory cards and project pages (ADR-0020). */
export function ReadinessBadge({ grade, score }: { grade: ReadinessGrade; score: number }) {
  return (
    <span
      title={`Contributor readiness: ${score}/100`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${gradeStyles[grade]}`}
    >
      Readiness {grade}
    </span>
  );
}
