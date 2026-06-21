/**
 * Screenshots for chat layout fixes (header offset, mobile full-screen, SOS token).
 */
import { chromium, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:7002";
const OUT_DIR = path.resolve(
  process.cwd(),
  "docs/redesign/screenshots/phase-2d-chat-layout"
);
const CHAT_BOOKING_ID =
  process.env.CHAT_BOOKING_ID || "edf48d30-d06a-49b5-8892-eb8233d0460a";
const PASSWORD = "AndamusLaunch2026PasswordSecret!";

fs.mkdirSync(OUT_DIR, { recursive: true });

async function login(browser, email) {
  const ctx = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/it`, { waitUntil: "networkidle" });
  const accedi = page.locator("header button", { hasText: /accedi/i }).first();
  await accedi.waitFor({ state: "visible", timeout: 10000 });
  await accedi.click();
  const modal = page.locator("#auth-modal-content");
  await modal.waitFor({ state: "visible" });
  await modal.locator('input[type="email"]').fill(email);
  await modal.locator('input[type="password"]').fill(PASSWORD);
  await modal.getByRole("button", { name: "auth.loginButton" }).click();
  await page.waitForTimeout(5000);
  const storage = await ctx.storageState();
  await ctx.close();
  return storage;
}

async function dismissCookies(page) {
  const accept = page.getByRole("button", { name: /accetta tutto/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(400);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const storage = await login(browser, "alessandro.melis@andamus.it");

  const desktop = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
    storageState: storage,
  });
  const dPage = await desktop.newPage();
  await dPage.goto(`${BASE_URL}/it/chat/${CHAT_BOOKING_ID}`, {
    waitUntil: "networkidle",
  });
  await dismissCookies(dPage);
  await dPage.waitForTimeout(2500);
  await dPage.screenshot({
    path: path.join(OUT_DIR, "chat-thread-desktop-header.png"),
    fullPage: false,
  });
  await desktop.close();

  const mobile = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "dark",
    storageState: storage,
  });
  const mPage = await mobile.newPage();
  await mPage.goto(`${BASE_URL}/it/chat/${CHAT_BOOKING_ID}`, {
    waitUntil: "networkidle",
  });
  await dismissCookies(mPage);
  await mPage.waitForTimeout(2500);
  await mPage.screenshot({
    path: path.join(OUT_DIR, "chat-thread-mobile-fullscreen.png"),
    fullPage: true,
  });

  const bottomNav = mPage.locator("nav.fixed.bottom-0");
  const navVisible = await bottomNav.isVisible().catch(() => false);
  console.log("bottom nav visible in thread:", navVisible);

  await mPage.goto(`${BASE_URL}/it/chat`, { waitUntil: "networkidle" });
  await dismissCookies(mPage);
  await mPage.waitForTimeout(1500);
  await mPage.screenshot({
    path: path.join(OUT_DIR, "chat-inbox-mobile-with-nav.png"),
    fullPage: true,
  });
  const inboxNavVisible = await bottomNav.isVisible().catch(() => false);
  console.log("bottom nav visible on inbox:", inboxNavVisible);

  await mobile.close();
  await browser.close();
  console.log(fs.readdirSync(OUT_DIR).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});