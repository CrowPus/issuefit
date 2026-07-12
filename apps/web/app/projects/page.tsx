import { findUserById, listPublicProjects } from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { AppHeader } from "../../components/app-header";
import { PublicShell } from "../../components/public-shell";
import { ReadinessBadge } from "../../components/readiness-badge";
import { isAdminUsername } from "../../lib/admin";
import { getAuth } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { toDirectoryProjects, type DirectoryProject } from "../../lib/projects";
import { getRecommendationsForUser } from "../../lib/recommendations";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Open-source projects that want contributors — with measured maintainer responsiveness and a contributor-readiness grade for each.",
};

// Reads live directory data on every request.
export const dynamic = "force-dynamic";

function formatResponse(medianDays: number | null): string | null {
  if (medianDays === null) {
    return null;
  }
  return `responds in ~${medianDays < 1 ? "<1" : Math.round(medianDays)}d`;
}

function ProjectCard({
  project,
  topMatchCount,
}: {
  project: DirectoryProject;
  topMatchCount: number | null;
}) {
  const { repository, readiness, openIssueCount } = project;
  const meta: string[] = [];
  if (repository.primaryLanguage !== null) {
    meta.push(repository.primaryLanguage);
  }
  meta.push(`★ ${repository.starsCount.toLocaleString("en-US")}`);
  meta.push(`${openIssueCount} open ${openIssueCount === 1 ? "issue" : "issues"} synced`);
  const response = formatResponse(repository.medianFirstResponseDays);
  if (response !== null) {
    meta.push(response);
  }
  if (repository.manifestMentorshipAvailable === "available") {
    meta.push("mentorship available");
  } else if (repository.manifestMentorshipAvailable === "limited") {
    meta.push("limited mentorship");
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/projects/${repository.owner}/${repository.name}`}
          className="text-base font-semibold text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
        >
          {repository.fullName}
        </Link>
        <ReadinessBadge grade={readiness.grade} score={readiness.score} />
        {repository.source === "submitted" && (
          <span className="inline-flex items-center rounded-full border border-emerald-300 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
            Maintainer-submitted
          </span>
        )}
      </div>
      {repository.description !== null && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{repository.description}</p>
      )}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{meta.join(" · ")}</p>
      {topMatchCount !== null && topMatchCount > 0 && (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {topMatchCount} of your top recommendations {topMatchCount === 1 ? "is" : "are"} from this
          project
        </p>
      )}
    </li>
  );
}

export default async function ProjectsPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const db = getDb();
  const projects = toDirectoryProjects(await listPublicProjects(db));

  const user = session === null ? null : await findUserById(db, session.user.id);
  const topMatchesByRepositoryId = new Map<string, number>();
  if (user !== null) {
    const { topRecommendations } = await getRecommendationsForUser(user.id);
    for (const recommendation of topRecommendations) {
      const repositoryId = recommendation.repository.id;
      topMatchesByRepositoryId.set(
        repositoryId,
        (topMatchesByRepositoryId.get(repositoryId) ?? 0) + 1,
      );
    }
  }

  const content = (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Projects looking for contributors</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/projects/top"
              className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-300"
            >
              Top projects
            </Link>
            <Link
              href="/projects/submit"
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Submit your project
            </Link>
          </div>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Every project shows measured signals — maintainer response times come from real
          first-response sampling, never estimates. Ordered by contributor readiness.
        </p>
      </header>
      {projects.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
          No projects are listed yet. Maintain a repository? Be the first to submit it.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.repository.id}
              project={project}
              topMatchCount={
                user === null ? null : (topMatchesByRepositoryId.get(project.repository.id) ?? 0)
              }
            />
          ))}
        </ul>
      )}
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
