import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers/auth";

const athleteEmail = process.env.PADDLIO_E2E_ATHLETE_EMAIL;
const athletePassword = process.env.PADDLIO_E2E_ATHLETE_PASSWORD;

async function openMoreItem(page: Page, label: "Profil" | "Material" | "Ziele" | "Einstellungen") {
  const moreButtons = page.getByTestId("nav-more");
  for (let index = 0; index < await moreButtons.count(); index += 1) {
    const button = moreButtons.nth(index);
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      break;
    }
  }
  const tile = page.getByRole("button", { name: `${label} öffnen` }).first();
  if (await tile.waitFor({ state: "visible", timeout: 5_000 }).then(() => true).catch(() => false)) {
    await tile.click();
    return;
  }
  const tab = page.getByRole("tab", { name: label, exact: true });
  await expect(tab).toBeVisible({ timeout: 10_000 });
  await tab.click();
}

test.describe("personal persistence", () => {
  test.setTimeout(120_000);
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "The cloud round-trip runs once in the desktop project.");
    test.skip(!athleteEmail || !athletePassword, "Set PADDLIO_E2E_ATHLETE_* for authenticated persistence checks.");
  });

  test("goals and personal material survive a cloud reload", async ({ page }) => {
    const marker = `E2E ${Date.now()}`;
    const goalTitle = `${marker} Ziel`;
    const materialName = `${marker} Boot`;
    await login(page, athleteEmail!, athletePassword!);

    await openMoreItem(page, "Ziele");
    await page.getByLabel("Titel", { exact: true }).fill(goalTitle);
    await page.getByLabel("Zielwert", { exact: true }).fill("8");
    await page.getByRole("button", { name: "Ziel erstellen", exact: true }).click();
    await expect(page.getByText(/Ziel erstellt|Ziel lokal gespeichert/)).toBeVisible();
    await expect(page.getByText(goalTitle, { exact: true })).toBeVisible();

    await openMoreItem(page, "Material");
    await page.getByRole("button", { name: "Material hinzufügen" }).click();
    await page.getByLabel("Name", { exact: true }).fill(materialName);
    await page.getByRole("button", { name: "Speichern", exact: true }).click();
    await expect(page.getByText(/Material gespeichert|Material lokal gespeichert/)).toBeVisible();
    await expect(page.getByText(materialName, { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("authenticated-app")).toBeVisible({ timeout: 30_000 });
    await openMoreItem(page, "Ziele");
    await expect(page.getByText(goalTitle, { exact: true })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: `Ziel ${goalTitle} löschen` }).click();
    await expect(page.getByText(goalTitle, { exact: true })).not.toBeVisible();

    await openMoreItem(page, "Material");
    const materialCard = page.locator(".wallet-card").filter({ hasText: materialName });
    await expect(materialCard).toBeVisible({ timeout: 20_000 });
    await materialCard.getByRole("button", { name: "Löschen" }).click();
    await expect(materialCard).not.toBeVisible();
  });

  test("identity, boat classes and extended profile data are confirmed and restored after reload", async ({ page }) => {
    const marker = `E2E Profil ${Date.now()}`;
    await login(page, athleteEmail!, athletePassword!);
    await openMoreItem(page, "Profil");
    const firstName = page.locator('input[name="firstName"]');
    const lastName = page.locator('input[name="lastName"]');
    const nickname = page.locator('input[name="nickname"]');
    const birthDate = page.locator('input[name="birthDate"]');
    const federation = page.locator('input[name="federation"]');
    const trainingYears = page.locator('input[name="trainingYears"]');
    const experience = page.locator('textarea[name="competitionExperience"]');
    const longTermGoal = page.locator('textarea[name="longTermGoal"]');
    const seasonGoal = page.locator('textarea[name="seasonGoal"]');
    const notes = page.locator('textarea[name="personalNotes"]');
    await expect(notes).toBeVisible({ timeout: 20_000 });
    const originalFirstName = await firstName.inputValue();
    const originalLastName = await lastName.inputValue();
    const originalNickname = await nickname.inputValue();
    const originalBirthDate = await birthDate.inputValue();
    const originalFederation = await federation.inputValue();
    const originalTrainingYears = await trainingYears.inputValue();
    const originalExperience = await experience.inputValue();
    const originalLongTermGoal = await longTermGoal.inputValue();
    const originalSeasonGoal = await seasonGoal.inputValue();
    const originalValue = await notes.inputValue();
    const original = originalValue.startsWith("E2E Profil ") ? "" : originalValue;
    const k1 = page.getByLabel("K1", { exact: true });
    const c1 = page.getByLabel("C1", { exact: true });
    const originalK1 = await k1.isChecked();
    const originalC1 = await c1.isChecked();
    const originalPaddleSide = originalC1 ? await page.locator('select[name="paddleSide"]').inputValue() : "rechts";
    await expect(page.locator("#profile-club")).toHaveAttribute("readonly", "");
    await expect(page.locator("#profile-club-help")).toContainText("berechtigten Vereins- oder Paddlio-Admin");

    try {
      await firstName.fill("E2E");
      await lastName.fill("Athlete");
      await nickname.fill(marker);
      await birthDate.fill("2001-02-03");
      await federation.fill("E2E Verband");
      await trainingYears.fill("7");
      await experience.fill("E2E Wettkampferfahrung");
      await longTermGoal.fill("E2E Langfristiges Ziel");
      await seasonGoal.fill("E2E Saisonziel");
      await notes.fill(marker);
      if (!await k1.isChecked()) await k1.check();
      if (!await c1.isChecked()) await c1.check();
      await page.locator('select[name="paddleSide"]').selectOption("links");
      const saveButton = page.getByRole("button", { name: "Profil speichern", exact: true });
      const profileWrite = page.waitForResponse((response) =>
        response.request().method() === "PATCH" && response.url().includes("/rest/v1/profiles"), { timeout: 20_000 });
      await saveButton.click();
      const response = await profileWrite;
      expect(response.ok(), await response.text()).toBe(true);
      await expect(page.getByText("Profil gespeichert und synchronisiert", { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByTestId("authenticated-app")).toBeVisible({ timeout: 30_000 });
      await openMoreItem(page, "Profil");
      await expect(page.locator('input[name="firstName"]')).toHaveValue("E2E");
      await expect(page.locator('input[name="lastName"]')).toHaveValue("Athlete");
      await expect(page.locator('input[name="nickname"]')).toHaveValue(marker);
      await expect(page.locator('input[name="birthDate"]')).toHaveValue("2001-02-03");
      await expect(page.locator('input[name="federation"]')).toHaveValue("E2E Verband");
      await expect(page.locator('input[name="trainingYears"]')).toHaveValue("7");
      await expect(page.locator('textarea[name="competitionExperience"]')).toHaveValue("E2E Wettkampferfahrung");
      await expect(page.locator('textarea[name="longTermGoal"]')).toHaveValue("E2E Langfristiges Ziel");
      await expect(page.locator('textarea[name="seasonGoal"]')).toHaveValue("E2E Saisonziel");
      await expect(page.locator('textarea[name="personalNotes"]')).toHaveValue(marker);
      await expect(page.getByLabel("K1", { exact: true })).toBeChecked();
      await expect(page.getByLabel("C1", { exact: true })).toBeChecked();
      await expect(page.locator('select[name="paddleSide"]')).toHaveValue("links");
    } finally {
      await page.locator('input[name="firstName"]').fill(originalFirstName);
      await page.locator('input[name="lastName"]').fill(originalLastName);
      await page.locator('input[name="nickname"]').fill(originalNickname);
      await page.locator('input[name="birthDate"]').fill(originalBirthDate);
      await page.locator('input[name="federation"]').fill(originalFederation);
      await page.locator('input[name="trainingYears"]').fill(originalTrainingYears);
      await page.locator('textarea[name="competitionExperience"]').fill(originalExperience);
      await page.locator('textarea[name="longTermGoal"]').fill(originalLongTermGoal);
      await page.locator('textarea[name="seasonGoal"]').fill(originalSeasonGoal);
      await page.locator('textarea[name="personalNotes"]').fill(original);
      const restoreK1 = page.getByLabel("K1", { exact: true });
      const restoreC1 = page.getByLabel("C1", { exact: true });
      if (originalK1 !== await restoreK1.isChecked()) await restoreK1.click();
      if (originalC1 !== await restoreC1.isChecked()) await restoreC1.click();
      if (originalC1) await page.locator('select[name="paddleSide"]').selectOption(originalPaddleSide);
      const restoreButton = page.getByRole("button", { name: "Profil speichern", exact: true });
      const restoreWrite = page.waitForResponse((response) =>
        response.request().method() === "PATCH" && response.url().includes("/rest/v1/profiles"), { timeout: 20_000 });
      await restoreButton.click();
      expect((await restoreWrite).ok()).toBe(true);
    }
  });

  test("app settings are confirmed and survive a cloud reload", async ({ page }) => {
    await login(page, athleteEmail!, athletePassword!);
    await openMoreItem(page, "Einstellungen");
    const units = page.locator('select[name="measurementUnit"]');
    await expect(units).toBeVisible({ timeout: 20_000 });
    const original = await units.inputValue();
    const changed = original === "metrisch" ? "imperial" : "metrisch";

    try {
      await units.selectOption(changed);
      const settingsWrite = page.waitForResponse((response) => {
        if (response.request().method() !== "PATCH" || !response.url().includes("/rest/v1/profiles")) return false;
        const payload = response.request().postDataJSON() as { profile_data?: { measurementUnit?: string } } | null;
        return payload?.profile_data?.measurementUnit === changed;
      }, { timeout: 20_000 });
      await page.getByRole("button", { name: "Einstellungen speichern", exact: true }).click();
      const response = await settingsWrite;
      const requestPayload = response.request().postDataJSON() as { profile_data?: { measurementUnit?: string } };
      expect(requestPayload.profile_data?.measurementUnit).toBe(changed);
      expect(response.ok()).toBe(true);
      await page.reload();
      await expect(page.getByTestId("authenticated-app")).toBeVisible({ timeout: 30_000 });
      await openMoreItem(page, "Einstellungen");
      await expect(page.locator('select[name="measurementUnit"]')).toHaveValue(changed, { timeout: 20_000 });
    } finally {
      await page.locator('select[name="measurementUnit"]').selectOption(original);
      const restoreWrite = page.waitForResponse((response) => {
        if (response.request().method() !== "PATCH" || !response.url().includes("/rest/v1/profiles")) return false;
        const payload = response.request().postDataJSON() as { profile_data?: { measurementUnit?: string } } | null;
        return payload?.profile_data?.measurementUnit === original;
      }, { timeout: 20_000 });
      await page.getByRole("button", { name: "Einstellungen speichern", exact: true }).click();
      expect((await restoreWrite).ok()).toBe(true);
    }
  });
});
