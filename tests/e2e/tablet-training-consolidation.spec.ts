import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const screenshotDir = join(process.cwd(), "docs", "ui", "paddlio-one", "tablet-training-consolidation");

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

async function openCalendarInTraining(page: Page) {
  await openTrainingTab(page, "Kalender");
  await expect(page.locator(".master-calendar-workspace")).toBeVisible({ timeout: 20_000 });
}

async function openBuilder(page: Page) {
  await openTrainingTab(page, "Individuell");
  await expect(page.locator(".tablet-training-builder-shell")).toBeVisible({ timeout: 20_000 });
}

test.describe("tablet training workspace consolidation", () => {
  test.setTimeout(120_000);
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for consolidation screenshots.");

  test.beforeEach(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test("captures consolidated tablet landscape training workspace", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet consolidation screenshots run only in the edge project.");
    await page.setViewportSize({ width: 1194, height: 834 });
    await login(page, coachEmail!, coachPassword!);

    await openCalendarInTraining(page);
    await capture(page, "01-calendar-landscape.png");

    await page.locator(".master-training-block-main, .master-agenda-row button").first().click();
    await expect(page.getByTestId("training-detail-panel")).toBeVisible({ timeout: 20_000 });
    await capture(page, "02-calendar-detail-inspector.png");

    await openCalendarInTraining(page);
    const templatesButton = page.locator(".master-calendar-toolbar").getByRole("button", { name: /^Vorlagen$/i }).first();
    if (await templatesButton.isVisible().catch(() => false)) await templatesButton.click();
    await expect(page.locator(".master-template-panel").first()).toBeVisible({ timeout: 20_000 });
    await capture(page, "03-calendar-template-panel.png");

    await openBuilder(page);
    await capture(page, "04-create-builder-landscape.png");

    const blocks = page.locator(".tablet-block-card");
    await expect(blocks.first()).toBeVisible({ timeout: 20_000 });
    await blocks.nth(0).click();
    await blocks.nth(1).click();
    await page.locator(".tablet-timeline-card").first().click();
    await expect(page.locator(".tablet-builder-inspector").getByRole("spinbutton", { name: "Dauer" })).toBeVisible({ timeout: 20_000 });
    await capture(page, "05-create-builder-section-selected.png");

    await openTrainingTab(page, "Vorlagen");
    await expect(page.getByText("Trainingsbibliothek").first()).toBeVisible({ timeout: 20_000 });
    await capture(page, "06-templates-library.png");

    const weekSection = page.locator(".program-template-group").filter({ hasText: "Wochenvorlagen" }).first();
    if (await weekSection.isVisible().catch(() => false)) {
      await weekSection.scrollIntoViewIfNeeded();
    }
    await capture(page, "07-week-templates.png");

    const seasonSection = page.locator(".program-template-group").filter({ hasText: "Saisonbausteine" }).first();
    if (await seasonSection.isVisible().catch(() => false)) {
      await seasonSection.scrollIntoViewIfNeeded();
    }
    await capture(page, "08-season-templates.png");

    await openTrainingTab(page, "Journal");
    await expect(page.getByText("Statusübersicht").first()).toBeVisible({ timeout: 20_000 });
    await capture(page, "09-journal-landscape.png");
  });

  test("captures consolidated tablet portrait builder states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet consolidation screenshots run only in the edge project.");
    await page.setViewportSize({ width: 834, height: 1194 });
    await login(page, coachEmail!, coachPassword!);

    await openBuilder(page);
    await capture(page, "10-create-portrait.png");

    await expect(page.locator(".tablet-block-library")).toBeVisible({ timeout: 20_000 });
    await capture(page, "11-create-portrait-blocks-drawer.png");

    await page.locator(".tablet-block-card").first().click();
    await page.locator(".tablet-timeline-card").first().click();
    await expect(page.locator(".tablet-builder-inspector").getByRole("spinbutton", { name: "Dauer" })).toBeVisible({ timeout: 20_000 });
    await capture(page, "12-create-portrait-details-drawer.png");
  });
});
