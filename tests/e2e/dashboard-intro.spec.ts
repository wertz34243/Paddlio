import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const introStorageKey = "paddlio-intro-dismissed";

test.describe("dashboard intro", () => {
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for dashboard intro tests.");

  test("opens, navigates and persists the Paddlio intro entry point", async ({ page }) => {
    await page.addInitScript((key) => window.localStorage.removeItem(key), introStorageKey);
    await login(page, coachEmail!, coachPassword!);

    const introCard = page.locator(".po-paddlio-intro-card");
    const introLink = page.getByRole("button", { name: /Was ist Paddlio|Paddlio kennenlernen öffnen/i });

    if (await introCard.isVisible().catch(() => false)) {
      await expect(introCard.getByText("Neu bei Paddlio?")).toBeVisible();
      await expect(introCard.getByText("Train. Analyze. Improve.")).toBeVisible();
      await page.getByRole("button", { name: "Paddlio-Info ausblenden" }).click();
      await expect(introCard).not.toBeVisible();
      await expect(introLink).toBeVisible();

      await page.reload();
      await expect(page.getByTestId("authenticated-app")).toBeVisible();
      await expect(introCard).not.toBeVisible();
    } else {
      await expect(introLink).toBeVisible();
    }

    await introLink.click();
    const dialog = page.getByRole("dialog", { name: "Training planen" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Kalender, Vorlagen und Wochenplanung")).toBeVisible();

    await dialog.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByRole("dialog", { name: "Training durchführen" })).toBeVisible();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByRole("dialog", { name: "Fortschritt analysieren" })).toBeVisible();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByRole("dialog", { name: "Gemeinsam trainieren" })).toBeVisible();

    await page.getByRole("button", { name: "Erstes Training planen" }).click();
    await expect(page.getByTestId("nav-training").filter({ visible: true }).first()).toHaveAttribute("aria-current", "page", { timeout: 20_000 });
    await expect(page.getByRole("tab", { name: "Individuell" }).first()).toHaveAttribute("aria-selected", "true", { timeout: 20_000 });
  });
});
