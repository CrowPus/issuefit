"use client";

import type { SkillLevel } from "@issuefit/skills";
import { useState } from "react";

import { updateSkillLevelAction } from "../app/profile/actions";

const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

export function SkillLevelSelect({ skillId, level }: { skillId: string; level: SkillLevel }) {
  const [value, setValue] = useState(level);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function onChange(next: SkillLevel) {
    const previous = value;
    setValue(next);
    setStatus("saving");
    const result = await updateSkillLevelAction({ skillId, level: next });
    setStatus(result.status === "error" ? "error" : "idle");
    if (result.status === "error") {
      setValue(previous);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(event) => void onChange(event.target.value as SkillLevel)}
        disabled={status === "saving"}
        aria-label="Skill level"
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm capitalize disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {LEVELS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {status === "error" && (
        <span role="alert" className="text-xs text-red-700 dark:text-red-300">
          Could not save
        </span>
      )}
    </div>
  );
}
