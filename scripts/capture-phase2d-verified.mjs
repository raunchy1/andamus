/**
 * Phase 2D screenshots: chat inbox, chat window, onboarding steps.
 */
import { chromium, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:7002";
const OUT_DIR = path.resolve(process.cwd(), "docs/redesign/screenshots/phase-2d-verified");
const CHAT_BOOKING_ID =
  process.env.CHAT_BOOKING_ID || "edf48d30-d06a-49b5-8892-eb8233d0460a";
const PASSWORD = "AndamusLaunch2026PasswordSecret!";

const USERS = {
  chat: { email: "alessandro.melis@andamus.it", password: PASSWORD },
  onboarding: { email: "giulia.carta@andamus.it", password: PASSWORD },
};

fs.mkdirSync(OUT_DIR, { recursive: true });

async function loginAndGetStorage(browser, email, password) {
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
  await modal.waitFor({ state: "visible", timeout: 10000 });
  await modal.locator('input[type="email"]').fill(email);
  await modal.locator('input[type="password"]').fill(password);
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

async function waitForOnboardingContent(page, timeout = 20000) {
  await page
    .getByRole("button", { name: /iniziamo|continua|attiva notifiche|salta/i })
    .or(page.getByRole("heading", { name: /ciao|come usi|notifiche|sei pronto/i }))
    .first()
    .waitFor({ state: "visible", timeout });
  await page.waitForTimeout(800);
}

async function captureChatList(browser, storage) {
  const ctx = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
    storageState: storage,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/it/chat`, { waitUntil: "networkidle" });
  await dismissCookies(page);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, "chat-inbox-desktop.png"), fullPage: true });
  await ctx.close();
}

async function captureChatWindow(browser, storage) {
  for (const [label, device] of [
    ["mobile", devices["iPhone 13"]],
    ["desktop", devices["Desktop Chrome"]],
  ]) {
    const ctx = await browser.newContext({
      ...device,
      colorScheme: "dark",
      storageState: storage,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/it/chat/${CHAT_BOOKING_ID}`, {
      waitUntil: "networkidle",
    });
    await dismissCookies(page);
    await page
      .locator('textarea, input[type="text"]')
      .first()
      .waitFor({ state: "visible", timeout: 20000 })
      .catch(() => null);
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: path.join(OUT_DIR, `chat-window-${label}.png`),
      fullPage: true,
    });
    await ctx.close();
  }
}

async function captureOnboarding(browser, storage) {
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "dark",
    storageState: storage,
  });
  await ctx.addInitScript(() => {
    try {
      Object.defineProperty(window.Notification, "permission", {
        get: () => "default",
        configurable: true,
      });
    } catch {
      /* headless may lack Notification */
    }
  });
  const page = await ctx.newPage();
  if (!page.url().includes("/onboarding")) {
    await page.goto(`${BASE_URL}/it/onboarding`, { waitUntil: "networkidle" });
  }
  await dismissCookies(page);
  await page.waitForTimeout(2000);

  const start = page.getByRole("button", { name: /iniziamo/i });
  await start.waitFor({ state: "visible", timeout: 25000 });
  await page.screenshot({
    path: path.join(OUT_DIR, "onboarding-step-welcome.png"),
    fullPage: true,
  });

  await dismissCookies(page);
  await start.click({ force: true });
  await page.getByRole("heading", { name: /completa il profilo/i }).waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT_DIR, "onboarding-step-profile.png"),
    fullPage: true,
  });

  const phone = page.locator('input[type="tel"], input[inputmode="tel"]').first();
  if (await phone.isVisible().catch(() => false)) {
    const value = await phone.inputValue();
    if (!value || value.length < 9) await phone.fill("+393339876543");
  }
  const yearSelect = page.locator("select").first();
  if (await yearSelect.isVisible().catch(() => false)) {
    await yearSelect.selectOption({ index: 10 });
  }

  await dismissCookies(page);
  await page.getByRole("button", { name: /^continua$/i }).click({ force: true });
  await page.getByRole("heading", { name: /come usi andamus/i }).waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT_DIR, "onboarding-step-role.png"),
    fullPage: true,
  });

  await page.getByText(/offro passaggi/i).first().click();
  await page.getByRole("button", { name: /cagliari/i }).click();
  await dismissCookies(page);
  await page.getByRole("button", { name: /^continua$/i }).click({ force: true });
  await page.getByRole("heading", { name: /resta aggiornato/i }).waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT_DIR, "onboarding-step-notifications.png"),
    fullPage: true,
  });

  await dismissCookies(page);
  await page.getByRole("button", { name: /non ora/i }).click({ force: true });
  await page.getByText(/sei pronto a partire/i).waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT_DIR, "onboarding-step-complete.png"),
    fullPage: true,
  });

  await ctx.close();
}

async function main() {
  console.log(`Phase 2D screenshots → ${OUT_DIR}`);
  const browser = await chromium.launch({ headless: true });
  try {
    const chatStorage = await loginAndGetStorage(
      browser,
      USERS.chat.email,
      USERS.chat.password
    );
    await captureChatList(browser, chatStorage);
    console.log("chat inbox");
    await captureChatWindow(browser, chatStorage);
    console.log("chat window");

    const onboardingStorage = await loginAndGetStorage(
      browser,
      USERS.onboarding.email,
      USERS.onboarding.password
    );
    await captureOnboarding(browser, onboardingStorage);
    console.log("onboarding");
  } finally {
    await browser.close();
  }
  console.log(fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png")).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});