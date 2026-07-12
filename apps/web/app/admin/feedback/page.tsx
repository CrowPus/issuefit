import { findUserById, listFeedbackWithRecommendations } from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "../../../components/app-header";
import { isAdminUsername } from "../../../lib/admin";
import { getAuth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import {
  countFeedbackVerdicts,
  VERDICT_LABELS,
  VERDICT_ORDER,
} from "../../../lib/feedback-aggregates";

export const metadata: Metadata = {
  title: "Recommendation feedback",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const db = getDb();
  const user = await findUserById(db, session.user.id);
  if (!user || !isAdminUsername(user.githubUsername)) {
    redirect("/dashboard");
  }

  const feedback = await listFeedbackWithRecommendations(db);
  const counts = countFeedbackVerdicts(feedback);

  return (
    <>
      <AppHeader userImage={user.image} userName={user.name} active="admin" isAdmin />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Recommendation feedback</h1>
            <p className="text-sm text-zinc-500 max-w-2xl dark:text-zinc-400">
              What developers said about their recommendations. Scores are the engine&apos;s values
              at feedback time; a missing score means the issue was excluded or unscorable by then.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/repositories"
              className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800"
            >
              Repositories
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800"
            >
              Analytics
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-950/60">
          {VERDICT_ORDER.map((verdict) => (
            <div
              key={verdict}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="text-2xl font-bold tabular-nums">{counts[verdict]}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {VERDICT_LABELS[verdict]}
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <h2 className="text-lg font-semibold">All feedback</h2>
          {feedback.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No feedback yet. It appears here as soon as a developer rates a recommendation.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {feedback.map((row) => (
                <li
                  key={row.recommendation.id}
                  className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <a
                      href={row.recommendation.issueHtmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {row.recommendation.issueTitle}
                    </a>
                    <span className="shrink-0 rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                      {VERDICT_LABELS[row.verdict]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{row.recommendation.repositoryFullName}</span>
                    <span>
                      {row.recommendation.matchScore === null
                        ? "score not available"
                        : `${Math.round(row.recommendation.matchScore)}% match at feedback time`}
                    </span>
                    <span>{row.updatedAt.toISOString().slice(0, 10)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
