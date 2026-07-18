import { expect, test } from "@playwright/test";

test("public app shell shows login without exposing private navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Einloggen" })).toBeVisible();
  await expect(page.getByText("Konto erstellen")).toBeVisible();
  await expect(page.getByText("Heute")).not.toBeVisible();
  await expect(page.getByTestId("bottom-navigation")).not.toBeVisible();
});

test("public controls expose accessible names", async ({ page }) => {
  await page.goto("/");

  const unnamedButtons = await page.locator("button").evaluateAll((buttons) =>
    buttons
      .map((button, index) => ({
        index,
        text: button.textContent?.trim() ?? "",
        label: button.getAttribute("aria-label") ?? "",
        title: button.getAttribute("title") ?? "",
      }))
      .filter((button) => !button.text && !button.label && !button.title),
  );

  expect(unnamedButtons).toEqual([]);
});
