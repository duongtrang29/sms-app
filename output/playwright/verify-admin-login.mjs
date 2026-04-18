import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = require("C:/Users/Admin/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright-core"));
}

const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const email = process.env.ADMIN_EMAIL ?? "admin.reset@sms.local";
const password = process.env.ADMIN_PASSWORD ?? "StrongAdmin@2026!";
const outDir = path.resolve("output", "playwright");

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });

  await page
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill(email);
  await page
    .locator('input[type="password"], input[name="password"]')
    .first()
    .fill(password);

  const submit = page
    .locator('button[type="submit"], button:has-text("Đăng nhập"), button:has-text("Login")')
    .first();
  await submit.click();

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const finalUrl = page.url();
  const isAdminArea =
    finalUrl.includes("/admin") || finalUrl.includes("/dashboard");

  const screenshotPath = path.join(outDir, "admin-login-check.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const reportPath = path.join(outDir, "admin-login-check.json");
  await fs.writeFile(
    reportPath,
    JSON.stringify(
      {
        baseUrl,
        email,
        finalUrl,
        isAdminArea,
        screenshotPath,
        checkedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );

  if (!isAdminArea) {
    throw new Error(`Unexpected post-login URL: ${finalUrl}`);
  }

  console.log(`LOGIN_OK finalUrl=${finalUrl}`);
  console.log(`REPORT=${reportPath}`);
  console.log(`SCREENSHOT=${screenshotPath}`);
} catch (error) {
  const screenshotPath = path.join(outDir, "admin-login-error.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.error("LOGIN_FAIL", error instanceof Error ? error.message : String(error));
  console.error(`SCREENSHOT=${screenshotPath}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
