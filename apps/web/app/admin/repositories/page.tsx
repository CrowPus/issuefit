import {
  countIssuesByRepositoryId,
  findUserById,
  listCuratedRepositories,
} from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddRepositoryForm } from "../../../components/add-repository-form";
import { AppHeader } from "../../../components/app-header";
import { CuratedRepositoryList } from "../../../components/curated-repository-list";
import { RefreshAllRepositoriesButton } from "../../../components/refresh-all-repositories-button";
import { isAdminUsername } from "../../../lib/admin";
import { getAuth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const metadata: Metadata = {
  title: "Curated repositories",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function AdminRepositoriesPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const db = getDb();
  const user = await findUserById(db, session.user.id);
  if (!user || !isAdminUsername(user.githubUsername)) {
    redirect("/dashboard");
  }

  const repositories = await listCuratedRepositories(db);
  const syncedIssueCounts = new Map(
    await Promise.all(
      repositories.map(
        async (repository) =>
          [repository.id, await countIssuesByRepositoryId(db, repository.id)] as const,
      ),
    ),
  );

  return (
    <>
      <AppHeader userImage={user.image} userName={user.name} active="admin" isAdmin />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Curated repositories</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Click "Sync issues" on a repository to fetch its open issues, detect linked pull
              requests, and measure maintainer responsiveness from first-response times.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/feedback"
              className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800"
            >
              Feedback
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800"
            >
              Analytics
            </Link>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Repositories ({repositories.length})</h2>
            <RefreshAllRepositoriesButton />
          </div>
          <AddRepositoryForm />
          <CuratedRepositoryList
            repositories={repositories}
            syncedIssueCounts={syncedIssueCounts}
          />
        </section>
      </main>
    </>
  );
}
