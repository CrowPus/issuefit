import { defineConfig, devices } from "@playwright/test";

const isCI = process.env.CI !== undefined;
// Overridable so e2e can run against a fresh server (Next.js honors PORT)
// while a long-lived `pnpm dev` occupies :3000 — a stale dev server's module
// graph does not reflect freshly rebuilt workspace packages.
const port = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // CI runs against the production build (built in a previous step);
    // local runs use the dev server so no build is required.
    command: isCI ? "pnpm --filter @issuefit/web start" : "pnpm --filter @issuefit/web dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
