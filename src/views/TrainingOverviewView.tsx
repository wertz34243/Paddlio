import { useMemo, useState, type FormEvent } from "react";
import { getTodayKey, isDoneStatus, isSkippedStatus, planStatusLabels, sortPlanEntries } from "../domain/trainingPlan";
import type { PlanEntry, PlanStatus, TrainingJournalEntry, TrainingSession } from "../domain/types";

type TrainingOverviewViewProps = {
  plan: PlanEntry[];
  sessions: TrainingSession[];
  journal: TrainingJournalEntry[];
  onPlanStatusChange: (id: string, status: PlanStatus) => void;
  onSaveJournal: (
    entry: Omit<TrainingJournalEntry, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string },
  ) => void;
  onOpenPlan: () => void;
  onOpenSessions: () => void;
  onOpenJournal: () => void;
};

const toNumber = (value: FormDataEntryValue | null, fallback = 0): number => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};

const completionLabel: Record<string, string> = {
  completed: "Durchgeführt",
  partially_completed: "Teilweise durchgeführt",
  skipped: "Übersprungen",
};

export function TrainingOverviewView({
  plan,
  sessions,
  journal,
  onPlanStatusChange,
  onSaveJournal,
  onOpenPlan,
  onOpenSessions,
  onOpenJournal,
}: TrainingOverviewViewProps) {
  const today = getTodayKey();
  const [completionEntry, setCompletionEntry] = useState<PlanEntry | null>(null);
  const [completionStatus, setCompletionStatus] = useState<"completed" | "partially_completed" | "skipped">("completed");
  const todayPlan = useMemo(() => sortPlanEntries(plan).filter((entry) => entry.date === today), [plan, today]);
  const upcomingPlan = useMemo(() => sortPlanEntries(plan).filter((entry) => entry.date >= today).slice(0, 5), [plan, today]);
  const todaySessions = useMemo(() => sessions.filter((session) => session.date === today), [sessions, today]);
  const journalByPlan = useMemo(
    () => new Map(journal.filter((entry) => entry.trainingPlanEntryId).map((entry) => [entry.trainingPlanEntryId, entry])),
    [journal],
  );

  const openCompletion = (entry: PlanEntry, status: "completed" | "partially_completed" | "skipped") => {
    setCompletionEntry(entry);
    setCompletionStatus(status);
  };

  const handleCompletionSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!completionEntry) return;
    const formData = new FormData(event.currentTarget);
    const existing = journalByPlan.get(completionEntry.id);

    onSaveJournal({
      id: existing?.id,
      trainingId: existing?.trainingId ?? completionEntry.id,
      trainingPlanEntryId: completionEntry.id,
      date: completionEntry.date,
      completionStatus,
      actualDurationMinutes: toNumber(formData.get("actualDurationMinutes"), completionEntry.durationMinutes),
      actualDistanceKm: toNumber(formData.get("actualDistanceKm"), 0),
      averageHeartRate: toNumber(formData.get("averageHeartRate"), 0),
      perceivedExertion: toNumber(formData.get("perceivedExertion"), completionEntry.intensity === "hart" ? 7 : 5),
      painNotes: String(formData.get("painNotes") ?? "").trim(),
      trainingRating: toNumber(formData.get("trainingRating"), 7),
      feeling: toNumber(formData.get("feeling"), 7),
      fatigue: toNumber(formData.get("fatigue"), 4),
      sleep: toNumber(formData.get("sleep"), 7),
      motivation: toNumber(formData.get("motivation"), 7),
      notes: String(formData.get("notes") ?? "").trim(),
    });
    onPlanStatusChange(completionEntry.id, completionStatus);
    setCompletionEntry(null);
  };

  return (
    <div className="stack">
      <section className="section-block training-overview-hero">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Training</p>
            <h3>Übersicht</h3>
          </div>
        </div>
        <div className="training-overview-grid">
          <button type="button" className="action-card" onClick={onOpenSessions} aria-label="Freies Training eintragen">
            <span>Mein Training heute</span>
            <strong>{todayPlan.length || todaySessions.length ? `${todayPlan.length + todaySessions.length} Einheiten` : "Kein Plan"}</strong>
            <small>Heute starten, durchführen oder frei dokumentieren.</small>
          </button>
          <button type="button" className="action-card" onClick={onOpenPlan} aria-label="Trainingsplan öffnen">
            <span>Trainingsplan</span>
            <strong>{upcomingPlan.length} kommende</strong>
            <small>Geplante Einheiten, Wochenansicht und Vorlagen.</small>
          </button>
          <button type="button" className="action-card" onClick={onOpenJournal} aria-label="Trainingstagebuch öffnen">
            <span>Trainingstagebuch</span>
            <strong>{journal.length} Einträge</strong>
            <small>Was tatsächlich durchgeführt wurde.</small>
          </button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Heute</p>
            <h3>Mein Training heute</h3>
          </div>
        </div>

        <div className="fitness-list">
          {todayPlan.length > 0 ? todayPlan.map((entry) => {
            const linkedJournal = journalByPlan.get(entry.id);
            return (
              <article className={`fitness-card status-${isSkippedStatus(entry.status) ? "skipped" : isDoneStatus(entry.status) ? "done" : "planned"}`} key={entry.id}>
                <div className="fitness-card-main static">
                  <span className="activity-ring">{entry.durationMinutes}</span>
                  <div>
                    <strong>{entry.title || entry.trainingType}</strong>
                    <small>{entry.startTime || entry.time || "Uhrzeit offen"} - {entry.area} - {entry.boatClass}</small>
                    <p>{entry.goal || entry.focus || "Kein Trainingsziel hinterlegt."}</p>
                  </div>
                  <b>{linkedJournal ? "im Journal" : planStatusLabels[entry.status] ?? "Geplant"}</b>
                </div>
                <div className="smart-detail-grid">
                  <span>Geplant: {entry.durationMinutes} min</span>
                  <span>Intensität: {entry.intensity}</span>
                  <span>Status: {planStatusLabels[entry.status] ?? entry.status}</span>
                </div>
                {linkedJournal ? (
                  <p className="card-note">
                    Durchgeführt: {linkedJournal.actualDurationMinutes ?? entry.durationMinutes} min
                    {linkedJournal.averageHeartRate ? `, Durchschnittspuls ${linkedJournal.averageHeartRate}` : ""}.
                    Bewertung: {linkedJournal.trainingRating}/10
                  </p>
                ) : null}
                <div className="card-actions">
                  <button type="button" className="edit-button" onClick={onOpenPlan} aria-label={`Training ${entry.title || entry.trainingType} ansehen`}>Training ansehen</button>
                  <button type="button" onClick={() => onPlanStatusChange(entry.id, "in_progress")} aria-label={`Training ${entry.title || entry.trainingType} starten`}>Training starten</button>
                  <button type="button" className="save-button" onClick={() => openCompletion(entry, "completed")} aria-label={`Training ${entry.title || entry.trainingType} als durchgeführt markieren`}>Durchgeführt</button>
                  <button type="button" onClick={() => openCompletion(entry, "partially_completed")} aria-label={`Training ${entry.title || entry.trainingType} als teilweise durchgeführt markieren`}>Teilweise</button>
                  <button type="button" className="delete-button" onClick={() => openCompletion(entry, "skipped")} aria-label={`Training ${entry.title || entry.trainingType} als übersprungen markieren`}>Übersprungen</button>
                </div>
              </article>
            );
          }) : (
            <article className="empty-state action-empty">
              <strong>Noch kein Training für heute geplant.</strong>
              <span>Du kannst ein freies Training eintragen oder direkt eine neue Einheit planen.</span>
              <div className="inline-actions">
                <button type="button" className="save-button" onClick={onOpenSessions} aria-label="Freies Training für heute eintragen">Freies Training eintragen</button>
                <button type="button" onClick={onOpenPlan} aria-label="Neue Einheit für heute planen">Einheit planen</button>
              </div>
            </article>
          )}
        </div>
      </section>

      {completionEntry ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{completionLabel[completionStatus]}</p>
              <h3>{completionEntry.title || completionEntry.trainingType}</h3>
            </div>
          </div>
          <form className="entry-form" onSubmit={handleCompletionSubmit}>
            <div className="form-grid">
              <label>Tatsächliche Dauer<input name="actualDurationMinutes" type="number" min="0" defaultValue={completionEntry.durationMinutes} /></label>
              <label>Strecke<input name="actualDistanceKm" type="number" min="0" step="0.1" placeholder="km" /></label>
              <label>Durchschnittspuls<input name="averageHeartRate" type="number" min="0" step="1" placeholder="bpm" /></label>
              <label>Belastung<input name="perceivedExertion" type="number" min="1" max="10" defaultValue={completionEntry.intensity === "hart" ? 7 : 5} /></label>
              <label>Bewertung<input name="trainingRating" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Gefühl<input name="feeling" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Müdigkeit<input name="fatigue" type="number" min="1" max="10" defaultValue={4} /></label>
              <label>Schlaf<input name="sleep" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Motivation<input name="motivation" type="number" min="1" max="10" defaultValue={7} /></label>
            </div>
            <label>Schmerzen oder Beschwerden<textarea name="painNotes" rows={2} /></label>
            <label>Notizen<textarea name="notes" rows={3} defaultValue={completionEntry.notes || completionEntry.note} /></label>
            <div className="form-actions">
              <button className="save-button" type="submit" aria-label={`${completionEntry.title || completionEntry.trainingType} im Trainingstagebuch speichern`}>Im Tagebuch speichern</button>
              <button className="ghost-button wide" type="button" onClick={() => setCompletionEntry(null)}>Abbrechen</button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
