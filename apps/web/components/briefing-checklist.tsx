"use client";

import { useState } from "react";

/**
 * Manual pre-flight checklist. Deliberately client-local state only:
 * checklist state is intentionally not persisted (ADR-0017).
 */
export function BriefingChecklist({ items }: { items: readonly string[] }) {
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());

  function toggle(index: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={item}>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={checked.has(index)}
              onChange={() => toggle(index)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-emerald-600 dark:border-zinc-700"
            />
            <span className={checked.has(index) ? "line-through opacity-60" : undefined}>
              {item}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
