import { getSupabaseClient } from "../lib/supabase";
import type { PlanEntry, TrainingFeedback } from "../domain/types";
import { enqueueSyncChange } from "./syncService";
import { sanitizeCloudPayload, toCloudUuid, toCloudUuidOrNull } from "./cloudIds";
import { getWeekdayFromDate } from "../domain/trainingPlan";

const isMissingColumnError = (error: unknown, columnName: string): boolean =>
  Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      ["42703", "PGRST204"].includes((error as { code?: string }).code ?? "") &&
      "message" in error &&
      String((error as { message?: string }).message ?? "").includes(columnName),
  );

const omitDeletedAt = <T extends Record<string, unknown>>(payload: T): Omit<T, "deleted_at"> => {
  const { deleted_at: _deletedAt, ...nextPayload } = payload;
  return nextPayload;
};

const omitColumn = <T extends Record<string, unknown>>(payload: T, columnName: string): T => {
  const nextPayload: Record<string, unknown> = { ...payload };
  delete nextPayload[columnName];
  return nextPayload as T;
};

const trainingPlanMetaPrefix = "\n\n[PaddlioTrainingMeta]";

type TrainingPlanCloudMeta = {
  assignedType?: PlanEntry["assignedType"];
  assignedAthleteIds?: string[];
  assignedGroupIds?: string[];
  description?: string;
  feedbackNote?: string;
  repeatUntil?: string;
  repeatMaxCount?: number;
  templateId?: string;
};

const stripTrainingPlanMeta = (notes: string): string => {
  const markerIndex = notes.indexOf(trainingPlanMetaPrefix);
  return markerIndex >= 0 ? notes.slice(0, markerIndex).trim() : notes;
};

const parseTrainingPlanMeta = (notes: string): TrainingPlanCloudMeta => {
  const markerIndex = notes.indexOf(trainingPlanMetaPrefix);
  if (markerIndex < 0) return {};
  try {
    return JSON.parse(notes.slice(markerIndex + trainingPlanMetaPrefix.length).trim()) as TrainingPlanCloudMeta;
  } catch {
    return {};
  }
};

const buildTrainingPlanNotes = (entry: PlanEntry): string => {
  const baseNotes = stripTrainingPlanMeta(entry.notes || entry.note || "");
  const meta: TrainingPlanCloudMeta = {
    assignedType: entry.assignedType,
    assignedAthleteIds: entry.assignedAthleteIds,
    assignedGroupIds: entry.assignedGroupIds,
    description: entry.description,
    feedbackNote: entry.feedbackNote,
    repeatUntil: entry.repeatUntil,
    repeatMaxCount: entry.repeatMaxCount,
    templateId: entry.templateId,
  };
  const compactMeta = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ""),
  );
  return Object.keys(compactMeta).length > 0 ? `${baseNotes}${trainingPlanMetaPrefix}${JSON.stringify(compactMeta)}` : baseNotes;
};

export const toCloudTraining = (entry: PlanEntry) => ({
  id: toCloudUuid(entry.id),
  owner_id: toCloudUuidOrNull(entry.ownerUserId),
  club_id: toCloudUuidOrNull(entry.clubId),
  coach_id: toCloudUuidOrNull(entry.createdByUserId),
  assigned_athlete_id: toCloudUuidOrNull(entry.assignedAthleteId || entry.assignedAthleteIds[0]),
  assigned_group_id: toCloudUuidOrNull(entry.assignedGroupId || entry.assignedGroupIds[0]),
  title: entry.title || entry.trainingType,
  date: entry.date,
  start_time: entry.startTime || entry.time || null,
  end_time: entry.endTime || null,
  duration_minutes: entry.durationMinutes,
  area: entry.area,
  training_type: entry.trainingType,
  boat_class: entry.boatClass,
  goal: entry.focus || entry.goal,
  intensity: entry.intensity,
  status:
    entry.status === "done" || entry.status === "erledigt" || entry.status === "completed"
      ? "completed"
      : entry.status === "partially_completed"
        ? "partially_completed"
        : entry.status === "in_progress"
          ? "in_progress"
          : entry.status === "skipped" || entry.status === "ausgelassen"
            ? "skipped"
            : entry.status === "cancelled"
              ? "cancelled"
              : "planned",
  repeat_rule: entry.repeat === "none" ? null : entry.repeat,
  repeat_series_id: entry.repeatSeriesId || null,
  notes: buildTrainingPlanNotes(entry),
  deleted_at: entry.deletedAt || null,
});

