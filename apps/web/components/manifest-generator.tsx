"use client";

import {
  CONTRIBUTION_MANIFEST_PATH,
  generateContributionManifestYaml,
  type AiPolicy,
  type ManifestDifficulty,
  type MentorshipAvailability,
  type OpportunityType,
} from "@issuefit/contribution-manifest";
import { useMemo, useState } from "react";

const OPPORTUNITY_TYPES: readonly OpportunityType[] = [
  "bug",
  "documentation",
  "feature",
  "maintenance",
  "performance",
  "refactor",
  "testing",
];
const DIFFICULTIES: readonly ManifestDifficulty[] = ["beginner", "intermediate", "advanced"];
const AI_POLICIES: readonly AiPolicy[] = ["none", "disclosed-assistance", "unrestricted"];
const MENTORSHIP: readonly MentorshipAvailability[] = ["none", "limited", "available"];

const checkboxClass = "h-4 w-4 accent-emerald-600";
const labelClass = "text-xs text-zinc-500 dark:text-zinc-400";
const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/**
 * Builds a ready-to-commit contribution manifest from form input. Fully
 * deterministic: the YAML comes from the schema-validated object, never
 * from an AI (the platform uses no AI providers by design).
 */
export function ManifestGenerator() {
  const [externalContributions, setExternalContributions] = useState(true);
  const [aiPolicy, setAiPolicy] = useState<AiPolicy>("disclosed-assistance");
  const [contributionGuide, setContributionGuide] = useState("CONTRIBUTING.md");
  const [acceptingContributors, setAcceptingContributors] = useState(true);
  const [mentorship, setMentorship] = useState<MentorshipAvailability>("limited");
  const [responseDays, setResponseDays] = useState("7");
  const [allowedTypes, setAllowedTypes] = useState<OpportunityType[]>(["bug", "documentation"]);
  const [skills, setSkills] = useState("");
  const [difficulty, setDifficulty] = useState<ManifestDifficulty[]>(["beginner", "intermediate"]);
  const [testsRequired, setTestsRequired] = useState(true);
  const [discussionRequired, setDiscussionRequired] = useState(true);
  const [draftFirst, setDraftFirst] = useState(false);
  const [copied, setCopied] = useState(false);

  const generated = useMemo(
    () =>
      generateContributionManifestYaml({
        version: 1,
        project: { externalContributions, aiPolicy, contributionGuide },
        maintainerCapacity: {
          acceptingContributors,
          mentorshipAvailable: mentorship,
          expectedResponseDays: Number(responseDays),
        },
        opportunities: {
          allowedTypes,
          preferredSkills: skills
            .split(",")
            .map((skill) => skill.trim())
            .filter((skill) => skill !== ""),
          difficulty,
        },
        qualityRequirements: {
          testsRequired,
          issueDiscussionRequired: discussionRequired,
          draftPullRequestFirst: draftFirst,
        },
      }),
    [
      externalContributions,
      aiPolicy,
      contributionGuide,
      acceptingContributors,
      mentorship,
      responseDays,
      allowedTypes,
      skills,
      difficulty,
      testsRequired,
      discussionRequired,
      draftFirst,
    ],
  );

  async function copyYaml() {
    if (generated.status !== "generated") {
      return;
    }
    await navigator.clipboard.writeText(generated.yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={externalContributions}
              onChange={(event) => setExternalContributions(event.target.checked)}
              className={checkboxClass}
            />
            We accept outside contributions
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptingContributors}
              onChange={(event) => setAcceptingContributors(event.target.checked)}
              className={checkboxClass}
            />
            We are ready for new contributors right now
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="manifest-guide" className={labelClass}>
              Contribution guide path
            </label>
            <input
              id="manifest-guide"
              value={contributionGuide}
              onChange={(event) => setContributionGuide(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="manifest-ai-policy" className={labelClass}>
              AI policy for contributions
            </label>
            <select
              id="manifest-ai-policy"
              value={aiPolicy}
              onChange={(event) => setAiPolicy(event.target.value as AiPolicy)}
              className={inputClass}
            >
              {AI_POLICIES.map((policy) => (
                <option key={policy} value={policy}>
                  {policy}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="manifest-mentorship" className={labelClass}>
              Mentorship for contributors
            </label>
            <select
              id="manifest-mentorship"
              value={mentorship}
              onChange={(event) => setMentorship(event.target.value as MentorshipAvailability)}
              className={inputClass}
            >
              {MENTORSHIP.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="manifest-response-days" className={labelClass}>
              Expected response time (days)
            </label>
            <input
              id="manifest-response-days"
              type="number"
              min={1}
              max={365}
              value={responseDays}
              onChange={(event) => setResponseDays(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <fieldset className="flex flex-col gap-1">
            <legend className={labelClass}>Contribution types you welcome</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {OPPORTUNITY_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={allowedTypes.includes(type)}
                    onChange={() => setAllowedTypes((current) => toggle(current, type))}
                    className={checkboxClass}
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-1">
            <legend className={labelClass}>Difficulty levels you have work for</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {DIFFICULTIES.map((level) => (
                <label key={level} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={difficulty.includes(level)}
                    onChange={() => setDifficulty((current) => toggle(current, level))}
                    className={checkboxClass}
                  />
                  {level}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="manifest-skills" className={labelClass}>
              Preferred skills (comma-separated, optional)
            </label>
            <input
              id="manifest-skills"
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              placeholder="typescript, postgresql, docker"
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={testsRequired}
              onChange={(event) => setTestsRequired(event.target.checked)}
              className={checkboxClass}
            />
            Pull requests must include tests
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={discussionRequired}
              onChange={(event) => setDiscussionRequired(event.target.checked)}
              className={checkboxClass}
            />
            Discuss in the issue before starting work
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draftFirst}
              onChange={(event) => setDraftFirst(event.target.checked)}
              className={checkboxClass}
            />
            Open a draft pull request first
          </label>
        </div>
      </div>

      {generated.status === "generated" ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Commit this file to your repository as{" "}
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {CONTRIBUTION_MANIFEST_PATH}
              </span>
              , then submit again.
            </p>
            <button
              type="button"
              onClick={() => void copyYaml()}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {copied ? "Copied!" : "Copy YAML"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
            {generated.yaml}
          </pre>
        </div>
      ) : (
        <ul role="alert" className="flex flex-col gap-1 text-sm text-red-700 dark:text-red-300">
          {generated.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
