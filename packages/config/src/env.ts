import { z } from "zod";

export const nodeEnvSchema = z.enum(["development", "test", "production"]);
export type NodeEnv = z.infer<typeof nodeEnvSchema>;

export const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace"]);
export type LogLevel = z.infer<typeof logLevelSchema>;

export const databaseUrlSchema = z
  .url({ protocol: /^postgres(ql)?$/ })
  .describe("PostgreSQL connection string, e.g. postgres://user:password@host:5432/database");

export const webEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default("development"),
  DATABASE_URL: databaseUrlSchema,
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "must be at least 32 characters; generate one with `openssl rand -base64 32`"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  /** Read-only token for platform-level reads of curated (non-user) repositories. See ADR-0009. */
  GITHUB_SERVICE_TOKEN: z.string().min(1),
  /** Comma-separated GitHub usernames allowed to access admin pages/actions. */
  ADMIN_GITHUB_USERNAMES: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((username) => username.trim())
        .filter((username) => username.length > 0),
    ),
});
export type WebEnv = z.infer<typeof webEnvSchema>;

const booleanEnvSchema = z
  .string()
  .default("false")
  .transform((value, context) => {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
    context.addIssue({
      code: "custom",
      message: "expected true or false",
    });
    return z.NEVER;
  });

const optionalUrlEnvSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.url().optional(),
);

export const workerEnvSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default("development"),
    DATABASE_URL: databaseUrlSchema,
    LOG_LEVEL: logLevelSchema.default("info"),
    WEEKLY_DIGEST_ENABLED: booleanEnvSchema,
    WEEKLY_DIGEST_INTERVAL_HOURS: z.coerce.number().int().positive().default(168),
    WEEKLY_DIGEST_RUN_ON_START: booleanEnvSchema,
    EMAIL_DELIVERY_MODE: z.enum(["log", "webhook"]).default("log"),
    EMAIL_FROM: z.string().min(1).default("IssueFit <noreply@localhost>"),
    EMAIL_WEBHOOK_URL: optionalUrlEnvSchema,
  })
  .superRefine((env, context) => {
    if (env.EMAIL_DELIVERY_MODE === "webhook" && env.EMAIL_WEBHOOK_URL === undefined) {
      context.addIssue({
        code: "custom",
        path: ["EMAIL_WEBHOOK_URL"],
        message: "is required when EMAIL_DELIVERY_MODE is webhook",
      });
    }
  });
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export class EnvValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(
      `Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`,
    );
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

/**
 * Validates an environment source (usually `process.env`) against a schema.
 * Throws {@link EnvValidationError} naming every invalid or missing variable,
 * so a misconfigured process fails at startup instead of at first use.
 */
export function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  source: Record<string, string | undefined>,
): z.output<Schema> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => {
      const variable = issue.path.join(".") || "(root)";
      return `${variable}: ${issue.message}`;
    });
    throw new EnvValidationError(issues);
  }
  return parsed.data;
}
