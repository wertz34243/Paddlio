import { expect, test } from "@playwright/test";

test.describe("public Paddlio website", () => {
  test("works without login or private app initialization", async ({ page }) => {
    const supabaseRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes(".supabase.co")) supabaseRequests.push(request.url());
    });

    await page.goto("/public-preview");
    await expect(page.getByRole("heading", { name: "Paddlio", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Paddlio Startseite" }).getByRole("img", { name: "Paddlio" }))
      .toHaveAttribute("src", "/brand/paddlio-brand-header.webp");
    await expect(page.getByRole("link", { name: "Paddlio App öffnen" })).toHaveAttribute("href", "https://dev.paddlio.de");
    await expect(page.getByTestId("authenticated-app")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    expect(supabaseRequests).toEqual([]);
  });

  test("exposes installation and legal pages", async ({ page }) => {
    for (const [route, heading] of [
      ["/", "Paddlio"],
      ["/funktionen", "Training, Wettkampf und Team in einem Arbeitsraum."],
      ["/sportler", "Dein Training. Deine Entwicklung."],
      ["/trainer", "Planung und Feedback im Zusammenhang."],
      ["/vereine", "Gemeinsam organisiert."],
      ["/installation", "Paddlio auf deinem Gerät."],
      ["/hilfe", "Fragen rund um Paddlio."],
      ["/datenschutz", "Datenschutzerklärung"],
      ["/impressum", "Impressum"],
      ["/kadertest", "Landeskadertest – Vorbereitung"],
    ] as const) {
      await page.goto(`/public-preview${route}`);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }

    await page.goto("/public-preview/datenschutz");
    await expect(page.getByRole("heading", { name: "Aufbewahrung" })).toBeVisible();
    await expect(page.getByText("Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen", { exact: false })).toBeVisible();
  });

  test("keeps the public layout usable on phone and desktop", async ({ page }) => {
    for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/public-preview/funktionen");
      await expect(page.getByRole("heading", { name: "Training, Wettkampf und Team in einem Arbeitsraum." })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
    }
  });

  test("does not register the private app service worker", async ({ page }) => {
    const serviceWorkerRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/sw.js")) serviceWorkerRequests.push(request.url());
    });

    await page.goto("/public-preview");
    await page.waitForLoadState("networkidle");
    expect(serviceWorkerRequests).toEqual([]);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
  });

  test("builds and locally persists the mobile kadertest checklist", async ({ page }) => {
    const supabaseRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes(".supabase.co")) supabaseRequests.push(request.url());
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/public-preview/kadertest");

    await expect(page.getByText("0 von 21 erledigt – 0 %")).toBeVisible();
    await expect(page.getByText("Zielwert: 100 cm")).toBeVisible();
    await page.getByLabel("K – kalendarisches Alter").selectOption("13.5");
    await page.getByLabel("B – biologisches Alter").selectOption("14.0");
    await page.getByLabel("Kajak + Canadier").check();
    await expect(page.getByText("Das DKV-Testmanual enthält keine eigene Technik-Norm für 13,5 Jahre.")).toHaveCount(2);
    await expect(page.getByText("Zielwert: 10", { exact: true })).toBeVisible();
    await expect(page.getByText("Zielwert: 7,80 s")).toBeVisible();
    await expect(page.getByText("Abwärtstor verkanten")).toBeVisible();

    await page.getByText("Sit & Reach", { exact: true }).click();
    await expect(page.getByText(/1 von \d+ erledigt/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/1 von \d+ erledigt/)).toBeVisible();
    await page.getByRole("button", { name: "Alle Häkchen zurücksetzen" }).click();
    await expect(page.getByText(/0 von \d+ erledigt – 0 %/)).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    expect(supabaseRequests).toEqual([]);
  });
});
