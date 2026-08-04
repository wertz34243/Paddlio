import { useMemo, useState, type FormEvent } from "react";
import {
  PaddlioOneButton,
  PaddlioOneCard,
  PaddlioOneMetricCard,
  PaddlioOnePageHeader,
  PaddlioOneStatusChip,
  PaddlioOneTextField,
} from "../components/paddlio-one/PaddlioOneComponents";
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
    <div className="po-training-workflow">
      <PaddlioOnePageHeader
        eyebrow="Training"
        title="Durchführen und dokumentieren"
        description="Vom geplanten Training direkt in Feedback und Trainingstagebuch."
        action={
          <div className="po-action-row">
            <PaddlioOneButton variant="secondary" icon="calendar" onClick={onOpenPlan}>Vorlagen</PaddlioOneButton>
            <PaddlioOneButton variant="primary" icon="training" onClick={onOpenSessions}>Freies Training</PaddlioOneButton>
          </div>
        }
      />

      <section className="po-kpi-strip">
        <PaddlioOneMetricCard label="Heute" value={todayPlan.length + todaySessions.length} detail="Einheiten" icon="training" tone="primary" />
        <PaddlioOneMetricCard label="Geplant" value={upcomingPlan.length} detail="kommend" icon="calendar" />
        <PaddlioOneMetricCard label="Journal" value={journal.length} detail="Einträge" icon="message" tone="success" />
      </section>

      <PaddlioOneCard className="po-training-flow-card">
        <div className="po-training-flow">
          <span>Training starten</span>
          <span>Durchführen</span>
          <span>Feedback</span>
          <span>Journal</span>
        </div>
      </PaddlioOneCard>

      <section className="po-training-list">
        {todayPlan.length > 0 ? todayPlan.map((entry) => {
          const linkedJournal = journalByPlan.get(entry.id);
          const isDone = isDoneStatus(entry.status);
          const skipped = isSkippedStatus(entry.status);

          return (
            <PaddlioOneCard className={`po-training-session-card ${isDone ? "is-done" : ""} ${skipped ? "is-skipped" : ""}`} key={entry.id}>
              <div className="po-card-heading-row">
                <div>
                  <p className="po-eyebrow">{entry.startTime || entry.time || "Uhrzeit offen"} · {entry.durationMinutes} min</p>
                  <h2>{entry.title || entry.trainingType}</h2>
                  <p>{entry.goal || entry.focus || "Kein Trainingsziel hinterlegt."}</p>
                </div>
                <PaddlioOneStatusChip tone={skipped ? "danger" : isDone ? "success" : "info"}>
                  {linkedJournal ? "im Journal" : planStatusLabels[entry.status] ?? "Geplant"}
                </PaddlioOneStatusChip>
              </div>
              <div className="po-training-meta-grid">
                <span>{entry.area}</span>
                <span>{entry.boatClass}</span>
                <span>Intensität {entry.intensity}</span>
              </div>
              {linkedJournal ? (
                <p className="po-card-note">
                  Durchgeführt: {linkedJournal.actualDurationMinutes ?? entry.durationMinutes} min
                  {linkedJournal.averageHeartRate ? ` · Ø HF ${linkedJournal.averageHeartRate}` : ""} · Bewertung {linkedJournal.trainingRating}/10
                </p>
              ) : null}
              <div className="po-action-row po-training-actions">
                <PaddlioOneButton variant="secondary" icon="calendar" onClick={onOpenPlan}>Ansehen</PaddlioOneButton>
                <PaddlioOneButton variant="primary" icon="training" onClick={() => onPlanStatusChange(entry.id, "in_progress")}>Starten</PaddlioOneButton>
                <PaddlioOneButton variant="secondary" icon="message" onClick={() => openCompletion(entry, "completed")}>Durchgeführt</PaddlioOneButton>
                <PaddlioOneButton variant="secondary" onClick={() => openCompletion(entry, "partially_completed")}>Teilweise</PaddlioOneButton>
                <PaddlioOneButton variant="ghost" onClick={() => openCompletion(entry, "skipped")}>Übersprungen</PaddlioOneButton>
              </div>
            </PaddlioOneCard>
          );
        }) : (
          <PaddlioOneCard className="po-empty-training-day">
            <h2>Noch kein Training für heute geplant.</h2>
            <p>Du kannst ein freies Training eintragen oder direkt eine Einheit planen.</p>
            <div className="po-action-row">
              <PaddlioOneButton variant="primary" icon="training" onClick={onOpenSessions}>Freies Training</PaddlioOneButton>
              <PaddlioOneButton variant="secondary" icon="calendar" onClick={onOpenPlan}>Vorlage nutzen</PaddlioOneButton>
            </div>
          </PaddlioOneCard>
        )}
      </section>

      {completionEntry ? (
        <PaddlioOneCard className="po-completion-panel">
          <div className="po-card-heading-row">
            <div>
              <p className="po-eyebrow">{completionLabel[completionStatus]}</p>
              <h2>{completionEntry.title || completionEntry.trainingType}</h2>
              <p>Soll/Ist, RPE und Feedback direkt im Journal speichern.</p>
            </div>
          </div>
          <form className="po-form po-form-compact" onSubmit={handleCompletionSubmit}>
            <div className="po-form-grid">
              <PaddlioOneTextField label="Tatsächliche Dauer" name="actualDurationMinutes" type="number" min="0" defaultValue={completionEntry.durationMinutes} />
              <PaddlioOneTextField label="Strecke" name="actualDistanceKm" type="number" min="0" step="0.1" placeholder="km" />
              <PaddlioOneTextField label="Ø Herzfrequenz" name="averageHeartRate" type="number" min="0" step="1" placeholder="bpm" />
              <PaddlioOneTextField label="Belastung" name="perceivedExertion" type="number" min="1" max="10" defaultValue={completionEntry.intensity === "hart" ? 7 : 5} />
              <PaddlioOneTextField label="Bewertung" name="trainingRating" type="number" min="1" max="10" defaultValue={7} />
              <PaddlioOneTextField label="Gefühl" name="feeling" type="number" min="1" max="10" defaultValue={7} />
              <PaddlioOneTextField label="Müdigkeit" name="fatigue" type="number" min="1" max="10" defaultValue={4} />
              <PaddlioOneTextField label="Schlaf" name="sleep" type="number" min="1" max="10" defaultValue={7} />
              <PaddlioOneTextField label="Motivation" name="motivation" type="number" min="1" max="10" defaultValue={7} />
            </div>
            <label className="po-field po-field-wide">
              <span>Schmerzen oder Beschwerden</span>
              <textarea name="painNotes" rows={2} />
            </label>
            <label className="po-field po-field-wide">
              <span>Notizen</span>
              <textarea name="notes" rows={3} defaultValue={completionEntry.notes || completionEntry.note} />
            </label>
            <div className="po-action-row">
              <PaddlioOneButton variant="primary" type="submit" icon="message">Im Tagebuch speichern</PaddlioOneButton>
              <PaddlioOneButton variant="ghost" onClick={() => setCompletionEntry(null)}>Abbrechen</PaddlioOneButton>
              <PaddlioOneButton variant="secondary" icon="message" onClick={onOpenJournal}>Journal öffnen</PaddlioOneButton>
            </div>
          </form>
        </PaddlioOneCard>
      ) : null}
    </div>
  );
}
