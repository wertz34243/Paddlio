import { getSupabaseClient } from "../lib/supabase";
import type { Competition } from "../domain/types";
import { enqueueSyncChange } from "./syncService";

const competitionIdFor = (competition: Competition): string => competition.id;

export const upsertCloudCompetition = async (competition: Competition, clubId?: string): Promise<void> => {
  const client = getSupabaseClient();
  const competitionPayload = {
    id: competitionIdFor(competition),
    club_id: clubId || null,
    name: competition.location || "Wettkampf",
    location: competition.location,
    start_date: competition.date,
    end_date: competition.date,
    level: null,
    notes: competition.note,
  };
  const resultPayload = {
    id: `result-${competition.id}`,
    competition_id: competition.id,
    athlete_id: competition.athleteId,
    boat_class: competition.boatClass,
    run1_time_seconds: competition.run1TimeSeconds,
    run1_penalty_seconds: competition.run1PenaltySeconds,
    run2_time_seconds: competition.run2TimeSeconds,
    run2_penalty_seconds: competition.run2PenaltySeconds,
    best_total_seconds: Math.min(competition.run1TimeSeconds + competition.run1PenaltySeconds, competition.run2TimeSeconds + competition.run2PenaltySeconds),
    rank: competition.rank,
    gap_to_winner_seconds: competition.gapToWinnerSeconds,
    feeling: competition.feeling,
    notes: competition.note,
  };

  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "competitions", action: "upsert", payload: competitionPayload });
    enqueueSyncChange({ tableName: "competition_results", action: "upsert", payload: resultPayload });
    return;
  }
  const { error: competitionError } = await (client.from("competitions") as any).upsert(competitionPayload, { onConflict: "id" });
  if (competitionError) throw competitionError;
  const { error: resultError } = await (client.from("competition_results") as any).upsert(resultPayload, { onConflict: "id" });
  if (resultError) throw resultError;
};

export const listCloudCompetitions = async (): Promise<Competition[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("competition_results")
    .select("*, competitions(location,start_date,notes)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.competition_id,
    athleteId: row.athlete_id,
    date: row.competitions?.start_date ?? row.created_at.slice(0, 10),
    location: row.competitions?.location ?? "Wettkampf",
    boatClass: row.boat_class,
    run1TimeSeconds: row.run1_time_seconds ?? 0,
    run1PenaltySeconds: row.run1_penalty_seconds ?? 0,
    run2TimeSeconds: row.run2_time_seconds ?? 0,
    run2PenaltySeconds: row.run2_penalty_seconds ?? 0,
    rank: row.rank ?? 0,
    gapToWinnerSeconds: row.gap_to_winner_seconds ?? 0,
    feeling: row.feeling ?? 7,
    note: row.notes ?? row.competitions?.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};
