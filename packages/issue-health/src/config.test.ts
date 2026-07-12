import { describe, expect, it } from "vitest";

import {
  IssueHealthConfigError,
  defaultIssueHealthConfig,
  validateIssueHealthConfig,
} from "./config.js";

describe("validateIssueHealthConfig", () => {
  it("accepts the default configuration", () => {
    expect(() => validateIssueHealthConfig(defaultIssueHealthConfig)).not.toThrow();
  });

  it("rejects a non-positive fullClarityDescriptionLength", () => {
    expect(() =>
      validateIssueHealthConfig({ ...defaultIssueHealthConfig, fullClarityDescriptionLength: 0 }),
    ).toThrow(IssueHealthConfigError);
  });

  it("rejects a non-integer fullClarityDescriptionLength", () => {
    expect(() =>
      validateIssueHealthConfig({
        ...defaultIssueHealthConfig,
        fullClarityDescriptionLength: 10.5,
      }),
    ).toThrow(/fullClarityDescriptionLength/);
  });

  it("rejects an empty version", () => {
    expect(() => validateIssueHealthConfig({ ...defaultIssueHealthConfig, version: "  " })).toThrow(
      /version/,
    );
  });
});
