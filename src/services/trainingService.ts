import { getSupabaseClient } from "../lib/supabase";
import type { PlanEntry, TrainingFeedback, Weekday } from "../domain/types";
import { enqueueSyncChange } from "./syncService";

const toWeekday = (date: string): Weekday => {
  const labels: Weekday[] = ["Sonntag" as Weekday, "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  return labels[new Date(`${date}T00:00:00`).getDay()] ?? "Montag";
};

export const toCloudTraining = (entry: PlanEntry) => ({
  id: entry.id,
  owner_id: entry.ownerUserId,
  club_id: entry.clubId || null,
  coach_id: entry.createdByUserId || null,
  assigned_athlete_id: entry.assignedAthleteId || entry.assignedAthleteIds[0] || null,
  assigned_group_id: entry.assignedGroupId || entry.assignedGroupIds[0] || null,
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
  status: entry.status === "done" || entry.status === "erledigt" ? "done" : entry.status === "skipped" || entry.status === "ausgelassen" ? "skipped" : "planned",
  repeat_rule: entry.repeat === "none" ? null : entry.repeat,
  notes: entry.notes || entry.note,
});

export const fromCloudTraining = (row: any, athleteId: string): PlanEntry => ({
  id: row.id,
  ownerUserId: row.owner_id,
  athleteId,
  clubId: row.club_id ?? "",
  assignedType: row.assigned_group_id ? "group" : row.assigned_athlete_id ? "athlete" : "self",
  assignedAthleteIds: row.assigned_athlete_id ? [row.assigned_athlete_id] : [athleteId],
  assignedGroupIds: row.assigned_group_id ? [row.assigned_group_id] : [],
  title: row.title,
  date: row.date,
  weekday: toWeekday(row.date),
  time: row.start_time ?? "",
  startTime: row.start_time ?? "",
  endTime: row.end_time ?? "",
  durationMinutes: row.duration_minutes ?? 0,
  area: row.area ?? "Wassertraining",
  trainingType: row.training_type ?? "K1 Technik",
  boatClass: row.boat_class ?? "none",
  goal: row.goal ?? "",
  focus: row.goal ?? "",
  description: "",
  intensity: row.intensity ?? "mittel",
  note: row.notes ?? "",
  notes: row.notes ?? "",
  status: row.status ?? "planned",
  repeat: row.repeat_rule ?? "none",
  repeatUntil: "",
  createdByUserId: row.coach_id ?? row.owner_id,
  assignedAthleteId: row.assigned_athlete_id ?? "",
  assignedGroupId: row.assigned_group_id ?? "",
  feedbackNote: "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listCloudTraining = async (athleteId: string): Promise<PlanEntry[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("training_plan_items").select("*").order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => fromCloudTraining(row, athleteId));
};

export const upsertCloudTraining = async (entry: PlanEntry): Promise<void> => {
  const payload = toCloudTraining(entry);
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "training_plan_items", action: "upsert", payload });
    return;
  }
  const { error } = await (client.from("training_plan_items") as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};

export const toCloudFeedback = (feedback: TrainingFeedback) => ({
  id: feedback.id,
  training_plan_item_id: feedback.trainingId,
  athlete_id: feedback.athleteUserId,
  coach_id: feedback.coachUserId || null,
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
  const payload = toCloudFeedback(feedback);
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "training_feedback", action: "upsert", payload });
    return;
  }
  const { error } = await (client.from("training_feedback") as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};
