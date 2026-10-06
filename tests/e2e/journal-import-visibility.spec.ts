import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;

async function openJournal(page: Page) {
  const trainingButtons = page.getByTestId("nav-training");
  for (let index = 0; index < await trainingButtons.count(); index += 1) {
    const button = trainingButtons.nth(index);
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      break;
    }
  }

  const tab = page.locator(".training-segment-switcher").getByRole("tab", { name: "Journal" });
  await expect(tab).toBeVisible({ timeout: 20_000 });
  await tab.click();
  await expect(page.locator(".po-journal-list")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Trainingstagebuch").first()).toBeVisible();
}

test.describe("journal source of truth across device sizes", () => {
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for journal visibility checks.");

  for (const viewport of [
    { label: "iPhone", width: 390, height: 844 },
    { label: "iPad", width: 834, height: 1112 },
    { label: "Desktop", width: 1440, height: 900 },
  ]) {
    test(`${viewport.label} opens the cloud-backed journal`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "edge", "Viewport coverage runs once in the edge project.");
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await login(page, coachEmail!, coachPassword!);
      await openJournal(page);
    });
  }
});
