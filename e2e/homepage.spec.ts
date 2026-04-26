import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with hero, map and search", async ({ page }) => {
    await page.goto("/it");

    // Hero title visible
    await expect(page.getByText("ANDAMUS", { exact: true })).toBeVisible();

    // Search elements present
    await expect(page.getByText("CARPOOLING SARDO")).toBeVisible();

    // Bottom nav present
    await expect(page.locator("nav").filter({ hasText: "ESPLORA" })).toBeVisible();
  });

  test("can navigate to search page", async ({ page }) => {
    await page.goto("/it");
    await page.click("text=Cerca");
    await expect(page).toHaveURL(/\/it\/cerca/);
  });
});
