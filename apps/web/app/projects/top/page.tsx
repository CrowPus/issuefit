import {
  findUserById,
  listContributionCountsByRepository,
  listPublicProjects,
} from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { AppHeader } from "../../../components/app-header";
import { PublicShell } from "../../../components/public-shell";
import { ReadinessBadge } from "../../../components/readiness-badge";
import { isAdminUsername } from "../../../lib/admin";
import { getAuth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { rankIssueFitTopProjects } from "../../../lib/projects";
import { getGithubTopRepositories } from "../../../lib/top-projects";

export const metadata: Metadata = {
  title: "Top projects",
  description:
    "The most contributor-ready projects on IssueFit, and the most starred repositories on GitHub.",
};

// Reads live ranking data (and may lazily refresh the GitHub list) per request.
export const dynamic = "force-dynamic";

const TOP_LIMIT = 10;

const sectionClass =
  "flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function TopProjectsPage() {
  const db = getDb();
  const [session, listings, contributionCounts, githubTop] = await Promise.all([
    getAuth().api.getSession({ headers: await headers() }),
    listPublicProjects(db),
    listContributionCountsByRepository(db),
    getGithubTopRepositories(),
  ]);
  const user = session === null ? null : await findUserById(db, session.user.id);
  const issuefitTop = rankIssueFitTopProjects(listings, contributionCounts, TOP_LIMIT);

  const content = (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Top projects</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Two honest rankings: IssueFit&apos;s own list rewards being good to contributors
          (readiness plus real contributions through the platform — a merged contribution counts 10
          points, a started one 2), and GitHub&apos;s list is simply the most-starred repositories,
          updated daily.
        </p>
      </header>

      <section className={sectionClass}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Top on IssueFit</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Contributor readiness + contributions started and merged through IssueFit.
          </p>
        </div>
        {issuefitTop.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No projects are listed yet —{" "}
            <Link
              href="/projects/submit"
              className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              submit yours
            </Link>{" "}
            to claim the top spot.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {issuefitTop.map((project, index) => (
              <li key={project.repository.id} className="flex items-baseline gap-3">
                <span className="w-6 shrink-0 text-right text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                  {index + 1}.
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/projects/${project.repository.owner}/${project.repository.name}`}
                    className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                  >
                    {project.repository.fullName}
                  </Link>
                  <ReadinessBadge grade={project.readiness.grade} score={project.readiness.score} />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {project.topScore} pts
                    {project.startedCount > 0 && ` · ${project.startedCount} started via IssueFit`}
                    {project.mergedCount > 0 && ` · ${project.mergedCount} merged`}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={sectionClass}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Top 10 on GitHub</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Most starred public repositories, from GitHub&apos;s search API
            {githubTop.fetchedAt !== null && ` — updated ${formatDate(githubTop.fetchedAt)}`}.
          </p>
        </div>
        {githubTop.repositories.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Not available yet — the list could not be fetched from GitHub. It is retried on the next
            visit.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {githubTop.repositories.map((repository) => (
              <li key={repository.id} className="flex items-baseline gap-3">
                <span className="w-6 shrink-0 text-right text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                  {repository.rank}.
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a
                      href={repository.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                    >
                      {repository.fullName} ↗
                    </a>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      ★ {repository.starsCount.toLocaleString("en-US")}
                      {repository.primaryLanguage !== null && ` · ${repository.primaryLanguage}`}
                    </span>
                  </div>
                  {repository.description !== null && (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {repository.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link
          href="/projects"
          className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          ← Browse the full project directory
        </Link>
      </p>
    </div>
  );

  if (user === null) {
    return <PublicShell>{content}</PublicShell>;
  }
  return (
    <>
      <AppHeader
        userImage={user.image}
        userName={user.name}
        active="projects"
        isAdmin={isAdminUsername(user.githubUsername)}
      />
      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {content}
      </main>
    </>
  );
}
