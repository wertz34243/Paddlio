import { expect, test } from "@playwright/test";

test("password recovery link shows reset screen instead of app dashboard", async ({ page }) => {
  await page.goto("/?type=recovery");

  await expect(page.getByRole("heading", { name: "Neues Passwort festlegen" })).toBeVisible();
  await expect(page.getByText("Dieser Link ist ungültig oder abgelaufen.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Neuen Link anfordern" })).toBeVisible();
  await expect(page.getByText("Heute")).not.toBeVisible();
  await expect(page.getByTestId("bottom-navigation")).not.toBeVisible();
});
