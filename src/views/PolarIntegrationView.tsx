import { useEffect, useMemo, useState } from "react";
import type { ExternalConnection, ExternalTrainingSession, PaddleMotionData, TrainingSession, User } from "../domain/types";
import { calculatePaddlioZones, formatDurationCompact } from "../features/integrations/polarZones";
import { deviceAdapters } from "../features/integrations/deviceAdapters";
import {
  disconnectPolar,
  getPolarStatus,
  mapPolarImportToExternalSession,
  startPolarConnection,
  syncPolarTrainings,
  type PolarConnectionStatus,
} from "../services/polarIntegrationService";

type PolarIntegrationViewProps = {
  data: PaddleMotionData;
  user: User;
  sessionAccessToken?: string;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
};

export function PolarIntegrationView({ data, user, sessionAccessToken, onDataChange }: PolarIntegrationViewProps) {
  const [status, setStatus] = useState<PolarConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const polarLocalConnection = data.externalConnections.find((connection) => connection.provider === "polar");
  const polarSessions = data.externalTrainingSessions.filter((session) => session.provider === "polar");
  const latestSession = polarSessions[0];

  const zoneSummary = useMemo(() => {
    const samples = latestSession?.rawData?.paddlio && typeof latestSession.rawData.paddlio === "object"
      ? (latestSession.rawData.paddlio as { heartRateSamples?: number[] }).heartRateSamples ?? []
      : [];
    return calculatePaddlioZones(samples, latestSession?.maxHeartRate || 190);
  }, [latestSession]);

  const loadStatus = async () => {
    if (!sessionAccessToken) {
      setMessage("Polar benötigt eine bestätigte Cloud-Anmeldung.");
      return;
    }
    setLoading(true);
    try {
      const nextStatus = await getPolarStatus(sessionAccessToken);
      setStatus(nextStatus);
      applyStatusToLocalData(nextStatus);
      setMessage(nextStatus.connected ? "Polar ist verbunden." : "Polar ist noch nicht verbunden.");
    } catch (error) {
      setMessage(explainPolarError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionAccessToken]);

  const connect = async () => {
    if (!sessionAccessToken) {
      setMessage("Bitte zuerst mit deinem Paddlio Cloud-Konto anmelden.");
      return;
    }
    setLoading(true);
    try {
      const url = await startPolarConnection(sessionAccessToken);
      window.location.assign(url);
    } catch (error) {
      setMessage(explainPolarError(error));
      setLoading(false);
    }
  };

  const sync = async () => {
    if (!sessionAccessToken) return;
    setLoading(true);
    try {
      const result = await syncPolarTrainings(sessionAccessToken);
      const nextStatus = await getPolarStatus(sessionAccessToken);
      setStatus(nextStatus);
      applyStatusToLocalData(nextStatus);
      applySyncedSessions(result.sessions);
      setMessage(`${result.imported} neu, ${result.updated} aktualisiert, ${result.skipped} übersprungen.`);
    } catch (error) {
      setMessage(explainPolarError(error));
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!sessionAccessToken) return;
    setLoading(true);
    try {
      await disconnectPolar(sessionAccessToken);
      const nextStatus = await getPolarStatus(sessionAccessToken);
      setStatus(nextStatus);
      applyStatusToLocalData(nextStatus);
      setMessage("Polar wurde getrennt. Bereits importierte Trainings bleiben erhalten.");
    } catch (error) {
      setMessage(explainPolarError(error));
    } finally {
      setLoading(false);
    }
  };

  const applyStatusToLocalData = (nextStatus: PolarConnectionStatus) => {
    const timestamp = new Date().toISOString();
    const connection: ExternalConnection = {
      id: polarLocalConnection?.id || `polar-${user.userId}`,
      userId: user.userId,
      provider: "polar",
      providerUserId: nextStatus.connection?.provider_user_id || polarLocalConnection?.providerUserId || "",
      status: nextStatus.connection?.status || (nextStatus.connected ? "connected" : "disconnected"),
      lastSyncAt: nextStatus.connection?.last_sync_at || polarLocalConnection?.lastSyncAt || "",
      errorMessage: nextStatus.connection?.error_message || "",
      createdAt: polarLocalConnection?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    const sessions = nextStatus.imports.map((row) => ({
      ...mapPolarImportToExternalSession(row),
      userId: user.userId,
      athleteId: user.userId,
      clubId: user.profile.club,
    }));
    onDataChange((current) => ({
      ...current,
      externalConnections: current.externalConnections.some((item) => item.id === connection.id)
        ? current.externalConnections.map((item) => item.id === connection.id ? connection : item)
        : [connection, ...current.externalConnections],
      externalTrainingSessions: mergeExternalSessions(current.externalTrainingSessions, sessions),
    }));
  };

  const applySyncedSessions = (rows: Array<Record<string, unknown>>) => {
    const timestamp = new Date().toISOString();
    const sessions: ExternalTrainingSession[] = rows.map((row) => ({
      id: String(row.id),
      userId: user.userId,
      athleteId: user.userId,
      clubId: user.profile.club,
      provider: "polar",
      providerActivityId: String(row.provider_activity_id || ""),
      title: String(row.title || "Polar Training"),
      sportType: String(row.sport_type || "other") as ExternalTrainingSession["sportType"],
      startedAt: String(row.started_at || timestamp),
      durationSeconds: Number(row.duration_seconds || 0),
      distanceMeters: Number(row.distance_meters || 0),
      avgHeartRate: Number(row.avg_heart_rate || 0),
      maxHeartRate: Number(row.max_heart_rate || 0),
      calories: Number(row.calories || 0),
      trainingLoad: Number(row.training_load || 0),
      recoveryStatus: String(row.recovery_status || ""),
      rawData: (row.raw_data || {}) as Record<string, unknown>,
      linkedTrainingId: String(row.linked_training_id || ""),
      createdAt: String(row.created_at || timestamp),
      updatedAt: String(row.updated_at || timestamp),
    }));
    const journalSessions: TrainingSession[] = sessions.map((session) => ({
      id: `training-${session.id}`,
      athleteId: user.userId,
      date: session.startedAt.slice(0, 10),
      type: trainingTypeFromSport(session.sportType),
      durationMinutes: Math.max(1, Math.round(session.durationSeconds / 60)),
      rpe: session.trainingLoad > 70 ? 8 : session.avgHeartRate > 155 ? 7 : 5,
      focus: `Polar ${session.title}`,
      note: `${Math.round(session.distanceMeters / 100) / 10} km · HF ${session.avgHeartRate || "-"} Ø / ${session.maxHeartRate || "-"} max`,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    onDataChange((current) => ({
      ...current,
      externalTrainingSessions: mergeExternalSessions(current.externalTrainingSessions, sessions),
      training: mergeTrainingSessions(current.training, journalSessions),
    }));
  };

  const connected = status?.connected || polarLocalConnection?.status === "connected";
  const envReady = status?.requiredEnvironment
    ? status.requiredEnvironment.polarClientConfigured && status.requiredEnvironment.serverConfigured
    : true;

  return (
    <section className="polar-view stack">
      <header className="polar-hero">
        <div>
          <p className="eyebrow">Polar AccessLink</p>
          <h3>Polar Flow verbinden</h3>
          <p>Trainings, Herzfrequenz, GPS und Belastung sicher in Paddlio synchronisieren.</p>
        </div>
        <div className={`polar-status ${connected ? "connected" : "disconnected"}`}>
          <strong>{connected ? "Verbunden" : "Nicht verbunden"}</strong>
          <span>{polarLocalConnection?.lastSyncAt ? `Letzter Sync ${new Date(polarLocalConnection.lastSyncAt).toLocaleString("de-DE")}` : "Noch kein Sync"}</span>
        </div>
      </header>

      {!envReady ? (
        <article className="polar-warning">
          <strong>Server-Konfiguration fehlt</strong>
          <p>Für Live-OAuth müssen die Polar- und Supabase-Servervariablen vollständig in der geschützten Deployment-Umgebung gesetzt sein.</p>
        </article>
      ) : null}

      <div className="polar-actions">
        <button className="primary-action" type="button" onClick={() => void connect()} disabled={loading || connected || !sessionAccessToken}>
          Polar verbinden
        </button>
        <button className="secondary-button" type="button" onClick={() => void sync()} disabled={loading || !connected || !sessionAccessToken}>
          Jetzt synchronisieren
        </button>
        <button className="secondary-button" type="button" onClick={() => void disconnect()} disabled={loading || !connected || !sessionAccessToken}>
          Trennen
        </button>
      </div>

      {message ? <p className="polar-message">{message}</p> : null}

      <section className="polar-grid">
        <article className="polar-card">
          <span>Importierte Einheiten</span>
          <strong>{polarSessions.length}</strong>
          <small>Duplikate werden über Polar Activity ID verhindert.</small>
        </article>
        <article className="polar-card">
          <span>Trainingszeit</span>
          <strong>{formatDurationCompact(polarSessions.reduce((sum, session) => sum + session.durationSeconds, 0))}</strong>
          <small>Synchronisierte Polar-Minuten.</small>
        </article>
        <article className="polar-card">
          <span>Ø Herzfrequenz</span>
          <strong>{average(polarSessions.map((session) => session.avgHeartRate).filter(Boolean)) || "--"}</strong>
          <small>Aus importierten Einheiten.</small>
        </article>
      </section>

      <section className="polar-panel">
        <div className="import-card-header">
          <div>
            <p className="eyebrow">Herzfrequenz & Zonen</p>
            <h3>{latestSession?.title || "Noch keine Polar-Einheit"}</h3>
          </div>
          <span>{latestSession ? new Date(latestSession.startedAt).toLocaleDateString("de-DE") : "Warte auf Sync"}</span>
        </div>
        <div className="polar-chart" aria-label="Herzfrequenzdiagramm">
          {extractHeartRateSamples(latestSession).slice(-72).map((heartRate, index, samples) => (
            <span key={`${heartRate}-${index}`} style={{ height: `${Math.max(12, Math.min(100, (heartRate / Math.max(...samples, 1)) * 100))}%` }} />
          ))}
        </div>
        <div className="polar-zones">
          {zoneSummary.map((zone) => (
            <div key={zone.label}>
              <span>{zone.label}</span>
              <strong>{formatDurationCompact(zone.seconds)}</strong>
              <em style={{ width: `${Math.min(100, zone.seconds / Math.max(1, latestSession?.durationSeconds || 1) * 100)}%` }} />
            </div>
          ))}
        </div>
      </section>

      <section className="polar-panel">
        <p className="eyebrow">Adapter-Architektur</p>
        <h3>Weitere Geräte vorbereitet</h3>
        <div className="device-adapter-list">
          {deviceAdapters.map((adapter) => (
            <article key={adapter.provider}>
              <strong>{adapter.label}</strong>
              <span>{adapter.status === "active" ? "Aktiv" : "Vorbereitet"} · {adapter.capabilities.join(", ")}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function mergeExternalSessions(current: ExternalTrainingSession[], incoming: ExternalTrainingSession[]): ExternalTrainingSession[] {
  const byKey = new Map<string, ExternalTrainingSession>();
  current.forEach((session) => byKey.set(`${session.provider}:${session.providerActivityId || session.id}`, session));
  incoming.forEach((session) => byKey.set(`${session.provider}:${session.providerActivityId || session.id}`, session));
  return [...byKey.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function mergeTrainingSessions(current: TrainingSession[], incoming: TrainingSession[]): TrainingSession[] {
  const existing = new Set(current.map((session) => session.id));
  return [...incoming.filter((session) => !existing.has(session.id)), ...current];
}

function trainingTypeFromSport(sport: ExternalTrainingSession["sportType"]): TrainingSession["type"] {
  if (sport === "strength") return "Kraft";
  if (sport === "mobility") return "Pause";
  if (sport === "kayak" || sport === "canoe" || sport === "paddling") return "Ausdauer";
  return "Technik";
}

function extractHeartRateSamples(session?: ExternalTrainingSession): number[] {
  const paddlio = session?.rawData?.paddlio;
  if (!paddlio || typeof paddlio !== "object") return [];
  const samples = (paddlio as { heartRateSamples?: unknown }).heartRateSamples;
  return Array.isArray(samples) ? samples.map(Number).filter((value) => Number.isFinite(value) && value > 0) : [];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function explainPolarError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Missing environment variable")) return "Polar ist serverseitig noch nicht vollständig konfiguriert.";
  if (message.includes("polar_not_connected")) return "Polar ist noch nicht verbunden.";
  if (message.includes("invalid_auth_token")) return "Bitte melde dich erneut an.";
  return "Polar-Aktion konnte nicht abgeschlossen werden. Details stehen in der Konsole.";
}
