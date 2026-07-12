import type { ContributionStatus } from "@issuefit/database";

// Client-safe: this module holds only the display metadata for contribution
// statuses, with no database import, so client components can use it without
// pulling the server-only data layer into the browser bundle. The type import
// above is erased at compile time (verify-only), keeping it client-safe.

export type { ContributionStatus };

/** Contribution status lifecycle order, for display. */
export const CONTRIBUTION_STATUS_ORDER: readonly ContributionStatus[] = [
  "selected",
  "preparing",
  "working",
  "pr_opened",
  "changes_requested",
  "merged",
  "closed",
  "abandoned",
];

export const CONTRIBUTION_STATUS_LABELS: Record<ContributionStatus, string> = {
  selected: "Selected",
  preparing: "Preparing",
  working: "Working",
  pr_opened: "PR opened",
  changes_requested: "Changes requested",
  merged: "Merged",
  closed: "Closed",
  abandoned: "Abandoned",
};
