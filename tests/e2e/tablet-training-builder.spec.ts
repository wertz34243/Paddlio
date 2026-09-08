import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const screenshotDir = join(process.cwd(), "docs", "ui", "paddlio-one", "tablet-training-builder");

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

async function openTabletBuilder(page: Page) {
  await clickVisible(page, "nav-training");
  const createTab = page.getByRole("tab", { name: "Erstellen" }).first();
  await expect(createTab).toBeVisible({ timeout: 20_000 });
  await createTab.click();
  await expect(page.locator(".tablet-training-builder-shell")).toBeVisible({ timeout: 20_000 });
}

async function addFirstBlocks(page: Page, count = 3) {
  const blocks = page.locator(".tablet-block-card");
  await expect(blocks.first()).toBeVisible({ timeout: 20_000 });
  for (let index = 0; index < Math.min(count, await blocks.count()); index += 1) {
    await blocks.nth(index).click();
  }
  await expect(page.locator(".tablet-timeline-card").first()).toBeVisible({ timeout: 20_000 });
}

async function capture(page: Page, name: string) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.querySelector<HTMLElement>(".skip-link")?.style.setProperty("display", "none");
  });
  await page.screenshot({ path: join(screenshotDir, name), fullPage: true });
}

test.describe("tablet training builder", () => {
  test.setTimeout(90_000);
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for tablet builder screenshots.");

  test.beforeEach(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test("captures tablet landscape builder states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet builder screenshots run only in the edge project.");
    await page.setViewportSize({ width: 1194, height: 834 });
    await login(page, coachEmail!, coachPassword!);
    await openTabletBuilder(page);

    await capture(page, "01-builder-empty.png");

    await page.locator(".tablet-timeline-top").getByLabel("Titel").fill(`Tablet Builder ${Date.now()}`);
    await page.locator(".tablet-assignment-strip").getByRole("button", { name: "Gruppe" }).click();
    const groupSelect = page.locator(".tablet-assignment-strip").getByLabel("Gruppe");
    if (await groupSelect.isVisible().catch(() => false)) {
      await groupSelect.selectOption({ index: 0 });
    }
    await capture(page, "02-builder-group.png");

    await addFirstBlocks(page, 4);
    await capture(page, "03-builder-with-sections.png");

    await page.locator(".tablet-timeline-card").first().click();
    await expect(page.locator(".tablet-builder-inspector").getByRole("spinbutton", { name: "Dauer" })).toBeVisible({ timeout: 20_000 });
    await capture(page, "04-builder-section-inspector.png");

    const firstSectionMenu = page.locator(".tablet-timeline-card").first().locator(".tablet-section-menu");
    await firstSectionMenu.locator("summary").click();
    await firstSectionMenu.getByRole("button", { name: "Duplizieren" }).click();
    await capture(page, "05-builder-duplicate.png");

    await page.locator(".tablet-builder-inspector").getByLabel("Ziel / Fokus").fill("Linienwahl, Druck, stabiler Rhythmus");
    await capture(page, "06-builder-preview.png");

    await page.getByRole("button", { name: "Als Vorlage speichern" }).click();
    await expect(page.getByText("Training wurde als Vorlage gespeichert.")).toBeVisible({ timeout: 20_000 });
    await capture(page, "07-builder-save-template.png");

    await page.getByRole("button", { name: "Training planen" }).click();
    await clickVisible(page, "nav-plan");
    await expect(page.locator(".master-calendar-workspace")).toBeVisible({ timeout: 20_000 });
    await capture(page, "08-builder-final-calendar.png");
  });

  test("captures tablet portrait builder states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet builder screenshots run only in the edge project.");
    await page.setViewportSize({ width: 834, height: 1194 });
    await login(page, coachEmail!, coachPassword!);
    await openTabletBuilder(page);
    await capture(page, "09-builder-portrait-empty.png");

    await addFirstBlocks(page, 2);
    await page.locator(".tablet-timeline-card").first().click();
    await capture(page, "10-builder-portrait-inspector.png");
  });
});
