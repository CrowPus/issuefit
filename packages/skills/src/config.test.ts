import { describe, expect, it } from "vitest";

import {
  SkillInferenceConfigError,
  defaultSkillInferenceConfig,
  validateSkillInferenceConfig,
} from "./config.js";

describe("validateSkillInferenceConfig", () => {
  it("accepts the default configuration", () => {
    expect(() => validateSkillInferenceConfig(defaultSkillInferenceConfig)).not.toThrow();
  });

  it("rejects a non-positive advancedThreshold", () => {
    expect(() =>
      validateSkillInferenceConfig({ ...defaultSkillInferenceConfig, advancedThreshold: 0 }),
    ).toThrow(SkillInferenceConfigError);
  });

  it("rejects a non-integer intermediateThreshold", () => {
    expect(() =>
      validateSkillInferenceConfig({ ...defaultSkillInferenceConfig, intermediateThreshold: 1.5 }),
    ).toThrow(/intermediateThreshold/);
  });

  it("rejects intermediateThreshold at or above advancedThreshold", () => {
    expect(() =>
      validateSkillInferenceConfig({
        ...defaultSkillInferenceConfig,
        advancedThreshold: 3,
        intermediateThreshold: 3,
      }),
    ).toThrow(/lower than advancedThreshold/);
  });

  it("rejects an empty version", () => {
    expect(() =>
      validateSkillInferenceConfig({ ...defaultSkillInferenceConfig, version: "  " }),
    ).toThrow(/version/);
  });
});
