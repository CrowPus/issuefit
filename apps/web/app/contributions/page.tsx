import { findUserById } from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "../../components/app-header";
import { isAdminUsername } from "../../lib/admin";
import { getAuth } from "../../lib/auth";
import { CONTRIBUTION_STATUS_LABELS, type ContributionStatus } from "../../lib/contribution-status";
import { getContributionsForUser } from "../../lib/contributions";
import { getDb } from "../../lib/db";

export const metadata: Metadata = {
  title: "Contributions",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

const STATUS_BADGE_CLASSES: Record<ContributionStatus, string> = {
  selected:
    "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  preparing:
    "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  working:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  pr_opened:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300",
  changes_requested:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  merged:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  closed:
    "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500",
  abandoned:
    "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function ContributionsPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const db = getDb();
  const [user, contributions] = await Promise.all([
    findUserById(db, session.user.id),
    getContributionsForUser(session.user.id),
  ]);
  if (!user) {
    redirect("/signin");
  }

  return (
    <>
      <AppHeader
        userImage={user.image}
        userName={user.name}
        active="contributions"
        isAdmin={isAdminUsername(user.githubUsername)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Contributions</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Issues you have started working on, from selected through to merged. Update a
            contribution&apos;s status from its briefing.
          </p>
        </header>

        {contributions.length === 0 ? (
          <section className="rounded-2xl border border-zinc-200 bg-white/80 p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
            You have not started any contributions yet. Open a{" "}
            <Link
              href="/recommendations"
              className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              recommendation
            </Link>{" "}
            and choose “Start contribution” to begin.
          </section>
        ) : (
          <ul className="flex flex-col gap-3">
            {contributions.map(({ contribution, recommendation }) => (
              <li
                key={contribution.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/recommendations/${recommendation.githubIssueId}`}
                    className="font-semibold text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                  >
                    {recommendation.issueTitle}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[contribution.status]}`}
                  >
                    {CONTRIBUTION_STATUS_LABELS[contribution.status]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>{recommendation.repositoryFullName}</span>
                  <span>Started {formatDate(contribution.startedAt)}</span>
                  {contribution.completedAt !== null && (
                    <span>Completed {formatDate(contribution.completedAt)}</span>
                  )}
                  {contribution.branchName !== null && (
                    <span className="font-mono text-xs">{contribution.branchName}</span>
                  )}
                  {contribution.prUrl !== null && (
                    <a
                      href={contribution.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                    >
                      View pull request
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
