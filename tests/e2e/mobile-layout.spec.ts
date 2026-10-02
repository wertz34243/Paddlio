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
    const initialTime = (await timeValue.textContent())?.trim() ?? "";
    const currentDeviceTime = await page.evaluate(() => {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    });
    expect(initialTime).toMatch(/^\d{2}:\d{2}$/);
    expect(Math.abs(toMinutes(initialTime) - toMinutes(currentDeviceTime))).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Uhrzeit 15 Minuten spaeter" }).click();
    await expect(timeValue).toHaveText(fromMinutes(toMinutes(initialTime) + 15));
    await expect(page.getByTestId("mobile-template-use-sheet")).toBeVisible();
    await expectPhoneChromeUsable(page);
  });

  test("team messages keep contacts and groups stable across a cloud reload", async ({ page }) => {
    test.setTimeout(90_000);
    const email = process.env.PADDLIO_E2E_COACH_EMAIL;
    const password = process.env.PADDLIO_E2E_COACH_PASSWORD;
    test.skip(!email || !password, "Set PADDLIO_E2E_COACH_* for authenticated communication checks.");

    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, email!, password!);
    await openBottomNav(page, /Team-Bereich/);

    const contactNames = page.locator(".communication-layout .communication-contact strong");
    await expect(contactNames.first()).toBeVisible({ timeout: 20_000 });
    const namesBefore = await contactNames.allTextContents();
    expect(namesBefore.every((name) => name.trim() && name.trim() !== "Paddlio Kontakt" && name.trim() !== "Paddlio Nutzer")).toBe(true);

    const chatForm = page.locator(".communication-layout .chat-form").first();
    await chatForm.scrollIntoViewIfNeeded();
    const doesNotOverlapNavigation = await page.evaluate(() => {
      const form = document.querySelector<HTMLElement>(".communication-layout .chat-form");
      const navigation = document.querySelector<HTMLElement>("[data-testid='bottom-navigation']");
      if (!form || !navigation) return false;
      return form.getBoundingClientRect().bottom <= navigation.getBoundingClientRect().top + 1;
    });
    expect(doesNotOverlapNavigation).toBe(true);

    await page.reload();
    await expect(page.getByTestId("authenticated-app")).toBeVisible({ timeout: 20_000 });
    await openBottomNav(page, /Team-Bereich/);
    await expect(contactNames.first()).toBeVisible({ timeout: 20_000 });
    await expect.poll(async () => contactNames.allTextContents()).toEqual(namesBefore);

    await page.getByRole("tab", { name: "Gruppen" }).click();
    const groupNames = page.locator(".communication-layout .communication-contact strong");
    await expect(groupNames.first()).toBeVisible({ timeout: 20_000 });
    const groupsBefore = await groupNames.allTextContents();
    await page.reload();
    await openBottomNav(page, /Team-Bereich/);
    await page.getByRole("tab", { name: "Gruppen" }).click();
    await expect(groupNames.first()).toBeVisible({ timeout: 20_000 });
    await expect.poll(async () => groupNames.allTextContents()).toEqual(groupsBefore);
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

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(value: number): string {
  const normalized = (value + 24 * 60) % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}
