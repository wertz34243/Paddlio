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
});
