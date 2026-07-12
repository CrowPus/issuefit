import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  EnvValidationError,
  databaseUrlSchema,
  parseEnv,
  webEnvSchema,
  workerEnvSchema,
} from "./env.js";

describe("parseEnv", () => {
  it("returns typed values for a valid source", () => {
    const env = parseEnv(workerEnvSchema, {
      NODE_ENV: "production",
      DATABASE_URL: "postgres://issuefit:issuefit@localhost:5432/issuefit",
      LOG_LEVEL: "warn",
    });

    expect(env).toMatchObject({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://issuefit:issuefit@localhost:5432/issuefit",
      LOG_LEVEL: "warn",
      WEEKLY_DIGEST_ENABLED: false,
      WEEKLY_DIGEST_INTERVAL_HOURS: 168,
      WEEKLY_DIGEST_RUN_ON_START: false,
      EMAIL_DELIVERY_MODE: "log",
      EMAIL_FROM: "IssueFit <noreply@localhost>",
    });
  });

  it("applies defaults for optional variables", () => {
    const env = parseEnv(workerEnvSchema, {
      DATABASE_URL: "postgres://issuefit:issuefit@localhost:5432/issuefit",
    });

    expect(env.WEEKLY_DIGEST_ENABLED).toBe(false);
    expect(env.WEEKLY_DIGEST_INTERVAL_HOURS).toBe(168);
    expect(env.EMAIL_DELIVERY_MODE).toBe("log");
  });

  it("ignores unrelated variables present in the source", () => {
    const env = parseEnv(workerEnvSchema, {
      PATH: "/usr/bin",
      DATABASE_URL: "postgres://issuefit:issuefit@localhost:5432/issuefit",
      LOG_LEVEL: "debug",
    });

    expect(env.LOG_LEVEL).toBe("debug");
  });

  it("names every invalid variable in the thrown error", () => {
    const schema = z.object({
      DATABASE_URL: databaseUrlSchema,
      LOG_LEVEL: z.enum(["info", "debug"]),
    });

    let caught: unknown;
    try {
      parseEnv(schema, { LOG_LEVEL: "loud" });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(EnvValidationError);
    const validationError = caught as EnvValidationError;
    expect(validationError.issues).toHaveLength(2);
    expect(validationError.message).toContain("DATABASE_URL");
    expect(validationError.message).toContain("LOG_LEVEL");
  });

  it("rejects values that are not valid for the schema", () => {
    expect(() =>
      parseEnv(workerEnvSchema, {
        NODE_ENV: "staging",
        DATABASE_URL: "postgres://issuefit:issuefit@localhost:5432/issuefit",
      }),
    ).toThrow(EnvValidationError);
  });
});

describe("workerEnvSchema", () => {
  const validSource = {
    DATABASE_URL: "postgres://issuefit:issuefit@localhost:5432/issuefit",
  };

  it("parses boolean and numeric worker controls", () => {
    const env = parseEnv(workerEnvSchema, {
      ...validSource,
      WEEKLY_DIGEST_ENABLED: "true",
      WEEKLY_DIGEST_RUN_ON_START: "1",
      WEEKLY_DIGEST_INTERVAL_HOURS: "24",
    });

    expect(env.WEEKLY_DIGEST_ENABLED).toBe(true);
    expect(env.WEEKLY_DIGEST_RUN_ON_START).toBe(true);
    expect(env.WEEKLY_DIGEST_INTERVAL_HOURS).toBe(24);
  });

  it("requires a webhook URL when webhook delivery is selected", () => {
    expect(() =>
      parseEnv(workerEnvSchema, {
        ...validSource,
        EMAIL_DELIVERY_MODE: "webhook",
      }),
    ).toThrow(/EMAIL_WEBHOOK_URL/);
  });

  it("accepts webhook delivery with a URL", () => {
    const env = parseEnv(workerEnvSchema, {
      ...validSource,
      EMAIL_DELIVERY_MODE: "webhook",
      EMAIL_WEBHOOK_URL: "https://mail.example.test/send",
    });

    expect(env.EMAIL_WEBHOOK_URL).toBe("https://mail.example.test/send");
  });

  it("treats an empty webhook URL as unset in log mode", () => {
    const env = parseEnv(workerEnvSchema, {
      ...validSource,
      EMAIL_DELIVERY_MODE: "log",
      EMAIL_WEBHOOK_URL: "",
    });

    expect(env.EMAIL_WEBHOOK_URL).toBeUndefined();
  });
});

describe("webEnvSchema", () => {
  const validSource = {
    DATABASE_URL: "postgres://issuefit:issuefit@localhost:5432/issuefit",
    BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef",
    GITHUB_CLIENT_ID: "Iv1.abc123",
    GITHUB_CLIENT_SECRET: "secret",
    GITHUB_SERVICE_TOKEN: "ghp_service_token",
  };

  it("accepts a complete source and defaults the app URL", () => {
    const env = parseEnv(webEnvSchema, validSource);

    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
    expect(env.NODE_ENV).toBe("development");
  });

  it("defaults ADMIN_GITHUB_USERNAMES to an empty list", () => {
    expect(parseEnv(webEnvSchema, validSource).ADMIN_GITHUB_USERNAMES).toEqual([]);
  });

  it("parses ADMIN_GITHUB_USERNAMES into a trimmed, non-empty list", () => {
    const env = parseEnv(webEnvSchema, {
      ...validSource,
      ADMIN_GITHUB_USERNAMES: " deeeye2 , octocat ,,",
    });

    expect(env.ADMIN_GITHUB_USERNAMES).toEqual(["deeeye2", "octocat"]);
  });

  it("requires the GitHub service token", () => {
    const { GITHUB_SERVICE_TOKEN: _omitted, ...withoutServiceToken } = validSource;

    expect(() => parseEnv(webEnvSchema, withoutServiceToken)).toThrow(/GITHUB_SERVICE_TOKEN/);
  });

  it("rejects a short auth secret with a helpful message", () => {
    expect(() => parseEnv(webEnvSchema, { ...validSource, BETTER_AUTH_SECRET: "short" })).toThrow(
      /openssl rand/,
    );
  });

  it("requires the GitHub App credentials", () => {
    const { GITHUB_CLIENT_ID: _omitted, ...withoutClientId } = validSource;

    expect(() => parseEnv(webEnvSchema, withoutClientId)).toThrow(/GITHUB_CLIENT_ID/);
  });
});

describe("databaseUrlSchema", () => {
  it("accepts postgres and postgresql connection strings", () => {
    expect(databaseUrlSchema.safeParse("postgres://user:pw@localhost:5432/db").success).toBe(true);
    expect(databaseUrlSchema.safeParse("postgresql://user:pw@db.example.com/db").success).toBe(
      true,
    );
  });

  it("rejects non-postgres URLs and plain strings", () => {
    expect(databaseUrlSchema.safeParse("mysql://user:pw@localhost:3306/db").success).toBe(false);
    expect(databaseUrlSchema.safeParse("not-a-url").success).toBe(false);
  });
});
