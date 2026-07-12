import { findCareerGoalByUserId, findUserById, listUserSkillsWithNames } from "@issuefit/database";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AddSkillForm } from "../../components/add-skill-form";
import { AppHeader } from "../../components/app-header";
import { CareerGoalForm } from "../../components/career-goal-form";
import { RefreshSkillsButton } from "../../components/refresh-skills-button";
import { SkillList } from "../../components/skill-list";
import { WeeklyDigestToggle } from "../../components/weekly-digest-toggle";
import { isAdminUsername } from "../../lib/admin";
import { getAuth } from "../../lib/auth";
import { toCareerGoalFormValue } from "../../lib/career-goal";
import { getDb } from "../../lib/db";

export const metadata: Metadata = {
  title: "Skill profile",
};

// Session-gated: must render per request, never at build time.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/signin");
  }

  const db = getDb();
  const [user, skills, careerGoal] = await Promise.all([
    findUserById(db, session.user.id),
    listUserSkillsWithNames(db, session.user.id),
    findCareerGoalByUserId(db, session.user.id),
  ]);
  if (!user) {
    redirect("/signin");
  }

  return (
    <>
      <AppHeader
        userImage={user.image}
        userName={user.name}
        active="profile"
        isAdmin={isAdminUsername(user.githubUsername)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Skill profile</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Editable — GitHub-derived skills can be adjusted or replaced at any time.
          </p>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Skills</h2>
            <RefreshSkillsButton />
          </div>
          <SkillList skills={skills} />
          <AddSkillForm />
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <h2 className="text-lg font-semibold">Career goal</h2>
          <CareerGoalForm initialValue={toCareerGoalFormValue(careerGoal)} />
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
          <h2 className="text-lg font-semibold">Digest</h2>
          <WeeklyDigestToggle initialEnabled={user.weeklyDigestEmailEnabled} />
        </section>
      </main>
    </>
  );
}
