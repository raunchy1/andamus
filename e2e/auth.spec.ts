import { test, expect } from "@playwright/test";

test.describe("Auth Modal", () => {
  test("opens and shows login form", async ({ page }) => {
    await page.goto("/it");

    // Click on profile icon to trigger auth modal
    await page.click("nav a[href='/it/profilo']");

    // Wait for auth modal to appear
    await expect(page.getByText("Accedi").first()).toBeVisible();
  });
});
