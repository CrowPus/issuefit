import { findUserById } from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "../../../components/app-header";
import { ManifestGenerator } from "../../../components/manifest-generator";
import { ProjectSubmitForm } from "../../../components/project-submit-form";
import { isAdminUsername } from "../../../lib/admin";
import { getAuth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const metadata: Metadata = {
  title: "Submit your project",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function SubmitProjectPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }
  const user = await findUserById(getDb(), session.user.id);
  if (!user) {
    redirect("/signin");
  }

  return (
    <>
      <AppHeader
        userImage={user.image}
        userName={user.name}
        active="projects"
        isAdmin={isAdminUsername(user.githubUsername)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Submit your project</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            List your repository on the public project directory and its open issues start reaching
            developers whose skills match. Two checks keep the directory honest: you need push
            access to the repository, and it must carry a valid contribution manifest that welcomes
            outside contributors.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <h2 className="text-lg font-semibold">Your repository</h2>
          <ProjectSubmitForm />
        </section>

        <section
          id="manifest-generator"
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Build your contribution manifest</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Answer a few questions and get the exact file to commit. The manifest is an open
              format — it also gives your recommendations a &quot;Maintainer-approved&quot; badge
              and lets you filter what kinds of contributions you receive.
            </p>
          </div>
          <ManifestGenerator />
        </section>
      </main>
    </>
  );
}
