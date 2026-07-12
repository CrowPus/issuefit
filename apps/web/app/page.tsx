import Image from "next/image";
import Link from "next/link";
import { LuGitPullRequest, LuSparkles, LuTarget } from "react-icons/lu";
import { SiGithub } from "react-icons/si";

import { Wordmark } from "../components/wordmark";

const REPOSITORY_URL = "https://github.com/CrowPus/IssueFit";

const features = [
  {
    icon: LuTarget,
    title: "Transparent match scores",
    description:
      "A deterministic engine scores every issue against your skills, goals, and preferences — and shows you exactly why. No black boxes.",
  },
  {
    icon: LuSparkles,
    title: "Deterministic issue briefings",
    description:
      "Open a recommendation and get a structured briefing from real data: the contribution guide, local setup signals, maintainer responsiveness, and a pre-flight checklist. No AI, no invented content.",
  },
  {
    icon: LuGitPullRequest,
    title: "Verified portfolio",
    description:
      "Track each contribution from selection to merged pull request, then turn it into a portfolio entry you can share with employers.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="inline-flex items-center rounded-md bg-white px-2 py-1.5">
          <Image
            src="/issuefit-logo.png"
            alt="IssueFit"
            width={526}
            height={167}
            priority
            className="h-7 w-auto"
          />
        </span>
        <Link
          href="/signin"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-4 py-12 sm:gap-16 sm:px-6 sm:py-16">
        <section className="flex flex-col items-start gap-6">
          <p className="rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
            Open source · Apache-2.0 · In early development
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Find open-source issues that <span className="text-teal-500">fit you</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            IssueFit analyses your GitHub activity, builds an editable skill profile, and recommends
            open-source issues that match your skills, interests, and career goals — then helps you
            track each contribution to a merged pull request.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-3 font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <SiGithub aria-hidden className="h-5 w-5" />
              Sign in with GitHub
            </Link>
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-5 py-3 font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              View on GitHub
            </a>
          </div>
        </section>

        <section aria-label="What IssueFit does" className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
            >
              <feature.icon aria-hidden className="h-6 w-6 text-teal-500" />
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 sm:px-6">
          <p>
            <Wordmark /> is free software under Apache-2.0.
          </p>
          <nav aria-label="Footer" className="flex gap-5">
            <Link
              href="/how-it-works"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              How it works
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Terms
            </Link>
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              GitHub
            </a>
            <a
              href={`${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Contributing
            </a>
            <a
              href={`${REPOSITORY_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              License
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
