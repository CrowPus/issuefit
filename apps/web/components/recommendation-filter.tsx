import { useMemo, useState, useRef, useEffect } from "react";
import type { Recommendation } from "../lib/recommendations";

export interface FilterState {
  languages: string[];
  difficulties: string[];
  labels: string[];
  repositories: string[];
}

interface FilterBarProps {
  recommendations: Recommendation[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

function FilterDropdown({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (options.length === 0) return null;

  const displayCount = selected.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-50 rounded-md transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        {title}
        {displayCount > 0 && (
          <span className="flex items-center justify-center bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 text-xs rounded-full min-w-[20px] h-5 px-1 font-semibold">
            {displayCount}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 max-h-80 overflow-y-auto">
          <div className="p-2 flex flex-col gap-1">
            {options.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-3 px-2 py-2 text-sm rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-zinc-50 dark:bg-zinc-900/50" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => onToggle(opt)}
                  />
                  <div
                    className={`flex w-4 h-4 items-center justify-center rounded border ${isSelected ? "border-zinc-800 bg-zinc-800 text-white dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-900" : "border-zinc-300 dark:border-zinc-700"}`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    )}
                  </div>
                  <span className="truncate flex-1">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({ recommendations, filters, onChange }: FilterBarProps) {
  // Extract unique options across all recommendations
  const options = useMemo(() => {
    const langs = new Set<string>();
    const diffs = new Set<string>();
    const lbls = new Set<string>();
    const repos = new Set<string>();

    recommendations.forEach((rec) => {
      if (rec.repository.primaryLanguage) langs.add(rec.repository.primaryLanguage);
      if (rec.issue.difficulty) diffs.add(rec.issue.difficulty);
      if (rec.repository.fullName) repos.add(rec.repository.fullName);
      if (rec.issue.labels) {
        rec.issue.labels.forEach((label: string) => lbls.add(label));
      }
    });

    return {
      languages: Array.from(langs).sort(),
      difficulties: Array.from(diffs).sort(),
      labels: Array.from(lbls).sort(),
      repositories: Array.from(repos).sort(),
    };
  }, [recommendations]);

  const toggleFilter = (category: keyof FilterState, value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    onChange({
      ...filters,
      [category]: updated,
    });
  };

  const clearOptions = () => {
    onChange({ languages: [], difficulties: [], labels: [], repositories: [] });
  };

  const hasAnyFilters =
    filters.languages.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.labels.length > 0 ||
    filters.repositories.length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              ></path>
            </svg>
            Filters
          </h3>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              title="Repository"
              options={options.repositories}
              selected={filters.repositories}
              onToggle={(val) => toggleFilter("repositories", val)}
            />
            <FilterDropdown
              title="Language"
              options={options.languages}
              selected={filters.languages}
              onToggle={(val) => toggleFilter("languages", val)}
            />
            <FilterDropdown
              title="Difficulty"
              options={options.difficulties}
              selected={filters.difficulties}
              onToggle={(val) => toggleFilter("difficulties", val)}
            />
            <FilterDropdown
              title="Issue Type"
              options={options.labels}
              selected={filters.labels}
              onToggle={(val) => toggleFilter("labels", val)}
            />
          </div>
        </div>

        {hasAnyFilters && (
          <button
            onClick={clearOptions}
            className="text-sm px-3 py-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Clear all
          </button>
        )}
      </div>

      {hasAnyFilters && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 mt-1">
          {filters.repositories.map((val) => (
            <span
              key={`repo-${val}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span className="text-zinc-500 dark:text-zinc-400 font-normal">Repository:</span>{" "}
              {val}
              <button
                onClick={() => toggleFilter("repositories", val)}
                className="opacity-60 hover:opacity-100 ml-0.5"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </span>
          ))}
          {filters.languages.map((val) => (
            <span
              key={`lang-${val}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span className="text-zinc-500 dark:text-zinc-400 font-normal">Language:</span> {val}
              <button
                onClick={() => toggleFilter("languages", val)}
                className="opacity-60 hover:opacity-100 ml-0.5"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </span>
          ))}
          {filters.difficulties.map((val) => (
            <span
              key={`diff-${val}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 capitalize"
            >
              <span className="text-zinc-500 dark:text-zinc-400 font-normal">Difficulty:</span>{" "}
              {val}
              <button
                onClick={() => toggleFilter("difficulties", val)}
                className="opacity-60 hover:opacity-100 ml-0.5"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </span>
          ))}
          {filters.labels.map((val) => (
            <span
              key={`lbl-${val}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span className="text-zinc-500 dark:text-zinc-400 font-normal">Type:</span> {val}
              <button
                onClick={() => toggleFilter("labels", val)}
                className="opacity-60 hover:opacity-100 ml-0.5"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
