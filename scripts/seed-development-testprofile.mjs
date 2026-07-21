import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const PRODUCTION_PROJECT_REF = "twlkhfbrrwjwppxinmpn";
const DEFAULT_DEVELOPMENT_PROJECT_REF = "nlllqsfdhfiwticrcnrp";

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
  { key: "athlete1", email: "dev.athlete1@paddlio.test", firstName: "Mia", lastName: "Test", roles: ["Athlete"], ageCategory: "U14", boatClasses: ["K1"] },
  { key: "athlete2", email: "dev.athlete2@paddlio.test", firstName: "Noah", lastName: "Test", roles: ["Athlete"], ageCategory: "U14", boatClasses: ["C1"] },
  { key: "athlete3", email: "dev.athlete3@paddlio.test", firstName: "Lea", lastName: "Test", roles: ["Athlete"], ageCategory: "U12", boatClasses: ["K1"] },
];

const today = new Date();
const isoDate = (offsetDays) => {
  const value = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays);
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

await requireOk(
  "Club upsert",
  supabase.from("clubs").upsert(
    {
      id: clubId,
      name: "Paddlio Development Verein",
      short_name: "PAD-DEV",
      city: "Development",
      contact_name: "Dev ClubAdmin",
      contact_email: "dev.clubadmin@paddlio.test",
      primary_color: "#00b4d8",
      secondary_color: "#22c55e",
      status: "active",
      updated_at: now,
    },
    { onConflict: "id" },
  ),
);

await requireOk(
  "Profile upsert",
  supabase.from("profiles").upsert(
    users.map((user) => ({
      id: ids[user.key],
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      display_name: `${user.firstName} ${user.lastName}`,
      club_id: clubId,
      active_club_id: clubId,
      roles: user.roles,
      primary_role: user.roles[0],
      status: "active",
      age_category: user.ageCategory,
      boat_classes: user.boatClasses,
      updated_at: now,
    })),
    { onConflict: "id" },
  ),
);

await requireOk(
  "Club-Mitgliedschaften upsert",
  supabase.from("club_memberships").upsert(
    users.map((user) => ({
      club_id: clubId,
      user_id: ids[user.key],
      role: user.roles[0],
      status: "active",
      updated_at: now,
    })),
    { onConflict: "club_id,user_id" },
  ),
);

await requireOk(
  "Trainingsgruppe upsert",
  supabase.from("training_groups").upsert(
    {
      id: groupId,
      club_id: clubId,
      coach_id: ids.coach,
      name: "U14 Development Gruppe",
      description: "Testgruppe fuer Planung, Anwesenheit, Feedback und Traineraufgaben.",
      age_category: "U14",
      boat_classes: ["K1", "C1"],
      training_focus: "Technik und Grundlagen",
      color: "#00b4d8",
      status: "active",
      updated_at: now,
    },
    { onConflict: "id" },
  ),
);

await requireOk(
  "Gruppenmitglieder upsert",
  supabase.from("group_members").upsert(
    ["athlete1", "athlete2", "athlete3"].map((key, index) => ({
      id: `22222222-2222-4222-8222-22222222223${index + 1}`,
      group_id: groupId,
      athlete_id: ids[key],
      user_id: ids[key],
      role: "Athlete",
      status: "active",
      updated_at: now,
    })),
    { onConflict: "id" },
  ),
);

