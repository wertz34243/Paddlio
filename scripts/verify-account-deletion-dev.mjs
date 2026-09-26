import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DEV_PROJECT_REF = "nlllqsfdhfiwticrcrnp";
const url = process.env.VITE_SUPABASE_URL ?? "";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.PADDLIO_DEV_SERVICE_ROLE_KEY ?? "";
if (!url.includes(DEV_PROJECT_REF)) throw new Error(`Abbruch: Ziel ist nicht Supabase DEV ${DEV_PROJECT_REF}.`);
if (!anonKey || !serviceRoleKey) throw new Error("DEV API-Konfiguration fehlt.");

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = Date.now();
const email = `paddlio-delete-test-${suffix}@example.invalid`;
const password = `${randomBytes(18).toString("base64url")}aA7!`;
let createdUserId = "";

const { count: profilesBefore, error: profilesBeforeError } = await admin.from("profiles").select("id", { count: "exact", head: true });
const { count: clubsBefore, error: clubsBeforeError } = await admin.from("clubs").select("id", { count: "exact", head: true });
if (profilesBeforeError || clubsBeforeError) throw new Error("DEV-Kontrollzaehler konnten nicht gelesen werden.");

try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { firstName: "Delete", lastName: "Test" },
  });
  if (createError || !created.user) throw new Error("Entbehrliches DEV-Loeschkonto konnte nicht erstellt werden.");
  createdUserId = created.user.id;

  const { error: profileError } = await admin.from("profiles").upsert({
    id: createdUserId,
    email,
    first_name: "Delete",
    last_name: "Test",
    display_name: "Delete Test",
    roles: ["Admin"],
    status: "active",
  });
  if (profileError) throw new Error(`DEV-Testprofil konnte nicht vorbereitet werden (${profileError.code}).`);

  const trainingId = randomUUID();
  const notificationId = randomUUID();
  const templateId = randomUUID();
  const marker = `privacy-delete-${suffix}`;
  const [trainingWrite, notificationWrite, templateWrite] = await Promise.all([
    admin.from("training_plan_items").insert({ id: trainingId, owner_id: createdUserId, title: marker, date: new Date().toISOString().slice(0, 10), duration_minutes: 30, status: "planned" }),
    admin.from("notifications").insert({ id: notificationId, user_id: createdUserId, title: marker }),
    admin.from("training_templates").insert({ id: templateId, owner_id: createdUserId, created_by: createdUserId, title: marker, category: "Allgemein", default_intensity: "mittel", visibility: "private" }),
  ]);
  for (const result of [trainingWrite, notificationWrite, templateWrite]) {
    if (result.error) throw new Error(`DEV-Testdaten konnten nicht vorbereitet werden (${result.error.code}).`);
  }

  const userClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: signInError } = await userClient.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error("Login des entbehrlichen DEV-Loeschkontos fehlgeschlagen.");

  const { data: wrongData, error: wrongError } = await userClient.functions.invoke("account-privacy", {
    body: { action: "delete", confirmation: "FALSCH", confirmAccountId: createdUserId },
  });
  if (!wrongError && wrongData?.deleted) throw new Error("Falsche Bestaetigungsphrase wurde akzeptiert.");

  const { data: deleteData, error: deleteError } = await userClient.functions.invoke("account-privacy", {
    body: { action: "delete", confirmation: "KONTO ENDGUELTIG LOESCHEN", confirmAccountId: createdUserId },
  });
  if (deleteError || !deleteData?.deleted) {
    let diagnostic = "";
    if (deleteError?.context && typeof deleteError.context.json === "function") {
      const body = await deleteError.context.json().catch(() => null);
      if (body?.diagnostic?.table && body?.diagnostic?.code) diagnostic = `: ${body.diagnostic.table}/${body.diagnostic.code}`;
    }
    throw new Error(`DEV-Kontoloeschung fehlgeschlagen${diagnostic}.`);
  }

  const { data: authLookup } = await admin.auth.admin.getUserById(createdUserId);
  const [profileCheck, trainingCheck, notificationCheck, templateCheck, profilesAfter, clubsAfter] = await Promise.all([
    admin.from("profiles").select("id").eq("id", createdUserId).maybeSingle(),
    admin.from("training_plan_items").select("id").eq("id", trainingId).maybeSingle(),
    admin.from("notifications").select("id").eq("id", notificationId).maybeSingle(),
    admin.from("training_templates").select("id").eq("id", templateId).maybeSingle(),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("clubs").select("id", { count: "exact", head: true }),
  ]);
  if (authLookup.user || profileCheck.data || trainingCheck.data || notificationCheck.data || templateCheck.data) throw new Error("DEV-Loeschkonto oder Testdaten sind noch vorhanden.");
  if (profilesAfter.count !== profilesBefore) throw new Error("Ein fremdes Profil wurde veraendert oder nicht nur das Testprofil entfernt.");
  if (clubsAfter.count !== clubsBefore) throw new Error("Vereinsdaten wurden beim Loeschtest veraendert.");

  const retryClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: retryLoginError } = await retryClient.auth.signInWithPassword({ email, password });
  if (!retryLoginError) throw new Error("Login mit geloeschtem DEV-Testkonto ist weiterhin moeglich.");

  console.log(JSON.stringify({
    projectRef: DEV_PROJECT_REF,
    disposableAccountCreated: true,
    wrongConfirmationRejected: true,
    accountDeleted: true,
    dependentTestRowsDeleted: true,
    unrelatedProfileCountUnchanged: true,
    clubCountUnchanged: true,
    loginAfterDeletionRejected: true,
  }));
  createdUserId = "";
} finally {
  if (createdUserId) await admin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
}
