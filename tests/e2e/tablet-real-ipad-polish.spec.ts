import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const screenshotDir = join(process.cwd(), "docs", "ui", "paddlio-one", "tablet-real-ipad-polish");

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

async function capture(page: Page, name: string, options: { preserveScroll?: boolean } = {}) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.querySelector<HTMLElement>(".skip-link")?.style.setProperty("display", "none");
  });
  if (!options.preserveScroll) await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(screenshotDir, name), fullPage: true });
}

async function openTrainingTab(page: Page, name: string) {
  await clickVisible(page, "nav-training");
  const tab = page.getByRole("tab", { name }).first();
  await expect(tab).toBeVisible({ timeout: 20_000 });
  await tab.click();
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function openCalendar(page: Page) {
  await openTrainingTab(page, "Kalender");
  await expect(page.locator(".master-calendar-workspace")).toBeVisible({ timeout: 20_000 });
}

test.describe("real iPad training polish", () => {
  test.setTimeout(120_000);
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for real iPad polish screenshots.");

  test.beforeEach(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test("captures iPad landscape polish states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Real iPad polish screenshots run only in the edge project.");
    await page.setViewportSize({ width: 1194, height: 834 });
    await login(page, coachEmail!, coachPassword!);

    await openCalendar(page);
    await expect(page.locator(".master-calendar-context")).toHaveCount(0);
    await capture(page, "01-calendar-full-width.png");
    await capture(page, "02-calendar-week.png");

    const textBreaks = await page.locator(".master-training-block-main strong, .master-training-block-main small, .master-training-summary-meta b").evaluateAll((nodes) =>
      nodes.map((node) => window.getComputedStyle(node).wordBreak),
    );
    expect(textBreaks).not.toContain("break-all");

    await page.locator(".master-calendar-toolbar").getByRole("button", { name: "Vorlagen" }).click();
    await expect(page.locator(".master-calendar-context")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".master-calendar-context .master-template-card").first()).toBeVisible({ timeout: 20_000 });
    await capture(page, "03-calendar-template-panel.png");

    await page.locator(".master-training-block-main").first().click();
    await expect(page.getByTestId("training-detail-panel")).toBeVisible({ timeout: 20_000 });
    await capture(page, "04-calendar-training-inspector.png");

    await page.getByTestId("training-detail-panel").getByRole("button", { name: "Feedback" }).click();
    await page.getByRole("button", { name: "Feedback erfassen" }).click();
    await expect(page.locator(".master-feedback-sheet")).toBeVisible({ timeout: 20_000 });
    await capture(page, "06-feedback-sheet.png");

    page.once("dialog", async (dialog) => dialog.accept());
    await page.locator(".master-feedback-sheet").getByRole("button", { name: "Schließen" }).click();
    await expect(page.locator(".master-feedback-sheet")).toHaveCount(0);
    await page.locator(".master-training-block-main").first().click();
    await expect(page.getByTestId("training-detail-panel")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("training-detail-panel").getByRole("button", { name: "Aufgaben" }).click();
    await page.getByRole("button", { name: "Traineraufgabe erstellen" }).click();
    await expect(page.locator(".master-task-sheet")).toBeVisible({ timeout: 20_000 });
    await capture(page, "07-trainer-task-sheet.png");
    page.once("dialog", async (dialog) => dialog.accept());
    await page.locator(".master-task-sheet").getByRole("button", { name: "Schließen" }).click();
    await expect(page.locator(".master-task-sheet")).toHaveCount(0);

    await page.getByTestId("training-detail-panel").getByRole("button", { name: "Details schließen" }).click();
    await page.locator(".master-segmented-control").getByRole("button", { name: "Monat" }).first().click();
    await capture(page, "05-calendar-month.png");

    await openTrainingTab(page, "Vorlagen");
    await expect(page.getByText("Trainingsbibliothek").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".template-library-tile").first()).toBeVisible({ timeout: 20_000 });
    await page.locator(".template-library-tile").first().scrollIntoViewIfNeeded();
    await capture(page, "08-templates-grid.png", { preserveScroll: true });
    await page.locator(".template-library-tile").first().click();
    await expect(page.locator(".template-detail-panel")).toBeVisible({ timeout: 20_000 });
    await capture(page, "09-template-detail.png");

    await openTrainingTab(page, "Erstellen");
    await expect(page.locator(".tablet-training-builder-shell")).toBeVisible({ timeout: 20_000 });
    await capture(page, "10-create-builder.png");

    await openTrainingTab(page, "Journal");
    await expect(page.getByText("Statusübersicht").first()).toBeVisible({ timeout: 20_000 });
    await capture(page, "11-journal.png");
  });

  test("captures iPad portrait polish states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Real iPad polish screenshots run only in the edge project.");
    await page.setViewportSize({ width: 834, height: 1194 });
    await login(page, coachEmail!, coachPassword!);

    await openCalendar(page);
    await capture(page, "12-portrait-calendar.png");

    await openTrainingTab(page, "Erstellen");
    await expect(page.locator(".tablet-training-builder-shell")).toBeVisible({ timeout: 20_000 });
    await capture(page, "13-portrait-builder.png");
  });
});
