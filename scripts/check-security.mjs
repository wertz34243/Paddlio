import fs from "node:fs";

const failures = [];
const read = (path) => fs.readFileSync(path, "utf8");

const profileService = read("src/services/profileService.ts");
const storage = read("src/data/storage.ts");
const vercel = JSON.parse(read("vercel.json"));
const polarHandlers = ["start", "status", "disconnect", "sync"].map((name) => read(`api/polar/${name}.js`));
const polarView = read("src/views/PolarIntegrationView.tsx");
const communicationView = read("src/views/CommunicationView.tsx");
const hardeningMigration = read("supabase/migrations/20261006154000_security_release_hardening.sql");
const releaseMigration = read("supabase/migrations/20261006163252_release_auth_age_and_privacy_hardening.sql");
const accountPrivacyFunction = read("supabase/functions/account-privacy/index.ts");

if (/ADMIN_EMAILS?|dev\.admin@paddlio\.test|t\.kanu@outlook\.com/.test(profileService + storage)) {
  failures.push("Client code must not derive administrator privileges from email addresses.");
}
if (/getCloudRolesFromMetadata\([^)]*\)/.test(profileService) && /\.\.\.getCloudRolesFromMetadata/.test(profileService)) {
  failures.push("Client-editable auth metadata must not grant profile roles.");
}
if (polarHandlers.some((source) => /sendJson\(res,\s*500,\s*\{\s*error:\s*error\s+instanceof\s+Error/.test(source))) {
  failures.push("API handlers must not return raw internal error messages.");
}
if (communicationView.includes('{ id: "files", label: "Dateien" }') || communicationView.includes("Anhänge vorbereiten")) {
  failures.push("Unreleased attachment metadata UI must not be exposed to normal users.");
}
if (!polarView.includes("Polar AccessLink · Beta") || !polarView.includes("!sessionAccessToken || !envReady")) {
  failures.push("Polar must remain marked as beta and unavailable without verified server configuration.");
}
if (!hardeningMigration.includes("alter function public.set_updated_at() set search_path = ''")
  || !hardeningMigration.includes("revoke all on function %s from anon")) {
  failures.push("Security release migration must harden function search paths and anonymous execution.");
}
if (!releaseMigration.includes("paddlio_before_user_created_500")
  || !releaseMigration.includes("current_date - interval '16 years'")
  || !releaseMigration.includes("revoke all on function public.paddlio_before_user_created_500(jsonb) from public, anon, authenticated")) {
  failures.push("Release migration must enforce the 16+ registration rule in a private Auth hook.");
}
const deleteSpecs = accountPrivacyFunction.slice(
  accountPrivacyFunction.indexOf("const deleteSpecs"),
  accountPrivacyFunction.indexOf("function allowedOrigins"),
);
if (!accountPrivacyFunction.includes('from("direct_messages").update({ sender_id: null })')
  || !accountPrivacyFunction.includes('from("direct_messages").update({ receiver_id: null })')
  || deleteSpecs.includes('table: "direct_messages"')) {
  failures.push("Account deletion must anonymize shared messages instead of deleting other participants' conversation history.");
}

const headers = new Map((vercel.headers?.[0]?.headers ?? []).map((entry) => [entry.key.toLowerCase(), entry.value]));
for (const required of ["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy", "x-frame-options", "strict-transport-security"]) {
  if (!headers.has(required)) failures.push(`Missing deployment security header: ${required}`);
}

if (failures.length) {
  console.error("Security release check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Security release check passed.");
