import { describe, expect, it } from "vitest";

import {
  RepositoryHealthConfigError,
  defaultRepositoryHealthConfig,
  validateRepositoryHealthConfig,
} from "./config.js";

describe("validateRepositoryHealthConfig", () => {
  it("accepts the default configuration", () => {
    expect(() => validateRepositoryHealthConfig(defaultRepositoryHealthConfig)).not.toThrow();
  });

  it("rejects a non-positive staleAfterDays", () => {
    expect(() =>
      validateRepositoryHealthConfig({ ...defaultRepositoryHealthConfig, staleAfterDays: 0 }),
    ).toThrow(RepositoryHealthConfigError);
  });

  it("rejects a non-integer staleAfterDays", () => {
    expect(() =>
      validateRepositoryHealthConfig({ ...defaultRepositoryHealthConfig, staleAfterDays: 10.5 }),
    ).toThrow(/staleAfterDays/);
  });

  it("rejects a non-positive maxResponseDays", () => {
    expect(() =>
      validateRepositoryHealthConfig({ ...defaultRepositoryHealthConfig, maxResponseDays: 0 }),
    ).toThrow(/maxResponseDays/);
  });

  it("rejects a non-integer responseSampleSize", () => {
    expect(() =>
      validateRepositoryHealthConfig({
        ...defaultRepositoryHealthConfig,
        responseSampleSize: 2.5,
      }),
    ).toThrow(/responseSampleSize/);
  });

  it("rejects an empty version", () => {
    expect(() =>
      validateRepositoryHealthConfig({ ...defaultRepositoryHealthConfig, version: "" }),
    ).toThrow(/version/);
  });
});
