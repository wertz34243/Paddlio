import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DEV_PROJECT_REF = "nlllqsfdhfiwticrcrnp";

for (const path of [".env.local", ".env.e2e.local"]) {
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const url = process.env.VITE_SUPABASE_URL ?? "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const testRole = (process.env.PADDLIO_PRIVACY_TEST_ROLE ?? "coach").toUpperCase();
const email = process.env[`PADDLIO_E2E_${testRole}_EMAIL`] ?? "";
const password = process.env[`PADDLIO_E2E_${testRole}_PASSWORD`] ?? "";

if (!url.includes(DEV_PROJECT_REF)) throw new Error(`Abbruch: Ziel ist nicht Supabase DEV ${DEV_PROJECT_REF}.`);
if (!anonKey || !email || !password) throw new Error("DEV-Konfiguration oder Coach-E2E-Zugang fehlt.");

const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password });
if (signInError || !signInData.user || !signInData.session?.access_token) throw new Error("DEV-Testlogin fehlgeschlagen.");

const functionUrl = `${url}/functions/v1/account-privacy`;
const preflightResponse = await fetch(functionUrl, {
  method: "OPTIONS",
  headers: {
    Origin: "https://dev.paddlio.de",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "authorization,apikey,content-type",
  },
});
if (!preflightResponse.ok || preflightResponse.headers.get("access-control-allow-origin") !== "https://dev.paddlio.de") {
  throw new Error("DEV-CORS-Preflight fuer dev.paddlio.de fehlgeschlagen.");
}

const foreignOriginResponse = await fetch(functionUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${signInData.session.access_token}`,
    apikey: anonKey,
    "Content-Type": "application/json",
    Origin: "https://example.invalid",
  },
  body: JSON.stringify({ action: "export" }),
});
if (foreignOriginResponse.status !== 403) throw new Error("Fremde Origin wurde nicht abgelehnt.");

const { data: exportData, error: exportError } = await client.functions.invoke("account-privacy", { body: { action: "export" } });
if (exportError || !exportData?.export) {
  let diagnostic = "";
  if (exportError?.context && typeof exportError.context.json === "function") {
    const body = await exportError.context.json().catch(() => null);
    if (body?.diagnostic?.table && body?.diagnostic?.code) diagnostic = `: ${body.diagnostic.table}/${body.diagnostic.code}`;
  }
  throw new Error(`DEV-Export fehlgeschlagen${exportError?.context?.status ? ` (HTTP ${exportError.context.status})` : ""}${diagnostic}.`);
}

const serialized = JSON.stringify(exportData.export);
const forbiddenKeys = ["access_token_encrypted", "refresh_token_encrypted", "service_role", "SUPABASE_SERVICE_ROLE_KEY"];
if (forbiddenKeys.some((key) => serialized.includes(key))) throw new Error("Export enthaelt ein verbotenes Geheimnisfeld.");
if (exportData.export.account?.id !== signInData.user.id) throw new Error("Export gehoert nicht zum angemeldeten Konto.");

const identityFields = new Set(["athlete_id", "assigned_athlete_id", "assigned_to", "assigned_by", "author_id", "coach_id", "created_by", "owner_id", "owner_user_id", "receiver_id", "sender_id", "sender_user_id", "target_user_id", "trainer_user_id", "uploaded_by_user_id", "user_id"]);
let foreignIdentityCount = 0;
let maskedIdentityCount = 0;
function inspect(value) {
  if (Array.isArray(value)) return value.forEach(inspect);
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (identityFields.has(key) && typeof item === "string") {
      if (item === "[andere Person]") maskedIdentityCount += 1;
      else if (item !== signInData.user.id) foreignIdentityCount += 1;
    }
    inspect(item);
  }
}
inspect(exportData.export.datasets);
if (foreignIdentityCount > 0) throw new Error("Export enthaelt unmaskierte fremde Identitaeten.");

const { data: deleteData, error: deleteError } = await client.functions.invoke("account-privacy", {
  body: { action: "delete", confirmation: "FALSCH", confirmAccountId: signInData.user.id },
});
if (!deleteError && deleteData?.deleted) throw new Error("Falsche Loeschbestaetigung wurde akzeptiert.");

const datasetCounts = Object.fromEntries(Object.entries(exportData.export.datasets ?? {}).map(([table, rows]) => [table, Array.isArray(rows) ? rows.length : 0]));
const populatedDatasetCount = Object.values(datasetCounts).filter((count) => count > 0).length;

await client.auth.signOut();
console.log(JSON.stringify({
  projectRef: DEV_PROJECT_REF,
  testRole: testRole.toLowerCase(),
  authenticatedExport: true,
  validJson: true,
  ownAccount: true,
  forbiddenSecretFields: false,
  unmaskedForeignIdentities: foreignIdentityCount,
  maskedForeignIdentities: maskedIdentityCount,
  populatedDatasetCount,
  wrongDeletionConfirmationRejected: true,
  allowedOriginPreflightAccepted: true,
  foreignOriginRejected: true,
}));
