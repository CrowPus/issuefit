"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { addRepositoryAction } from "../app/admin/repositories/actions";

type Status = "idle" | "saving" | "error";

export function AddRepositoryForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);
    const result = await addRepositoryAction(slug);
    if (result.status === "error") {
      setStatus("error");
      setMessage(result.message);
      return;
    }
    setStatus("idle");
    setSlug("");
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="repository-slug" className="text-xs text-zinc-500 dark:text-zinc-400">
          Repository
        </label>
        <input
          id="repository-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
          placeholder="owner/name, e.g. facebook/react"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={status === "saving" || slug.trim() === ""}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {status === "saving" ? "Adding…" : "Add repository"}
      </button>
      {status === "error" && message !== null && (
        <p role="alert" className="w-full text-sm text-red-700 dark:text-red-300">
          {message}
        </p>
      )}
    </form>
  );
}
