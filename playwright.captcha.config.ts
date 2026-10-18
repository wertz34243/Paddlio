import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Isolated browser tests: mocked provider + mocked Auth. No real emails or DB writes.
export default defineConfig({
  ...base,
  testMatch: "captcha.spec.ts",
  use: { baseURL: "http://127.0.0.1:5174" },
  webServer: {
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort",
    url: "http://127.0.0.1:5174", reuseExistingServer: false,
    env: {
      VITE_TURNSTILE_ENABLED: "true", VITE_TURNSTILE_SITE_KEY: "test-site-key",
      VITE_SUPABASE_URL: "https://captcha-test.supabase.co", VITE_SUPABASE_ANON_KEY: "test-publishable-key",
    },
  },
});
