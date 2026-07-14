import type { TrainingJournalEntry } from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload, toCloudUuid } from "./cloudIds";
import { enqueueSyncChange } from "./syncService";

const toCloudJournalEntry = (entry: TrainingJournalEntry) => sanitizeCloudPayload({
  id: entry.id,
  athlete_id: entry.athleteId,
  training_id: entry.trainingId,
  training_plan_entry_id: entry.trainingPlanEntryId ? toCloudUuid(entry.trainingPlanEntryId) : null,
  date: entry.date,
  completion_status: entry.completionStatus ?? "completed",
  actual_duration_minutes: entry.actualDurationMinutes ?? null,
  actual_distance_km: entry.actualDistanceKm ?? null,
  average_heart_rate: entry.averageHeartRate ?? null,
  perceived_exertion: entry.perceivedExertion ?? null,
  pain_notes: entry.painNotes ?? null,
  training_rating: entry.trainingRating,
  feeling: entry.feeling,
  fatigue: entry.fatigue,
  sleep: entry.sleep,
  motivation: entry.motivation,
  notes: entry.notes,
  created_at: entry.createdAt,
  updated_at: entry.updatedAt,
});

const fromCloudJournalEntry = (row: any): TrainingJournalEntry => ({
  id: row.id,
  athleteId: row.athlete_id,
  trainingId: row.training_id,
  trainingPlanEntryId: row.training_plan_entry_id ?? undefined,
  date: row.date,
  completionStatus: row.completion_status ?? undefined,
  actualDurationMinutes: row.actual_duration_minutes ?? undefined,
  actualDistanceKm: row.actual_distance_km ?? undefined,
  averageHeartRate: row.average_heart_rate ?? undefined,
  perceivedExertion: row.perceived_exertion ?? undefined,
  painNotes: row.pain_notes ?? "",
  trainingRating: row.training_rating ?? 7,
  feeling: row.feeling ?? 7,
  fatigue: row.fatigue ?? 4,
  sleep: row.sleep ?? 7,
  motivation: row.motivation ?? 7,
  notes: row.notes ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listCloudJournalEntries = async (): Promise<TrainingJournalEntry[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await (client.from("training_journal_entries") as any)
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromCloudJournalEntry);
};

export const upsertCloudJournalEntry = async (entry: TrainingJournalEntry): Promise<void> => {
  const payload = toCloudJournalEntry(entry);
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "training_journal_entries", action: "upsert", payload });
    return;
  }

  const { error } = await (client.from("training_journal_entries") as any).upsert(payload, { onConflict: entry.trainingPlanEntryId ? "athlete_id,training_plan_entry_id" : "id" });
  if (error) throw error;
};
