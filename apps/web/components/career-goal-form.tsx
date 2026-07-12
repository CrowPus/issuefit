"use client";

import type {
  CareerGoalOption,
  IssueDifficultyPreference,
  IssueTypePreference,
} from "@issuefit/skills";
import { type FormEvent, useState } from "react";

import { updateCareerGoalAction } from "../app/profile/actions";
import { careerGoalLabels, issueTypeLabels, type CareerGoalFormValue } from "../lib/career-goal";

const GOAL_OPTIONS = Object.keys(careerGoalLabels) as CareerGoalOption[];
const ISSUE_TYPE_OPTIONS = Object.keys(issueTypeLabels) as IssueTypePreference[];
const DIFFICULTY_OPTIONS: IssueDifficultyPreference[] = ["beginner", "intermediate", "advanced"];

export function CareerGoalForm({ initialValue }: { initialValue: CareerGoalFormValue }) {
  const [goal, setGoal] = useState(initialValue.goal);
  const [goalDetails, setGoalDetails] = useState(initialValue.goalDetails);
  const [preferredLanguages, setPreferredLanguages] = useState(
    initialValue.preferredLanguages.join(", "),
  );
  const [preferredIssueTypes, setPreferredIssueTypes] = useState(initialValue.preferredIssueTypes);
  const [hoursPerWeek, setHoursPerWeek] = useState(initialValue.hoursPerWeek);
  const [difficulty, setDifficulty] = useState(initialValue.difficulty);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function toggleIssueType(type: IssueTypePreference) {
    setPreferredIssueTypes((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);
    const result = await updateCareerGoalAction({
      goal,
      goalDetails: goal === "other" ? goalDetails : undefined,
      preferredLanguages: preferredLanguages
        .split(",")
        .map((language) => language.trim())
        .filter((language) => language.length > 0),
      preferredIssueTypes,
      hoursPerWeek,
      difficulty,
    });
    if (result.status === "error") {
      setStatus("error");
      setMessage(result.message);
      return;
    }
    setStatus("success");
    setMessage("Saved.");
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="goal" className="text-sm font-medium">
          Career goal
        </label>
        <select
          id="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value as CareerGoalOption)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {GOAL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {careerGoalLabels[option]}
            </option>
          ))}
        </select>
      </div>

      {goal === "other" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="goal-details" className="text-sm font-medium">
            Describe your goal
          </label>
          <input
            id="goal-details"
            value={goalDetails}
            onChange={(event) => setGoalDetails(event.target.value)}
            required
            maxLength={200}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="preferred-languages" className="text-sm font-medium">
          Technologies you want to improve
        </label>
        <input
          id="preferred-languages"
          value={preferredLanguages}
          onChange={(event) => setPreferredLanguages(event.target.value)}
          placeholder="TypeScript, Docker, PostgreSQL"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Comma-separated.</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Preferred contribution types</legend>
        <div className="flex flex-wrap gap-3">
          {ISSUE_TYPE_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferredIssueTypes.includes(option)}
                onChange={() => toggleIssueType(option)}
                className="h-4 w-4"
              />
              {issueTypeLabels[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="hours-per-week" className="text-sm font-medium">
          Hours available per week
        </label>
        <input
          id="hours-per-week"
          type="number"
          min={1}
          max={80}
          value={hoursPerWeek}
          onChange={(event) => setHoursPerWeek(Number(event.target.value))}
          className="w-24 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="difficulty" className="text-sm font-medium">
          Preferred issue difficulty
        </label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as IssueDifficultyPreference)}
          className="w-40 rounded-md border border-zinc-300 px-3 py-2 text-sm capitalize dark:border-zinc-700 dark:bg-zinc-900"
        >
          {DIFFICULTY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {status === "saving" ? "Saving…" : "Save career goal"}
        </button>
        {message !== null && (
          <p
            role={status === "error" ? "alert" : "status"}
            className={
              status === "error"
                ? "text-sm text-red-700 dark:text-red-300"
                : "text-sm text-emerald-700 dark:text-emerald-300"
            }
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
