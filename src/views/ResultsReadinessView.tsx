import { useMemo } from "react";
import { createId } from "../data/storage";
import { getBestTotalTime } from "../domain/metrics";
import type { BetaReadinessCheck, ExternalConnection, ExternalTrainingSession, PaddleMotionData, ResultImport, User } from "../domain/types";
import {
  calculatePersonalBests,
  upsertCloudBetaReadinessCheck,
  upsertCloudExternalConnection,
  upsertCloudResultImport,
} from "../services/resultsReadinessService";

type ResultsReadinessMode = "results" | "imports" | "integrations" | "load" | "beta";

type ResultsReadinessViewProps = {
  data: PaddleMotionData;
  user: User;
  mode: ResultsReadinessMode;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
};

const now = (): string => new Date().toISOString();
const today = (): string => now().slice(0, 10);

const weekKey = (date: string): string => {
  const parsed = new Date(date);
  const firstDay = new Date(parsed.getFullYear(), 0, 1);
  const days = Math.floor((parsed.getTime() - firstDay.getTime()) / 86400000);
  return `${parsed.getFullYear()}-${Math.ceil((days + firstDay.getDay() + 1) / 7).toString().padStart(2, "0")}`;
};

const formatSeconds = (value: number): string =>
  value > 0 ? `${value.toLocaleString("de-DE", { maximumFractionDigits: 2 })} s` : "--";

const isAdmin = (user: User): boolean => user.role === "admin";

