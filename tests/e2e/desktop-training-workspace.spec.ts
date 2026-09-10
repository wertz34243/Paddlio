import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const screenshotDir = join(process.cwd(), "docs", "ui", "paddlio-one", "desktop-training-workspace");

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

async function capture(page: Page, name: string) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.querySelector<HTMLElement>(".skip-link")?.style.setProperty("display", "none");
  });
  await page.screenshot({ path: join(screenshotDir, name), fullPage: true });
}

async function openTrainingTab(page: Page, name: string | RegExp) {
  await clickVisible(page, "nav-training");
  const tab = page.locator(".training-segment-switcher").getByRole("tab", { name });
  await expect(tab).toBeVisible({ timeout: 20_000 });
  await tab.click();
}

async function openCalendar(page: Page) {
  await openTrainingTab(page, "Kalender");
  await expect(page.locator(".master-calendar-workspace")).toBeVisible({ timeout: 20_000 });
}

async function openTemplatesPanel(page: Page) {
  const panel = page.locator(".master-calendar-context .master-template-panel").first();
  if (await panel.isVisible().catch(() => false)) return;
  await page.locator(".master-calendar-toolbar").getByRole("button", { name: /^Vorlagen$/i }).click();
  await expect(panel).toBeVisible({ timeout: 20_000 });
}

test.describe("desktop training workspace", () => {
  test.setTimeout(120_000);
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for desktop screenshots.");

  test.beforeEach(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test("captures desktop calendar interactions", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Desktop screenshots run only in the edge project.");
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, coachEmail!, coachPassword!);

    await openCalendar(page);
    await capture(page, "01-calendar-1440.png");

    await page.setViewportSize({ width: 1920, height: 1080 });
    await capture(page, "02-calendar-1920.png");

    await openTemplatesPanel(page);
    await capture(page, "03-calendar-template-panel.png");

    const firstTraining = page.locator(".master-training-block-main").first();
    await expect(firstTraining).toBeVisible({ timeout: 20_000 });
    await firstTraining.click();
    await expect(page.getByTestId("training-detail-panel")).toBeVisible({ timeout: 20_000 });
    await capture(page, "04-calendar-detail-inspector.png");

    await firstTraining.dblclick();
    await expect(page.getByRole("region", { name: /Training schnell/i }).or(page.getByRole("dialog", { name: /Training schnell/i })).first()).toBeVisible({ timeout: 20_000 });
    await capture(page, "05-calendar-quick-edit.png");

    await page.keyboard.press("Escape");
    await page.locator(".master-calendar-toolbar").getByRole("button", { name: "Auswählen" }).click();
    await firstTraining.click();
    const secondTraining = page.locator(".master-training-block-main").nth(1);
    if (await secondTraining.isVisible().catch(() => false)) {
      await secondTraining.click();
    }
    await expect(page.locator(".master-selection-bar")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".master-selection-bar").getByRole("button", { name: /Löschen/i })).toBeVisible();
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("löschen");
      await dialog.dismiss();
    });
    await page.locator(".master-selection-bar").getByRole("button", { name: /Löschen/i }).click();
    await capture(page, "06-calendar-multiselect.png");
    await page.keyboard.press("Escape");
    await firstTraining.click({ button: "right" });
    await expect(page.getByRole("menu", { name: "Training Kontextmenü" })).toBeVisible({ timeout: 20_000 });
    await capture(page, "07-calendar-context-menu.png");
    await page.keyboard.press("Escape");

    await page.locator(".master-segmented-control").getByRole("button", { name: "Monat" }).click();
    await capture(page, "08-calendar-month.png");
  });

  test("captures desktop builder, templates and journal", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Desktop screenshots run only in the edge project.");
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, coachEmail!, coachPassword!);

    await openTrainingTab(page, "Erstellen");
    await expect(page.locator(".tablet-training-builder-shell")).toBeVisible({ timeout: 20_000 });
    await capture(page, "09-create-builder.png");
    await page.locator(".tablet-block-card").first().click();
    await page.locator(".tablet-timeline-card").first().click();
    await expect(page.locator(".tablet-builder-inspector").getByRole("spinbutton", { name: "Dauer" })).toBeVisible({ timeout: 20_000 });
    await capture(page, "10-create-builder-section.png");

    await openTrainingTab(page, "Vorlagen");
    await expect(page.locator(".template-library-redesign-layout")).toBeVisible({ timeout: 20_000 });
    await capture(page, "11-templates-library.png");
    const firstTemplate = page.locator(".template-library-tile").first();
    await firstTemplate.click();
    await expect(page.locator(".template-detail-panel")).toBeVisible({ timeout: 20_000 });
    await capture(page, "12-template-detail.png");
    await page.locator(".program-template-group").filter({ hasText: "Wochenvorlagen" }).first().scrollIntoViewIfNeeded();
    await capture(page, "13-week-templates.png");
    await page.locator(".program-template-group").filter({ hasText: "Saisonbausteine" }).first().scrollIntoViewIfNeeded();
    await capture(page, "14-season-templates.png");

    await openTrainingTab(page, "Journal");
    await expect(page.locator(".journal-filter-bar")).toBeVisible({ timeout: 20_000 });
    await capture(page, "15-journal.png");
    const feedbackEntry = page.locator(".training-journal-only .calendar-training-card").first();
    if (await feedbackEntry.isVisible().catch(() => false)) {
      await feedbackEntry.click();
    }
    await capture(page, "16-journal-detail.png");
  });
});
