import { parseEnv, webEnvSchema } from "@issuefit/config";
import { createDatabaseClient, type Database, type DatabaseClient } from "@issuefit/database";

let client: DatabaseClient | null = null;

/** Shared connection pool for the web process, created on first use. */
export function getDb(): Database {
  client ??= createDatabaseClient(parseEnv(webEnvSchema, process.env).DATABASE_URL);
  return client.db;
}
