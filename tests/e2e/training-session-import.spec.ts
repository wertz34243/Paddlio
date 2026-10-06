import { expect, test, type Page, type Route } from "@playwright/test";
import { login } from "./helpers/auth";

const coachEmail = process.env.PADDLIO_E2E_COACH_EMAIL;
const coachPassword = process.env.PADDLIO_E2E_COACH_PASSWORD;

const csv = [
  "Datum,Dauer,Fokus,Bootsklasse,Beschreibung",
  "2030-06-01,61,E2E Technik Alpha,K1,Tore sauber fahren",
  "2030-06-02,62,E2E Ausdauer Beta,C1,Ruhiger Rhythmus",
  "2030-06-03,63,E2E Kraft Gamma,K1,Rumpfstabilitaet",
].join("\n");

async function clickVisibleTestId(page: Page, testId: string) {
  const candidates = page.getByTestId(testId);
  for (let index = 0; index < await candidates.count(); index += 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click();
      return;
    }
  }
  throw new Error(`No visible ${testId} found.`);
}

async function openImport(page: Page) {
  await clickVisibleTestId(page, "nav-more");
  const integrations = page.getByRole("button", { name: "Integrationen öffnen" });
  await expect(integrations.first()).toBeVisible({ timeout: 20_000 });
  await integrations.first().click();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByText("1. Importart")).toBeVisible({ timeout: 20_000 });
}

async function prepareTrainingSessionImport(page: Page) {
  await page.locator(".import-card").filter({ hasText: "1. Importart" }).locator("select").selectOption("training_sessions");
  await page.locator("input[type=file]").setInputFiles({
    name: "trainingseinheiten-e2e.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf8"),
  });
  await expect(page.getByText("3 gültig")).toBeVisible();
  await page.locator(".confirm-row input[type=checkbox]").check();
}

async function openJournal(page: Page) {
  await clickVisibleTestId(page, "nav-training");
  await page.locator(".training-segment-switcher").getByRole("tab", { name: "Journal" }).click();
  await expect(page.locator(".po-journal-list")).toBeVisible({ timeout: 20_000 });
}

test.describe("training session import submit", () => {
  test.skip(!coachEmail || !coachPassword, "Development coach credentials are required for import submit checks.");

  test("click persists three sessions, reports progress and survives reload without duplicates", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "edge", "Import submit runs once in the edge project.");
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1024, height: 900 });
    await login(page, coachEmail!, coachPassword!);

    const journalRows: Record<string, unknown>[] = [];
    await page.route("**/rest/v1/training_journal_entries*", async (route: Route) => {
      const method = route.request().method();
      if (method === "POST") {
        const payload = route.request().postDataJSON() as Record<string, unknown> | Record<string, unknown>[];
        const rows = Array.isArray(payload) ? payload : [payload];
        rows.forEach((row) => {
          const index = journalRows.findIndex((known) => known.id === row.id);
          if (index >= 0) journalRows[index] = row;
          else journalRows.push(row);
        });
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(rows) });
        return;
      }
      if (method === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", headers: { "content-range": `0-${Math.max(0, journalRows.length - 1)}/${journalRows.length}` }, body: JSON.stringify(journalRows) });
        return;
      }
      await route.continue();
    });
    await page.route("**/rest/v1/import_jobs*", (route) => route.request().method() === "POST"
      ? route.fulfill({ status: 201, contentType: "application/json", body: "[]" })
      : route.continue());
    await page.route("**/rest/v1/import_rows*", (route) => route.request().method() === "POST"
      ? route.fulfill({ status: 201, contentType: "application/json", body: "[]" })
      : route.continue());

    await openImport(page);
    await prepareTrainingSessionImport(page);
    await page.getByRole("button", { name: "Jetzt importieren" }).click();

    await expect(page.getByText("Der Import wurde erfolgreich gespeichert.")).toBeVisible();
    await expect(page.getByText("3 verarbeitet · 3 neu · 0 übersprungen · 0 Fehler")).toBeVisible();
    expect(journalRows).toHaveLength(3);

    await openJournal(page);
    await expect(page.getByText("E2E Technik Alpha")).toBeVisible();
    await expect(page.getByText("E2E Ausdauer Beta")).toBeVisible();
    await expect(page.getByText("E2E Kraft Gamma")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("authenticated-app")).toBeVisible({ timeout: 20_000 });
    await openJournal(page);
    await expect(page.getByText("E2E Technik Alpha")).toBeVisible();

    await openImport(page);
    await prepareTrainingSessionImport(page);
    await page.getByRole("button", { name: "Jetzt importieren" }).click();
    await expect(page.getByText("3 verarbeitet · 0 neu · 3 übersprungen · 0 Fehler")).toBeVisible();
    expect(journalRows).toHaveLength(3);
  });
});
