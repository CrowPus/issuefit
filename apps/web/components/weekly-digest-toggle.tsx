"use client";

import { useState, useTransition } from "react";

import { updateWeeklyDigestPreferenceAction } from "../app/profile/actions";

export function WeeklyDigestToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(nextEnabled: boolean) {
    setEnabled(nextEnabled);
    setMessage(null);
    startTransition(async () => {
      const result = await updateWeeklyDigestPreferenceAction({ enabled: nextEnabled });
      if (result.status === "error") {
        setEnabled(!nextEnabled);
        setMessage(result.message);
        return;
      }
      setMessage(nextEnabled ? "Weekly digest enabled." : "Weekly digest disabled.");
    });
  }

  return (
    <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(event) => update(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 disabled:opacity-50 dark:border-zinc-700"
      />
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email me weekly recommendations</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Sends a weekly digest when the worker finds active recommendations for your current skill
          profile and goals.
        </span>
        {message !== null && (
          <span aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
            {message}
          </span>
        )}
      </span>
    </label>
  );
}
