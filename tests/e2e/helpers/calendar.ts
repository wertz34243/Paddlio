import { expect, type Locator, type Page } from "@playwright/test";

export async function ensureCalendarTraining(page: Page): Promise<Locator> {
  const firstTraining = page.locator(".master-training-block-main").first();
  if (await firstTraining.isVisible().catch(() => false)) return firstTraining;

  const templatePanel = page.locator(".master-calendar-context .master-template-panel").first();
  if (!await templatePanel.isVisible().catch(() => false)) {
    await page.locator(".master-calendar-toolbar").getByRole("button", { name: /^Vorlagen$/i }).click();
    await expect(templatePanel).toBeVisible({ timeout: 20_000 });
  }

  const template = templatePanel.locator(".master-template-card").first();
  await expect(template).toBeVisible({ timeout: 20_000 });
  await template.click();

  const quickEdit = page
    .getByRole("region", { name: /Training schnell/i })
    .or(page.getByRole("dialog", { name: /Training schnell/i }))
    .first();
  await expect(quickEdit).toBeVisible({ timeout: 20_000 });
  await quickEdit.getByRole("button", { name: /Einf.*gen/i }).click();
  await expect(quickEdit).not.toBeVisible({ timeout: 20_000 });
  await expect(firstTraining).toBeVisible({ timeout: 20_000 });
  return firstTraining;
}
