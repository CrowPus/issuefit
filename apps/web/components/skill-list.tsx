import type { UserSkillWithName } from "@issuefit/database";

import { LanguageIcon } from "./language-icon";
import { SkillLevelSelect } from "./skill-level-select";

export function SkillList({ skills }: { skills: readonly UserSkillWithName[] }) {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No skills yet. Sync your GitHub data on the dashboard, then refresh your skill profile below
        — or add one manually.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {skills.map((skill) => (
        <li
          key={skill.skillId}
          className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40"
        >
          <div className="flex items-center gap-3">
            <LanguageIcon language={skill.name} className="h-5 w-5" />
            <div>
              <p className="font-medium">{skill.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {skill.userConfirmed ? "Confirmed by you" : "Detected from GitHub"}
              </p>
            </div>
          </div>
          <SkillLevelSelect skillId={skill.skillId} level={skill.level} />
        </li>
      ))}
    </ul>
  );
}
