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
  await expect(page.getByTestId("bottom-navigation")).toBeVisible({ timeout: 20_000 });
}

test.describe("role isolation", () => {
  test.skip(!hasCoachAthleteCredentials, "Set PADDLIO_E2E_COACH_* and PADDLIO_E2E_ATHLETE_* for authenticated role E2E.");

  test("athlete cannot see coach or admin hubs", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, athleteEmail!, athletePassword!);
    await page.getByRole("button", { name: "Mehr" }).click();

    await expect(page.getByText("Admin Hub")).not.toBeVisible();
    await expect(page.getByText("Coach Hub")).not.toBeVisible();
    await context.close();
  });

  test("coach can use coach hub but not admin hub", async ({ page }) => {
    await login(page, coachEmail!, coachPassword!);
    await page.getByRole("button", { name: "Mehr" }).click();

    await expect(page.getByText("Coach Hub")).toBeVisible();
    await expect(page.getByText("Admin Hub")).not.toBeVisible();
  });
});

test.describe("two-device training and feedback flow", () => {
  test.skip(!hasCoachAthleteCredentials, "Set PADDLIO_E2E_COACH_* and PADDLIO_E2E_ATHLETE_* for authenticated sync E2E.");

  test("coach and athlete sessions can load in separate browser contexts", async ({ browser }) => {
    const coachContext = await browser.newContext();
    const athleteContext = await browser.newContext();
    const coachPage = await coachContext.newPage();
    const athletePage = await athleteContext.newPage();

    await login(coachPage, coachEmail!, coachPassword!);
    await login(athletePage, athleteEmail!, athletePassword!);

    await expect(coachPage.getByTestId("bottom-navigation")).toBeVisible();
    await expect(athletePage.getByTestId("bottom-navigation")).toBeVisible();

    await coachContext.close();
    await athleteContext.close();
  });
});

test.describe("admin access", () => {
  test.skip(!hasAdminCredentials, "Set PADDLIO_E2E_ADMIN_* for authenticated admin E2E.");

  test("admin sees admin hub", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!);
    await page.getByRole("button", { name: "Mehr" }).click();
    await expect(page.getByText("Admin Hub")).toBeVisible();
  });
});
