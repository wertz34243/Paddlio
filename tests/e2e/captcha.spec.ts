import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page, baseURL }) => {
  test.skip(!baseURL?.endsWith(":5174"), "Use playwright.captcha.config.ts for isolated CAPTCHA fixtures");
  await page.route("https://*.supabase.co/**", (route) => route.fulfill({ json: [] }));
  await page.route("https://challenges.cloudflare.com/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: `window.turnstile = {
      render(element, options) {
        for (const [label, handler] of [
          ['Testprüfung bestätigen', () => options.callback('test-verified-token')],
          ['Testprüfung ablaufen', () => options['expired-callback']()],
          ['Testprüfung Fehler', () => options['error-callback']()]
        ]) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.onclick = handler; element.append(button); }
        element.id = 'test-widget'; return element.id;
      },
      remove(id) { document.getElementById(id)?.replaceChildren(); }
    };`,
  }));
});

async function verify(page: Page) { await page.getByRole("button", { name: "Testprüfung bestätigen" }).click(); }

test("login blocks missing/expired tokens and retains credentials after failure", async ({ page }) => {
  let body: Record<string, unknown> | undefined;
  await page.route("**/auth/v1/token?**", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 400, json: { code: "captcha_failed", msg: "raw captcha provider error" } });
  });
  await page.goto("/");
  await page.locator('[name="email"]').fill("test@example.com");
  await page.locator('[name="password"]').fill("TestPassword!23");
  const login = page.getByRole("button", { name: "Einloggen" });
  await expect(login).toBeDisabled();
  await verify(page);
  await expect(login).toBeEnabled();
  await page.getByRole("button", { name: "Testprüfung ablaufen" }).click();
  await expect(login).toBeDisabled();
  await verify(page);
  await login.click();
  await expect(page.getByText("Bitte bestätige die Sicherheitsprüfung und versuche es erneut.")).toBeVisible();
  expect(body?.gotrue_meta_security).toEqual({ captcha_token: "test-verified-token" });
  await expect(page.locator('[name="email"]')).toHaveValue("test@example.com");
  await expect(page.locator('[name="password"]')).toHaveValue("TestPassword!23");
  await expect(login).toBeDisabled();
  await page.getByRole("button", { name: "Testprüfung Fehler" }).click();
  await expect(page.getByRole("alert")).toContainText("nicht geladen");
  await page.getByRole("button", { name: "Sicherheitsprüfung erneut laden" }).click();
  await verify(page);
  await expect(login).toBeEnabled();
});

test("recovery passes the token and allows retry without losing the email", async ({ page }) => {
  let body: Record<string, unknown> | undefined;
  await page.route("**/auth/v1/recover**", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 400, json: { code: "captcha_failed", msg: "captcha verification failed" } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Passwort vergessen" }).click();
  await page.getByLabel("E-Mail für Passwort-Reset").fill("test@example.com");
  const send = page.getByRole("button", { name: "Reset-Link senden" });
  await expect(send).toBeDisabled();
  await verify(page); await send.click();
  await expect(page.getByText("Bitte bestätige die Sicherheitsprüfung und versuche es erneut.")).toBeVisible();
  expect(body?.gotrue_meta_security).toEqual({ captcha_token: "test-verified-token" });
  await expect(page.getByLabel("E-Mail für Passwort-Reset")).toHaveValue("test@example.com");
  await expect(send).toBeDisabled();
});

test("registration and resend both require fresh tokens and preserve the 16+ metadata", async ({ page }) => {
  const requests: Record<string, any>[] = [];
  await page.route("**/auth/v1/signup**", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: { id: "test-user", email: "test@example.com", identities: [] } });
  });
  await page.route("**/auth/v1/resend**", async (route) => {
    requests.push(route.request().postDataJSON());
    if (requests.length === 2) {
      await route.fulfill({ status: 400, json: { code: "captcha_failed", msg: "captcha verification failed" } });
    } else await route.fulfill({ json: {} });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Konto erstellen", exact: true }).click();
  await page.getByLabel("Vorname", { exact: true }).fill("Test");
  await page.getByLabel("Nachname", { exact: true }).fill("Person");
  await page.locator('[name="email"]').fill("test@example.com");
  await page.locator('[name="birthDate"]').fill("2000-01-01");
  await page.getByRole("button", { name: "Verein vorschlagen" }).click();
  await page.getByLabel("Vereinsname").fill("Testverein");
  await page.locator('[name="password"]').fill("TestPassword!23");
  await page.locator('[name="passwordRepeat"]').fill("TestPassword!23");
  await page.locator('[name="privacyAccepted"]').check();
  const submit = page.locator('button[type="submit"]');
  await expect(submit).toBeDisabled();
  await verify(page); await submit.click();
  const resend = page.getByRole("button", { name: "Bestätigungsmail erneut senden" });
  await expect(resend).toBeVisible();
  await expect(resend).toBeDisabled();
  await verify(page); await resend.click();
  await expect(page.getByText("Bitte bestätige die Sicherheitsprüfung und versuche es erneut.")).toBeVisible();
  await expect(resend).toBeVisible();
  await expect(resend).toBeDisabled();
  await verify(page); await resend.click();
  await expect(page.getByText(/Bestätigungsmail wurde erneut angefordert/)).toBeVisible();
  expect(requests).toHaveLength(3);
  for (const body of requests) expect(body.gotrue_meta_security).toEqual({ captcha_token: "test-verified-token" });
  expect(requests[0].data.registrationPolicy).toBe("self_registration_16_plus_v1");
  expect(requests[0].data.birthDate).toBe("2000-01-01");
});

test("script failure is recoverable without submitting Auth requests", async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("nicht geladen");
  await expect(page.getByRole("button", { name: "Einloggen" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sicherheitsprüfung erneut laden" })).toBeEnabled();
});
