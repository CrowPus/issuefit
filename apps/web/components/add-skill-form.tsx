"use client";

import type { SkillLevel } from "@issuefit/skills";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { addSkillAction } from "../app/profile/actions";

const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

export function AddSkillForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<SkillLevel>("beginner");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);
    const result = await addSkillAction({ name, level });
    if (result.status === "error") {
      setStatus("error");
      setMessage(result.message);
      return;
    }
    setStatus("idle");
    setName("");
    setLevel("beginner");
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="skill-name" className="text-xs text-zinc-500 dark:text-zinc-400">
          Skill name
        </label>
        <input
          id="skill-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={50}
          placeholder="e.g. GraphQL"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="skill-level" className="text-xs text-zinc-500 dark:text-zinc-400">
          Level
        </label>
        <select
          id="skill-level"
          value={level}
          onChange={(event) => setLevel(event.target.value as SkillLevel)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm capitalize dark:border-zinc-700 dark:bg-zinc-900"
        >
          {LEVELS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={status === "saving" || name.trim() === ""}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {status === "saving" ? "Adding…" : "Add skill"}
      </button>
      {status === "error" && message !== null && (
        <p role="alert" className="w-full text-sm text-red-700 dark:text-red-300">
          {message}
        </p>
      )}
    </form>
  );
}
