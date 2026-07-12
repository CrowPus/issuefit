import { describe, expect, it } from "vitest";

import { detectSetupSignals } from "./detect-setup-signals.js";

describe("detectSetupSignals", () => {
  it("detects the full signal set from typical repository listings", () => {
    expect(
      detectSetupSignals({
        rootFileNames: ["package.json", "pnpm-lock.yaml", "docker-compose.yml", ".nvmrc"],
        workflowFileNames: ["ci.yml", "release.yaml"],
        nvmrcContent: "22.11.0\n",
      }),
    ).toEqual({
      packageManager: "pnpm",
      hasDockerCompose: true,
      nodeVersion: "22.11.0",
      ciWorkflowNames: ["ci.yml", "release.yaml"],
    });
  });

  it("reports measured absence, not guesses, for an empty repository", () => {
    expect(
      detectSetupSignals({ rootFileNames: [], workflowFileNames: null, nvmrcContent: null }),
    ).toEqual({
      packageManager: null,
      hasDockerCompose: false,
      nodeVersion: null,
      ciWorkflowNames: [],
    });
  });

  it("maps each known lockfile to its package manager", () => {
    const expectations: readonly (readonly [string, string])[] = [
      ["pnpm-lock.yaml", "pnpm"],
      ["yarn.lock", "yarn"],
      ["bun.lockb", "bun"],
      ["package-lock.json", "npm"],
      ["Cargo.lock", "cargo"],
      ["go.sum", "go modules"],
      ["Gemfile.lock", "bundler"],
      ["poetry.lock", "poetry"],
      ["uv.lock", "uv"],
      ["Pipfile.lock", "pipenv"],
      ["composer.lock", "composer"],
      ["mix.lock", "mix"],
    ];
    for (const [lockfile, packageManager] of expectations) {
      expect(
        detectSetupSignals({
          rootFileNames: [lockfile],
          workflowFileNames: null,
          nvmrcContent: null,
        }).packageManager,
      ).toBe(packageManager);
    }
  });

  it("prefers the more specific lockfile when several are present", () => {
    expect(
      detectSetupSignals({
        rootFileNames: ["package-lock.json", "pnpm-lock.yaml"],
        workflowFileNames: null,
        nvmrcContent: null,
      }).packageManager,
    ).toBe("pnpm");
  });

  it("recognises every compose file variant, case-insensitively", () => {
    for (const name of [
      "docker-compose.yml",
      "Docker-Compose.YAML",
      "compose.yml",
      "compose.yaml",
    ]) {
      expect(
        detectSetupSignals({ rootFileNames: [name], workflowFileNames: null, nvmrcContent: null })
          .hasDockerCompose,
      ).toBe(true);
    }
  });

  it("keeps only YAML files as CI workflows", () => {
    expect(
      detectSetupSignals({
        rootFileNames: [],
        workflowFileNames: ["ci.yml", "README.md", "deploy.YAML"],
        nvmrcContent: null,
      }).ciWorkflowNames,
    ).toEqual(["ci.yml", "deploy.YAML"]);
  });

  it("treats a blank .nvmrc as no usable version", () => {
    expect(
      detectSetupSignals({
        rootFileNames: [".nvmrc"],
        workflowFileNames: null,
        nvmrcContent: " \n",
      }).nodeVersion,
    ).toBeNull();
  });
});
