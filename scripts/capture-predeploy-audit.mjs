/**
 * Pre-deploy visual audit — full screenshot pass.
 * Run: node scripts/capture-predeploy-audit.mjs
 * Requires: server on SCREENSHOT_BASE_URL (default http://localhost:7002)
 */
import { chromium, devices } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:7002";
const OUT_DIR = path.resolve(process.cwd(), "docs/redesign/screenshots/predeploy-audit");
const PASSWORD = "AndamusLaunch2026PasswordSecret!";
const SEED_EMAIL = "alessandro.melis@andamus.it";
const CHAT_BOOKING_ID =
  process.env.CHAT_BOOKING_ID || "edf48d30-d06a-49b5-8892-eb8233d0460a";
const PROFILE_ID = "279ae6f1-7c7c-497b-8a76-d3a106431691";

const RESULTS = [];

fs.mkdirSync(OUT_DIR, { recursive: true });

function record(name, file, status, note = "") {
  RESULTS.push({ name, file, status, note });
}

async function dismissCookies(page) {
  const accept = page.getByRole("button", { name: /accetta tutto/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(400);
  }
}

async function shot(page, filename, { fullPage = true, selector = null } = {}) {
  const filePath = path.join(OUT_DIR, filename);
  if (selector) {
    const el = page.locator(selector).first();
    await el.waitFor({ state: "visible", timeout: 15000 }).catch(() => null);
    await el.screenshot({ path: filePath });
  } else {
    await page.screenshot({ path: filePath, fullPage });
  }
  return filePath;
}

async function login(browser) {
  const ctx = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/it`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await dismissCookies(page);
  const accedi = page.locator("header button", { hasText: /accedi/i }).first();
  await accedi.waitFor({ state: "visible", timeout: 20000 });
  await accedi.click();
  const modal = page.locator("#auth-modal-content");
  await modal.waitFor({ state: "visible", timeout: 10000 });
  await modal.locator('input[type="email"]').fill(SEED_EMAIL);
  await modal.locator('input[type="password"]').fill(PASSWORD);
  await modal.getByRole("button", { name: "auth.loginButton" }).click();
  await page.waitForTimeout(5000);
  const storage = await ctx.storageState();
  await ctx.close();
  return storage;
}

async function capturePublic(browser) {
  for (const [slug, pathSuffix, waitFor] of [
    ["home-desktop", "/it", "trova un passaggio"],
    ["cerca-desktop", "/it/cerca", "cerca"],
    ["not-found-desktop", "/it/invalid-audit-page", null],
  ]) {
    const ctx = await browser.newContext({
      ...devices["Desktop Chrome"],
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE_URL}${pathSuffix}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await dismissCookies(page);
      if (waitFor) {
        await page.getByText(new RegExp(waitFor, "i")).first().waitFor({
          state: "visible",
          timeout: 20000,
        });
      }
      await page.waitForTimeout(1200);
      await shot(page, `${slug}.png`);
      record(slug, `${slug}.png`, "ok");
    } catch (e) {
      await shot(page, `${slug}-error.png`).catch(() => null);
      record(slug, `${slug}-error.png`, "fail", String(e.message || e));
    }
    await ctx.close();
  }

  const mobileCtx = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "dark",
  });
  const mobilePage = await mobileCtx.newPage();
  try {
    await mobilePage.goto(`${BASE_URL}/it`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await dismissCookies(mobilePage);
    await mobilePage.waitForTimeout(1500);
    await shot(mobilePage, "home-mobile.png");
    record("home-mobile", "home-mobile.png", "ok");
  } catch (e) {
    record("home-mobile", "home-mobile.png", "fail", String(e.message || e));
  }
  await mobileCtx.close();
}

async function captureAuthenticated(browser, storage) {
  const pages = [
    ["offri-desktop", "/it/offri", /partenza|pubblica|offri/i],
    ["profilo-desktop", "/it/profilo", /profilo|impostazioni|veicol/i],
    ["chat-inbox-desktop", "/it/chat", /chat|messaggi|convers/i],
    ["chat-window-desktop", `/it/chat/${CHAT_BOOKING_ID}`, /messagg|scriv/i],
  ];

  for (const [slug, pathSuffix, pattern] of pages) {
    const ctx = await browser.newContext({
      ...devices["Desktop Chrome"],
      colorScheme: "dark",
      storageState: storage,
    });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE_URL}${pathSuffix}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await dismissCookies(page);
      await page
        .getByText(pattern)
        .first()
        .waitFor({ state: "visible", timeout: 20000 })
        .catch(() => null);
      await page.waitForTimeout(2000);
      await shot(page, `${slug}.png`);
      record(slug, `${slug}.png`, "ok");
    } catch (e) {
      await shot(page, `${slug}-error.png`).catch(() => null);
      record(slug, `${slug}.png`, "fail", String(e.message || e));
    }
    await ctx.close();
  }

  const ctx = await browser.newContext({
    ...devices["Desktop Chrome"],
    colorScheme: "dark",
    storageState: storage,
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE_URL}/it/cerca`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await dismissCookies(page);
    await page.waitForTimeout(2000);
    const rideLink = page.locator('a[href*="/corsa/"]').first();
    const hasRide = await rideLink.isVisible().catch(() => false);
    if (hasRide) {
      await rideLink.click();
      await page.waitForURL(/\/corsa\//, { timeout: 20000 });
      await page.waitForTimeout(3500);
      await shot(page, "ride-detail-desktop.png");
      const map = page.locator(".gm-style, [class*='map'], canvas").first();
      if (await map.isVisible().catch(() => false)) {
        await shot(page, "ride-detail-map.png", { selector: ".gm-style" });
        record("ride-detail-map", "ride-detail-map.png", "ok");
      }
      record("ride-detail-desktop", "ride-detail-desktop.png", "ok");
    } else {
      await page.goto(`${BASE_URL}/it/u/${PROFILE_ID}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(1000);
      await shot(page, "profile-public-desktop.png");
      record(
        "ride-detail-desktop",
        "ride-detail-desktop.png",
        "skip",
        "No active rides in cerca — captured profile instead"
      );
    }
  } catch (e) {
    record("ride-detail-desktop", "ride-detail-desktop.png", "fail", String(e.message || e));
  }
  await ctx.close();
}

async function captureAdmin(browser, storage) {
  const tabs = [
    ["admin-overview", "/it/admin"],
    ["admin-feedback", "/it/admin/feedback"],
    ["admin-diagnostics", "/it/admin/diagnostics"],
  ];
  for (const [slug, pathSuffix] of tabs) {
    const ctx = await browser.newContext({
      ...devices["Desktop Chrome"],
      colorScheme: "dark",
      storageState: storage,
    });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE_URL}${pathSuffix}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await dismissCookies(page);
      await page.waitForTimeout(2500);
      const url = page.url();
      const blocked =
        (await page.getByText(/non autorizzat|accesso negato|unauthorized|accedi/i).isVisible().catch(() => false)) ||
        url.includes("/join") ||
        url.includes("/login");
      await shot(page, `${slug}.png`);
      record(
        slug,
        `${slug}.png`,
        blocked ? "blocked" : "ok",
        blocked ? "Seed user lacks admin — needs Google admin login" : ""
      );
    } catch (e) {
      record(slug, `${slug}.png`, "fail", String(e.message || e));
    }
    await ctx.close();
  }
}

async function captureOnboarding(browser, storage) {
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    colorScheme: "dark",
    storageState: storage,
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE_URL}/it/onboarding`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await dismissCookies(page);
    await page
      .getByRole("button", { name: /iniziamo/i })
      .or(page.getByRole("heading", { name: /ciao|benvenut/i }))
      .first()
      .waitFor({ state: "visible", timeout: 20000 });
    await page.waitForTimeout(800);
    await shot(page, "onboarding-welcome-mobile.png");
    record("onboarding-welcome-mobile", "onboarding-welcome-mobile.png", "ok");
  } catch (e) {
    record("onboarding-welcome-mobile", "onboarding-welcome-mobile.png", "fail", String(e.message || e));
  }
  await ctx.close();
}

function writeReport() {
  const ok = RESULTS.filter((r) => r.status === "ok").length;
  const fail = RESULTS.filter((r) => r.status === "fail").length;
  const blocked = RESULTS.filter((r) => r.status === "blocked").length;
  const skip = RESULTS.filter((r) => r.status === "skip").length;
  const date = new Date().toISOString().slice(0, 10);

  const rows = RESULTS.map(
    (r) =>
      `| ${r.name} | ${r.status} | \`${r.file}\` | ${r.note || "—"} |`
  ).join("\n");

  const md = `# Andamus Pre-Deploy Visual Audit

**Date:** ${date}  
**Base URL:** ${BASE_URL}  
**Screenshots:** \`docs/redesign/screenshots/predeploy-audit/\`

## Summary

| Metric | Count |
|--------|-------|
| ✅ OK | ${ok} |
| 🚫 Blocked (auth) | ${blocked} |
| ⏭️ Skipped | ${skip} |
| ❌ Failed | ${fail} |

## Screenshots

| Page | Status | File | Notes |
|------|--------|------|-------|
${rows}

## Design checklist

| Area | Expected | Verify in screenshots |
|------|----------|----------------------|
| Dark theme | \`bg-canvas\`, dark cards | home, cerca, offri |
| Teal accent | \`#4FB3C9\` CTAs | buttons, links |
| Maps | Dark tiles + teal route | ride-detail-map (if ride available) |
| Admin | Mono KPI cards, teal charts | admin-* (requires Google admin) |
| Mobile | Bottom nav, responsive | home-mobile, onboarding |

## Manual follow-up

- **Admin pages:** Capture with \`cristianermurache@gmail.com\` via Google OAuth (seed user no longer has admin).
- **Ride detail map:** Open any active \`/it/corsa/[id]\` in production after deploy.
`;

  const reportPath = path.resolve(
    process.cwd(),
    "docs/redesign/Andamus_PreDeploy_Visual_Audit.md"
  );
  fs.writeFileSync(reportPath, md);
  console.log(`\n📄 Report → ${reportPath}`);
}

async function main() {
  console.log(`📸 Pre-deploy audit → ${OUT_DIR}`);
  console.log(`🌐 ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  try {
    await capturePublic(browser);
    console.log("public pages");

    let storage;
    try {
      storage = await login(browser);
      console.log("logged in");
    } catch (e) {
      console.error("login failed:", e.message);
      writeReport();
      process.exit(1);
    }

    await captureAuthenticated(browser, storage);
    console.log("authenticated pages");
    await captureOnboarding(browser, storage);
    console.log("onboarding");
    await captureAdmin(browser, storage);
    console.log("admin (may be blocked)");
  } finally {
    await browser.close();
  }

  writeReport();
  const pngs = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png"));
  console.log(`\n${pngs.length} screenshots:`);
  for (const f of pngs) console.log(`  - ${f}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});