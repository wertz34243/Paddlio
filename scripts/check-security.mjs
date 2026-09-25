import fs from "node:fs";

const failures = [];
const read = (path) => fs.readFileSync(path, "utf8");

const profileService = read("src/services/profileService.ts");
const storage = read("src/data/storage.ts");
const vercel = JSON.parse(read("vercel.json"));
const polarHandlers = ["start", "status", "disconnect", "sync"].map((name) => read(`api/polar/${name}.js`));

if (/ADMIN_EMAILS?|dev\.admin@paddlio\.test|t\.kanu@outlook\.com/.test(profileService + storage)) {
  failures.push("Client code must not derive administrator privileges from email addresses.");
}
if (/getCloudRolesFromMetadata\([^)]*\)/.test(profileService) && /\.\.\.getCloudRolesFromMetadata/.test(profileService)) {
  failures.push("Client-editable auth metadata must not grant profile roles.");
}
if (polarHandlers.some((source) => /sendJson\(res,\s*500,\s*\{\s*error:\s*error\s+instanceof\s+Error/.test(source))) {
  failures.push("API handlers must not return raw internal error messages.");
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
