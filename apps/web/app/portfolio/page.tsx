import { findUserById } from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "../../components/app-header";
import { PortfolioEntryEditor } from "../../components/portfolio-entry-editor";
import { ProfileVisibilityToggle } from "../../components/profile-visibility-toggle";
import { isAdminUsername } from "../../lib/admin";
import { getAuth } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { getPortfolioForUser } from "../../lib/portfolio";

export const metadata: Metadata = {
  title: "Portfolio",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function PortfolioPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const db = getDb();
  const [user, entries] = await Promise.all([
    findUserById(db, session.user.id),
    getPortfolioForUser(session.user.id),
  ]);
  if (!user) {
    redirect("/signin");
  }

  return (
    <>
      <AppHeader
        userImage={user.image}
        userName={user.name}
        active="portfolio"
        isAdmin={isAdminUsername(user.githubUsername)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Entries are generated automatically when a contribution is marked merged, from your
            structured contribution data — never by AI. Edit each entry and choose what to share.
          </p>
        </header>

        <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Public profile</h2>
            {user.profileVisibility === "public" && (
              <a
                href={`/u/${user.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                View public profile ↗
              </a>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your public profile is a standalone page at{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              /u/{user.githubUsername}
            </span>{" "}
            that anyone can view — it shows only the entries you mark public.
          </p>
          <ProfileVisibilityToggle
            username={user.githubUsername}
            initialVisibility={user.profileVisibility}
          />
        </section>

        {entries.length === 0 ? (
          <section className="rounded-2xl border border-zinc-200 bg-white/80 p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
            No portfolio entries yet. Mark a{" "}
            <Link
              href="/contributions"
              className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              contribution
            </Link>{" "}
            as merged and it will appear here.
          </section>
        ) : (
          <ul className="flex flex-col gap-4">
            {entries.map(({ entry, contribution, recommendation }) => (
              <li
                key={entry.id}
                className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {recommendation.repositoryFullName}
                  </span>
                  <a
                    href={recommendation.issueHtmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    Issue
                  </a>
                  {contribution.prUrl !== null && (
                    <a
                      href={contribution.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                    >
                      Pull request
                    </a>
                  )}
                  {contribution.completedAt !== null && (
                    <span>Merged {formatDate(contribution.completedAt)}</span>
                  )}
                </div>
                <PortfolioEntryEditor
                  entryId={entry.id}
                  initialTitle={entry.title}
                  initialSummary={entry.summary ?? ""}
                  initialSkills={entry.skillsDemonstrated}
                  initialReviewRounds={entry.reviewRounds}
                  initialIsPublic={entry.isPublic}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
