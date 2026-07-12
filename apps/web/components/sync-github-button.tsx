"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { syncGithubDataAction } from "../app/dashboard/actions";

type SyncState = { status: "idle" | "syncing" } | { status: "error"; message: string };

export function SyncGithubButton() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>({ status: "idle" });

  async function sync() {
    setState({ status: "syncing" });
    const result = await syncGithubDataAction();
    if (result.status === "success") {
      setState({ status: "idle" });
      router.refresh();
    } else {
      setState({ status: "error", message: result.message });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={sync}
        disabled={state.status === "syncing"}
        className="self-start rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {state.status === "syncing" ? "Syncing…" : "Sync GitHub data"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.message}
        </p>
      )}
    </div>
  );
}
