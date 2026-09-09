import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const screenshotDir = join(process.cwd(), "docs", "ui", "paddlio-one", "tablet-workspace-4");

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
  await closeDetailIfOpen(page);

  const panel = page.locator(".master-calendar-context .master-template-panel").first();
  if (await panel.isVisible().catch(() => false)) return;

  const templateButtons = page.locator(".master-calendar-toolbar").getByRole("button", { name: /^Vorlagen$/i });
  for (let index = 0; index < await templateButtons.count(); index += 1) {
    const button = templateButtons.nth(index);
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      break;
    }
  }
  await expect(panel).toBeVisible({ timeout: 20_000 });
}

async function openFirstTrainingDetail(page: Page) {
  const entry = page.locator(".master-training-block-main, .master-training-pill [role='button'], .master-agenda-row button").first();
  await expect(entry).toBeVisible({ timeout: 20_000 });
  await entry.click();
  await expect(page.getByTestId("training-detail-panel")).toBeVisible({ timeout: 20_000 });
}

async function closeDetailIfOpen(page: Page) {
  const detailPanel = page.getByTestId("training-detail-panel");
  if (await detailPanel.isVisible().catch(() => false)) {
    const close = detailPanel.getByRole("button", { name: /schlie/i }).first();
    if (await close.isVisible().catch(() => false)) {
      await close.click();
      await expect(detailPanel).not.toBeVisible({ timeout: 20_000 });
    }
  }
}

async function closeTabletContextIfOpen(page: Page) {
  const context = page.locator(".master-calendar-context.is-overlay");
  if (await context.count() > 0) {
    const quickEditClose = context.locator(".master-quick-edit button[aria-label*='Sch']").first();
    if (await quickEditClose.count() > 0) {
      page.once("dialog", (dialog) => dialog.accept());
      await quickEditClose.click({ force: true });
      await expect(context).not.toBeVisible({ timeout: 20_000 });
      return;
    }
    const backdrop = page.locator(".master-calendar-context-backdrop").first();
    if (await backdrop.count() > 0) {
      await backdrop.click({ force: true });
      await expect(context).not.toBeVisible({ timeout: 20_000 });
      return;
    }
    const close = context.locator(".master-calendar-context-header button").first();
    if (await close.count() > 0) {
      await close.click({ force: true });
      await expect(context).not.toBeVisible({ timeout: 20_000 });
    }
  }
}

async function openQuickEdit(page: Page) {
  await openTemplates(page);
  const templatePanel = page.locator(".master-calendar-context .master-template-panel").first();
  const trainingTab = templatePanel.locator(".master-template-primary-tabs").getByRole("button", { name: "Training" });
  if (await trainingTab.isVisible().catch(() => false)) {
    await trainingTab.click();
  }
  const templateButton = page.locator(".master-calendar-context .master-template-panel").getByRole("button").filter({ hasText: /GA1|GA2|K1|Kraft|Wettkampf/i }).first();
  await expect(templateButton).toBeVisible({ timeout: 20_000 });
  await templateButton.click();
  await expect(page.getByRole("region", { name: /Training schnell/i }).or(page.getByRole("dialog", { name: /Training schnell/i })).first()).toBeVisible({ timeout: 20_000 });
}

test.describe("tablet trainer workspace 4", () => {
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for tablet screenshots.");

  test.beforeEach(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test("captures landscape calendar, templates, detail and quick edit", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet workspace screenshots run only in the edge project with tablet viewports.");
    await page.setViewportSize({ width: 1194, height: 834 });
    await login(page, coachEmail!, coachPassword!);
    await closeTabletContextIfOpen(page);
    await openCalendar(page);
    await page.screenshot({ path: join(screenshotDir, "landscape-01-calendar.png"), fullPage: true });

    await openTemplates(page);
    await page.screenshot({ path: join(screenshotDir, "landscape-02-templates.png"), fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    const weekTemplateButton = page.locator(".master-calendar-context").getByRole("button", { name: /^Woche$/ });
    await weekTemplateButton.scrollIntoViewIfNeeded();
    await weekTemplateButton.click();
    await page.screenshot({ path: join(screenshotDir, "landscape-03-week-templates.png"), fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    const seasonTemplateButton = page.locator(".master-calendar-context").getByRole("button", { name: /^Saison$/ });
    await seasonTemplateButton.scrollIntoViewIfNeeded();
    await seasonTemplateButton.click();
    await page.screenshot({ path: join(screenshotDir, "landscape-04-season-blocks.png"), fullPage: true });

    await openFirstTrainingDetail(page);
    await page.screenshot({ path: join(screenshotDir, "landscape-05-detail-planning.png"), fullPage: true });
    const detailPanel = page.getByTestId("training-detail-panel");
    await detailPanel.getByRole("button", { name: /Durchf/i }).click();
    await page.screenshot({ path: join(screenshotDir, "landscape-06-detail-execution.png"), fullPage: true });
    await detailPanel.getByRole("button", { name: "Feedback" }).click();
    await page.screenshot({ path: join(screenshotDir, "landscape-07-detail-feedback.png"), fullPage: true });
    await detailPanel.getByRole("button", { name: "Aufgaben" }).click();
    await page.screenshot({ path: join(screenshotDir, "landscape-08-detail-tasks.png"), fullPage: true });
    await closeDetailIfOpen(page);

    await openQuickEdit(page);
    await page.screenshot({ path: join(screenshotDir, "landscape-09-quick-edit.png"), fullPage: true });

    await page.locator(".master-segmented-control").getByRole("button", { name: "Monat" }).click();
    await page.screenshot({ path: join(screenshotDir, "landscape-10-month.png"), fullPage: true });
    await page.getByRole("button", { name: "Filter" }).click();
    await page.screenshot({ path: join(screenshotDir, "landscape-11-filter.png"), fullPage: true });
  });

  test("captures portrait calendar and drawer contexts", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Tablet workspace screenshots run only in the edge project with tablet viewports.");
    await page.setViewportSize({ width: 834, height: 1194 });
    await login(page, coachEmail!, coachPassword!);
    await openCalendar(page);
    await page.screenshot({ path: join(screenshotDir, "portrait-01-calendar.png"), fullPage: true });

    await openTemplates(page);
    await page.screenshot({ path: join(screenshotDir, "portrait-02-templates-drawer.png"), fullPage: true });

    await openQuickEdit(page);
    await page.screenshot({ path: join(screenshotDir, "portrait-03-quick-edit-drawer.png"), fullPage: true });

    await closeTabletContextIfOpen(page);
    await openCalendar(page);
    await page.locator(".master-segmented-control").getByRole("button", { name: "Monat" }).click();
    await page.screenshot({ path: join(screenshotDir, "portrait-04-month.png"), fullPage: true });
    await openFirstTrainingDetail(page);
    await page.screenshot({ path: join(screenshotDir, "portrait-05-training-detail-drawer.png"), fullPage: true });
    await closeDetailIfOpen(page);
    await page.getByRole("button", { name: "Filter" }).click();
    await page.screenshot({ path: join(screenshotDir, "portrait-06-filter-drawer.png"), fullPage: true });
    const teamNavButtons = page.getByTestId("nav-communication");
    for (let index = 0; index < await teamNavButtons.count(); index += 1) {
      const button = teamNavButtons.nth(index);
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        break;
      }
    }
    await page.screenshot({ path: join(screenshotDir, "portrait-07-team.png"), fullPage: true });
  });
});
