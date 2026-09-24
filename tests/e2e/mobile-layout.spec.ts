import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers/auth";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectPhoneChromeUsable(page: Page) {
  await expectNoHorizontalOverflow(page);
  const metrics = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>("[data-testid='app-header']");
    const bottom = document.querySelector<HTMLElement>("[data-testid='bottom-navigation']");
    const main = document.querySelector<HTMLElement>("#main");
    const headerRect = header?.getBoundingClientRect();
    const bottomRect = bottom?.getBoundingClientRect();
    const mainRect = main?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      headerHeight: headerRect?.height ?? 0,
      bottomHeight: bottomRect?.height ?? 0,
      mainTop: mainRect?.top ?? 0,
      bottomTop: bottomRect?.top ?? window.innerHeight,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  expect(metrics.hasHorizontalOverflow).toBe(false);
  expect(metrics.headerHeight).toBeLessThanOrEqual(76);
  expect(metrics.bottomHeight).toBeLessThanOrEqual(86);
  expect(metrics.mainTop).toBeGreaterThanOrEqual(0);
  expect(metrics.bottomTop).toBeGreaterThan(0);
}

async function openBottomNav(page: Page, label: RegExp) {
  await page.getByRole("button", { name: label }).click();
  await page.waitForTimeout(250);
  await expectPhoneChromeUsable(page);
}

test.describe("mobile layout guards", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-edge", "Mobile layout guards are covered in the mobile-edge project.");
  });

  test("login shell does not overflow on iPhone SE width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Einloggen" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("login shell does not overflow on large phone width", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Einloggen" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("authenticated athlete phone navigation stays usable", async ({ page }) => {
    const email = process.env.PADDLIO_E2E_ATHLETE_EMAIL;
    const password = process.env.PADDLIO_E2E_ATHLETE_PASSWORD;
    test.skip(!email || !password, "Set PADDLIO_E2E_ATHLETE_* for authenticated phone UX checks.");

    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, email!, password!);
    await expectPhoneChromeUsable(page);

    await openBottomNav(page, /Kalender/);
    await expect(page.getByRole("button", { name: "Heute" }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await openBottomNav(page, /Training-Bereich/);
    await expect(page.getByRole("tab", { name: /Individuell|Vorlagen|Journal/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await openBottomNav(page, /Team-Bereich/);
    await openBottomNav(page, /Mehr-Bereich/);
  });

  test("authenticated coach phone templates require confirmation before insert", async ({ page }) => {
    const email = process.env.PADDLIO_E2E_COACH_EMAIL;
    const password = process.env.PADDLIO_E2E_COACH_PASSWORD;
    test.skip(!email || !password, "Set PADDLIO_E2E_COACH_* for authenticated phone template checks.");

    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, email!, password!);
    await openBottomNav(page, /Training-Bereich/);
    await page.getByRole("tab", { name: /Vorlagen/ }).click();

    const templateButton = page.locator(".mobile-template-row button").first();
    await expect(templateButton).toBeVisible();
    await templateButton.click();
    await expect(page.getByRole("dialog", { name: "Vorlage verwenden" })).toBeVisible();
    await expect(page.getByTestId("mobile-template-use-sheet")).toBeVisible();
    await expect(page.getByLabel("Tag")).toBeVisible();
    await expect(page.getByTestId("mobile-template-time-control")).toBeVisible();
    const timeValue = page.getByTestId("mobile-template-time");
    await expect(timeValue).toHaveText("17:30");
    await page.getByRole("button", { name: "Uhrzeit 15 Minuten spaeter" }).click();
    await expect(timeValue).toHaveText("17:45");
    await expect(page.getByTestId("mobile-template-use-sheet")).toBeVisible();
    await expectPhoneChromeUsable(page);
  });

  test("training feedback detail remains readable on a small phone", async ({ page }) => {
    const email = process.env.PADDLIO_E2E_COACH_EMAIL;
    const password = process.env.PADDLIO_E2E_COACH_PASSWORD;
    test.skip(!email || !password, "Set PADDLIO_E2E_COACH_* for mobile feedback checks.");

    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, email!, password!);
    await openBottomNav(page, /Kalender/);

    const training = page.locator(".master-training-block-main").first();
    await expect(training).toBeVisible({ timeout: 20_000 });
    await training.click();
    const detail = page.getByTestId("training-detail-panel");
    await expect(detail).toBeVisible({ timeout: 20_000 });
    await detail.getByRole("button", { name: "Feedback", exact: true }).click();

    const tabs = detail.locator(".master-detail-tabs button");
    const layout = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>("[data-testid='training-detail-panel']");
      const headings = [...document.querySelectorAll<HTMLElement>(".master-feedback-group-heading")];
      const metrics = [...document.querySelectorAll<HTMLElement>(".master-feedback-metrics > div")];
      const panelRect = panel?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        headingsInside: headings.every((node) => {
          const rect = node.getBoundingClientRect();
          return !panelRect || (rect.left >= panelRect.left - 1 && rect.right <= panelRect.right + 1);
        }),
        metricsInside: metrics.every((node) => {
          const rect = node.getBoundingClientRect();
          return !panelRect || (rect.left >= panelRect.left - 1 && rect.right <= panelRect.right + 1);
        }),
      };
    });
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.headingsInside).toBe(true);
    expect(layout.metricsInside).toBe(true);
    await expect(tabs).toHaveCount(4);
    await expect(detail.getByText("Athletenfeedback", { exact: true })).toBeVisible();
    await expect(detail.getByText("Trainerfeedback", { exact: true })).toBeVisible();
  });
});
