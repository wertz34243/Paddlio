import { existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const path = ".env.e2e.local";
const ignored = execFileSync("git", ["check-ignore", "--", path], { encoding: "utf8" }).trim();
if (ignored !== path) throw new Error("Test credentials must be excluded from Git.");
if (existsSync(path)) {
  console.log("Existing .env.e2e.local preserved; no values displayed.");
} else {
  writeFileSync(path, [
    "# DEV only. Never commit, copy to Production, or paste passwords into chat.",
    "# Use four distinct confirmed DEV accounts; roles are assigned in profiles.roles.",
    "# Public DEV key is inherited from .env.local; no service-role key is needed here.",
    "VITE_SUPABASE_URL=https://nlllqsfdhfiwticrcrnp.supabase.co",
    ...["ATHLETE", "COACH", "CLUBADMIN", "ADMIN"].flatMap((role) => [
      `PADDLIO_E2E_${role}_EMAIL=`,
      `PADDLIO_E2E_${role}_PASSWORD=`,
    ]),
    "",
  ].join("\n"), { flag: "wx", mode: 0o600 });
  console.log("Created ignored .env.e2e.local with empty credential fields.");
}