export function ResultsReadinessView({ data, user, mode, onDataChange }: ResultsReadinessViewProps) {
  const personalBests = useMemo(() => {
    const stored = data.personalBests ?? [];
    return stored.length > 0 ? stored : calculatePersonalBests(data.competitions);
  }, [data.competitions, data.personalBests]);

  const resultStats = useMemo(() => {
    const validResults = data.competitions.filter((competition) => !competition.deletedAt);
    const penalties = validResults.flatMap((competition) => [competition.run1PenaltySeconds, competition.run2PenaltySeconds]);
    const best = [...validResults].sort((a, b) => getBestTotalTime(a) - getBestTotalTime(b))[0];
    const byBoat = validResults.reduce<Record<string, number>>((acc, competition) => {
      acc[competition.boatClass] = (acc[competition.boatClass] ?? 0) + 1;
      return acc;
    }, {});
    return {
      count: validResults.length,
      best,
      averagePenalty: penalties.length ? penalties.reduce((sum, value) => sum + value, 0) / penalties.length : 0,
      byBoat,
    };
  }, [data.competitions]);

  const loadStats = useMemo(() => {
    const externalByWeek = data.externalTrainingSessions.reduce<Record<string, number>>((acc, session) => {
      const key = weekKey(session.startedAt);
      acc[key] = (acc[key] ?? 0) + Math.round((session.durationSeconds ?? 0) / 60);
      return acc;
    }, {});
    const currentWeek = weekKey(today());
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 7);
    const previousWeek = weekKey(previousDate.toISOString());
    const current = externalByWeek[currentWeek] ?? 0;
    const previous = externalByWeek[previousWeek] ?? 0;
    return {
      current,
      previous,
      delta: current - previous,
      linked: data.externalTrainingSessions.filter((session) => session.linkedTrainingId).length,
      unlinked: data.externalTrainingSessions.filter((session) => !session.linkedTrainingId).length,
    };
  }, [data.externalTrainingSessions]);

  const polarConnection = data.externalConnections.find((connection) => connection.provider === "polar");

  const updateData = (updater: (current: PaddleMotionData) => PaddleMotionData) => onDataChange(updater);

  const preparePolar = () => {
    const timestamp = now();
    const connection: ExternalConnection = {
      id: polarConnection?.id ?? createId("external-connection"),
      userId: user.userId,
      provider: "polar",
      providerUserId: polarConnection?.providerUserId ?? "",
      status: "prepared",
      lastSyncAt: polarConnection?.lastSyncAt ?? "",
      errorMessage: "",
      createdAt: polarConnection?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    updateData((current) => ({
      ...current,
      externalConnections: current.externalConnections.some((item) => item.id === connection.id)
        ? current.externalConnections.map((item) => item.id === connection.id ? connection : item)
        : [connection, ...current.externalConnections],
    }));
    void upsertCloudExternalConnection(connection).catch((error) => console.error("[Paddlio 3.9] Polar Vorbereitung konnte nicht gespeichert werden.", error));
  };

  const createImportDraft = () => {
    const timestamp = now();
    const item: ResultImport = {
      id: createId("result-import"),
      clubId: "",
      uploadedBy: user.userId,
      sourceType: "manual",
      sourceName: "Ergebnisimport vorbereitet",
      sourceUrl: "",
      filePath: "",
      importStatus: "draft",
      detectedResultsCount: 0,
      importedResultsCount: 0,
      errorMessage: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    updateData((current) => ({ ...current, resultImports: [item, ...current.resultImports] }));
    void upsertCloudResultImport(item).catch((error) => console.error("[Paddlio 3.9] Import-Entwurf konnte nicht gespeichert werden.", error));
  };

  const runBetaCheck = () => {
    const timestamp = now();
    const checks: BetaReadinessCheck[] = [
      { id: "beta-supabase", checkedBy: user.userId, checkKey: "Supabase verbunden", status: "manual", message: "Bitte in Vercel/Supabase final bestaetigen.", createdAt: timestamp },
      { id: "beta-users", checkedBy: user.userId, checkKey: "Nutzer/Rollen vorhanden", status: data.users.length > 0 ? "ok" : "warning", message: `${data.users.length} geladene Nutzerprofile.`, createdAt: timestamp },
      { id: "beta-groups", checkedBy: user.userId, checkKey: "Trainingsgruppen", status: data.coachGroups.length > 0 ? "ok" : "warning", message: `${data.coachGroups.length} Gruppen geladen.`, createdAt: timestamp },
      { id: "beta-training", checkedBy: user.userId, checkKey: "Trainingsplanung", status: data.plan.length > 0 ? "ok" : "warning", message: `${data.plan.length} Trainings im Cache/Cloud-Snapshot.`, createdAt: timestamp },
      { id: "beta-communication", checkedBy: user.userId, checkKey: "Kommunikation", status: data.tasks.length + data.directMessages.length + data.clubPosts.length > 0 ? "ok" : "manual", message: "Kommunikationsmodul ist vorbereitet.", createdAt: timestamp },
      { id: "beta-results", checkedBy: user.userId, checkKey: "Ergebnisse", status: data.competitions.length > 0 ? "ok" : "warning", message: `${data.competitions.length} Ergebnisse geladen.`, createdAt: timestamp },
      { id: "beta-mobile", checkedBy: user.userId, checkKey: "Mobile Ansicht", status: "manual", message: "Bitte auf iPhone/iPad im echten Browser pruefen.", createdAt: timestamp },
      { id: "beta-rls", checkedBy: user.userId, checkKey: "Datenschutz/RLS", status: "manual", message: "RLS im Supabase Dashboard pruefen.", createdAt: timestamp },
    ];
    updateData((current) => ({ ...current, betaReadinessChecks: checks }));
    void Promise.all(checks.map(upsertCloudBetaReadinessCheck)).catch((error) => console.error("[Paddlio 3.9] Beta-Check konnte nicht synchronisiert werden.", error));
  };

  if (mode === "imports") {
    return (
      <section className="section-block segment-panel">
        <div className="section-heading">
          <div><p className="eyebrow">Import</p><h3>Ergebnis-Import vorbereiten</h3></div>
          <button className="secondary-button" type="button" onClick={createImportDraft}>Import starten</button>
        </div>
        <p className="card-note">CSV, Excel, PDF und Web-Quellen sind als stabile Import-Struktur vorbereitet. Automatische Scraper bleiben bewusst deaktiviert.</p>
        <div className="result-list">
          {data.resultImports.length ? data.resultImports.map((item) => (
            <article className="result-row" key={item.id}>
              <div><strong>{item.sourceName || item.sourceType}</strong><span>Status {item.importStatus}</span><small>{item.detectedResultsCount} erkannt, {item.importedResultsCount} importiert</small></div>
              <b>{item.sourceType.toUpperCase()}</b>
            </article>
          )) : <p className="empty-state">Noch keine Ergebnisimporte vorbereitet.</p>}
        </div>
      </section>
    );
  }

  if (mode === "integrations") {
    return (
      <section className="section-block segment-panel">
        <div className="section-heading">
          <div><p className="eyebrow">Integrationen</p><h3>Polar Sync vorbereitet</h3></div>
          <button className="secondary-button" type="button" onClick={preparePolar}>Verbindung vorbereiten</button>
        </div>
        <div className="metric-grid two-columns">
          <article className="metric-card tone-training"><span>Polar Flow</span><strong>{polarConnection?.status ?? "nicht verbunden"}</strong><small>Sichere Aktivierung folgt ueber Backend/OAuth.</small></article>
          <article className="metric-card tone-success"><span>Externe Einheiten</span><strong>{data.externalTrainingSessions.length}</strong><small>{loadStats.unlinked} noch nicht verknuepft</small></article>
        </div>
        <p className="muted">Keine Client-Secrets im Frontend. Tokens werden erst mit Supabase Edge Functions oder sicherem Backend aktiv genutzt.</p>
      </section>
    );
  }

  if (mode === "load") {
    return (
      <section className="section-block segment-panel">
        <div className="section-heading"><div><p className="eyebrow">Belastung</p><h3>Externe Trainingsdaten</h3></div></div>
        <div className="metric-grid two-columns">
          <article className="metric-card tone-training"><span>Diese Woche</span><strong>{loadStats.current} min</strong><small>{loadStats.delta >= 0 ? "+" : ""}{loadStats.delta} min zur Vorwoche</small></article>
          <article className="metric-card tone-penalty"><span>Nicht verknuepft</span><strong>{loadStats.unlinked}</strong><small>Polar/extern mit Paddlio-Training verbinden</small></article>
        </div>
        <div className="result-list">
          {data.externalTrainingSessions.length ? data.externalTrainingSessions.map((item: ExternalTrainingSession) => (
            <article className="result-row" key={item.id}>
              <div><strong>{item.title}</strong><span>{new Date(item.startedAt).toLocaleDateString("de-DE")} - {item.provider}</span><small>{Math.round(item.durationSeconds / 60)} min, HF {item.avgHeartRate || "--"}/{item.maxHeartRate || "--"}</small></div>
              <b>{item.linkedTrainingId ? "verknuepft" : "offen"}</b>
            </article>
          )) : <p className="empty-state">Noch keine externen Trainingsdaten vorhanden.</p>}
        </div>
      </section>
    );
  }

  if (mode === "beta") {
    return (
      <section className="section-block segment-panel">
        <div className="section-heading">
          <div><p className="eyebrow">Beta-Readiness</p><h3>Check vor Paddlio 4.0</h3></div>
          {isAdmin(user) ? <button className="secondary-button" type="button" onClick={runBetaCheck}>Jetzt pruefen</button> : null}
        </div>
        {!isAdmin(user) ? <p className="empty-state">Der Beta-Check ist nur fuer Admins sichtbar.</p> : (
          <div className="result-list">
            {data.betaReadinessChecks.length ? data.betaReadinessChecks.map((item) => (
              <article className="result-row" key={item.id}>
                <div><strong>{item.checkKey}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString("de-DE")}</small></div>
                <b className={`status-pill ${item.status === "ok" ? "done" : item.status === "error" ? "skipped" : "planned"}`}>{item.status}</b>
              </article>
            )) : <p className="empty-state">Noch kein Beta-Check ausgefuehrt.</p>}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="section-block segment-panel">
      <div className="section-heading"><div><p className="eyebrow">Ergebnisverwaltung</p><h3>Bestzeiten und Saisonvergleich</h3></div></div>
      <div className="metric-grid two-columns">
        <article className="metric-card tone-k1"><span>Ergebnisse</span><strong>{resultStats.count}</strong><small>{Object.entries(resultStats.byBoat).map(([boat, count]) => `${boat}: ${count}`).join(" · ") || "keine Starts"}</small></article>
        <article className="metric-card tone-c1"><span>Beste Zeit</span><strong>{resultStats.best ? formatSeconds(getBestTotalTime(resultStats.best)) : "--"}</strong><small>{resultStats.best ? `${resultStats.best.location} ${resultStats.best.boatClass}` : "noch offen"}</small></article>
        <article className="metric-card tone-penalty"><span>Strafschnitt</span><strong>{formatSeconds(resultStats.averagePenalty)}</strong><small>ueber alle Laeufe</small></article>
        <article className="metric-card tone-success"><span>Persoenliche Bestzeiten</span><strong>{personalBests.length}</strong><small>automatisch berechnet</small></article>
      </div>
      <div className="result-list">
        {personalBests.length ? personalBests.map((item) => (
          <article className="result-row" key={item.id}>
            <div><strong>{item.boatClass} {item.location || "Strecke"}</strong><span>{item.courseName || "vergleichbare Strecke"} - {new Date(item.achievedAt).toLocaleDateString("de-DE")}</span><small>Resultat: {item.resultId || "manuell"}</small></div>
            <b>{formatSeconds(item.bestTimeSeconds)}</b>
          </article>
        )) : <p className="empty-state">Noch keine Bestzeiten vorhanden.</p>}
      </div>
    </section>
  );
}