const trainingItems = [
  {
    id: "33333333-3333-4333-8333-333333333331",
    title: "Technik Aufwaertstore",
    date: isoDate(0),
    start_time: "17:00",
    end_time: "18:15",
    duration_minutes: 75,
    area: "Wasser",
    training_type: "Technik",
    boat_class: "K1+C1",
    goal: "Linienwahl, Blickfuehrung, saubere Torpassage",
    intensity: "mittel",
    notes: "Basisplan fuer die Gruppe mit individueller Zusatzaufgabe fuer Mia.",
    repeat_series_id: seriesId,
  },
  {
    id: "33333333-3333-4333-8333-333333333332",
    title: "GA1 Grundlagenfahrt",
    date: isoDate(1),
    start_time: "16:30",
    end_time: "17:30",
    duration_minutes: 60,
    area: "Wasser",
    training_type: "Ausdauer",
    boat_class: "K1+C1",
    goal: "Aerobe Grundlagenausdauer, gleichmaessiger Rhythmus",
    intensity: "locker",
    notes: "Soll-Training fuer Polar-Zuordnung.",
    repeat_series_id: seriesId,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Kraftausdauer Zirkel",
    date: isoDate(2),
    start_time: "18:00",
    end_time: "19:00",
    duration_minutes: 60,
    area: "Athletik",
    training_type: "Kraft",
    boat_class: "none",
    goal: "Rumpfstabilitaet, Schulterstabilitaet",
    intensity: "mittel",
    notes: "40 Sekunden Belastung, 20 Sekunden Wechsel, 4 Runden.",
    repeat_series_id: seriesId,
  },
  {
    id: "33333333-3333-4333-8333-333333333334",
    title: "Regeneration und Beweglichkeit",
    date: isoDate(3),
    start_time: "17:00",
    end_time: "17:40",
    duration_minutes: 40,
    area: "Athletik",
    training_type: "Regeneration",
    boat_class: "none",
    goal: "Mobilisation und lockere Durchblutung",
    intensity: "locker",
    notes: "Bewusst niedrig belasten.",
    repeat_series_id: seriesId,
  },
];

await requireOk(
  "Trainingsplan upsert",
  supabase.from("training_plan_items").upsert(
    trainingItems.map((item) => ({
      ...item,
      owner_id: ids.coach,
      coach_id: ids.coach,
      club_id: clubId,
      assigned_group_id: groupId,
      status: "planned",
      updated_at: now,
      deleted_at: null,
    })),
    { onConflict: "id" },
  ),
);

await requireOk(
  "Feedback upsert",
  supabase.from("training_feedback").upsert(
    {
      id: "44444444-4444-4444-8444-444444444441",
      training_plan_item_id: trainingItems[0].id,
      athlete_id: ids.athlete1,
      coach_id: ids.coach,
      status: "done",
      feeling: 8,
      difficulty: 6,
      fatigue: 4,
      motivation: 9,
      sleep: 7,
      comment: "Aufwaertstor sicherer getroffen, Blickwechsel noch ueben.",
      updated_at: now,
    },
    { onConflict: "training_plan_item_id,athlete_id" },
  ),
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
    title: "Anwesenheit erfassen",
    description: "Teilnahme und Abweichungen direkt nach dem Training speichern.",
    task_type: "training",
    priority: "normal",
    due_date: isoDate(0),
    related_training_id: trainingItems[0].id,
    assigned_to: ids.clubAdmin,
  },
];

await requireOk(
  "Traineraufgaben upsert",
  supabase.from("tasks").upsert(
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
  ),
);

await requireOk(
  "Traineraufgaben-Zuweisungen upsert",
  supabase.from("task_assignments").upsert(
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
  ),
);

await requireOk(
  "Trainingsvorlagen upsert",
  supabase.from("training_templates").upsert(
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
        default_duration_minutes: 60,
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
        title: "Technik Aufwaertstore",
        category: "Technik",
        training_area: "Wasser",
        training_type: "Technik",
        boat_class: "K1+C1",
        default_duration_minutes: 75,
        default_intensity: "mittel",
        focus: "Linienwahl, Blickfuehrung, Innenstab",
        description: "Aufwaertstore mit hoechstens drei Knotenpunkten trainieren.",
        tags: ["Technik", "Tor", "U14"],
        is_favorite: true,
        visibility: "club",
      },
    ],
    { onConflict: "id" },
  ),
);

await requireOk(
  "Polar-Mock upsert",
  supabase.from("external_training_sessions").upsert(
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
  ),
);

console.log("\nDevelopment-Testprofil wurde angelegt/aktualisiert.");
console.log("Testkonten:");
for (const user of users) {
  console.log(`- ${user.email}`);
}
console.log("\nPasswort: aus PADDLIO_DEV_TEST_PASSWORD");
console.log("Umgebung: Development");
