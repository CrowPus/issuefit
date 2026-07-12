import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  findGithubProfileByUserId,
  findUserById,
  listGithubRepositoriesByUserId,
  listUserSkillsWithNames,
} from "@issuefit/database";

import { AppHeader } from "../../components/app-header";
import { GithubProfileSummary } from "../../components/github-profile-summary";
import { GithubRepositoryList } from "../../components/github-repository-list";
import { RecommendationsTeaser } from "../../components/recommendations-teaser";
import { SkillSummary } from "../../components/skill-summary";
import { SyncGithubButton } from "../../components/sync-github-button";
import { isAdminUsername } from "../../lib/admin";
import { getAuth } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { getRecommendationsForUser } from "../../lib/recommendations";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const db = getDb();
  const [user, githubProfile, repositories, skills, recommendations] = await Promise.all([
    findUserById(db, session.user.id),
    findGithubProfileByUserId(db, session.user.id),
    listGithubRepositoriesByUserId(db, session.user.id),
    listUserSkillsWithNames(db, session.user.id),
    getRecommendationsForUser(session.user.id),
  ]);
  if (!user) {
    redirect("/signin");
  }

  return (
    <>
      <AppHeader
        userImage={user.image}
        userName={user.name}
        active="dashboard"
        isAdmin={isAdminUsername(user.githubUsername)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">@{user.githubUsername}</p>
          {user.profileVisibility === "public" ? (
            <a
              href={`/u/${user.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              View your public profile ↗
            </a>
          ) : (
            <Link
              href="/portfolio"
              className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Your public profile is off — enable it in Portfolio
            </Link>
          )}
        </header>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Skills</h2>
            <Link
              href="/profile"
              className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              Edit skill profile
            </Link>
          </div>
          <SkillSummary skills={skills} />
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">GitHub data</h2>
            <SyncGithubButton />
          </div>
          {githubProfile === null ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Your GitHub data has not been synced yet. Click "Sync GitHub data" to fetch your
              public profile and repositories.
            </p>
          ) : (
            <>
              <GithubProfileSummary profile={githubProfile} />
              <GithubRepositoryList repositories={repositories} />
            </>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Recommendations</h2>
            <Link
              href="/recommendations"
              className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              View all
            </Link>
          </div>
          <RecommendationsTeaser result={recommendations} />
        </section>
      </main>
    </>
  );
}
