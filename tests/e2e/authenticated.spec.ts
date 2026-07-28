import { expect, test } from "@playwright/test";

test("development credentials can access dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@example.com");
  await page.getByLabel("Display name").fill("Alex");
  await page.getByRole("button", { name: "Continue with test account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("link", { name: "Create Post" }).click();
  await expect(page).toHaveURL(/\/lfg\/new/);
  await expect(page.getByRole("heading", { name: "Create LFG post" })).toBeVisible();
});
