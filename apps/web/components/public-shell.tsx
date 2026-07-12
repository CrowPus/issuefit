import Link from "next/link";

import { Wordmark } from "./wordmark";

/** Header/footer chrome for unauthenticated public pages (content + profiles). */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label="IssueFit home">
            <Wordmark className="text-lg" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/projects"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Projects
            </Link>
            <Link
              href="/signin"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-4 px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 sm:px-6">
          <Link href="/how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            How it works
          </Link>
          <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
