import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const parseLocalDateOnly = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getLocalWeekdayLabel = (value) =>
  parseLocalDateOnly(value).toLocaleDateString("de-DE", { weekday: "long" });

const app = read("src/App.tsx");
const planView = read("src/views/PlanView.tsx");
const communicationView = read("src/views/CommunicationView.tsx");
const trainingPlan = read("src/domain/trainingPlan.ts");
const trainingService = read("src/services/trainingService.ts");
const migration = read("supabase/migrations/0024_training_feedback_beta_blockers.sql");

assert(getLocalWeekdayLabel("2026-07-14") === "Dienstag", "2026-07-14 muss Dienstag bleiben.");
assert(trainingPlan.includes("parseLocalDateOnly"), "Date-only Helper parseLocalDateOnly fehlt.");
assert(trainingPlan.includes("getLocalWeekdayLabel"), "Date-only Helper getLocalWeekdayLabel fehlt.");
assert(!planView.includes('new Date(`${draft.date}T00:00:00`)'), "PlanView nutzt noch UTC-anfällige Date-String-Logik.");
assert(!planView.includes("new Date(date)."), "PlanView nutzt noch new Date(date) für date-only Anzeige.");
assert(trainingService.includes("getWeekdayFromDate(row.date)"), "Cloud-Training nutzt nicht den lokalen Wochentag-Helper.");
assert(trainingService.includes("deleteCloudTraining"), "Trainingsplan-Löschung wird nicht an Supabase gesendet.");

assert(app.includes("upsertCloudFeedback(nextFeedback)"), "Feedback wird nicht direkt in Supabase gespeichert.");
assert(app.includes("upsertCloudTraining(nextPlanEntry)"), "Planstatus nach Feedback wird nicht direkt in Supabase gespeichert.");
assert(
  app.includes("deleteCloudTraining(id, timestamp)") || app.includes("deleteCloudTraining(entryId, timestamp)"),
  "Plan-Löschung nutzt keinen Cloud-Soft-Delete.",
);
assert(trainingService.includes('.is("deleted_at", null)'), "Gelöschte Trainings werden beim Cloud-Load nicht gefiltert.");
assert(trainingService.includes("deleted_at: deletedAt"), "Cloud-Training-Delete setzt keinen Soft-Delete-Zeitstempel.");
assert(app.includes("Rückmeldung gespeichert"), "Feedback ohne Kommentar wird nicht als gespeicherte Rückmeldung markiert.");
assert(app.includes('coach: { description: "Coach-Bereich"'), "Coach-Mehr-Bereich ist nicht sauber getrennt.");
assert(!app.includes("Coach- und Adminbereich"), "Alter Coach/Admin-Mischtext ist noch vorhanden.");
assert(planView.includes("Kommentar:"), "Coach/Plan-Rückmeldungen zeigen den Feedback-Kommentar nicht sichtbar an.");
assert(communicationView.includes("getKnownUserName"), "Team-Kontakte werden nicht aus geladenen Nachrichten abgeleitet.");
assert(communicationView.includes("Paddlio Kontakt"), "Direktnachrichten ohne Profilkontakt haben keinen stabilen Fallback-Kontakt.");

assert(migration.includes("training_plan_items_select_0024"), "RLS-Policy für Training-Select fehlt.");
assert(migration.includes("training_plan_items_insert_0024"), "RLS-Policy für Training-Insert fehlt.");
assert(migration.includes("training_feedback_select_0024"), "RLS-Policy für Feedback-Select fehlt.");
assert(migration.includes("training_feedback_insert_0024"), "RLS-Policy für Feedback-Insert fehlt.");
assert(migration.includes("MKC Monheim"), "Canonical Club MKC Monheim fehlt in Migration.");
assert(migration.includes("mohnheim"), "Club-Alias Mohnheim fehlt in Migration.");

console.log("Beta blocker check passed.");
