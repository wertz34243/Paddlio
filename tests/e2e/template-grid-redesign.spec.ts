import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const screenshotDir = join(process.cwd(), "docs", "ui", "paddlio-one", "template-grid-redesign");

async function clickVisible(page: Page, testId: string) {
  const buttons = page.getByTestId(testId);
  await expect(buttons.first()).toBeAttached({ timeout: 20_000 });

  for (let index = 0; index < await buttons.count(); index += 1) {
    const button = buttons.nth(index);
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      return;
    }
  }

  throw new Error(`No visible ${testId} button found`);
}

async function openTrainingTemplates(page: Page) {
  await clickVisible(page, "nav-training");

  const templatesTab = page.getByRole("tab", { name: "Vorlagen" }).first();
  await expect(templatesTab).toBeVisible({ timeout: 20_000 });
  await templatesTab.click();

  await expect(page.getByText("Trainingsbibliothek").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".template-library-redesign-layout, .template-group-list").first()).toBeVisible({ timeout: 20_000 });
}

async function openTemplateDetail(page: Page) {
  const tile = page.locator(".template-library-tile").first();
  await expect(tile).toBeVisible({ timeout: 20_000 });
  await tile.scrollIntoViewIfNeeded();
  await tile.click();
  await expect(page.locator(".template-library-redesign-layout.has-detail")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".template-detail-panel")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(300);
}

test.describe("template grid redesign", () => {
  test.setTimeout(90_000);
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for template grid screenshots.");

  test.beforeEach(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test("captures tablet landscape template grid states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Template grid screenshots run only in the edge project.");
    await page.setViewportSize({ width: 1194, height: 834 });
    await login(page, coachEmail!, coachPassword!);
    await openTrainingTemplates(page);

    await page.screenshot({ path: join(screenshotDir, "01-tablet-landscape-all.png"), fullPage: true });

    const techniqueFilter = page.locator(".template-tag-filter").getByRole("button", { name: "Technik" });
    if (await techniqueFilter.isVisible().catch(() => false)) {
      await techniqueFilter.click();
      await page.screenshot({ path: join(screenshotDir, "02-tablet-landscape-technik-filter.png"), fullPage: true });
    }

    await openTemplateDetail(page);
    await page.screenshot({ path: join(screenshotDir, "03-tablet-landscape-template-detail.png"), fullPage: true });

    const weekSection = page.locator(".program-template-group").filter({ hasText: "Wochenvorlagen" }).first();
    if (await weekSection.isVisible().catch(() => false)) {
      await weekSection.scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(screenshotDir, "04-tablet-landscape-week-templates.png"), fullPage: true });
    }

    const seasonSection = page.locator(".program-template-group").filter({ hasText: "Saisonbausteine" }).first();
    if (await seasonSection.isVisible().catch(() => false)) {
      await seasonSection.scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(screenshotDir, "05-tablet-landscape-season-templates.png"), fullPage: true });
    }
  });

  test("captures tablet portrait template grid state", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Template grid screenshots run only in the edge project.");

    await page.setViewportSize({ width: 834, height: 1194 });
    await login(page, coachEmail!, coachPassword!);
    await openTrainingTemplates(page);
    await page.screenshot({ path: join(screenshotDir, "06-tablet-portrait.png"), fullPage: true });
  });

  test("captures desktop template grid states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Template grid screenshots run only in the edge project.");

    await page.setViewportSize({ width: 1440, height: 960 });
    await login(page, coachEmail!, coachPassword!);
    await openTrainingTemplates(page);
    await page.screenshot({ path: join(screenshotDir, "07-desktop-training-templates.png"), fullPage: true });

    await openTemplateDetail(page);
    await page.screenshot({ path: join(screenshotDir, "08-desktop-template-detail.png"), fullPage: true });
  });
});
