import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SignInButton } from "../../components/sign-in-button";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-6 rounded-xl border border-zinc-200 p-8 shadow-sm dark:border-zinc-800">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-md bg-white px-2 py-1.5">
            <Image
              src="/issuefit-logo.png"
              alt="IssueFit"
              width={526}
              height={167}
              className="h-6 w-auto"
            />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            IssueFit signs you in with your GitHub account and, later, analyses your public activity
            to build your skill profile. Access is read-only; we never act on GitHub on your behalf.
          </p>
        </div>
        {error !== undefined && (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          >
            GitHub sign-in did not complete. Please try again.
          </p>
        )}
        <SignInButton />
      </div>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to the home page
        </Link>
      </p>
    </main>
  );
}
