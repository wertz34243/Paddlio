import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const screenshotDir = join(process.cwd(), "docs", "ui", "paddlio-one", "tablet-calendar-touch");

async function openCalendar(page: Page) {
  const navButtons = page.getByTestId("nav-plan");
  await expect(navButtons.first()).toBeAttached({ timeout: 20_000 });
  for (let index = 0; index < await navButtons.count(); index += 1) {
    const button = navButtons.nth(index);
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      break;
    }
  }
  await expect(page.locator(".master-calendar-workspace")).toBeVisible({ timeout: 20_000 });
}

async function openTemplates(page: Page) {
  const panel = page.locator(".master-calendar-context .master-template-panel").first();
  if (await panel.isVisible().catch(() => false)) return;
  await page.locator(".master-calendar-toolbar").getByRole("button", { name: /^Vorlagen$/i }).click();
  await expect(panel).toBeVisible({ timeout: 20_000 });
}

async function closeContext(page: Page) {
  const quickClose = page.locator(".master-quick-edit button[aria-label*='Sch']").first();
  if (await quickClose.isVisible().catch(() => false)) {
    page.once("dialog", (dialog) => dialog.accept());
    await quickClose.click({ force: true });
    await expect(page.locator(".master-calendar-context")).not.toBeVisible({ timeout: 20_000 });
    return;
  }
  const backdrop = page.locator(".master-calendar-context-backdrop").first();
  if (await backdrop.isVisible().catch(() => false)) {
    await backdrop.click({ force: true });
  }
}

async function longPress(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(520);
  await page.mouse.up();
}

test.describe("tablet calendar touch interactions", () => {
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for tablet screenshots.");

  test.beforeEach(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test("captures compact tablet calendar interactions", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet touch screenshots run only in the edge project.");
    await page.setViewportSize({ width: 1194, height: 834 });
    await login(page, coachEmail!, coachPassword!);
    await openCalendar(page);
    await page.screenshot({ path: join(screenshotDir, "01-calendar-clean.png"), fullPage: true });

    await openTemplates(page);
    await page.screenshot({ path: join(screenshotDir, "02-calendar-template-panel.png"), fullPage: true });

    const templateButton = page.locator(".master-calendar-context .master-template-card button").first();
    await expect(templateButton).toBeVisible({ timeout: 20_000 });
    await templateButton.click();
    const quickEdit = page.getByRole("region", { name: /Training schnell/i }).or(page.getByRole("dialog", { name: /Training schnell/i })).first();
    await expect(quickEdit).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: join(screenshotDir, "06-template-insert.png"), fullPage: true });
    await closeContext(page);

    const firstTraining = page.locator(".master-training-block-main").first();
    await expect(firstTraining).toBeVisible({ timeout: 20_000 });
    await firstTraining.dblclick();
    await expect(quickEdit).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: join(screenshotDir, "03-calendar-quick-edit.png"), fullPage: true });
    await firstTraining.dblclick();
    await expect(quickEdit).not.toBeVisible({ timeout: 20_000 });

    await longPress(page, firstTraining);
    const selectionBar = page.locator(".master-selection-bar");
    if (!await selectionBar.isVisible().catch(() => false)) {
      await firstTraining.click({ button: "right" });
    }
    await expect(selectionBar).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: join(screenshotDir, "04-calendar-multi-select.png"), fullPage: true });
    const secondTraining = page.locator(".master-training-block-main").nth(1);
    if (await secondTraining.isVisible().catch(() => false)) {
      await secondTraining.click();
    }
    await page.screenshot({ path: join(screenshotDir, "05-calendar-multi-select-actions.png"), fullPage: true });
    await page.getByRole("button", { name: "Auswahl beenden" }).click();
    await expect(page.locator(".master-selection-bar")).not.toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: join(screenshotDir, "07-calendar-full-width.png"), fullPage: true });

    await page.setViewportSize({ width: 834, height: 1194 });
    await openTemplates(page);
    await templateButton.click();
    await expect(quickEdit).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: join(screenshotDir, "08-calendar-portrait-sheet.png"), fullPage: true });
  });
});
