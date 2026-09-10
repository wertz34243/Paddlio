import { expect, test, type Locator, type Page } from "@playwright/test";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;

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

async function openCalendar(page: Page, viaBottomCalendar = false) {
  if (viaBottomCalendar) {
    await clickVisible(page, "nav-plan");
  } else {
    await clickVisible(page, "nav-training");
    const calendarTab = page.locator(".training-segment-switcher").getByRole("tab", { name: "Kalender" });
    await expect(calendarTab).toBeVisible({ timeout: 20_000 });
    await calendarTab.click();
  }
  await expect(page.locator(".master-calendar-workspace")).toBeVisible({ timeout: 20_000 });
}

async function ensureTrainingVisible(page: Page) {
  const firstTraining = page.locator(".master-training-block-main").first();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await firstTraining.isVisible().catch(() => false)) return firstTraining;
    await page.getByRole("button", { name: "Vorheriger Zeitraum" }).click();
  }
  await expect(firstTraining).toBeVisible({ timeout: 20_000 });
  return firstTraining;
}

async function longPress(page: Page, locator: Locator) {
  await locator.dispatchEvent("pointerdown", { bubbles: true, pointerId: 1, pointerType: "touch", isPrimary: true });
  await page.waitForTimeout(520);
  await locator.dispatchEvent("pointerup", { bubbles: true, pointerId: 1, pointerType: "touch", isPrimary: true });
}

test.describe("responsive calendar multi-selection", () => {
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for calendar selection tests.");

  test("desktop supports explicit select mode and modifier click", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Desktop selection test runs only in edge.");
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page, coachEmail!, coachPassword!);
    await openCalendar(page);

    await expect(page.locator(".master-calendar-toolbar").getByRole("button", { name: "Auswählen" })).toBeVisible();
    const firstTraining = await ensureTrainingVisible(page);
    await firstTraining.click({ modifiers: ["Control"] });

    const selectionBar = page.locator(".master-selection-bar.is-desktop");
    await expect(selectionBar).toBeVisible({ timeout: 20_000 });
    await expect(selectionBar.getByText(/1 ausgewählt/)).toBeVisible();
    await expect(firstTraining.locator("xpath=ancestor::article[1]")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(selectionBar).not.toBeVisible({ timeout: 20_000 });
  });

  test("phone uses compact long-press selection bar", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-edge", "Phone selection test runs only in mobile-edge.");
    await page.setViewportSize({ width: 393, height: 852 });
    await login(page, coachEmail!, coachPassword!);
    await openCalendar(page, true);

    const firstTraining = await ensureTrainingVisible(page);
    await longPress(page, firstTraining);

    const selectionBar = page.locator(".master-selection-bar.is-phone");
    await expect(selectionBar).toBeVisible({ timeout: 20_000 });
    await expect(selectionBar.getByRole("button", { name: /Kopieren/i })).toBeVisible();
    await expect(selectionBar.getByRole("button", { name: /Status/i })).toBeVisible();
    await expect(selectionBar.getByRole("button", { name: /Löschen/i })).toBeVisible();
    await expect(selectionBar.getByRole("button", { name: "Auswahl beenden" })).toBeVisible();

    const layout = await page.evaluate(() => {
      const filter = document.querySelector<HTMLElement>(".mobile-calendar-filter-row");
      const selection = document.querySelector<HTMLElement>(".master-selection-bar.is-phone");
      const day = document.querySelector<HTMLElement>(".master-calendar-week-day, .master-calendar-day");
      return {
        filterBottom: filter?.getBoundingClientRect().bottom ?? 0,
        selectionTop: selection?.getBoundingClientRect().top ?? 0,
        selectionBottom: selection?.getBoundingClientRect().bottom ?? 0,
        dayTop: day?.getBoundingClientRect().top ?? 0,
        selectionWidth: selection?.getBoundingClientRect().width ?? 0,
        viewportWidth: window.innerWidth,
      };
    });

    expect(layout.selectionTop).toBeGreaterThanOrEqual(layout.filterBottom - 2);
    expect(layout.selectionBottom).toBeLessThanOrEqual(layout.dayTop + 2);
    expect(layout.selectionWidth).toBeLessThanOrEqual(layout.viewportWidth);
  });
});
