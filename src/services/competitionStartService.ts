import type { CompetitionStartEntry } from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload, toCloudUuidOrNull } from "./cloudIds";
import { runCloudWrite } from "./cloudWriteService";

const toPayload = (entry: CompetitionStartEntry) => sanitizeCloudPayload({
  id: entry.id,
  competition_id: entry.competitionId,
  club_id: toCloudUuidOrNull(entry.clubId),
  athlete_id: toCloudUuidOrNull(entry.athleteId),
  created_by: entry.createdBy,
  start_number: entry.startNumber,
  display_name: entry.displayName,
  boat_class: entry.boatClass,
  age_class: entry.ageClass || null,
  source: entry.source || "file",
  created_at: entry.createdAt,
  updated_at: entry.updatedAt,
});

export const upsertCloudCompetitionStartEntry = async (entry: CompetitionStartEntry): Promise<void> => {
  const payload = toPayload(entry);
  await runCloudWrite("competition_start_entries", "upsert", payload, (client) =>
    (client.from("competition_start_entries") as any).upsert(payload, { onConflict: "competition_id,start_number,boat_class" }));
};

export const listCloudCompetitionStartEntries = async (): Promise<CompetitionStartEntry[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from("competition_start_entries") as any).select("*").order("start_number");
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id, competitionId: row.competition_id, clubId: row.club_id ?? "",
    athleteId: row.athlete_id ?? undefined, createdBy: row.created_by,
    startNumber: row.start_number, displayName: row.display_name,
    boatClass: row.boat_class, ageClass: row.age_class ?? "", source: row.source ?? "file",
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));
};
