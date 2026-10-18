export const CAPTCHA_MESSAGE = "Bitte bestätige die Sicherheitsprüfung und versuche es erneut.";
export const CAPTCHA_UNAVAILABLE = "Die Sicherheitsprüfung konnte nicht geladen werden. Bitte versuche es erneut.";

export function captchaConfig(env: Record<string, unknown>) {
  const siteKey = String(env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
  return { siteKey, enabled: env.VITE_TURNSTILE_ENABLED === "true" || siteKey.length > 0 };
}

export const authCaptchaConfig = captchaConfig(import.meta.env);

export function captchaRequired(token?: string, enabled = authCaptchaConfig.enabled) {
  return enabled && !token?.trim();
}

export function isCaptchaError(error: { code?: string; message?: string }) {
  return error.code === "captcha_failed" || /captcha|turnstile/i.test(error.message ?? "");
}
