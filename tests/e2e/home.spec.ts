import { expect, test } from "@playwright/test";

test("landing page renders the project introduction", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/IssueFit/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Find open-source issues that fit you/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "View on GitHub" })).toBeVisible();
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
