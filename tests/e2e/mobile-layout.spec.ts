import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("mobile layout guards", () => {
  test("login shell does not overflow on iPhone SE width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Einloggen" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("login shell does not overflow on large phone width", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Einloggen" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
