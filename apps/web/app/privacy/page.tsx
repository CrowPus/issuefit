import type { Metadata } from "next";

import { PublicShell } from "../../components/public-shell";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <PublicShell>
      <article className="prose-sm flex flex-col gap-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Privacy
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          IssueFit is open-source software (Apache-2.0). This page describes what the hosted service
          stores. If you self-host, you control all of it.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          What we store
        </h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Your GitHub identity (username, name, email, avatar) from sign-in.</li>
          <li>
            Your public repositories&apos; languages, used to propose a skill profile you can edit.
          </li>
          <li>Your skill profile, career goal, recommendation feedback, and contributions.</li>
          <li>
            Portfolio entries generated from your merged contributions. These are private until you
            explicitly make an entry and your profile public.
          </li>
        </ul>

        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          What we never do
        </h2>
        <ul className="list-inside list-disc space-y-1">
          <li>We do not read your private repositories.</li>
          <li>We do not send your data to any AI provider — the service uses none.</li>
          <li>We do not sell your data or show third-party ads.</li>
        </ul>

        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Your control
        </h2>
        <p>
          Your public profile is off by default and opt-in per entry. You can turn it off at any
          time, which immediately hides your profile page. Contact the operator of your instance to
          export or delete your account data.
        </p>
      </article>
    </PublicShell>
  );
}
