"use client";

import { useState, useTransition } from "react";

import { setProfileVisibilityAction } from "../app/portfolio/actions";

export function ProfileVisibilityToggle({
  username,
  initialVisibility,
}: {
  username: string;
  initialVisibility: "private" | "public";
}) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isPublic = visibility === "public";

  function handleToggle(next: boolean) {
    const nextVisibility = next ? "public" : "private";
    setVisibility(nextVisibility);
    startTransition(async () => {
      const result = await setProfileVisibilityAction({ visibility: nextVisibility });
      if (result.status === "success") {
        setMessage(
          next
            ? "Your public profile is on. Only entries you mark public are shown."
            : "Your public profile is off.",
        );
      } else {
        setVisibility(next ? "private" : "public");
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={isPublic}
          disabled={isPending}
          onChange={(event) => handleToggle(event.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-emerald-600 dark:border-zinc-700"
        />
        Enable my public profile page
      </label>
      {isPublic && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Live at{" "}
          <a
            href={`/u/${username}`}
            className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            /u/{username}
          </a>
        </p>
      )}
      {message !== null && (
        <p aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
}
