import { expect, test } from "@playwright/test";

test("registration communicates and enforces the release password shape in the browser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: "Paddlio" })).toHaveAttribute("src", "/brand/paddlio-brand-primary.webp");
  await page.getByRole("button", { name: "Konto erstellen" }).click();

  await expect(page.getByText("Die selbstständige Registrierung ist ab 16 Jahren möglich.")).toBeVisible();
  await expect(page.getByText("Mindestens 10 Zeichen mit Großbuchstabe, Kleinbuchstabe, Zahl und Sonderzeichen.")).toBeVisible();
  const passwordFields = page.locator('input[autocomplete="new-password"]');
  await expect(passwordFields).toHaveCount(2);
  await expect(passwordFields.first()).toHaveAttribute("minlength", "10");
  await expect(passwordFields.last()).toHaveAttribute("minlength", "10");
});
