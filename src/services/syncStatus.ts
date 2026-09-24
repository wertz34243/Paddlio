export type SyncErrorCategory =
  | "profile_sync_error"
  | "training_sync_error"
  | "planning_sync_error"
  | "feedback_sync_error"
  | "supplemental_sync_error";

const getErrorText = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return [record.code, record.message, record.details, record.hint].filter(Boolean).join(" ");
  }
  return String(error ?? "");
};

export const classifySyncError = (scope: string, error?: unknown): SyncErrorCategory => {
  const text = `${scope} ${getErrorText(error)}`.toLowerCase();
  if (text.includes("profil") || text.includes("profile")) return "profile_sync_error";
  if (text.includes("feedback") || text.includes("rückmeldung")) return "feedback_sync_error";
  if (text.includes("plan") || text.includes("template") || text.includes("vorlage") || text.includes("training_plan_items")) return "planning_sync_error";
  if (text.includes("training") || text.includes("journal")) return "training_sync_error";
  return "supplemental_sync_error";
};

export const classifyOptionalSyncError = (
  scope: string,
  error?: unknown,
  categoryOverride?: SyncErrorCategory,
): SyncErrorCategory => categoryOverride ?? classifySyncError(scope, error);

export const getSyncErrorMessage = (categories: Iterable<SyncErrorCategory>): string => {
  const errors = new Set(categories);
  if (errors.has("profile_sync_error")) {
    return "Dein Profil konnte gerade nicht vollständig synchronisiert werden. Bitte versuche es erneut.";
  }
  if (errors.has("planning_sync_error")) {
    return "Einige Planungsdaten konnten nicht synchronisiert werden. Die App bleibt nutzbar. Wir versuchen es automatisch erneut.";
  }
  if (errors.has("training_sync_error")) {
    return "Einige Trainingsdaten konnten nicht synchronisiert werden. Die App bleibt nutzbar. Wir versuchen es automatisch erneut.";
  }
  if (errors.has("feedback_sync_error")) {
    return "Einige Rückmeldungen konnten nicht synchronisiert werden. Wir versuchen es automatisch erneut.";
  }
  return "Einige Zusatzbereiche konnten nicht synchronisiert werden. Die App bleibt nutzbar.";
};

const SYNC_TABLE_LABELS: Record<string, string> = {
  profiles: "Profil",
  training_plan_items: "Trainingsplanung",
  training_templates: "Vorlagen",
  training_feedback: "Feedback",
  training_journal_entries: "Journal",
  materials: "Material",
  notifications: "Benachrichtigungen",
  training_groups: "Gruppen",
  group_members: "Gruppen",
  group_memberships: "Gruppen",
};

export const getFailedSyncMessage = (tables: string[], count: number): string => {
  const areas = Array.from(new Set(tables.map((table) => SYNC_TABLE_LABELS[table] ?? "Zusatzdaten")));
  const affected = areas.length > 0 ? ` Betroffen: ${areas.slice(0, 3).join(", ")}.` : "";
  return `${count} ${count === 1 ? "Datensatz konnte" : "Datensätze konnten"} noch nicht synchronisiert werden.${affected}`;
};
