"use client";

import { useState } from "react";
import { SiGithub } from "react-icons/si";

import { authClient } from "../lib/auth-client";

type SignInStatus = "idle" | "redirecting" | "failed";

export function SignInButton() {
  const [status, setStatus] = useState<SignInStatus>("idle");

  async function signIn() {
    setStatus("redirecting");
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
      errorCallbackURL: "/signin?error=oauth",
    });
    if (error) {
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={signIn}
        disabled={status === "redirecting"}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-5 py-3 text-center font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        <SiGithub aria-hidden className="h-5 w-5" />
        {status === "redirecting" ? "Redirecting to GitHub…" : "Continue with GitHub"}
      </button>
      {status === "failed" && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Could not start GitHub sign-in. Check your connection and try again.
        </p>
      )}
    </div>
  );
}
