import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const PRODUCTION_PROJECT_REF = "twlkhfbrrwjwppxinmpn";
const DEFAULT_DEVELOPMENT_PROJECT_REF = "nlllqsfdhfiwticrcrnp";

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (!key || process.env[key]) continue;
    process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.development.local");

const appEnv = process.env.VITE_APP_ENV || process.env.APP_ENV || "";
const allowSeed = process.env.PADDLIO_SEED_ALLOW_DEVELOPMENT === "true";
const expectedDevelopmentRef =
  process.env.PADDLIO_DEV_SUPABASE_PROJECT_REF || DEFAULT_DEVELOPMENT_PROJECT_REF;
const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const testPassword = process.env.PADDLIO_DEV_TEST_PASSWORD || "";

function fail(message) {
  console.error(`\n[seed:development] ${message}\n`);
  process.exit(1);
}

function normalizeSupabaseUrl(value) {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    if (!url.hostname.endsWith(".supabase.co")) return trimmed;
    return `https://${url.hostname}`;
  } catch {
    return trimmed;
  }
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

function assertDevelopmentTarget() {
  if (!allowSeed) {
    fail("Setze PADDLIO_SEED_ALLOW_DEVELOPMENT=true, um den Development-Seed explizit freizugeben.");
  }

  if (appEnv !== "development") {
    fail("VITE_APP_ENV oder APP_ENV muss exakt development sein.");
  }

  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    fail(
      "SUPABASE_URL/VITE_SUPABASE_URL ist keine gueltige Supabase-Projekt-URL. " +
        "Nutze die Project URL ohne /rest/v1/, z. B. https://projekt-ref.supabase.co.",
    );
  }

  if (supabaseUrl.includes(PRODUCTION_PROJECT_REF)) {
    fail("Production-Supabase erkannt. Seed wird blockiert.");
  }

  if (!supabaseUrl.includes(expectedDevelopmentRef)) {
    fail(
      `Supabase-Projekt passt nicht zum erwarteten Development-Ref ${expectedDevelopmentRef}. ` +
        "Setze PADDLIO_DEV_SUPABASE_PROJECT_REF bewusst, falls sich das Dev-Projekt geaendert hat.",
    );
  }

  if (!serviceRoleKey) {
    fail("SUPABASE_SERVICE_ROLE_KEY fehlt. Nutze ausschliesslich den Development-Service-Role-Key.");
  }

  if (testPassword.length < 12) {
    fail("PADDLIO_DEV_TEST_PASSWORD fehlt oder ist kuerzer als 12 Zeichen.");
  }
}

assertDevelopmentTarget();

