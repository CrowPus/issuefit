import { findUserById, getBetaAnalytics } from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "../../../components/app-header";
import { isAdminUsername } from "../../../lib/admin";
import { getAuth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const metadata: Metadata = {
  title: "Beta analytics",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

function percentage(part: number, total: number): string {
  if (total === 0) {
    return "0%";
  }
  return `${Math.round((part / total) * 100)}%`;
}

export default async function AdminAnalyticsPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const db = getDb();
  const user = await findUserById(db, session.user.id);
  if (!user || !isAdminUsername(user.githubUsername)) {
    redirect("/dashboard");
  }

  const analytics = await getBetaAnalytics(db);
  const funnel = [
    {
      label: "Signed up",
      count: analytics.totalUsers,
      rate: "100%",
      target: "20 beta developers",
    },
    {
      label: "Completed onboarding",
      count: analytics.onboardingCompleteUsers,
      rate: percentage(analytics.onboardingCompleteUsers, analytics.totalUsers),
      target: "60%",
    },
    {
      label: "Persisted a recommendation",
      count: analytics.usersWithPersistedRecommendations,
      rate: percentage(analytics.usersWithPersistedRecommendations, analytics.totalUsers),
      target: "measurement input",
    },
    {
      label: "Rated useful",
      count: analytics.usersWithUsefulFeedback,
      rate: percentage(analytics.usersWithUsefulFeedback, analytics.totalUsers),
      target: "40%",
    },
    {
      label: "Selected an issue",
      count: analytics.usersWithSelectedContribution,
      rate: percentage(analytics.usersWithSelectedContribution, analytics.totalUsers),
      target: "25%",
    },
    {
      label: "Started working",
      count: analytics.usersWorking,
      rate: percentage(analytics.usersWorking, analytics.totalUsers),
      target: "15%",
    },
    {
      label: "Opened a pull request",
      count: analytics.usersWithPullRequest,
      rate: percentage(analytics.usersWithPullRequest, analytics.totalUsers),
      target: "10%",
    },
    {
      label: "Merged",
      count: analytics.usersMerged,
      rate: percentage(analytics.usersMerged, analytics.totalUsers),
      target: "portfolio source",
    },
  ];

  return (
    <>
      <AppHeader userImage={user.image} userName={user.name} active="admin" isAdmin />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Beta analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Private-beta funnel from persisted IssueFit data.{" "}
            <Link href="/admin/repositories" className="underline-offset-2 hover:underline">
              Curated repositories →
            </Link>
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="text-2xl font-bold tabular-nums">
              {analytics.maintainerApprovedRepositories}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Maintainer-approved repositories
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="text-2xl font-bold tabular-nums">
              {analytics.publicPortfolioEntries}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Public portfolio entries</div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="text-2xl font-bold tabular-nums">{analytics.usersWithPullRequest}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Users with PR evidence</div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Funnel step</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Beta target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {funnel.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  <td className="px-4 py-3 tabular-nums">{row.count}</td>
                  <td className="px-4 py-3 tabular-nums">{row.rate}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
