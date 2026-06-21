#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.argv[2] || path.join(__dirname, "../../audit");
const BASE = process.env.SCREENSHOT_BASE_URL || "http://localhost:7001";

const PAGES = [
  { slug: "", name: "home" },
  { slug: "cerca", name: "cerca" },
  { slug: "premium", name: "premium" },
  { slug: "gruppi", name: "gruppi" },
  { slug: "privacy-policy", name: "privacy-policy" },
];

const EMAIL_HTML = [
  "email-welcome",
  "email-booking-request",
  "email-booking-confirmed",
  "email-booking-rejected",
  "email-new-message",
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const page = await context.newPage();
  const results = [];

  for (const { slug, name } of PAGES) {
    const url = slug ? `${BASE}/it/${slug}` : `${BASE}/it`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(1200);
      const file = `phase-2g-${name}-desktop.png`;
      await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: name !== "home" });
      const hasRed = await page.evaluate(() => /e63946/i.test(document.documentElement.innerHTML));
      results.push({ name, url, file, status: "ok", legacyRedInHtml: hasRed });
      console.log(`OK page ${name} red=${hasRed}`);
    } catch (err) {
      results.push({ name, url, status: "fail", error: String(err) });
    }
  }

  // Auth modal trigger on home
  try {
    await page.goto(`${BASE}/it`, { waitUntil: "networkidle", timeout: 45000 });
    const loginBtn = page.locator('button:has-text("Accedi"), button:has-text("Login"), a:has-text("Accedi")').first();
    if (await loginBtn.count()) {
      await loginBtn.click();
      await page.waitForTimeout(800);
      const file = "phase-2g-auth-modal-desktop.png";
      await page.screenshot({ path: path.join(OUT_DIR, file) });
      const hasRed = await page.evaluate(() => /e63946/i.test(document.documentElement.innerHTML));
      results.push({ name: "auth-modal", file, status: "ok", legacyRedInHtml: hasRed });
      console.log(`OK auth-modal red=${hasRed}`);
    }
  } catch (err) {
    results.push({ name: "auth-modal", status: "fail", error: String(err) });
  }

  for (const name of EMAIL_HTML) {
    const htmlPath = path.join(OUT_DIR, `${name}.html`);
    try {
      const html = await readFile(htmlPath, "utf8");
      const preview = await context.newPage();
      await preview.setContent(html, { waitUntil: "load" });
      const file = `${name}.png`;
      await preview.screenshot({ path: path.join(OUT_DIR, file), fullPage: true });
      await preview.close();
      results.push({ name, file, status: "ok", legacyRedInHtml: /#e63946/i.test(html) });
      console.log(`OK email ${name}`);
    } catch (err) {
      results.push({ name, status: "fail", error: String(err) });
    }
  }

  await browser.close();
  await writeFile(path.join(OUT_DIR, "phase-2g-results.json"), JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });