import { expect, test, type Page } from "@playwright/test";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const athleteEmail = process.env.PADDLIO_E2E_ATHLETE_EMAIL;
const athletePassword = process.env.PADDLIO_E2E_ATHLETE_PASSWORD;
const adminEmail = process.env.PADDLIO_E2E_ADMIN_EMAIL;
const adminPassword = process.env.PADDLIO_E2E_ADMIN_PASSWORD;

const hasCoachAthleteCredentials = Boolean(coachEmail && coachPassword && athleteEmail && athletePassword);
const hasAdminCredentials = Boolean(adminEmail && adminPassword);

async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Einloggen" }).click();
  await expect(page.getByRole("heading", { name: "Heute" })).toBeVisible({ timeout: 20_000 });
}

async function openMore(page: Page) {
  const mobileButton = page.getByRole("button", { name: "Mehr-Bereich öffnen" });
  if (await mobileButton.isVisible().catch(() => false)) {
    await mobileButton.click();
    return;
  }

  await page.locator(".desktop-nav-item").filter({ hasText: "Mehr" }).click();
}

async function openMainPage(page: Page, label: "Training") {
  const mobileButton = page.getByRole("button", { name: new RegExp(`${label}-Bereich`) });
  if (await mobileButton.isVisible().catch(() => false)) {
    await mobileButton.click();
    return;
  }

  await page.locator(".desktop-nav-item:visible").filter({ hasText: label }).click();
}

async function openTrainingPlan(page: Page) {
  await openMainPage(page, "Training");
  await page.getByRole("tab", { name: "Plan" }).click();
  await expect(page.getByRole("button", { name: "Neue Trainingseinheit im Plan eintragen" })).toBeVisible();
}

async function expectTrainingVisibleAfterSync(page: Page, title: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.reload();
    await openTrainingPlan(page);
    if (await page.getByText(title).first().isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(2_500);
  }

  await expect(page.getByText(title)).toBeVisible({ timeout: 20_000 });
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("role isolation", () => {
  test.skip(!hasCoachAthleteCredentials, "Set PADDLIO_E2E_COACH_* and PADDLIO_E2E_ATHLETE_* for authenticated role E2E.");

  test("athlete cannot see coach or admin hubs", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, athleteEmail!, athletePassword!);
    await openMore(page);

    await expect(page.getByText("Admin Hub")).not.toBeVisible();
    await expect(page.getByText("Coach Hub")).not.toBeVisible();
    await context.close();
  });

  test("coach can use coach hub but not admin hub", async ({ page }) => {
    await login(page, coachEmail!, coachPassword!);
    await openMore(page);

    await expect(page.getByText("Coach Hub")).toBeVisible();
    await expect(page.getByText("Admin Hub")).not.toBeVisible();
  });
});

test.describe("two-device training and feedback flow", () => {
  test.skip(!hasCoachAthleteCredentials, "Set PADDLIO_E2E_COACH_* and PADDLIO_E2E_ATHLETE_* for authenticated sync E2E.");

  test("coach creates training, athlete sends feedback, coach sees feedback", async ({ browser }) => {
    test.setTimeout(120_000);
    const coachContext = await browser.newContext();
    const athleteContext = await browser.newContext();
    const coachPage = await coachContext.newPage();
    const athletePage = await athleteContext.newPage();
    const runId = Date.now();
    const title = `E2E Sync Training ${runId}`;
    const feedbackComment = `E2E Feedback ${runId}`;

    await login(coachPage, coachEmail!, coachPassword!);
    await login(athletePage, athleteEmail!, athletePassword!);

    await expect(coachPage.getByRole("heading", { name: "Heute" })).toBeVisible();
    await expect(athletePage.getByRole("heading", { name: "Heute" })).toBeVisible();

    await openTrainingPlan(coachPage);
    await coachPage.getByRole("button", { name: "Neue Trainingseinheit im Plan eintragen" }).click();
    const planForm = coachPage.locator("form.entry-form").filter({ has: coachPage.locator('input[name="title"]') }).last();
    await planForm.getByLabel("Titel").fill(title);
    await planForm.locator('select[name="assignedType"]').selectOption("athlete");
    const athleteCheckboxes = planForm.locator('input[name="assignedAthleteIds"]');
    for (let index = 0; index < await athleteCheckboxes.count(); index += 1) {
      const checkbox = athleteCheckboxes.nth(index);
      if (await checkbox.isChecked()) {
        await checkbox.uncheck({ force: true });
      }
    }

    const athleteTarget = planForm
      .locator("label.toggle-row")
      .filter({ hasText: /auren|elritzen|icloud|trst hallo/i })
      .locator('input[name="assignedAthleteIds"]')
      .first();
    await expect(athleteTarget).toHaveCount(1);
    await athleteTarget.check({ force: true });
    await planForm.getByLabel("Ziel/Fokus").fill("E2E Rollen- und Sync-Pruefung");
    await planForm.getByRole("button", { name: "Speichern" }).click();
    await expect(coachPage.getByText(title)).toBeVisible({ timeout: 20_000 });

    await expectTrainingVisibleAfterSync(athletePage, title);
    await athletePage.getByRole("button", { name: new RegExp(`Feedback.*${escapeRegExp(title)}`) }).click();
    await athletePage.getByLabel("Kommentar").fill(feedbackComment);
    await athletePage.getByRole("button", { name: /ckmeldung speichern/i }).click();
    await expect(athletePage.getByText(feedbackComment)).toBeVisible({ timeout: 20_000 });

    await coachPage.reload();
    await openTrainingPlan(coachPage);
    await expect(coachPage.getByText(feedbackComment)).toBeVisible({ timeout: 20_000 });

    const coachTrainingCard = coachPage.locator(".calendar-training-card").filter({ hasText: title }).first();
    await coachTrainingCard.getByRole("button", { name: /schen/i }).click();
    await expect(coachPage.getByText(title)).not.toBeVisible({ timeout: 20_000 });

    await coachContext.close();
    await athleteContext.close();
  });
});

test.describe("admin access", () => {
  test.skip(!hasAdminCredentials, "Set PADDLIO_E2E_ADMIN_* for authenticated admin E2E.");

  test("admin sees admin hub", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!);
    await openMore(page);
    await expect(page.getByText("Admin Hub")).toBeVisible();
  });
});
