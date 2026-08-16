import { expect, type Page } from "@playwright/test";

const loginErrorPattern = /E-Mail oder Passwort ist nicht korrekt|Supabase ist noch nicht vollstaendig konfiguriert|Supabase ist noch nicht vollständig konfiguriert|Invalid path specified in request URL/i;

export async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Einloggen" }).click();

  const authenticatedApp = page.getByTestId("authenticated-app");
  const authError = page.locator(".auth-message").filter({ hasText: loginErrorPattern }).last();

  const result = await Promise.race([
    authenticatedApp.waitFor({ state: "visible", timeout: 20_000 }).then(() => "authenticated" as const),
    authError.waitFor({ state: "visible", timeout: 20_000 }).then(() => "auth-error" as const),
  ]);

  if (result === "auth-error") {
    const message = (await authError.textContent())?.trim() || "Unbekannter Loginfehler";
    throw new Error(`E2E login failed for ${email}: ${message}`);
  }

  await expect(authenticatedApp).toBeVisible();
}
