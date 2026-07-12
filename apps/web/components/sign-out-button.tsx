"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "../lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await authClient.signOut();
    if (error) {
      setIsSigningOut(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isSigningOut}
      className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
