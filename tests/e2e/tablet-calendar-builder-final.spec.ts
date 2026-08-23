import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const screenshotDir = join(process.cwd(), "docs", "ui", "paddlio-one", "tablet-calendar-builder-final");

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

async function openCalendar(page: Page) {
  await clickVisible(page, "nav-plan");
  await expect(page.locator(".master-calendar-workspace")).toBeVisible({ timeout: 20_000 });
}

async function openTemplates(page: Page) {
  const panel = page.locator(".master-template-panel").first();
  if (await panel.isVisible().catch(() => false)) return;
  await page.locator(".master-calendar-toolbar").getByRole("button", { name: /^Vorlagen$/i }).first().click();
  await expect(panel).toBeVisible({ timeout: 20_000 });
}

async function openTrainingDetail(page: Page) {
  await page.locator(".master-training-block-main, .master-agenda-row button").first().click();
  await expect(page.getByTestId("training-detail-panel")).toBeVisible({ timeout: 20_000 });
}

async function openQuickEditFromTemplate(page: Page) {
  await openTemplates(page);
  const trainingTab = page.locator(".master-template-panel .master-template-primary-tabs").getByRole("button", { name: "Training" });
  if (await trainingTab.isVisible().catch(() => false)) await trainingTab.click();
  await page.locator(".master-template-panel").getByRole("button").filter({ hasText: /GA1|GA2|K1|Kraft|Wettkampf/i }).first().click();
  await expect(page.getByRole("region", { name: /Training schnell/i }).or(page.getByRole("dialog", { name: /Training schnell/i })).first()).toBeVisible({ timeout: 20_000 });
}

async function openTabletBuilder(page: Page) {
  await clickVisible(page, "nav-training");
  const createTab = page.locator(".training-segment-switcher").getByRole("tab", { name: "Erstellen" });
  if (await createTab.isVisible().catch(() => false)) await createTab.click();
  await expect(page.locator(".tablet-training-builder-shell")).toBeVisible({ timeout: 20_000 });
}

test.describe("tablet calendar and builder final", () => {
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for tablet final screenshots.");

  test.beforeEach(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test("captures tablet landscape calendar and builder states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet final screenshots run only in the edge project.");
    await page.setViewportSize({ width: 1194, height: 834 });
    await login(page, coachEmail!, coachPassword!);

    await openCalendar(page);
    await page.screenshot({ path: join(screenshotDir, "01-calendar-week-landscape.png"), fullPage: true });

    await openTemplates(page);
    await page.screenshot({ path: join(screenshotDir, "02-calendar-template-panel.png"), fullPage: true });

    await openTrainingDetail(page);
    await page.screenshot({ path: join(screenshotDir, "03-calendar-training-detail.png"), fullPage: true });

    await openCalendar(page);
    await openQuickEditFromTemplate(page);
    await page.screenshot({ path: join(screenshotDir, "04-calendar-template-drag.png"), fullPage: true });

    await openCalendar(page);
    await page.locator(".master-segmented-control").getByRole("button", { name: "Monat" }).click();
    await page.screenshot({ path: join(screenshotDir, "05-calendar-month.png"), fullPage: true });

    await openTabletBuilder(page);
    await page.screenshot({ path: join(screenshotDir, "07-builder-empty.png"), fullPage: true });

    await page.getByLabel("Titel").fill(`Tablet Builder ${Date.now()}`);
    await page.getByLabel("Zuweisung").selectOption("group");
    const groupSelect = page.getByLabel("Gruppe");
    if (await groupSelect.isVisible().catch(() => false)) {
      await groupSelect.selectOption({ index: 0 });
    }
    await page.screenshot({ path: join(screenshotDir, "08-builder-group.png"), fullPage: true });

    const templateSelect = page.getByLabel("Vorlage laden");
    if (await templateSelect.isVisible().catch(() => false)) {
      await templateSelect.selectOption({ index: 1 });
    }
    await page.screenshot({ path: join(screenshotDir, "09-builder-template.png"), fullPage: true });
    await page.screenshot({ path: join(screenshotDir, "10-builder-preview.png"), fullPage: true });

    await page.getByRole("button", { name: "+ Abschnitt" }).click();
    await page.screenshot({ path: join(screenshotDir, "11-builder-sections.png"), fullPage: true });

    await page.getByRole("button", { name: "Training planen" }).click();
    await openCalendar(page);
    await page.screenshot({ path: join(screenshotDir, "12-builder-final.png"), fullPage: true });
  });

  test("captures tablet portrait calendar", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet final screenshots run only in the edge project.");
    await page.setViewportSize({ width: 834, height: 1194 });
    await login(page, coachEmail!, coachPassword!);
    await openCalendar(page);
    await page.screenshot({ path: join(screenshotDir, "06-calendar-portrait.png"), fullPage: true });
  });
});