console.log(`[seed:development] Ziel: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const clubId = "11111111-1111-4111-8111-111111111111";
const groupId = "22222222-2222-4222-8222-222222222222";
const seriesId = "dev-series-u14-technik-week";

const users = [
  { key: "admin", email: "dev.admin@paddlio.test", firstName: "Dev", lastName: "Admin", roles: ["Admin"], ageCategory: null, boatClasses: [] },
  { key: "clubAdmin", email: "dev.clubadmin@paddlio.test", firstName: "Dev", lastName: "ClubAdmin", roles: ["ClubAdmin"], ageCategory: null, boatClasses: [] },
  { key: "coach", email: "dev.coach@paddlio.test", firstName: "Dev", lastName: "Coach", roles: ["Coach"], ageCategory: null, boatClasses: ["K1"] },
  { key: "athlete", email: "dev.athlete@paddlio.test", firstName: "Test", lastName: "Athlete", roles: ["Athlete"], ageCategory: "U18", boatClasses: ["K1"] },
  { key: "athlete1", email: "dev.athlete1@paddlio.test", firstName: "Mia", lastName: "Test", roles: ["Athlete"], ageCategory: "U14", boatClasses: ["K1"] },
  { key: "athlete2", email: "dev.athlete2@paddlio.test", firstName: "Noah", lastName: "Test", roles: ["Athlete"], ageCategory: "U14", boatClasses: ["C1"] },
  { key: "athlete3", email: "dev.athlete3@paddlio.test", firstName: "Lea", lastName: "Test", roles: ["Athlete"], ageCategory: "U12", boatClasses: ["K1"] },
];

const profileRolesFor = (user) => {
  return user.roles;
};

const today = new Date();
const isoDate = (offsetDays) => {
  const value = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays);
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
};
const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
const weekDate = (dayIndex) => {
  const value = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayIndex);
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
};

async function requireOk(label, promise) {
  const { data, error } = await promise;
  if (error) {
    fail(`${label} fehlgeschlagen: ${error.message}`);
  }
  return data;
}

function removeColumnFromPayload(payload, column) {
  const cleanRow = (row) => {
    const { [column]: _removed, ...rest } = row;
    return rest;
  };

  return Array.isArray(payload) ? payload.map(cleanRow) : cleanRow(payload);
}

function getMissingColumn(error) {
  return error?.message?.match(/Could not find the '([^']+)' column/)?.[1] ?? null;
}

function isMissingTable(error) {
  const message = error?.message ?? "";
  return message.includes("Could not find the table") || message.includes("does not exist");
}

async function upsertAdaptive(label, table, payload, options, { optional = false } = {}) {
  let nextPayload = payload;
  const removedColumns = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await supabase.from(table).upsert(nextPayload, options);

    if (!error) {
      if (removedColumns.length) {
        console.log(`[seed:development] ${label}: optionale Spalten ausgelassen: ${removedColumns.join(", ")}`);
      }
      return;
    }

    const missingColumn = getMissingColumn(error);
    if (missingColumn) {
      removedColumns.push(missingColumn);
      nextPayload = removeColumnFromPayload(nextPayload, missingColumn);
      continue;
    }

    if (optional && isMissingTable(error)) {
      console.log(`[seed:development] ${label}: optionale Tabelle fehlt, Schritt uebersprungen.`);
      return;
    }

    fail(`${label} fehlgeschlagen: ${error.message}`);
  }

  fail(`${label} fehlgeschlagen: zu viele Schema-Anpassungen noetig.`);
}

function buildProfilePayload(ids, { clubAdminFallback = false } = {}) {
  return users.map((user) => {
    const roles = clubAdminFallback && user.key === "clubAdmin" ? ["TeamAdmin"] : profileRolesFor(user);
    return {
      id: ids[user.key],
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      display_name: `${user.firstName} ${user.lastName}`,
      club_id: clubId,
      active_club_id: clubId,
      roles,
      primary_role: roles[0],
      status: "active",
      age_category: user.ageCategory,
      boat_classes: user.boatClasses,
      updated_at: now,
    };
  });
}

async function upsertProfiles(ids) {
  let nextPayload = buildProfilePayload(ids);
  const removedColumns = [];
  let usedClubAdminFallback = false;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const { error } = await supabase.from("profiles").upsert(nextPayload, { onConflict: "id" });

    if (!error) {
      if (removedColumns.length) {
        console.log(`[seed:development] Profile upsert: optionale Spalten ausgelassen: ${removedColumns.join(", ")}`);
      }
      if (usedClubAdminFallback) {
        console.log("[seed:development] ClubAdmin-Profilrolle auf TeamAdmin fallback, weil die Dev-Datenbank ClubAdmin im profiles_roles_check noch nicht erlaubt.");
      }
      return;
    }

    const missingColumn = getMissingColumn(error);
    if (missingColumn) {
      removedColumns.push(missingColumn);
      nextPayload = removeColumnFromPayload(nextPayload, missingColumn);
      continue;
    }

    if (!usedClubAdminFallback && error.message.includes("profiles_roles_check")) {
      usedClubAdminFallback = true;
      nextPayload = buildProfilePayload(ids, { clubAdminFallback: true });
      for (const column of removedColumns) {
        nextPayload = removeColumnFromPayload(nextPayload, column);
      }
      continue;
    }

    fail(`Profile upsert fehlgeschlagen: ${error.message}`);
  }

  fail("Profile upsert fehlgeschlagen: zu viele Schema-Anpassungen noetig.");
}

async function listAllAuthUsers() {
  const result = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail(`Auth-User-Liste fehlgeschlagen: ${error.message}`);
    result.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return result;
}

async function ensureAuthUsers() {
  const existingUsers = await listAllAuthUsers();
  const byEmail = new Map(existingUsers.map((user) => [user.email?.toLowerCase(), user]));
  const ids = {};

  for (const user of users) {
    const existing = byEmail.get(user.email.toLowerCase());
    if (existing) {
      ids[user.key] = existing.id;
      await requireOk(
        `Auth-User aktualisieren ${user.email}`,
        supabase.auth.admin.updateUserById(existing.id, {
          password: testPassword,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
            roles: user.roles,
            paddlio_seed: "development",
          },
        }),
      );
      continue;
    }

    const created = await requireOk(
      `Auth-User anlegen ${user.email}`,
      supabase.auth.admin.createUser({
        email: user.email,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
          roles: user.roles,
          paddlio_seed: "development",
        },
      }),
    );
    ids[user.key] = created.user.id;
  }

  return ids;
}

const ids = await ensureAuthUsers();
const now = new Date().toISOString();

await upsertAdaptive(
  "Club upsert",
  "clubs",
  {
    id: clubId,
    name: "Paddlio Testverein",
    short_name: "PAD-TEST",
    city: "Development",
    contact_name: "Dev ClubAdmin",
    contact_email: "dev.clubadmin@paddlio.test",
    primary_color: "#00b4d8",
    secondary_color: "#22c55e",
    status: "active",
    updated_at: now,
  },
  { onConflict: "id" },
);

await upsertProfiles(ids);

await upsertAdaptive(
  "Club-Mitgliedschaften upsert",
  "club_memberships",
  users.map((user) => ({
    club_id: clubId,
    user_id: ids[user.key],
    role: user.roles[0],
    status: "active",
    updated_at: now,
  })),
  { onConflict: "club_id,user_id" },
  { optional: true },
);

await upsertAdaptive(
  "Trainingsgruppe upsert",
  "training_groups",
  {
    id: groupId,
    club_id: clubId,
    coach_id: ids.coach,
    name: "Paddlio Testgruppe U18",
    description: "Testgruppe fuer Planung, Anwesenheit, Feedback und Traineraufgaben.",
    age_category: "U18",
    boat_classes: ["K1", "C1"],
    training_focus: "Technik und Grundlagen",
    color: "#00b4d8",
    status: "active",
    updated_at: now,
  },
  { onConflict: "id" },
  { optional: true },
);

await upsertAdaptive(
  "Gruppenmitglieder upsert",
  "group_members",
  ["athlete", "athlete1", "athlete2", "athlete3"].map((key, index) => ({
    id: `22222222-2222-4222-8222-22222222223${index + 1}`,
    group_id: groupId,
    athlete_id: ids[key],
    user_id: ids[key],
    role: "Athlete",
    status: "active",
    updated_at: now,
  })),
  { onConflict: "id" },
  { optional: true },
);

await upsertAdaptive(
  "Gruppenmitgliedschaften upsert",
  "group_memberships",
  [
    { key: "coach", role: "Coach" },
    { key: "athlete", role: "Athlete" },
    { key: "athlete1", role: "Athlete" },
    { key: "athlete2", role: "Athlete" },
    { key: "athlete3", role: "Athlete" },
  ].map((member, index) => ({
    id: `22222222-2222-4222-8222-22222222224${index + 1}`,
    group_id: groupId,
    user_id: ids[member.key],
    role: member.role,
    status: "active",
    updated_at: now,
  })),
  { onConflict: "id" },
  { optional: true },
);

const trainingItems = [
  {
    id: "33333333-3333-4333-8333-333333333331",
    title: "K1 GA1 Grundlagenfahrt",
    date: weekDate(0),
    start_time: "17:00",
    end_time: "18:30",
    duration_minutes: 90,
    area: "Wasser",
    training_type: "Ausdauer",
    boat_class: "K1",
    goal: "Ruhige Grundlagenfahrt mit sauberem Rhythmus",
    intensity: "locker",
    notes: "Basisplan fuer Athlete 1. Saubere Technik trotz niedriger Belastung.",
    repeat_series_id: seriesId,
  },
  {
    id: "33333333-3333-4333-8333-333333333332",
    title: "Kraftausdauer Zirkel",
    date: weekDate(1),
    start_time: "18:00",
    end_time: "19:00",
    duration_minutes: 60,
    area: "Athletik",
    training_type: "Kraft",
    boat_class: "none",
    goal: "Rumpfstabilitaet und Schulterstabilitaet",
    intensity: "mittel",
    notes: "40 Sekunden Belastung, 20 Sekunden Wechsel, 4 Runden.",
    repeat_series_id: seriesId,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "K1 Technik Aufwaertstore",
    date: weekDate(2),
    start_time: "17:00",
    end_time: "18:30",
    duration_minutes: 90,
    area: "Wasser",
    training_type: "Technik",
    boat_class: "K1",
    goal: "Aufwaertstor, Uebergriff, Linienwahl",
    intensity: "mittel",
    notes: "Basisplan fuer U14. Athlete 2 reduziert auf 60 min mit Fokus Uebergriff.",
    repeat_series_id: seriesId,
  },
  {
    id: "33333333-3333-4333-8333-333333333334",
    title: "Regeneration und Beweglichkeit",
    date: weekDate(3),
    start_time: "17:00",
    end_time: "17:45",
    duration_minutes: 45,
    area: "Athletik",
    training_type: "Regeneration",
    boat_class: "none",
    goal: "Mobilisation und lockere Durchblutung",
    intensity: "locker",
    notes: "Bewusst niedrige Belastung nach Technikblock.",
    repeat_series_id: seriesId,
  },
  {
    id: "33333333-3333-4333-8333-333333333335",
    title: "C1 Technik Linie und Druck",
    date: weekDate(4),
    start_time: "16:45",
    end_time: "18:00",
    duration_minutes: 75,
    area: "Wasser",
    training_type: "Technik",
    boat_class: "C1",
    goal: "Druckphase, Linienwahl, saubere Ausfahrt",
    intensity: "mittel",
    notes: "C1-Schwerpunkt mit kurzer Videoanalyse.",
    repeat_series_id: seriesId,
  },
  {
    id: "33333333-3333-4333-8333-333333333336",
    title: "Wettkampfsimulation U14",
    date: weekDate(5),
    start_time: "09:30",
    end_time: "11:30",
    duration_minutes: 120,
    area: "Wasser",
    training_type: "Wettkampf",
    boat_class: "K1+C1",
    goal: "Startablauf, zwei Wertungslaufe, Feedback direkt danach",
    intensity: "hart",
    notes: "Mit Zeitnahme und Trainerfeedback.",
    repeat_series_id: "",
  },
  {
    id: "33333333-3333-4333-8333-333333333337",
    title: "Vereinsabend Paddlio Test",
    date: weekDate(2),
    start_time: "19:15",
    end_time: "20:15",
    duration_minutes: 60,
    area: "Besprechung",
    training_type: "Vereinstermin",
    boat_class: "none",
    goal: "Material, Termine und Feedbackrunde",
    intensity: "locker",
    notes: "Vereinsveranstaltung als Kalendereintrag.",
    repeat_series_id: "",
  },
  {
    id: "33333333-3333-4333-8333-333333333338",
    title: "Trainingslagerblock Slalomkanal",
    date: weekDate(4),
    start_time: "08:30",
    end_time: "15:30",
    duration_minutes: 420,
    area: "Wasser",
    training_type: "Trainingslager",
    boat_class: "K1+C1",
    goal: "Tagesblock Technik, Mittagspause, Videoauswertung",
    intensity: "mittel",
    notes: "Trainingslagerblock zur Kalenderdarstellung.",
    repeat_series_id: "",
  },
  {
    id: "33333333-3333-4333-8333-333333333339",
    title: "Abgesagtes Stabi-Training",
    date: weekDate(1),
    start_time: "16:30",
    end_time: "17:15",
    duration_minutes: 45,
    area: "Athletik",
    training_type: "Stabilisation",
    boat_class: "none",
    goal: "Rumpf und Schulter",
    intensity: "locker",
    notes: "Absage wegen Hallenbelegung.",
    repeat_series_id: "",
    status: "cancelled",
  },
  {
    id: "33333333-3333-4333-8333-333333333340",
    title: "Durchgefuehrtes Feedbacktraining",
    date: weekDate(-1),
    start_time: "17:30",
    end_time: "18:30",
    duration_minutes: 60,
    area: "Wasser",
    training_type: "Technik",
    boat_class: "K1",
    goal: "Tor 4 bis 7 flach und eng",
    intensity: "mittel",
    notes: "Bereits abgeschlossen mit Feedback.",
    repeat_series_id: "",
    status: "done",
  },
];

await upsertAdaptive(
  "Trainingsplan upsert",
  "training_plan_items",
  trainingItems.map((item, index) => {
    const athleteKey = index === 2 ? "athlete2" : index === 9 ? "athlete1" : "";
    return {
      ...item,
      owner_id: ids.coach,
      coach_id: ids.coach,
      club_id: clubId,
      assigned_athlete_id: athleteKey ? ids[athleteKey] : null,
      assigned_group_id: groupId,
      status: item.status ?? "planned",
      updated_at: now,
      deleted_at: null,
    };
  }),
  { onConflict: "id" },
  { optional: true },
);

await upsertAdaptive(
  "Wettkampf upsert",
  "competitions",
  {
    id: "88888888-8888-4888-8888-888888888881",
    club_id: clubId,
    name: "Paddlio Testwettkampf",
    location: "Slalomkanal Development",
    organizer: "Paddlio Testverein",
    course: "U18 Teststrecke",
    start_date: weekDate(5),
    end_date: weekDate(5),
    level: "regional",
    source: "development-seed",
    external_id: "dev-competition-001",
    source_url: null,
    notes: "Development-Wettkampf fuer Kalender, Analyse und Soll/Ist-Pruefung.",
    updated_at: now,
  },
  { onConflict: "id" },
  { optional: true },
);

await upsertAdaptive(
  "Wettkampfergebnis upsert",
  "competition_results",
  {
    id: "88888888-8888-4888-8888-888888888882",
    competition_id: "88888888-8888-4888-8888-888888888881",
    athlete_id: ids.athlete1,
    boat_class: "K1",
    run1_time_seconds: 98.42,
    run1_penalty_seconds: 2,
    run2_time_seconds: 96.1,
    run2_penalty_seconds: 0,
    best_total_seconds: 96.1,
    rank: 3,
    starter_field: 14,
    gap_to_winner_seconds: 4.2,
    feeling: 8,
    notes: "Development-Ergebnis fuer realistische Testdaten.",
    updated_at: now,
  },
  { onConflict: "id" },
  { optional: true },
);

await upsertAdaptive(
  "Feedback upsert",
  "training_feedback",
  {
    id: "44444444-4444-4444-8444-444444444441",
    training_plan_item_id: trainingItems[9].id,
    training_id: trainingItems[9].id,
    athlete_id: ids.athlete1,
    athlete_user_id: ids.athlete1,
    coach_id: ids.coach,
    coach_user_id: ids.coach,
    status: "done",
    feeling: 8,
    difficulty: 6,
    fatigue: 4,
    motivation: 9,
    sleep: 7,
    comment: "Aufwaertstor sicherer getroffen, Blickwechsel noch ueben.",
    completed_at: now,
    updated_at: now,
  },
  { onConflict: "training_plan_item_id,athlete_id" },
  { optional: true },
);

const trainerTasks = [
  {
    id: "55555555-5555-4555-8555-555555555551",
    title: "Strecke fuer Aufwaertstore aufbauen",
    description: "Drei Knotenpunkte festlegen und vor Trainingsbeginn markieren.",
    task_type: "training",
    priority: "important",
    due_date: isoDate(0),
    related_training_id: trainingItems[0].id,
    assigned_to: ids.coach,
  },
  {
    id: "55555555-5555-4555-8555-555555555552",
    title: "Videoaufnahme von Mia vorbereiten",
    description: "Ein Lauf von hinten und ein Lauf seitlich filmen.",
    task_type: "video",
    priority: "normal",
    due_date: isoDate(0),
    related_training_id: trainingItems[0].id,
    assigned_to: ids.coach,
  },
  {
    id: "55555555-5555-4555-8555-555555555553",
    title: "Zeiten bei Wettkampfsimulation erfassen",
    description: "Beide Laeufe erfassen und Strafsekunden im Journal vermerken.",
    task_type: "training",
    priority: "normal",
    due_date: weekDate(5),
    related_training_id: trainingItems[5].id,
    assigned_to: ids.coach,
  },
  {
    id: "55555555-5555-4555-8555-555555555554",
    title: "Material fuer C1 Technik pruefen",
    description: "C1-Boot und Paddel vor dem Training kontrollieren.",
    task_type: "material",
    priority: "normal",
    due_date: weekDate(4),
    related_training_id: trainingItems[4].id,
    assigned_to: ids.clubAdmin,
  },
];

await upsertAdaptive(
  "Traineraufgaben upsert",
  "tasks",
  trainerTasks.map(({ assigned_to, ...task }) => ({
    ...task,
    club_id: clubId,
    user_id: assigned_to,
    owner_id: ids.coach,
    created_by: ids.coach,
    updated_at: now,
    deleted_at: null,
  })),
  { onConflict: "id" },
  { optional: true },
);

await upsertAdaptive(
  "Traineraufgaben-Zuweisungen upsert",
  "task_assignments",
  trainerTasks.map((task, index) => ({
    id: `55555555-5555-4555-8555-55555555556${index + 1}`,
    task_id: task.id,
    assigned_to: task.assigned_to,
    user_id: task.assigned_to,
    status: "open",
    updated_at: now,
    deleted_at: null,
  })),
  { onConflict: "id" },
  { optional: true },
);

await upsertAdaptive(
  "Trainingsvorlagen upsert",
  "training_templates",
  [
    {
      id: "66666666-6666-4666-8666-666666666661",
      owner_id: ids.coach,
      club_id: clubId,
      created_by: ids.coach,
      title: "GA1 Grundlagenfahrt",
      category: "Ausdauer",
      training_area: "Wasser",
      training_type: "Ausdauer",
      boat_class: "K1+C1",
      default_duration_minutes: 75,
      default_intensity: "locker",
      focus: "aerobe Grundlagenausdauer, gleichmaessiger Rhythmus, saubere Paddeltechnik",
      description: "Ruhige Fahrt mit gleichmaessigem Rhythmus und kontrollierter Paddeltechnik.",
      tags: ["GA1", "Grundlage", "Wasser"],
      is_favorite: true,
      visibility: "club",
    },
    {
      id: "66666666-6666-4666-8666-666666666662",
      owner_id: ids.coach,
      club_id: clubId,
      created_by: ids.coach,
      title: "GA2 Tempoausdauer",
      category: "Ausdauer",
      training_area: "Wasser",
      training_type: "Ausdauer",
      boat_class: "K1+C1",
      default_duration_minutes: 60,
      default_intensity: "mittel",
      focus: "Tempo halten, saubere Linien unter Belastung, gleichmaessige Pausen",
      description: "Tempoausdauer mit kontrollierten Belastungsabschnitten und sauberer Technik.",
      tags: ["GA2", "Tempo", "Wasser"],
      is_favorite: true,
      visibility: "club",
    },
    {
      id: "66666666-6666-4666-8666-666666666663",
      owner_id: ids.coach,
      club_id: clubId,
      created_by: ids.coach,
      title: "K1 Technik",
      category: "Technik",
      training_area: "Wasser",
      training_type: "Technik",
      boat_class: "K1",
      default_duration_minutes: 75,
      default_intensity: "mittel",
      focus: "Linienwahl, Blickfuehrung, Innenstab",
      description: "Aufwaertstore mit hoechstens drei Knotenpunkten trainieren.",
      tags: ["K1", "Technik", "Tor"],
      is_favorite: true,
      visibility: "club",
    },
    {
      id: "66666666-6666-4666-8666-666666666664",
      owner_id: ids.coach,
      club_id: clubId,
      created_by: ids.coach,
      title: "C1 Technik",
      category: "Technik",
      training_area: "Wasser",
      training_type: "Technik",
      boat_class: "C1",
      default_duration_minutes: 75,
      default_intensity: "mittel",
      focus: "Druckphase, Seitenwechsel, stabile Bootslage",
      description: "C1-Technikeinheit mit Fokus auf Druckphase und saubere Linien.",
      tags: ["C1", "Technik", "Linie"],
      is_favorite: false,
      visibility: "club",
    },
    {
      id: "66666666-6666-4666-8666-666666666665",
      owner_id: ids.coach,
      club_id: clubId,
      created_by: ids.coach,
      title: "Kraftausdauer Zirkel",
      category: "Kraft",
      training_area: "Athletik",
      training_type: "Kraft",
      boat_class: "none",
      default_duration_minutes: 60,
      default_intensity: "mittel",
      focus: "Rumpfstabilitaet, Schulterstabilitaet, Zugbewegung",
      description: "Athletikzirkel mit stabiler Technik und kurzen Wechselzeiten.",
      tags: ["Kraft", "Athletik", "Zirkel"],
      is_favorite: true,
      visibility: "club",
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      owner_id: ids.coach,
      club_id: clubId,
      created_by: ids.coach,
      title: "Regeneration & Beweglichkeit",
      category: "Regeneration",
      training_area: "Athletik",
      training_type: "Regeneration",
      boat_class: "none",
      default_duration_minutes: 45,
      default_intensity: "locker",
      focus: "Mobilisation, Beweglichkeit, lockere Aktivierung",
      description: "Regenerationseinheit mit Mobility, lockerer Aktivierung und Koordination.",
      tags: ["Regeneration", "Mobility", "Locker"],
      is_favorite: false,
      visibility: "club",
    },
    {
      id: "66666666-6666-4666-8666-666666666667",
      owner_id: ids.coach,
      club_id: clubId,
      created_by: ids.coach,
      title: "Wettkampfsimulation",
      category: "Wettkampf",
      training_area: "Wasser",
      training_type: "Wettkampf",
      boat_class: "K1+C1",
      default_duration_minutes: 120,
      default_intensity: "hart",
      focus: "Startablauf, Rennsimulation, Zeitnahme, direkte Auswertung",
      description: "Wettkampfnaher Ablauf mit zwei Laeufen, Strafsekunden und Trainerfeedback.",
      tags: ["Wettkampf", "Simulation", "Zeitnahme"],
      is_favorite: true,
      visibility: "club",
    },
  ],
  { onConflict: "id" },
  { optional: true },
);

await upsertAdaptive(
  "Polar-Mock upsert",
  "external_training_sessions",
  {
    id: "77777777-7777-4777-8777-777777777771",
    club_id: clubId,
    user_id: ids.athlete1,
    owner_id: ids.athlete1,
    source: "polar",
    external_id: "dev-polar-activity-001",
    title: "Polar GA1 Mock",
    activity_date: isoDate(1),
    duration_minutes: 58,
    distance_meters: 6200,
    load_score: 42,
    payload: {
      sport: "canoeing",
      average_heart_rate: 142,
      max_heart_rate: 171,
      planned_training_id: trainingItems[1].id,
      note: "Development-Mock ohne echte Polar-Tokens.",
    },
    updated_at: now,
    deleted_at: null,
  },
  { onConflict: "id" },
  { optional: true },
);

console.log("\nDevelopment-Testprofil wurde angelegt/aktualisiert.");
console.log("Testkonten:");
for (const user of users) {
  console.log(`- ${user.email}`);
}
console.log("\nPasswort: aus PADDLIO_DEV_TEST_PASSWORD");
console.log("Umgebung: Development");
