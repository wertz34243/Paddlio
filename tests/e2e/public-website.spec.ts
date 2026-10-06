import { expect, test } from "@playwright/test";

test.describe("public Paddlio website", () => {
  test("works without login or private app initialization", async ({ page }) => {
    const supabaseRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes(".supabase.co")) supabaseRequests.push(request.url());
    });

    await page.goto("/public-preview");
    await expect(page.getByRole("heading", { name: "Paddlio", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Paddlio App öffnen" })).toHaveAttribute("href", "https://dev.paddlio.de");
    await expect(page.getByTestId("authenticated-app")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    expect(supabaseRequests).toEqual([]);
  });

  test("exposes installation and legal pages", async ({ page }) => {
    for (const [route, heading] of [
      ["/installation", "Paddlio auf deinem Gerät."],
      ["/datenschutz", "Datenschutzerklärung"],
      ["/impressum", "Impressum"],
    ] as const) {
      await page.goto(`/public-preview${route}`);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
  });

  test("keeps the public layout usable on phone and desktop", async ({ page }) => {
    for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/public-preview/funktionen");
      await expect(page.getByRole("heading", { name: "Training, Wettkampf und Team in einem Arbeitsraum." })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow).toBe(false);
    }
  });
});