export const fromCloudTraining = (row: any, athleteId: string): PlanEntry => {
  const rawNotes = row.notes ?? "";
  const meta = parseTrainingPlanMeta(rawNotes);
  const assignedAthleteIds = meta.assignedAthleteIds?.length
    ? meta.assignedAthleteIds
    : row.assigned_athlete_id
      ? [row.assigned_athlete_id]
      : [athleteId];
  const assignedGroupIds = meta.assignedGroupIds?.length ? meta.assignedGroupIds : row.assigned_group_id ? [row.assigned_group_id] : [];
  const assignedType = meta.assignedType ?? (row.assigned_group_id ? "group" : row.assigned_athlete_id ? "athlete" : "self");
  const notes = stripTrainingPlanMeta(rawNotes);

  return {
    id: row.id,
    ownerUserId: row.owner_id,
    athleteId,
    clubId: row.club_id ?? "",
    assignedType,
    assignedAthleteIds,
    assignedGroupIds,
    title: row.title,
    date: row.date,
    weekday: getWeekdayFromDate(row.date),
    time: row.start_time ?? "",
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? "",
    durationMinutes: row.duration_minutes ?? 0,
    area: row.area ?? "Wassertraining",
    trainingType: row.training_type ?? "K1 Technik",
    boatClass: row.boat_class ?? "none",
    goal: row.goal ?? "",
    focus: row.goal ?? "",
    description: meta.description ?? "",
    intensity: row.intensity ?? "mittel",
    note: notes,
    notes,
    status: row.status ?? "planned",
    repeat: row.repeat_rule ?? "none",
    repeatUntil: meta.repeatUntil ?? "",
    repeatMaxCount: meta.repeatMaxCount,
    repeatSeriesId: row.repeat_series_id ?? "",
    createdByUserId: row.coach_id ?? row.owner_id,
    assignedAthleteId: row.assigned_athlete_id ?? assignedAthleteIds[0] ?? "",
    assignedGroupId: row.assigned_group_id ?? assignedGroupIds[0] ?? "",
    feedbackNote: meta.feedbackNote ?? "",
    templateId: meta.templateId ?? "",
    deletedAt: row.deleted_at ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const listCloudTraining = async (athleteId: string): Promise<PlanEntry[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  let { data, error } = await client.from("training_plan_items").select("*").is("deleted_at", null).order("date", { ascending: true });
  if (error && isMissingColumnError(error, "deleted_at")) {
    const fallback = await client.from("training_plan_items").select("*").order("date", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;
  return (data ?? []).map((row) => fromCloudTraining(row, athleteId));
};

export const upsertCloudTraining = async (entry: PlanEntry): Promise<void> => {
  const payload = sanitizeCloudPayload(toCloudTraining(entry));
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "training_plan_items", action: "upsert", payload });
    return;
  }
  let cloudPayload = payload;
  let { error } = await (client.from("training_plan_items") as any).upsert(cloudPayload, { onConflict: "id" });
  if (error && isMissingColumnError(error, "repeat_series_id")) {
    cloudPayload = omitColumn(cloudPayload, "repeat_series_id");
    const fallback = await (client.from("training_plan_items") as any).upsert(cloudPayload, { onConflict: "id" });
    error = fallback.error;
  }
  if (error && isMissingColumnError(error, "deleted_at")) {
    const fallback = await (client.from("training_plan_items") as any).upsert(omitDeletedAt(cloudPayload), { onConflict: "id" });
    error = fallback.error;
  }
  if (error) throw error;
};

export const deleteCloudTraining = async (id: string, deletedAt = new Date().toISOString()): Promise<void> => {
  const cloudId = toCloudUuid(id);
  if (!cloudId) return;

  const payload = { id: cloudId, deleted_at: deletedAt, updated_at: deletedAt };
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "training_plan_items", action: "update", payload });
    return;
  }

  const { error } = await (client.from("training_plan_items") as any)
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", cloudId);
  if (error && isMissingColumnError(error, "deleted_at")) {
    const fallback = await client.from("training_plan_items").delete().eq("id", cloudId);
    if (fallback.error) throw fallback.error;
    return;
  }
  if (error) throw error;
};

export const toCloudFeedback = (feedback: TrainingFeedback) => ({
  id: toCloudUuid(feedback.id),
  training_plan_item_id: toCloudUuid(feedback.trainingId),
  athlete_id: toCloudUuidOrNull(feedback.athleteUserId),
  coach_id: toCloudUuidOrNull(feedback.coachUserId),
  status: feedback.status,
  feeling: feedback.feeling,
  difficulty: feedback.difficulty,
  fatigue: feedback.fatigue,
  motivation: feedback.motivation,
  sleep: feedback.sleep ?? null,
  reason: feedback.reason ?? null,
  comment: feedback.comment ?? null,
});

export const upsertCloudFeedback = async (feedback: TrainingFeedback): Promise<void> => {
  const payload = sanitizeCloudPayload(toCloudFeedback(feedback));
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "training_feedback", action: "upsert", payload });
    return;
  }
  const { error } = await (client.from("training_feedback") as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};

export const fromCloudFeedback = (row: any): TrainingFeedback => ({
  id: row.id,
  trainingId: row.training_plan_item_id ?? row.training_id,
  athleteUserId: row.athlete_id ?? row.athlete_user_id,
  coachUserId: row.coach_id ?? "",
  status: row.status ?? "done",
  feeling: row.feeling ?? 7,
  difficulty: row.difficulty ?? 5,
  fatigue: row.fatigue ?? 5,
  motivation: row.motivation ?? 7,
  sleep: row.sleep ?? undefined,
  reason: row.reason ?? "",
  comment: row.comment ?? "",
  completedAt: row.updated_at ?? row.created_at,
});

export const listCloudFeedback = async (): Promise<TrainingFeedback[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("training_feedback").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromCloudFeedback);
};
