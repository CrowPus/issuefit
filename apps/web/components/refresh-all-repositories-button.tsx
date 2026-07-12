"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { refreshAllRepositoriesAction } from "../app/admin/repositories/actions";

type State =
  | { status: "idle" | "refreshing" }
  | { status: "message"; tone: "success" | "error"; text: string };

export function RefreshAllRepositoriesButton() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "idle" });

  async function refreshAll() {
    setState({ status: "refreshing" });
    const result = await refreshAllRepositoriesAction();
    if (result.status === "error") {
      setState({ status: "message", tone: "error", text: result.message });
      return;
    }
    setState({
      status: "message",
      tone: result.failedCount === 0 ? "success" : "error",
      text: `Refreshed ${result.refreshedCount}, failed ${result.failedCount}.`,
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => void refreshAll()}
        disabled={state.status === "refreshing"}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {state.status === "refreshing" ? "Refreshing all…" : "Refresh all"}
      </button>
      {state.status === "message" && (
        <p
          role={state.tone === "error" ? "alert" : "status"}
          className={
            state.tone === "error"
              ? "text-sm text-red-700 dark:text-red-300"
              : "text-sm text-emerald-700 dark:text-emerald-300"
          }
        >
          {state.text}
        </p>
      )}
    </div>
  );
}
