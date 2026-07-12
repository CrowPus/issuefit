import YAML from "yaml";
import type { ZodError } from "zod";

import { contributionManifestSchema, type ContributionManifest } from "./schemas.js";

export type ContributionManifestParseResult =
  { status: "valid"; manifest: ContributionManifest } | { status: "invalid"; errors: string[] };

function formatPath(path: readonly (string | number | symbol)[]): string {
  if (path.length === 0) {
    return "manifest";
  }
  return path.map(String).join(".");
}

function formatZodError(error: ZodError): string[] {
  return error.issues.map((issue) => `${formatPath(issue.path)}: ${issue.message}`);
}

export function parseContributionManifestObject(input: unknown): ContributionManifestParseResult {
  const parsed = contributionManifestSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", errors: formatZodError(parsed.error) };
  }
  return { status: "valid", manifest: parsed.data };
}

export function parseContributionManifestYaml(
  rawManifest: string,
): ContributionManifestParseResult {
  let parsedYaml: unknown;
  try {
    parsedYaml = YAML.parse(rawManifest);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse YAML";
    return { status: "invalid", errors: [`YAML: ${message}`] };
  }
  return parseContributionManifestObject(parsedYaml);
}
