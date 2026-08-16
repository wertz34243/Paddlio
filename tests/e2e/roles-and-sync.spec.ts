import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;
const athleteEmail = process.env.PADDLIO_E2E_ATHLETE_EMAIL;
const athletePassword = process.env.PADDLIO_E2E_ATHLETE_PASSWORD;
const clubAdminEmail = process.env.PADDLIO_E2E_CLUBADMIN_EMAIL;
const clubAdminPassword = process.env.PADDLIO_E2E_CLUBADMIN_PASSWORD;
const adminEmail = process.env.PADDLIO_E2E_ADMIN_EMAIL;
const adminPassword = process.env.PADDLIO_E2E_ADMIN_PASSWORD;

const hasCoachAthleteCredentials = Boolean(coachEmail && coachPassword && athleteEmail && athletePassword);
const hasClubAdminCredentials = Boolean(clubAdminEmail && clubAdminPassword);
const hasAdminCredentials = Boolean(adminEmail && adminPassword);

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
  await page.getByRole("tab", { name: /Vorlagen|Plan/ }).click();
  await expect(page.getByRole("button", { name: /Neue Trainingseinheit im Plan eintragen|Training planen/ }).first()).toBeVisible();
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

async function expectTextVisibleAfterSync(page: Page, text: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.reload();
    await openTrainingPlan(page);
    if (await page.getByText(text).first().isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(2_500);
  }

  await expect(page.getByText(text)).toBeVisible({ timeout: 20_000 });
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function seededAthletePattern(email?: string): RegExp {
  if (email?.includes("athlete2")) return /Noah Test|athlete2/i;
  if (email?.includes("athlete3")) return /Lea Test|athlete3/i;
  return /Mia Test|athlete1/i;
}

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

    await expect(page.getByRole("heading", { name: "Coach Hub" })).toBeVisible();
    await expect(page.getByText("Admin Hub")).not.toBeVisible();
  });
});

test.describe("club admin access", () => {
  test.skip(!hasClubAdminCredentials, "Set PADDLIO_E2E_CLUBADMIN_* for authenticated club admin E2E.");

  test("club admin can use coach-level hub without admin hub", async ({ page }) => {
    await login(page, clubAdminEmail!, clubAdminPassword!);
    await openMore(page);

    await expect(page.getByRole("heading", { name: "Coach Hub" })).toBeVisible();
    await expect(page.getByText("Admin Hub")).not.toBeVisible();
  });
});

test.describe("two-device training and feedback flow", () => {
  test.skip(!hasCoachAthleteCredentials, "Set PADDLIO_E2E_COACH_* and PADDLIO_E2E_ATHLETE_* for authenticated sync E2E.");

  test("coach creates training, athlete sends feedback, coach sees feedback", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Two-device sync uses coach desktop plus athlete phone and runs in the desktop project.");
    test.setTimeout(120_000);
    const coachContext = await browser.newContext();
    const athleteContext = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const coachPage = await coachContext.newPage();
    const athletePage = await athleteContext.newPage();
    const runId = Date.now();
    const title = `E2E Sync Training ${runId}`;
    const feedbackComment = `E2E Feedback ${runId}`;

    await login(coachPage, coachEmail!, coachPassword!);
    await login(athletePage, athleteEmail!, athletePassword!);

    await expect(coachPage.getByTestId("authenticated-app")).toBeVisible();
    await expect(athletePage.getByTestId("authenticated-app")).toBeVisible();

    await openTrainingPlan(coachPage);
    await coachPage.getByRole("button", { name: /Neue Trainingseinheit im Plan eintragen|Training planen/ }).first().click();
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
      .filter({ hasText: seededAthletePattern(athleteEmail) })
      .locator('input[name="assignedAthleteIds"]')
      .first();
    await expect(athleteTarget).toHaveCount(1);
    await athleteTarget.check({ force: true });
    await planForm.getByLabel("Ziel/Fokus").fill("E2E Rollen- und Sync-Pruefung");
    await planForm.getByRole("button", { name: "Speichern" }).click();
    await expect(coachPage.getByText(title)).toBeVisible({ timeout: 20_000 });

    await expectTrainingVisibleAfterSync(athletePage, title);
    const athleteTrainingCard = athletePage.locator(".calendar-training-card").filter({ hasText: title }).first();
    await athleteTrainingCard.getByRole("button", { name: new RegExp(`Feedback.*${escapeRegExp(title)}`) }).click();
    await athletePage.getByLabel("Kommentar").fill(feedbackComment);
    await athletePage.getByRole("button", { name: /ckmeldung speichern/i }).click();
    await expectTextVisibleAfterSync(athletePage, feedbackComment);

    await expectTextVisibleAfterSync(coachPage, feedbackComment);

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
