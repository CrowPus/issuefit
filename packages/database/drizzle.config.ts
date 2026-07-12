import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnvFile } from "dotenv";
import { defineConfig } from "drizzle-kit";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
loadEnvFile({ path: path.resolve(packageDir, "../../.env"), quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl === "") {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env at the repository root " +
      "and start the local database with `docker compose up -d`.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
