import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

loadLocalEnv(".env.local");
loadLocalEnv(".env.e2e.local", true);

// Authenticated browser tests may write fixtures. Never point them at Production.
const hasRoleCredentials = ["ATHLETE", "COACH", "CLUBADMIN", "ADMIN"]
  .some((role) => process.env[`PADDLIO_E2E_${role}_EMAIL`] || process.env[`PADDLIO_E2E_${role}_PASSWORD`]);
if (hasRoleCredentials && process.env.VITE_SUPABASE_URL !== "https://nlllqsfdhfiwticrcrnp.supabase.co") {
  throw new Error("Authenticated E2E tests require the exact Paddlio DEV URL.");
}

function loadLocalEnv(path: string, override = false) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && (override || process.env[key] === undefined)) {
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: process.env.PADDLIO_E2E_COACH_EMAIL ? 1 : undefined,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    // Auth traces contain request tokens and password fill arguments.
    trace: "off",
  },
  webServer: {
    command: "npm.cmd run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "edge",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
    {
      name: "mobile-edge",
      use: { ...devices["Pixel 7"], channel: "msedge" },
    },
  ],
});
