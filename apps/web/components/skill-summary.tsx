import type { UserSkillWithName } from "@issuefit/database";

import { LanguageIcon } from "./language-icon";

const levelStyles = {
  beginner: "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
  intermediate: "border-sky-300 text-sky-700 dark:border-sky-800 dark:text-sky-300",
  advanced: "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
} as const;

/** Read-only skill overview for the dashboard; editing lives on /profile. */
export function SkillSummary({ skills }: { skills: readonly UserSkillWithName[] }) {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No skills yet. Open your skill profile to generate them from your synced GitHub data.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <li
          key={skill.skillId}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${levelStyles[skill.level]}`}
        >
          <LanguageIcon language={skill.name} className="h-3.5 w-3.5" />
          <span className="font-medium">{skill.name}</span>
          <span className="capitalize opacity-80">{skill.level}</span>
        </li>
      ))}
    </ul>
  );
}
