import { expect, test, type Locator, type Page } from "@playwright/test";
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

async function openMainPage(page: Page, label: "Training" | "Kalender") {
  const mobileButton = page.getByRole("button", { name: new RegExp(`${label}(?:-Bereich)? .*ffnen|${label}`, "i") });
  if (await mobileButton.isVisible().catch(() => false)) {
    await mobileButton.click();
    return;
  }

  await page.locator(".desktop-nav-item:visible").filter({ hasText: label }).click();
}

async function openCalendarWorkspace(page: Page) {
  await openMainPage(page, "Kalender");
  await expect(page.locator(".master-calendar-workspace")).toBeVisible({ timeout: 20_000 });
}

async function ensureTemplatePanelVisible(page: Page) {
  await openCalendarWorkspace(page);
  if (await page.getByRole("region", { name: /Vorlagenbibliothek/i }).isVisible().catch(() => false)) {
    return;
  }

  const templatesButton = page.getByRole("button", { name: /^Vorlagen$/i }).first();
  await expect(templatesButton).toBeVisible({ timeout: 20_000 });
  await templatesButton.click();
  await expect(page.getByRole("region", { name: /Vorlagenbibliothek/i })).toBeVisible({ timeout: 20_000 });
}

async function selectOptionMatching(select: Locator, pattern: RegExp) {
  const options = select.locator("option");
  await expect(options).not.toHaveCount(0);
  for (let index = 0; index < await options.count(); index += 1) {
    const option = options.nth(index);
    const label = (await option.textContent()) ?? "";
    if (pattern.test(label)) {
      const value = await option.getAttribute("value");
      await select.selectOption(value ?? { label });
      return;
    }
  }

  throw new Error(`No select option matched ${pattern}`);
}

function todayKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function uniqueStartTime(runId: number) {
  const minutes = 5 + (runId % 45);
  return `18:${`${minutes}`.padStart(2, "0")}`;
}

async function createTrainingFromCalendarTemplate(page: Page, marker: string, runId: number) {
  await ensureTemplatePanelVisible(page);
  const templatePanel = page.getByRole("region", { name: /Vorlagenbibliothek/i });
  const templateButton = templatePanel.getByRole("button", { name: /GA1 Grundlagenfahrt|GA2 Tempoausdauer|K1 Technik|Kraftausdauer Zirkel|Wettkampfsimulation/i }).first();
  await expect(templateButton).toBeVisible({ timeout: 20_000 });
  await templateButton.click();

  const quickEdit = page.getByRole("region", { name: /Training schnell/i }).or(page.getByRole("dialog", { name: /Training schnell/i })).first();
  await expect(quickEdit).toBeVisible({ timeout: 20_000 });
  await quickEdit.getByLabel("Datum").fill(todayKey());
  await quickEdit.getByLabel("Start").fill(uniqueStartTime(runId));
  await quickEdit.getByLabel("Dauer").fill("55");
  await quickEdit.getByLabel("Zuweisung").selectOption("athlete");
  await selectOptionMatching(quickEdit.getByLabel("Ziel"), seededAthletePattern(athleteEmail));
  await quickEdit.getByLabel("Individuelle Anpassung").fill(marker);
  await quickEdit.getByRole("button", { name: /Einf.*gen/i }).click();
  await expect(quickEdit).not.toBeVisible({ timeout: 20_000 });
}

async function openTrainingDetailsByMarker(page: Page, marker: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await openCalendarWorkspace(page);
    const candidateButtons = page.locator(".master-training-block-main, .master-training-pill [role='button'], .master-agenda-row button");
    const count = await candidateButtons.count();
    for (let index = 0; index < count; index += 1) {
      await candidateButtons.nth(index).click();
      const details = page.getByLabel("Training Details");
      if (await details.isVisible().catch(() => false) && await details.getByText(marker).isVisible().catch(() => false)) {
        return details;
      }
      const closeButton = details.getByRole("button", { name: /Details.*schlie/i }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }
    }

    await page.reload();
    await page.waitForTimeout(2_500);
  }

  await expect(page.getByText(marker)).toBeVisible({ timeout: 20_000 });
  return page.getByLabel("Training Details");
}

async function expectTrainingVisibleAfterSync(page: Page, marker: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.reload();
    await openCalendarWorkspace(page);
    if (await page.getByText(marker).first().isVisible().catch(() => false)) {
      return;
    }
    if (await openTrainingDetailsByMarker(page, marker).then(() => true).catch(() => false)) {
      return;
    }
    await page.waitForTimeout(2_500);
  }

  await expect(page.getByText(marker)).toBeVisible({ timeout: 20_000 });
}

async function expectFeedbackVisibleAfterSync(page: Page, marker: string, text: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.reload();
    const details = await openTrainingDetailsByMarker(page, marker).catch(() => null);
    if (details) {
      await details.getByRole("button", { name: "Feedback" }).click();
    }
    if (await page.getByText(text).first().isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(2_500);
  }

  await expect(page.getByText(text)).toBeVisible({ timeout: 20_000 });
}

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
    const marker = `E2E Sync Training ${runId}`;
    const feedbackComment = `E2E Feedback ${runId}`;

    await login(coachPage, coachEmail!, coachPassword!);
    await login(athletePage, athleteEmail!, athletePassword!);

    await expect(coachPage.getByTestId("authenticated-app")).toBeVisible();
    await expect(athletePage.getByTestId("authenticated-app")).toBeVisible();

    await createTrainingFromCalendarTemplate(coachPage, marker, runId);
    await openTrainingDetailsByMarker(coachPage, marker);

    const athleteDetails = await openTrainingDetailsByMarker(athletePage, marker);
    await athleteDetails.getByRole("button", { name: "Feedback", exact: true }).click();
    await athleteDetails.getByRole("button", { name: /Feedback erfassen/i }).click();
    const feedbackDialog = athletePage.getByRole("dialog", { name: /Feedback schreiben/i });
    await expect(feedbackDialog).toBeVisible({ timeout: 20_000 });
    await feedbackDialog.getByLabel("Kurze Notiz").fill(feedbackComment);
    await feedbackDialog.getByRole("button", { name: "Speichern" }).click();
    await expectFeedbackVisibleAfterSync(athletePage, marker, feedbackComment);

    await expectFeedbackVisibleAfterSync(coachPage, marker, feedbackComment);

    const coachDetails = await openTrainingDetailsByMarker(coachPage, marker);
    await coachDetails.getByRole("button", { name: /L.*schen/i }).last().click();
    await coachPage.reload();
    await openCalendarWorkspace(coachPage);
    await expect(coachPage.getByText(marker)).not.toBeVisible({ timeout: 20_000 });
    await athletePage.reload();
    await openCalendarWorkspace(athletePage);
    await expect(athletePage.getByText(marker)).not.toBeVisible({ timeout: 20_000 });

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
