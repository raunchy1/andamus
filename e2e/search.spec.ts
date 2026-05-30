import { test, expect } from "@playwright/test";

test.describe("Search page", () => {
  test("loads with filters and results area", async ({ page }) => {
    await page.goto("/it/cerca");

    // Filter buttons visible
    await expect(page.locator("button").filter({ hasText: /Tutti|Gratis|Verificati/ }).first()).toBeVisible({ timeout: 15000 });

    // Search results area or empty state
    const resultsOrEmpty = page.locator("[data-testid='ride-card']").or(page.locator("text=Nessun passaggio"));
    await expect(resultsOrEmpty.first()).toBeVisible({ timeout: 15000 });
  });
});
