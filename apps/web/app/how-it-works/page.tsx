import type { Metadata } from "next";

import { PublicShell } from "../../components/public-shell";

export const metadata: Metadata = {
  title: "How it works",
};

const steps = [
  {
    title: "Connect GitHub",
    body: "Sign in with GitHub. IssueFit reads your public repositories to understand the languages and technologies you already work with.",
  },
  {
    title: "Build a skill profile",
    body: "A deterministic analysis proposes a skill per language from your repositories. You edit it freely and set a career goal — sync never overwrites your manual edits.",
  },
  {
    title: "Get transparent recommendations",
    body: "A deterministic engine scores every curated open issue against your skills, goals, and preferences, and shows the exact reasons. No AI, no black box.",
  },
  {
    title: "Read a deterministic briefing",
    body: "Opening a recommendation shows the score breakdown, the repository's contribution guide, local setup signals, measured maintainer responsiveness, and the maintainer's own requirements — all from real data, with a manual pre-flight checklist.",
  },
  {
    title: "Track your contribution",
    body: "Start a contribution and move it through selected, working, PR opened, and merged — recording your pull request and branch as you go.",
  },
  {
    title: "Build a verified portfolio",
    body: "When a contribution merges, IssueFit generates a portfolio entry from your structured data. You choose what to make public on your profile page.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <h1 className="text-3xl font-bold tracking-tight">How IssueFit works</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        IssueFit matches developers with open-source issues that fit their skills and career goals.
        Every score and briefing is deterministic and explainable — the MVP uses no AI provider at
        all.
      </p>
      <ol className="mt-8 flex flex-col gap-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-sm font-semibold text-teal-700 dark:text-teal-300">
              {index + 1}
            </span>
            <div>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </PublicShell>
  );
}
