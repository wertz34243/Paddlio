import { getSupabaseClient } from "../lib/supabase";
import type { Competition } from "../domain/types";
import { enqueueSyncChange } from "./syncService";
import { calculatePersonalBests, upsertCloudPersonalBest } from "./resultsReadinessService";
import { sanitizeCloudPayload, toCloudUuid, toCloudUuidOrNull } from "./cloudIds";
import { calculateCompetitionTotalTime, normalizeCompetitionLevel } from "../domain/competition";

const competitionIdFor = (competition: Competition): string => toCloudUuid(competition.id) ?? crypto.randomUUID();

export const upsertCloudCompetition = async (competition: Competition, clubId?: string): Promise<void> => {
  const client = getSupabaseClient();
  const cloudCompetitionId = competitionIdFor(competition);
  const competitionPayload = sanitizeCloudPayload({
    id: cloudCompetitionId,
    club_id: clubId || null,
    user_id: toCloudUuidOrNull(competition.athleteId),
    created_by: toCloudUuidOrNull(competition.createdBy || competition.athleteId),
    name: competition.name || competition.location || "Wettkampf",
    location: competition.location,
    start_date: competition.date,
    end_date: competition.date,
    organizer: competition.organizer ?? null,
    course: competition.course ?? null,
    level: normalizeCompetitionLevel(competition.level),
    source: competition.source ?? "manual",
    external_id: competition.externalId ?? null,
    source_url: competition.sourceUrl ?? null,
    notes: competition.note,
  });
  const resultPayload = sanitizeCloudPayload({
    id: `result-${competition.id}`,
    club_id: competition.clubId || clubId || null,
    competition_id: cloudCompetitionId,
    athlete_id: toCloudUuidOrNull(competition.athleteId),
    competition_name: competition.name || competition.location || "Wettkampf",
    competition_date: competition.date,
    location: competition.location,
    course_name: competition.courseName ?? competition.course ?? null,
    boat_class: competition.boatClass,
    age_class: competition.ageClass ?? null,
    run1_time: competition.run1TimeSeconds,
    run1_time_seconds: competition.run1TimeSeconds,
    run1_penalties: competition.run1PenaltySeconds,
    run1_penalty_seconds: competition.run1PenaltySeconds,
    run1_total: calculateCompetitionTotalTime(competition.run1TimeSeconds, competition.run1PenaltySeconds),
    run2_time: competition.run2TimeSeconds,
    run2_time_seconds: competition.run2TimeSeconds,
    run2_penalties: competition.run2PenaltySeconds,
    run2_penalty_seconds: competition.run2PenaltySeconds,
    run2_total: calculateCompetitionTotalTime(competition.run2TimeSeconds, competition.run2PenaltySeconds),
    best_total: Math.min(
      calculateCompetitionTotalTime(competition.run1TimeSeconds, competition.run1PenaltySeconds),
      calculateCompetitionTotalTime(competition.run2TimeSeconds, competition.run2PenaltySeconds),
    ),
    best_total_seconds: Math.min(
      calculateCompetitionTotalTime(competition.run1TimeSeconds, competition.run1PenaltySeconds),
      calculateCompetitionTotalTime(competition.run2TimeSeconds, competition.run2PenaltySeconds),
    ),
    ranking: competition.rank,
    rank: competition.rank,
    starter_count: competition.starterField ?? null,
    starter_field: competition.starterField ?? null,
    gap_to_winner: competition.gapToWinnerSeconds,
    gap_to_winner_seconds: competition.gapToWinnerSeconds,
    gap_to_podium: competition.gapToPodiumSeconds ?? null,
    gap_to_personal_best: competition.gapToPersonalBestSeconds ?? null,
    feeling: competition.feeling,
    coach_note: competition.coachNote ?? null,
    notes: competition.note,
    source_url: competition.sourceUrl ?? null,
    source_type: competition.sourceType ?? competition.source ?? "manual",
    created_by: toCloudUuidOrNull(competition.createdBy || competition.athleteId),
  });

  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "competitions", action: "upsert", payload: competitionPayload });
    enqueueSyncChange({ tableName: "competition_results", action: "upsert", payload: resultPayload });
    return;
  }
  const { error: competitionError } = await (client.from("competitions") as any).upsert(competitionPayload, { onConflict: "id" });
  if (competitionError) throw competitionError;
  const { error: resultError } = await (client.from("competition_results") as any).upsert(resultPayload, { onConflict: "id" });
  if (resultError) throw resultError;
  await Promise.all(calculatePersonalBests([competition]).map(upsertCloudPersonalBest));
};

export const listCloudCompetitions = async (): Promise<Competition[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("competition_results")
    .select("*, competitions(name,location,start_date,organizer,course,level,source,external_id,source_url,notes)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.competition_id,
    athleteId: row.athlete_id,
    clubId: row.club_id ?? "",
    competitionId: row.competition_id ?? "",
    name: row.competition_name ?? row.competitions?.name ?? "",
    date: row.competition_date ?? row.competitions?.start_date ?? row.created_at.slice(0, 10),
    location: row.location ?? row.competitions?.location ?? "Wettkampf",
    organizer: row.competitions?.organizer ?? "",
    course: row.course_name ?? row.competitions?.course ?? "",
    courseName: row.course_name ?? row.competitions?.course ?? "",
    level: normalizeCompetitionLevel(row.competitions?.level),
    boatClass: row.boat_class,
    ageClass: row.age_class ?? "",
    run1TimeSeconds: row.run1_time ?? row.run1_time_seconds ?? 0,
    run1PenaltySeconds: row.run1_penalties ?? row.run1_penalty_seconds ?? 0,
    run1TotalSeconds: row.run1_total ?? undefined,
    run2TimeSeconds: row.run2_time ?? row.run2_time_seconds ?? 0,
    run2PenaltySeconds: row.run2_penalties ?? row.run2_penalty_seconds ?? 0,
    run2TotalSeconds: row.run2_total ?? undefined,
    bestTotalSeconds: row.best_total ?? row.best_total_seconds ?? undefined,
    rank: row.ranking ?? row.rank ?? 0,
    starterField: row.starter_count ?? row.starter_field ?? 0,
    gapToWinnerSeconds: row.gap_to_winner ?? row.gap_to_winner_seconds ?? 0,
    gapToPodiumSeconds: row.gap_to_podium ?? 0,
    gapToPersonalBestSeconds: row.gap_to_personal_best ?? 0,
    feeling: row.feeling ?? 7,
    coachNote: row.coach_note ?? "",
    note: row.notes ?? row.competitions?.notes ?? "",
    source: row.source_type ?? row.competitions?.source ?? "manual",
    sourceType: row.source_type ?? row.competitions?.source ?? "manual",
    externalId: row.competitions?.external_id ?? "",
    sourceUrl: row.source_url ?? row.competitions?.source_url ?? "",
    createdBy: row.created_by ?? "",
    deletedAt: row.deleted_at ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};
