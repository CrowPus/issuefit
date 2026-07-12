import type { Metadata } from "next";

import { PublicShell } from "../../components/public-shell";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <PublicShell>
      <article className="flex flex-col gap-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Terms
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          IssueFit is free, open-source software provided under the Apache License 2.0. These terms
          apply to the hosted service; a self-hosted instance is governed by its own operator.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          The service is provided as-is
        </h2>
        <p>
          IssueFit is offered without warranty of any kind. Recommendations, match scores, and
          briefings are generated deterministically from public data and are informational only —
          always confirm an issue is available and read a project&apos;s contribution guide before
          starting work.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Your content
        </h2>
        <p>
          You own what you write (portfolio summaries, skill edits). By making a portfolio entry
          public you choose to display it on your public profile page; you can make it private again
          at any time.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Acceptable use
        </h2>
        <p>
          Use IssueFit to find and track genuine open-source contributions. Do not use it to harass
          maintainers, spam repositories, or misrepresent your work.
        </p>

        <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">The source</h2>
        <p>
          The full source and license are on{" "}
          <a
            href="https://github.com/CrowPus/IssueFit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            GitHub
          </a>
          .
        </p>
      </article>
    </PublicShell>
  );
}
