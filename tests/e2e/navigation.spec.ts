import { expect, test } from "@playwright/test";

test("public navigation surfaces core routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Looking For Group" })).toBeVisible();
  await page.getByRole("link", { name: /Discover groups/i }).click();
  await expect(page).toHaveURL(/\/discover/);
  await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
});
