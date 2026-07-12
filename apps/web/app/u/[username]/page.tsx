import Image from "next/image";
import type { Metadata } from "next";

import { PublicShell } from "../../../components/public-shell";
import { getPublicPortfolio } from "../../../lib/portfolio";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} · Portfolio` };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const portfolio = await getPublicPortfolio(username);

  // Same neutral response whether the profile is private, empty, or the
  // username does not exist — the page discloses nothing (ADR-0019).
  if (portfolio === null) {
    return (
      <PublicShell>
        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950/60">
          <h1 className="text-xl font-semibold">No public portfolio</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            This profile is private or has no public entries.
          </p>
        </div>
      </PublicShell>
    );
  }

  const { user, entries } = portfolio;

  return (
    <PublicShell>
      <header className="flex items-center gap-4">
        {user.image !== null && (
          <Image src={user.image} alt="" width={56} height={56} className="rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          <a
            href={`https://github.com/${user.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            @{user.githubUsername}
          </a>
        </div>
      </header>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Verified contributions
      </h2>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          No public entries to show yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {entries.map(({ entry, contribution, recommendation }) => (
            <li
              key={entry.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{entry.title}</h3>
                {contribution.prUrl !== null && (
                  <a
                    href={contribution.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                  >
                    Pull request
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                <span>{recommendation.repositoryFullName}</span>
                {contribution.completedAt !== null && (
                  <span>Merged {formatDate(contribution.completedAt)}</span>
                )}
                {entry.reviewRounds !== null && <span>{entry.reviewRounds} review rounds</span>}
              </div>
              {entry.summary !== null && (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{entry.summary}</p>
              )}
              {entry.skillsDemonstrated.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.skillsDemonstrated.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </PublicShell>
  );
}
