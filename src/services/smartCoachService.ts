import type { SmartCoachRecommendation } from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { enqueueSyncChange } from "./syncService";
import { sanitizeCloudPayload } from "./cloudIds";

const toCloudRecommendation = (recommendation: SmartCoachRecommendation) => ({
  id: recommendation.id,
  owner_user_id: recommendation.ownerUserId,
  created_for_user_id: recommendation.createdForUserId,
  created_by_system: recommendation.createdBySystem,
  club_id: recommendation.clubId || null,
  category: recommendation.category,
  priority: recommendation.priority,
  title: recommendation.title,
  message: recommendation.message,
  reason: recommendation.reason,
  suggested_action: recommendation.suggestedAction,
  status: recommendation.status,
  related_entity_type: recommendation.relatedEntityType ?? null,
  related_entity_id: recommendation.relatedEntityId ?? null,
  note: recommendation.note ?? null,
});

const fromCloudRecommendation = (row: any): SmartCoachRecommendation => ({
  id: row.id,
  ownerUserId: row.owner_user_id,
  createdForUserId: row.created_for_user_id,
  createdBySystem: Boolean(row.created_by_system),
  clubId: row.club_id ?? "",
  category: row.category ?? "training",
  priority: row.priority ?? "medium",
  title: row.title,
  message: row.message ?? "",
  reason: row.reason ?? "",
  suggestedAction: row.suggested_action ?? "",
  status: row.status ?? "open",
  relatedEntityType: row.related_entity_type ?? undefined,
  relatedEntityId: row.related_entity_id ?? undefined,
  note: row.note ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listCloudSmartCoachRecommendations = async (): Promise<SmartCoachRecommendation[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await (client.from("smart_coach_recommendations") as any)
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(fromCloudRecommendation);
};

export const upsertCloudSmartCoachRecommendation = async (recommendation: SmartCoachRecommendation): Promise<void> => {
  const payload = sanitizeCloudPayload(toCloudRecommendation(recommendation));
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "smart_coach_recommendations", action: "upsert", payload });
    return;
  }

  const { error } = await (client.from("smart_coach_recommendations") as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};
