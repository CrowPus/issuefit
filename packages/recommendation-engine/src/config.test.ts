import { describe, expect, it } from "vitest";

import { ScoringConfigError, defaultScoringConfig, validateScoringConfig } from "./config.js";

describe("validateScoringConfig", () => {
  it("accepts the default configuration", () => {
    expect(() => validateScoringConfig(defaultScoringConfig)).not.toThrow();
  });

  it("rejects weights that do not sum to 1", () => {
    const config = {
      ...defaultScoringConfig,
      weights: { ...defaultScoringConfig.weights, skillMatch: 0.5 },
    };
    expect(() => validateScoringConfig(config)).toThrow(ScoringConfigError);
    expect(() => validateScoringConfig(config)).toThrow(/sum to 1/);
  });

  it("rejects negative weights", () => {
    const config = {
      ...defaultScoringConfig,
      weights: { ...defaultScoringConfig.weights, skillMatch: -0.1, freshness: 0.5 },
    };
    expect(() => validateScoringConfig(config)).toThrow(/skillMatch/);
  });

  it("rejects a non-positive stale threshold", () => {
    expect(() => validateScoringConfig({ ...defaultScoringConfig, staleAfterDays: 0 })).toThrow(
      /staleAfterDays/,
    );
  });

  it("rejects a negative minimum description length", () => {
    expect(() =>
      validateScoringConfig({ ...defaultScoringConfig, minDescriptionLength: -1 }),
    ).toThrow(/minDescriptionLength/);
  });

  it("rejects out-of-range unknownSignalScore and reasonThreshold", () => {
    expect(() =>
      validateScoringConfig({ ...defaultScoringConfig, unknownSignalScore: 1.2 }),
    ).toThrow(/unknownSignalScore/);
    expect(() => validateScoringConfig({ ...defaultScoringConfig, reasonThreshold: -0.2 })).toThrow(
      /reasonThreshold/,
    );
  });

  it("rejects out-of-range manifest boosts", () => {
    expect(() =>
      validateScoringConfig({ ...defaultScoringConfig, manifestPresenceBoost: 0.2 }),
    ).toThrow(/manifestPresenceBoost/);
    expect(() =>
      validateScoringConfig({ ...defaultScoringConfig, manifestPreferredSkillBoost: -0.01 }),
    ).toThrow(/manifestPreferredSkillBoost/);
  });

  it("rejects an empty version", () => {
    expect(() => validateScoringConfig({ ...defaultScoringConfig, version: "  " })).toThrow(
      /version/,
    );
  });
});
