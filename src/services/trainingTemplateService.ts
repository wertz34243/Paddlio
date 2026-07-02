import { getSupabaseClient } from "../lib/supabase";
import type { TrainingTemplate } from "../domain/types";
import { enqueueSyncChange } from "./syncService";

const toCloudTemplate = (template: TrainingTemplate) => ({
  id: template.id,
  owner_id: template.ownerUserId,
  club_id: template.visibility === "club" ? template.clubId ?? null : null,
  created_by: template.createdByUserId || template.ownerUserId,
  title: template.title,
  category: template.category,
  training_area: template.trainingArea,
  training_type: template.trainingType,
  boat_class: template.boatClass ?? "none",
  default_duration_minutes: template.defaultDurationMinutes ?? null,
  default_intensity: template.defaultIntensity,
  focus: template.focus,
  description: template.description ?? null,
  notes: template.notes ?? null,
  tags: template.tags,
  is_favorite: template.isFavorite,
  visibility: template.visibility,
});

export const fromCloudTemplate = (row: any): TrainingTemplate => ({
  id: row.id,
  ownerUserId: row.owner_id,
  clubId: row.club_id ?? "",
  createdByUserId: row.created_by ?? row.owner_id,
  title: row.title,
  category: row.category ?? "Allgemein",
  trainingArea: row.training_area ?? "Wassertraining",
  trainingType: row.training_type ?? "K1 Technik",
  boatClass: row.boat_class ?? "none",
  defaultDurationMinutes: row.default_duration_minutes ?? undefined,
  defaultIntensity: row.default_intensity ?? "mittel",
  focus: row.focus ?? "",
  description: row.description ?? "",
  notes: row.notes ?? "",
  tags: row.tags ?? [],
  isFavorite: Boolean(row.is_favorite),
  visibility: row.visibility ?? "private",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listCloudTrainingTemplates = async (): Promise<TrainingTemplate[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from("training_templates") as any).select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromCloudTemplate);
};

export const upsertCloudTrainingTemplate = async (template: TrainingTemplate): Promise<void> => {
  const payload = toCloudTemplate(template);
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "training_templates", action: "upsert", payload });
    return;
  }
  const { error } = await (client.from("training_templates") as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};
