import type { TrainingJournalEntry } from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload } from "./cloudIds";
import { enqueueSyncChange } from "./syncService";

const toCloudJournalEntry = (entry: TrainingJournalEntry) => sanitizeCloudPayload({
  id: entry.id,
  athlete_id: entry.athleteId,
  training_id: entry.trainingId,
  date: entry.date,
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
  date: row.date,
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

  const { error } = await (client.from("training_journal_entries") as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};
