/**
 * Capture Phase 2C verification screenshots (404, logged-in /offri, real profile).
 * Run: node scripts/capture-phase2c-verified.mjs
 * Requires: production server on BASE_URL (default http://localhost:7002)
 */
import { chromium, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:7002";
const OUT_DIR = path.resolve(process.cwd(), "docs/redesign/screenshots/phase-2c-verified");
const SEED_EMAIL = "alessandro.melis@andamus.it";
const SEED_PASSWORD = "AndamusLaunch2026PasswordSecret!";
const PROFILE_ID = "279ae6f1-7c7c-497b-8a76-d3a106431691"; // Alessandro Melis

fs.mkdirSync(OUT_DIR, { recursive: true });

/** Login via in-app Auth modal (browser can reach Supabase when Node fetch cannot). */
async function loginViaModal(page) {
  await page.goto(`${BASE_URL}/it`, { waitUntil: "networkidle" });
  const accedi = page.locator("header button", { hasText: /accedi/i }).first();
  await accedi.click({ timeout: 10000 });

  const modal = page.locator("#auth-modal-content");
  await modal.waitFor({ state: "visible", timeout: 10000 });

  await modal.locator('input[type="email"]').fill(SEED_EMAIL);
  await modal.locator('input[type="password"]').fill(SEED_PASSWORD);
  // Primary submit is the first full-width CTA above the Google divider
  await modal.getByRole("button", { name: "auth.loginButton" }).click();
  await page.waitForTimeout(4000);

  const stillLoggedOut = await page.locator("header button", { hasText: /accedi/i }).isVisible().catch(() => false);
  if (stillLoggedOut) {
    await page.screenshot({ path: path.join(OUT_DIR, "debug-login-failed.png"), fullPage: true });
    throw new Error("Login did not complete — header still shows Accedi");
  }
}

async function capture404(browser) {
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/it/invalid-page-phase2c-test`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, "not-found-desktop.png"), fullPage: true });
  await context.close();
}

async function captureProfile(browser) {
  const context = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/it/u/${PROFILE_ID}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "profile-public-desktop.png"), fullPage: true });

  const mobileContext = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "dark",
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${BASE_URL}/it/u/${PROFILE_ID}`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, "profile-public-mobile.png"), fullPage: true });

  await context.close();
  await mobileContext.close();
}

async function completeOnboarding(page) {
  if (!page.url().includes("/onboarding")) return;

  await page.getByRole("button", { name: /iniziamo/i }).click();
  await page.waitForTimeout(800);

  const phone = page.locator('input[type="tel"]');
  if (await phone.isVisible().catch(() => false)) {
    await phone.fill("3471234567");
    await page.locator("select").selectOption({ index: 10 });
    await page.getByRole("button", { name: /continua/i }).click();
    await page.waitForTimeout(1500);
  }

  const skipRole = page.getByRole("button", { name: /salta per ora/i });
  if (await skipRole.isVisible().catch(() => false)) {
    await skipRole.click();
    await page.waitForTimeout(1500);
  }

  const skipNotif = page.getByRole("button", { name: /non ora/i });
  if (await skipNotif.isVisible().catch(() => false)) {
    await skipNotif.click();
    await page.waitForTimeout(2000);
  }
}

async function dismissCookies(page) {
  const accept = page.getByRole("button", { name: /accetta tutto/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(400);
  }
}

async function prepareAuthenticatedOffri(browser) {
  const authContext = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
  });
  const authPage = await authContext.newPage();
  await loginViaModal(authPage);
  await authPage.goto(`${BASE_URL}/it/offri`, { waitUntil: "networkidle" });
  await completeOnboarding(authPage);
  if (!authPage.url().includes("/offri")) {
    await authPage.goto(`${BASE_URL}/it/offri`, { waitUntil: "networkidle" });
  }
  const storageState = await authContext.storageState();
  await authContext.close();
  return storageState;
}

async function captureOffri(browser) {
  const storageState = await prepareAuthenticatedOffri(browser);

  const desktopContext = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
    storageState,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(`${BASE_URL}/it/offri`, { waitUntil: "networkidle" });
  await dismissCookies(desktopPage);
  await desktopPage.waitForTimeout(1500);
  const desktopForm = desktopPage
    .locator("text=Crea un passaggio")
    .or(desktopPage.locator("text=Partenza"))
    .or(desktopPage.locator("text=Pubblica passaggio"))
    .or(desktopPage.locator('input[placeholder*="parti"]'));
  try {
    await desktopForm.first().waitFor({ state: "visible", timeout: 20000 });
  } catch {
    await desktopPage.screenshot({ path: path.join(OUT_DIR, "debug-offri-desktop.png"), fullPage: true });
    throw new Error("Offri form not visible after login (see debug-offri-desktop.png)");
  }
  await desktopPage.screenshot({ path: path.join(OUT_DIR, "offri-form-desktop.png"), fullPage: true });

  const mobileContext = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "dark",
    storageState,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${BASE_URL}/it/offri`, { waitUntil: "networkidle" });
  await dismissCookies(mobilePage);
  await mobilePage.waitForTimeout(1500);
  const mobileForm = mobilePage
    .locator("text=Offri un passaggio")
    .or(mobilePage.locator("text=Partenza"))
    .or(mobilePage.locator("text=Pubblica passaggio"));
  await mobileForm.first().waitFor({ state: "visible", timeout: 20000 });
  await mobilePage.screenshot({ path: path.join(OUT_DIR, "offri-form-mobile.png"), fullPage: true });

  await desktopContext.close();
  await mobileContext.close();
}

async function main() {
  console.log(`📸 Capturing screenshots → ${OUT_DIR}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });

  try {
    await capture404(browser);
    console.log("✅ 404 page captured");

    await captureProfile(browser);
    console.log("✅ Public profile captured");

    await captureOffri(browser);
    console.log("✅ Logged-in /offri form captured");
  } finally {
    await browser.close();
  }

  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png"));
  console.log(`\n📁 ${files.length} screenshots saved:`);
  for (const f of files) console.log(`   - ${f}`);
}

main().catch((err) => {
  console.error("❌ Screenshot capture failed:", err);
  process.exit(1);
});