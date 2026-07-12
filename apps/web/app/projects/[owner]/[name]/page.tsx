import {
  findRepositoryByFullName,
  findUserById,
  listIssuesByRepositoryId,
  type RepositoryRecord,
} from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { AppHeader } from "../../../../components/app-header";
import { PublicShell } from "../../../../components/public-shell";
import { ReadinessBadge } from "../../../../components/readiness-badge";
import { ReadinessChecklist } from "../../../../components/readiness-checklist";
import { isAdminUsername } from "../../../../lib/admin";
import { getAuth } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { readinessForRepository } from "../../../../lib/projects";
import { parseRepositorySlug } from "../../../../lib/repository-slug";

const MAX_ISSUES_SHOWN = 30;

interface PageParams {
  owner: string;
  name: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { owner, name } = await params;
  return { title: `${decodeURIComponent(owner)}/${decodeURIComponent(name)}` };
}

// Reads live project data on every request.
export const dynamic = "force-dynamic";

const sectionClass =
  "flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60";

function NotListed() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Project not listed</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This project is not on the IssueFit directory.{" "}
          <Link
            href="/projects"
            className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            Browse listed projects
          </Link>{" "}
          or, if you maintain it,{" "}
          <Link
            href="/projects/submit"
            className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            submit it
          </Link>
          .
        </p>
      </div>
    </PublicShell>
  );
}

function maintainerWants(repository: RepositoryRecord): string[] {
  const wants: string[] = [];
  if (repository.manifestTestsRequired === true) {
    wants.push("Pull requests must include tests");
  }
  if (repository.manifestIssueDiscussionRequired === true) {
    wants.push("Discuss in the issue before starting work");
  }
  if (repository.manifestDraftPullRequestFirst === true) {
    wants.push("Open a draft pull request first");
  }
  if (repository.manifestAiPolicy !== null) {
    wants.push(`AI policy: ${repository.manifestAiPolicy}`);
  }
  return wants;
}

export default async function ProjectPage({ params }: { params: Promise<PageParams> }) {
  const rawParams = await params;
  const slug = parseRepositorySlug(
    `${decodeURIComponent(rawParams.owner)}/${decodeURIComponent(rawParams.name)}`,
  );
  if (slug === null) {
    return <NotListed />;
  }

  const db = getDb();
  const repository = await findRepositoryByFullName(db, slug.owner, slug.name);
  if (repository === null || !repository.approved) {
    return <NotListed />;
  }

  const [session, issues] = await Promise.all([
    getAuth().api.getSession({ headers: await headers() }),
    listIssuesByRepositoryId(db, repository.id),
  ]);
  const user = session === null ? null : await findUserById(db, session.user.id);
  const readiness = readinessForRepository(repository);
  const openIssues = issues.filter((issue) => issue.state === "open");
  const wants = maintainerWants(repository);

  const setupFacts: string[] = [];
  if (repository.packageManager !== null) {
    setupFacts.push(`Package manager: ${repository.packageManager}`);
  }
  if (repository.nodeVersion !== null) {
    setupFacts.push(`Node ${repository.nodeVersion}`);
  }
  if (repository.hasDockerCompose === true) {
    setupFacts.push("Docker Compose available");
  }
  if ((repository.ciWorkflowNames ?? []).length > 0) {
    setupFacts.push(`CI: ${(repository.ciWorkflowNames ?? []).join(", ")}`);
  }

  const links: { label: string; href: string }[] = [
    { label: "GitHub repository", href: repository.htmlUrl },
  ];
  if (repository.contributingUrl !== null) {
    links.push({ label: "Contributing guide", href: repository.contributingUrl });
  }
  if (repository.codeOfConductUrl !== null) {
    links.push({ label: "Code of conduct", href: repository.codeOfConductUrl });
  }

  const content = (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{repository.fullName}</h1>
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {[
            repository.primaryLanguage,
            `★ ${repository.starsCount.toLocaleString("en-US")}`,
            `${openIssues.length} open ${openIssues.length === 1 ? "issue" : "issues"} synced`,
          ]
            .filter((part): part is string => part !== null)
            .join(" · ")}
        </p>
      </header>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold">Contributor readiness</h2>
        <ReadinessChecklist readiness={readiness} />
      </section>

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold">Maintainer signals</h2>
        {repository.medianFirstResponseDays !== null ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Maintainers respond in{" "}
            <span className="font-semibold">
              ~
              {repository.medianFirstResponseDays < 1
                ? "<1"
                : Math.round(repository.medianFirstResponseDays)}{" "}
              {Math.round(repository.medianFirstResponseDays) === 1 ? "day" : "days"}
            </span>{" "}
            (median first response, measured from real issue sampling
            {repository.firstResponseRate !== null &&
              `; ${Math.round(repository.firstResponseRate * 100)}% of sampled issues got a response`}
            ).
          </p>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Responsiveness not measured yet — it is sampled during issue sync.
          </p>
        )}
        {repository.manifestStatus === "valid" ? (
          <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            {repository.manifestMentorshipAvailable !== null && (
              <li>Mentorship: {repository.manifestMentorshipAvailable}</li>
            )}
            {repository.manifestExpectedResponseDays !== null && (
              <li>
                Maintainers aim to respond within {repository.manifestExpectedResponseDays}{" "}
                {repository.manifestExpectedResponseDays === 1 ? "day" : "days"}
              </li>
            )}
            {repository.manifestAllowedTypes.length > 0 && (
              <li>Welcome contributions: {repository.manifestAllowedTypes.join(", ")}</li>
            )}
            {repository.manifestDifficulty.length > 0 && (
              <li>Difficulty levels: {repository.manifestDifficulty.join(", ")}</li>
            )}
            {repository.manifestPreferredSkills.length > 0 && (
              <li>Preferred skills: {repository.manifestPreferredSkills.join(", ")}</li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This project has no valid contribution manifest yet, so maintainer preferences are
            unknown.
          </p>
        )}
        {wants.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">Before you open a pull request</h3>
            <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-300">
              {wants.map((want) => (
                <li key={want}>{want}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {setupFacts.length > 0 && (
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold">Local setup</h2>
          <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            {setupFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={sectionClass}>
        <h2 className="text-lg font-semibold">Links</h2>
        <ul className="flex flex-wrap gap-4 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                {link.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={sectionClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Open issues</h2>
          {user === null && (
            <Link
              href="/signin"
              className="text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              Sign in to see which issues fit your skills
            </Link>
          )}
        </div>
        {openIssues.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No open issues synced yet. Issues appear after the project&apos;s next sync.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {openIssues.slice(0, MAX_ISSUES_SHOWN).map((issue) => (
              <li key={issue.id} className="flex flex-col gap-1">
                <a
                  href={issue.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                >
                  #{issue.number} {issue.title}
                </a>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {[
                    issue.difficulty,
                    issue.isAssigned ? "assigned" : "unassigned",
                    issue.hasActivePullRequest ? "has an open PR" : null,
                    ...issue.labels.slice(0, 4),
                  ]
                    .filter((part): part is string => part !== null)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
        {openIssues.length > MAX_ISSUES_SHOWN && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {MAX_ISSUES_SHOWN} of {openIssues.length} open issues — the rest are on{" "}
            <a
              href={repository.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        )}
      </section>
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
