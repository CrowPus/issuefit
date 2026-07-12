import type { RepositorySetupSignals } from "./types.js";

/**
 * Lockfiles that identify a package/dependency manager, checked in order —
 * the first match wins when a repository carries several. The table is a
 * deliberate fixed list (ADR-0017): ecosystems outside it are reported as
 * "not detected", never guessed.
 */
const LOCKFILE_PACKAGE_MANAGERS: readonly (readonly [string, string])[] = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["package-lock.json", "npm"],
  ["cargo.lock", "cargo"],
  ["go.sum", "go modules"],
  ["gemfile.lock", "bundler"],
  ["poetry.lock", "poetry"],
  ["uv.lock", "uv"],
  ["pipfile.lock", "pipenv"],
  ["composer.lock", "composer"],
  ["mix.lock", "mix"],
];

const COMPOSE_FILE_NAMES = new Set([
  "docker-compose.yml",
  "docker-compose.yaml",
  "compose.yml",
  "compose.yaml",
]);

function isWorkflowFile(name: string): boolean {
  const lowered = name.toLowerCase();
  return lowered.endsWith(".yml") || lowered.endsWith(".yaml");
}

export interface DetectSetupSignalsInput {
  /** File names in the repository root. */
  rootFileNames: readonly string[];
  /** File names in `.github/workflows`; null when the directory is absent. */
  workflowFileNames: readonly string[] | null;
  /** Raw `.nvmrc` contents; null when the file is absent or unreadable. */
  nvmrcContent: string | null;
}

/**
 * Derives local setup signals for the issue briefing from directory
 * listings alone (ADR-0017). Pure and deterministic: no file contents are
 * inspected except the already-fetched `.nvmrc`, and every "absent" result
 * is a measured absence, not a guess.
 */
export function detectSetupSignals(input: DetectSetupSignalsInput): RepositorySetupSignals {
  const rootNames = new Set(input.rootFileNames.map((name) => name.toLowerCase()));

  const packageManager =
    LOCKFILE_PACKAGE_MANAGERS.find(([lockfile]) => rootNames.has(lockfile))?.[1] ?? null;

  const hasDockerCompose = [...COMPOSE_FILE_NAMES].some((name) => rootNames.has(name));

  const nodeVersion = (() => {
    if (input.nvmrcContent === null) {
      return null;
    }
    const trimmed = input.nvmrcContent.trim();
    return trimmed === "" ? null : trimmed;
  })();

  const ciWorkflowNames = (input.workflowFileNames ?? []).filter(isWorkflowFile);

  return { packageManager, hasDockerCompose, nodeVersion, ciWorkflowNames };
}
