import { getBestTotalTime } from "../domain/metrics";
import type {
  BetaReadinessCheck,
  Competition,
  ExternalConnection,
  ExternalTrainingSession,
  PersonalBest,
  ResultImport,
} from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { enqueueSyncChange } from "./syncService";
import { sanitizeCloudPayload } from "./cloudIds";

const today = (): string => new Date().toISOString().slice(0, 10);

const tableUpsert = async (tableName: string, payload: Record<string, unknown>): Promise<void> => {
  const cloudPayload = sanitizeCloudPayload(payload);
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName, action: "upsert", payload: cloudPayload });
    return;
  }
  const { error } = await (client.from(tableName) as any).upsert(cloudPayload, { onConflict: "id" });
  if (error) throw error;
};

const tableList = async <T,>(tableName: string, mapper: (row: any) => T): Promise<T[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from(tableName) as any).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapper);
};

export const calculatePersonalBests = (competitions: Competition[]): PersonalBest[] => {
  const bestByKey = new Map<string, Competition>();
  competitions
    .filter((competition) => !competition.deletedAt && getBestTotalTime(competition) > 0)
    .forEach((competition) => {
      const key = [
        competition.athleteId,
        competition.boatClass,
        competition.courseName || competition.course || "",
        competition.location || "",
      ].join("|");
      const current = bestByKey.get(key);
      if (!current || getBestTotalTime(competition) < getBestTotalTime(current)) {
        bestByKey.set(key, competition);
      }
    });

  return [...bestByKey.entries()].map(([key, result]) => {
    const [, boatClass, courseName, location] = key.split("|");
    return {
      id: `pb-${key}`.replace(/[^a-zA-Z0-9-]/g, "-"),
      athleteId: result.athleteId,
      clubId: result.clubId ?? "",
      boatClass: result.boatClass,
      courseName,
      location,
      bestTimeSeconds: getBestTotalTime(result),
      resultId: result.id,
      achievedAt: result.date || today(),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  });
};

export const upsertCloudPersonalBest = (item: PersonalBest): Promise<void> =>
  tableUpsert("personal_bests", {
    id: item.id,
    athlete_id: item.athleteId,
    club_id: item.clubId || null,
    boat_class: item.boatClass,
    course_name: item.courseName || null,
    location: item.location || null,
    best_time: item.bestTimeSeconds,
    result_id: item.resultId || null,
    achieved_at: item.achievedAt,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  });

export const listCloudPersonalBests = (): Promise<PersonalBest[]> =>
  tableList("personal_bests", (row) => ({
    id: row.id,
    athleteId: row.athlete_id,
    clubId: row.club_id ?? "",
    boatClass: row.boat_class,
    courseName: row.course_name ?? "",
    location: row.location ?? "",
    bestTimeSeconds: row.best_time ?? 0,
    resultId: row.result_id ?? "",
    achievedAt: row.achieved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export const upsertCloudResultImport = (item: ResultImport): Promise<void> =>
  tableUpsert("result_imports", {
    id: item.id,
    club_id: item.clubId || null,
    uploaded_by: item.uploadedBy,
    source_type: item.sourceType,
    source_name: item.sourceName || null,
    source_url: item.sourceUrl || null,
    file_path: item.filePath || null,
    import_status: item.importStatus,
    detected_results_count: item.detectedResultsCount,
    imported_results_count: item.importedResultsCount,
    error_message: item.errorMessage || null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  });

export const listCloudResultImports = (): Promise<ResultImport[]> =>
  tableList("result_imports", (row) => ({
    id: row.id,
    clubId: row.club_id ?? "",
    uploadedBy: row.uploaded_by,
    sourceType: row.source_type,
    sourceName: row.source_name ?? "",
    sourceUrl: row.source_url ?? "",
    filePath: row.file_path ?? "",
    importStatus: row.import_status,
    detectedResultsCount: row.detected_results_count ?? 0,
    importedResultsCount: row.imported_results_count ?? 0,
    errorMessage: row.error_message ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export const upsertCloudExternalConnection = (item: ExternalConnection): Promise<void> =>
  tableUpsert("external_connections", {
    id: item.id,
    user_id: item.userId,
    provider: item.provider,
    provider_user_id: item.providerUserId || null,
    status: item.status,
    last_sync_at: item.lastSyncAt || null,
    error_message: item.errorMessage || null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  });

export const listCloudExternalConnections = (): Promise<ExternalConnection[]> =>
  tableList("external_connections", (row) => ({
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id ?? "",
    status: row.status,
    lastSyncAt: row.last_sync_at ?? "",
    errorMessage: row.error_message ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export const upsertCloudExternalTrainingSession = (item: ExternalTrainingSession): Promise<void> =>
  tableUpsert("external_training_sessions", {
    id: item.id,
    user_id: item.userId,
    athlete_id: item.athleteId || null,
    club_id: item.clubId || null,
    provider: item.provider,
    provider_activity_id: item.providerActivityId || null,
    title: item.title || null,
    sport_type: item.sportType,
    started_at: item.startedAt,
    duration_seconds: item.durationSeconds || null,
    distance_meters: item.distanceMeters || null,
    avg_heart_rate: item.avgHeartRate || null,
    max_heart_rate: item.maxHeartRate || null,
    calories: item.calories || null,
    training_load: item.trainingLoad || null,
    recovery_status: item.recoveryStatus || null,
    raw_data: item.rawData,
    linked_training_id: item.linkedTrainingId || null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  });

export const listCloudExternalTrainingSessions = (): Promise<ExternalTrainingSession[]> =>
  tableList("external_training_sessions", (row) => ({
    id: row.id,
    userId: row.user_id,
    athleteId: row.athlete_id ?? "",
    clubId: row.club_id ?? "",
    provider: row.provider,
    providerActivityId: row.provider_activity_id ?? "",
    title: row.title ?? "Externes Training",
    sportType: row.sport_type ?? "other",
    startedAt: row.started_at,
    durationSeconds: row.duration_seconds ?? 0,
    distanceMeters: row.distance_meters ?? 0,
    avgHeartRate: row.avg_heart_rate ?? 0,
    maxHeartRate: row.max_heart_rate ?? 0,
    calories: row.calories ?? 0,
    trainingLoad: row.training_load ?? 0,
    recoveryStatus: row.recovery_status ?? "",
    rawData: row.raw_data ?? {},
    linkedTrainingId: row.linked_training_id ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export const upsertCloudBetaReadinessCheck = (item: BetaReadinessCheck): Promise<void> =>
  tableUpsert("beta_readiness_checks", {
    id: item.id,
    checked_by: item.checkedBy || null,
    check_key: item.checkKey,
    status: item.status,
    message: item.message || null,
    created_at: item.createdAt,
  });

export const listCloudBetaReadinessChecks = (): Promise<BetaReadinessCheck[]> =>
  tableList("beta_readiness_checks", (row) => ({
    id: row.id,
    checkedBy: row.checked_by ?? "",
    checkKey: row.check_key,
    status: row.status,
    message: row.message ?? "",
    createdAt: row.created_at,
  }));
