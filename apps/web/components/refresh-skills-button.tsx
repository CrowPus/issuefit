"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { refreshSkillProfileAction } from "../app/profile/actions";

type State =
  | { status: "idle" | "refreshing" }
  | { status: "message"; tone: "success" | "error"; text: string };

export function RefreshSkillsButton() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "idle" });

  async function refresh() {
    setState({ status: "refreshing" });
    const result = await refreshSkillProfileAction();
    if (result.status === "success") {
      setState({
        status: "message",
        tone: "success",
        text:
          result.proposedCount === 0
            ? "No languages could be detected from your repositories."
            : `Updated ${result.proposedCount} skill${result.proposedCount === 1 ? "" : "s"} from GitHub.`,
      });
      router.refresh();
    } else if (result.status === "no_repositories") {
      setState({
        status: "message",
        tone: "error",
        text: "Sync your GitHub data on the dashboard first.",
      });
    } else {
      setState({ status: "message", tone: "error", text: result.message });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void refresh()}
        disabled={state.status === "refreshing"}
        className="self-start rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {state.status === "refreshing" ? "Refreshing…" : "Refresh from GitHub"}
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
