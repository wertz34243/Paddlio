import type { ExternalTrainingSession } from "../domain/types";

export type PolarConnectionStatus = {
  connected: boolean;
  connection: {
    provider: "polar";
    provider_user_id?: string;
    status: "disconnected" | "prepared" | "connected" | "expired" | "error";
    last_sync_at?: string;
    error_message?: string;
  } | null;
  imports: PolarImportRow[];
  jobs: Array<{ id: string; status: string; sync_type: string; imported_count: number; updated_count: number; error_message?: string; created_at: string }>;
  requiredEnvironment: {
    polarClientConfigured: boolean;
    serverConfigured: boolean;
    polarClientIdConfigured?: boolean;
    polarClientSecretConfigured?: boolean;
    polarRedirectUriConfigured?: boolean;
    supabaseServiceRoleConfigured?: boolean;
    polarTokenEncryptionConfigured?: boolean;
  };
};

export type PolarImportRow = {
  id: string;
  provider_activity_id: string;
  title: string;
  sport_type: ExternalTrainingSession["sportType"];
  started_at: string;
  duration_seconds: number;
  distance_meters: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  calories: number;
  training_load: number;
  recovery_status: string;
  raw_data: Record<string, unknown>;
  linked_training_id: string | null;
  updated_at: string;
};

export type PolarSyncResult = {
  ok: boolean;
  imported: number;
  updated: number;
  skipped: number;
  sessions: Array<Record<string, unknown>>;
};

const authHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
});

const readJson = async <T,>(response: Response): Promise<T> => {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof json.error === "string" ? json.error : "polar_request_failed";
    throw new Error(message);
  }
  return json as T;
};

export const getPolarStatus = async (accessToken: string): Promise<PolarConnectionStatus> =>
  readJson<PolarConnectionStatus>(await fetch("/api/polar/status", { headers: authHeaders(accessToken) }));

export const startPolarConnection = async (accessToken: string): Promise<string> => {
  const result = await readJson<{ authorizationUrl: string }>(await fetch("/api/polar/start", {
    method: "POST",
    headers: authHeaders(accessToken),
  }));
  return result.authorizationUrl;
};

export const syncPolarTrainings = async (accessToken: string): Promise<PolarSyncResult> =>
  readJson<PolarSyncResult>(await fetch("/api/polar/sync", {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ syncType: "manual" }),
  }));

export const disconnectPolar = async (accessToken: string): Promise<void> => {
  await readJson<{ ok: boolean }>(await fetch("/api/polar/disconnect", {
    method: "POST",
    headers: authHeaders(accessToken),
  }));
};

export const mapPolarImportToExternalSession = (row: PolarImportRow): ExternalTrainingSession => ({
  id: row.id,
  userId: "",
  athleteId: "",
  clubId: "",
  provider: "polar",
  providerActivityId: row.provider_activity_id,
  title: row.title || "Polar Training",
  sportType: row.sport_type || "other",
  startedAt: row.started_at,
  durationSeconds: row.duration_seconds || 0,
  distanceMeters: row.distance_meters || 0,
  avgHeartRate: row.avg_heart_rate || 0,
  maxHeartRate: row.max_heart_rate || 0,
  calories: row.calories || 0,
  trainingLoad: row.training_load || 0,
  recoveryStatus: row.recovery_status || "",
  rawData: row.raw_data || {},
  linkedTrainingId: row.linked_training_id || "",
  createdAt: row.updated_at,
  updatedAt: row.updated_at,
});
