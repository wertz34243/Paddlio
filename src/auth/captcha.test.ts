import { describe, expect, it } from "vitest";
import { captchaConfig, captchaRequired, isCaptchaError } from "./captcha";

describe("CAPTCHA configuration and error handling", () => {
  it("does not activate an unconfigured integration", () => {
    expect(captchaConfig({})).toEqual({ enabled: false, siteKey: "" });
    expect(captchaRequired(undefined, false)).toBe(false);
  });
  it("fails closed when enabled without a site key or token", () => {
    expect(captchaConfig({ VITE_TURNSTILE_ENABLED: "true" }).enabled).toBe(true);
    expect(captchaRequired("  ", true)).toBe(true);
    expect(captchaRequired(undefined, true)).toBe(true);
  });
  it("requires a token for a configured public key", () => {
    expect(captchaConfig({ VITE_TURNSTILE_SITE_KEY: " public-key " })).toEqual({ enabled: true, siteKey: "public-key" });
    expect(captchaRequired("verified-token", true)).toBe(false);
  });
  it("recognizes verification failures without displaying raw provider messages", () => {
    expect(isCaptchaError({ code: "captcha_failed" })).toBe(true);
    expect(isCaptchaError({ message: "captcha verification process failed" })).toBe(true);
    expect(isCaptchaError({ message: "Invalid credentials" })).toBe(false);
  });
});
