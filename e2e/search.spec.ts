import { test, expect } from "@playwright/test";

test.describe("Search page", () => {
  test("loads with filters and results area", async ({ page }) => {
    await page.goto("/it/cerca");

    // Filter buttons visible
    await expect(page.locator("button").filter({ hasText: /Tutti|Corsa|Viaggio/ }).first()).toBeVisible();

    // Search results area or empty state
    const resultsOrEmpty = page.locator("text=Nessuna corsa trovata").or(page.locator("[data-testid='ride-card']"));
    await expect(resultsOrEmpty.first()).toBeVisible();
  });
});
