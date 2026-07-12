import { findUserById } from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "../../components/app-header";
import { RecommendationList } from "../../components/recommendation-list";
import { isAdminUsername } from "../../lib/admin";
import { getAuth } from "../../lib/auth";
import { getDb } from "../../lib/db";
import { getRecommendationsForUser } from "../../lib/recommendations";

export const metadata: Metadata = {
  title: "Recommendations",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const db = getDb();
  const [user, result] = await Promise.all([
    findUserById(db, session.user.id),
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
        active="recommendations"
        isAdmin={isAdminUsername(user.githubUsername)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Scored deterministically against your skills, career goal, and preferences — never by
            AI. Updated live from the current curated catalogue.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <RecommendationList result={result} />
        </section>
      </main>
    </>
  );
}
