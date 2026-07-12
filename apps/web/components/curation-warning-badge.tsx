const labels: Record<string, string> = {
  archived: "Archived",
  disabled: "Disabled",
  stale: "Stale",
  no_contributing_guide: "No contributing guide",
};

export function CurationWarningBadge({ warning }: { warning: string }) {
  return (
    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
      {labels[warning] ?? warning}
    </span>
  );
}
