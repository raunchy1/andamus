import { test, expect } from "@playwright/test";

test.describe("Auth Modal", () => {
  test("opens and shows login form", async ({ page }) => {
    await page.goto("/it");

    // Click on Accedi button in desktop header to trigger auth modal
    await page.click("header button:has-text('Accedi')");

    // Wait for auth modal to appear
    await expect(page.getByText("Accedi").first()).toBeVisible();
  });
});
