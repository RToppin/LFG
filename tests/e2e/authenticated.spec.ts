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

test("approved game selector creates posts and rejects tampered game IDs", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alex@example.com");
  await page.getByLabel("Display name").fill("Alex");
  await page.getByRole("button", { name: "Continue with test account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/lfg/new");

  await page.getByLabel("Game search").fill("Valheim");
  await page.getByRole("option", { name: /Valheim/i }).click();
  await page.getByLabel("Post title").fill(`Valheim approved catalog ${Date.now()}`);
  await page
    .getByLabel("Description")
    .fill("A full end-to-end approved catalog post for Valheim with friendly co-op players.");
  await page.getByLabel("Planned start").fill("2026-08-05T19:30");
  await page.getByRole("button", { name: "Preview and publish" }).click();
  await expect(page).toHaveURL(/\/lfg\//);
  await expect(page.getByText("Valheim").first()).toBeVisible();

  await page.goto("/lfg/new");
  await page.getByLabel("Post title").fill("Invalid catalog tamper attempt");
  await page
    .getByLabel("Description")
    .fill("This submission tampers with the hidden game ID and should be rejected by the server.");
  await page.getByLabel("Planned start").fill("2026-08-06T19:30");
  await page.locator('input[name="gameId"]').evaluate((input) => {
    (input as HTMLInputElement).value = "invalid-game-id";
  });
  await page.getByRole("button", { name: "Preview and publish" }).click();
  await expect(page.getByText("This game is not currently approved for LFG listings.")).toBeVisible();
});

