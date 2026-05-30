import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with hero, map and search", async ({ page }) => {
    await page.goto("/it");

    // Brand logo visible in header
    await expect(page.locator("header").getByText("Andamus", { exact: true }).first()).toBeVisible();

    // Search/hero badge present
    await expect(page.getByText("Sardegna Condivisa")).toBeVisible();

    // Global navigation header present
    await expect(page.locator("header nav")).toBeVisible();
  });

  test("can navigate to search page", async ({ page }) => {
    await page.goto("/it");
    // Click specifically on the navigation link to prevent form submit clicks
    await page.click("header nav a[href='/it/cerca']");
    await expect(page).toHaveURL(/\/it\/cerca/, { timeout: 15000 });
  });
});
