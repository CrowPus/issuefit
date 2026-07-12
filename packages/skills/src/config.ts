export interface SkillInferenceConfig {
  /** Identifies the inference rules that produced a result; bump on changes. */
  version: string;
  /** Repository count at or above which a language is proposed as "advanced". */
  advancedThreshold: number;
  /** Repository count at or above which a language is proposed as "intermediate". */
  intermediateThreshold: number;
  /** Whether forked repositories count toward a language's repository count. */
  includeForks: boolean;
}

export const defaultSkillInferenceConfig: SkillInferenceConfig = {
  version: "1",
  advancedThreshold: 5,
  intermediateThreshold: 2,
  includeForks: false,
};

export class SkillInferenceConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillInferenceConfigError";
  }
}

/**
 * Rejects configurations that would silently distort skill proposals. Called
 * on every inference run, so a bad config fails loudly instead of producing
 * plausible-looking but wrong skill levels.
 */
export function validateSkillInferenceConfig(config: SkillInferenceConfig): void {
  if (!Number.isInteger(config.advancedThreshold) || config.advancedThreshold < 1) {
    throw new SkillInferenceConfigError("advancedThreshold must be a positive integer");
  }
  if (!Number.isInteger(config.intermediateThreshold) || config.intermediateThreshold < 1) {
    throw new SkillInferenceConfigError("intermediateThreshold must be a positive integer");
  }
  if (config.intermediateThreshold >= config.advancedThreshold) {
    throw new SkillInferenceConfigError(
      "intermediateThreshold must be lower than advancedThreshold",
    );
  }
  if (config.version.trim() === "") {
    throw new SkillInferenceConfigError("version must not be empty");
  }
}
