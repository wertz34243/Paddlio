import { expect, test } from "@playwright/test";

test("email confirmation link returns to login instead of dashboard", async ({ page }) => {
  await page.goto("/?type=signup");

  await expect(page.getByRole("button", { name: "Einloggen" })).toBeVisible();
  await expect(page.getByText("E-Mail-Adresse bestätigt. Du kannst dich jetzt anmelden.")).toBeVisible();
  await expect(page.getByText("Heute")).not.toBeVisible();
  await expect(page.getByTestId("bottom-navigation")).not.toBeVisible();
});
