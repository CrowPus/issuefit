import YAML from "yaml";

import { parseContributionManifestObject } from "./parse.js";
import type { ContributionManifest } from "./schemas.js";

export type GenerateContributionManifestResult =
  | { status: "generated"; yaml: string; manifest: ContributionManifest }
  | { status: "invalid"; errors: string[] };

/**
 * Turns untrusted form input into a ready-to-commit manifest file. The input
 * is validated through the same schema that submission uses, so a generated
 * file can never be rejected later as invalid (ADR-0020).
 */
export function generateContributionManifestYaml(
  input: unknown,
): GenerateContributionManifestResult {
  const parsed = parseContributionManifestObject(input);
  if (parsed.status === "invalid") {
    return { status: "invalid", errors: parsed.errors };
  }
  return {
    status: "generated",
    yaml: YAML.stringify(parsed.manifest),
    manifest: parsed.manifest,
  };
}
