import { expect, test } from "@playwright/test";

test("landing page links to sign-in", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Sign in with GitHub" }).click();
  await expect(page).toHaveURL(/\/signin$/);
});

test("sign-in page renders the GitHub button", async ({ page }) => {
  await page.goto("/signin");

  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeEnabled();
});

test("sign-in page explains an OAuth failure", async ({ page }) => {
  await page.goto("/signin?error=oauth");

  // Filtered because Next.js adds its own empty role="alert" route announcer.
  await expect(
    page.getByRole("alert").filter({ hasText: "GitHub sign-in did not complete" }),
  ).toBeVisible();
});

// Exercises the better-auth Drizzle adapter end to end: starting a social
// sign-in writes an OAuth state row before redirecting to GitHub.
test("sign-in endpoint issues a GitHub authorization URL", async ({ request, baseURL }) => {
  const response = await request.post("/api/auth/sign-in/social", {
    headers: { Origin: baseURL ?? "" },
    data: { provider: "github", callbackURL: "/dashboard" },
  });

  expect(response.ok()).toBeTruthy();
  const body: { url?: string } = await response.json();
  expect(body.url).toContain("https://github.com/login/oauth/authorize");
});

test("dashboard redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/signin$/);
});

test("profile page redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/profile");

  await expect(page).toHaveURL(/\/signin$/);
});

test("admin repositories page redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/admin/repositories");

  await expect(page).toHaveURL(/\/signin$/);
});

test("recommendations page redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/recommendations");

  await expect(page).toHaveURL(/\/signin$/);
});

test("issue briefing page redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/recommendations/42");

  await expect(page).toHaveURL(/\/signin$/);
});

test("contributions page redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/contributions");

  await expect(page).toHaveURL(/\/signin$/);
});

test("portfolio page redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/portfolio");

  await expect(page).toHaveURL(/\/signin$/);
});

test("a public profile page is reachable without signing in", async ({ page }) => {
  await page.goto("/u/this-user-does-not-exist");

  await expect(page).toHaveURL(/\/u\/this-user-does-not-exist$/);
  await expect(page.getByRole("heading", { name: "No public portfolio" })).toBeVisible();
});

test("the project directory is reachable without signing in", async ({ page }) => {
  await page.goto("/projects");

  await expect(page).toHaveURL(/\/projects$/);
  await expect(
    page.getByRole("heading", { name: "Projects looking for contributors" }),
  ).toBeVisible();
});

test("an unlisted project page shows a neutral not-listed message", async ({ page }) => {
  await page.goto("/projects/no-such-owner/no-such-project");

  await expect(page.getByRole("heading", { name: "Project not listed" })).toBeVisible();
});

test("project submission redirects anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/projects/submit");

  await expect(page).toHaveURL(/\/signin$/);
});

test("the top-projects rankings are reachable without signing in", async ({ page }) => {
  await page.goto("/projects/top");

  await expect(page.getByRole("heading", { level: 1, name: "Top projects" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Top on IssueFit" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Top 10 on GitHub" })).toBeVisible();
});
