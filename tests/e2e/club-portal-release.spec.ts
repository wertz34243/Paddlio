import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

test("club admin persists portal material through reload", async ({ page }, info) => {
  test.skip(info.project.name !== "edge", "Full club administration is a desktop/tablet feature.");
  test.setTimeout(90_000);
  const marker = `Release portal ${Date.now()}`;
  await login(page, process.env.PADDLIO_E2E_CLUBADMIN_EMAIL!, process.env.PADDLIO_E2E_CLUBADMIN_PASSWORD!);
  const openMaterial = async () => {
    await page.getByTestId("nav-club").filter({ visible: true }).click();
    await page.getByRole("tab", { name: "Material", exact: true }).click();
  };
  try {
    await openMaterial();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Material speichern", exact: true }) });
    await form.locator('[name="name"]').fill(marker);
    await form.locator('[name="ownerName"]').fill("Release fixture");
    await form.locator('[name="remark"]').fill("Persistence check");
    await form.getByRole("button", { name: "Material speichern", exact: true }).click();
    await expect(page.locator(".auth-message")).toHaveText("Material gespeichert");
    await page.reload();
    await expect(page.getByTestId("authenticated-app")).toBeVisible({ timeout: 30_000 });
    await openMaterial();
    await expect(page.getByText(marker, { exact: true })).toBeVisible();
  } finally {
    await page.evaluate(async (name) => {
      const path = "/src/lib/supabase.ts";
      const { getSupabaseClient } = await import(/* @vite-ignore */ path);
      const client = getSupabaseClient();
      const { error } = await client.from("club_material").delete().eq("name", name);
      if (error) throw new Error("Portal fixture cleanup failed");
    }, marker);
  }
});
