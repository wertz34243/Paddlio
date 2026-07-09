import { getSupabaseClient } from "../lib/supabase";
import type { MaterialItem } from "../domain/types";
import { enqueueSyncChange } from "./syncService";
import { sanitizeCloudPayload } from "./cloudIds";

export const upsertCloudMaterial = async (item: MaterialItem): Promise<void> => {
  const payload = sanitizeCloudPayload({
    id: item.id,
    athlete_id: item.athleteId,
    category: item.category,
    name: item.name,
    status: item.status,
    weight_kg: item.weightKg || null,
    length_cm: item.lengthCm || null,
    rating: item.rating,
    image_url: item.imageDataUrl || null,
    notes: item.note,
  });
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "materials", action: "upsert", payload });
    return;
  }
  const { error } = await (client.from("materials") as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};

export const listCloudMaterials = async (): Promise<MaterialItem[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("materials").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    athleteId: row.athlete_id,
    category: row.category,
    name: row.name,
    weightKg: row.weight_kg ?? 0,
    lengthCm: row.length_cm ?? 0,
    imageDataUrl: row.image_url ?? "",
    status: row.status ?? "bereit",
    rating: row.rating ?? 7,
    note: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};
