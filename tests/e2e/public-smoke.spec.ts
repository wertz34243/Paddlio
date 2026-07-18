import { expect, test } from "@playwright/test";

test("public app shell shows login without exposing private navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Einloggen" })).toBeVisible();
  await expect(page.getByText("Konto erstellen")).toBeVisible();
  await expect(page.getByText("Heute")).not.toBeVisible();
  await expect(page.getByTestId("bottom-navigation")).not.toBeVisible();
});
