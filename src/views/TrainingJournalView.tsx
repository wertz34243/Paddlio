import {
  PaddlioOneButton,
  PaddlioOneCard,
  PaddlioOneMetricCard,
  PaddlioOnePageHeader,
  PaddlioOneStatusChip,
} from "../components/paddlio-one/PaddlioOneComponents";
import type { PlanEntry, TrainingJournalEntry, TrainingSession } from "../domain/types";
import { parseLocalDateOnly } from "../domain/trainingPlan";

type TrainingJournalViewProps = {
  journal: TrainingJournalEntry[];
  sessions: TrainingSession[];
  plan: PlanEntry[];
  onOpenOverview: () => void;
  onOpenPlan: () => void;
  onOpenSessions: () => void;
};

const formatDate = (date: string): string =>
  parseLocalDateOnly(date).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

const average = (values: number[]): number => {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (filtered.length === 0) return 0;
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
};

export function TrainingJournalView({
  journal,
  sessions,
  plan,
  onOpenOverview,
  onOpenPlan,
  onOpenSessions,
}: TrainingJournalViewProps) {
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  const planById = new Map(plan.map((entry) => [entry.id, entry]));
  const sortedJournal = [...journal].sort((a, b) => b.date.localeCompare(a.date));
  const totalMinutes = sortedJournal.reduce((sum, entry) => sum + (entry.actualDurationMinutes ?? 0), 0);
  const avgFeeling = average(sortedJournal.map((entry) => entry.feeling));
  const avgRating = average(sortedJournal.map((entry) => entry.trainingRating));

  return (
    <div className="po-journal-workspace">
      <PaddlioOnePageHeader
        eyebrow="Trainingstagebuch"
        title="Was wirklich passiert ist"
        description="Ist-Daten, Feedback und Belastung als Grundlage für Analyse und Planung."
        action={
          <div className="po-action-row">
            <PaddlioOneButton variant="secondary" icon="training" onClick={onOpenOverview}>Training</PaddlioOneButton>
            <PaddlioOneButton variant="secondary" icon="calendar" onClick={onOpenPlan}>Vorlagen</PaddlioOneButton>
            <PaddlioOneButton variant="primary" icon="message" onClick={onOpenSessions}>Freies Training</PaddlioOneButton>
          </div>
        }
      />

      <section className="po-kpi-strip">
        <PaddlioOneMetricCard label="Einträge" value={sortedJournal.length} detail="gespeichert" icon="message" tone="primary" />
        <PaddlioOneMetricCard label="Trainingszeit" value={`${totalMinutes} min`} detail="dokumentiert" icon="timer" />
        <PaddlioOneMetricCard label="Gefühl" value={avgFeeling || "--"} detail="Ø von 10" icon="bolt" tone="info" />
        <PaddlioOneMetricCard label="Bewertung" value={avgRating || "--"} detail="Ø von 10" icon="target" tone="success" />
      </section>

      <PaddlioOneCard className="po-journal-list">
        <div className="po-card-heading-row">
          <div>
            <p className="po-eyebrow">Historie</p>
            <h2>Journal</h2>
          </div>
          <PaddlioOneStatusChip tone="info">Soll/Ist</PaddlioOneStatusChip>
        </div>

        {sortedJournal.length > 0 ? sortedJournal.map((entry) => {
          const session = sessionsById.get(entry.trainingId);
          const planned = entry.trainingPlanEntryId ? planById.get(entry.trainingPlanEntryId) : undefined;
          const title = planned?.title || planned?.trainingType || session?.focus || session?.type || "Freies Training";
          const plannedMinutes = planned?.durationMinutes;
          const actualMinutes = entry.actualDurationMinutes ?? plannedMinutes ?? session?.durationMinutes ?? 0;

          return (
            <article className="po-journal-row" key={entry.id}>
              <div className="po-journal-row-main">
                <strong>{title}</strong>
                <span>{formatDate(entry.date)} · {planned ? "geplante Einheit" : "freies Training"}</span>
                <p>
                  {plannedMinutes ? `Geplant: ${plannedMinutes} min · ` : ""}
                  Durchgeführt: {actualMinutes} min
                  {entry.averageHeartRate ? ` · Ø HF ${entry.averageHeartRate}` : ""}
                </p>
                <div className="po-journal-chips">
                  <PaddlioOneStatusChip tone="info">Gefühl {entry.feeling}/10</PaddlioOneStatusChip>
                  <PaddlioOneStatusChip tone="warning">Müdigkeit {entry.fatigue}/10</PaddlioOneStatusChip>
                  <PaddlioOneStatusChip tone="success">Schlaf {entry.sleep}/10</PaddlioOneStatusChip>
                  <PaddlioOneStatusChip tone="primary">Motivation {entry.motivation}/10</PaddlioOneStatusChip>
                </div>
                {entry.painNotes ? <small>Beschwerden: {entry.painNotes}</small> : null}
                {entry.notes ? <small>{entry.notes}</small> : null}
              </div>
              <strong className="po-journal-score">{entry.trainingRating}/10</strong>
            </article>
          );
        }) : (
          <div className="po-empty-training-day">
            <h2>Noch keine Journal-Einträge gespeichert.</h2>
            <p>Nach dem Training kannst du Dauer, Belastung, Gefühl und Notizen hier festhalten.</p>
            <PaddlioOneButton variant="primary" icon="training" onClick={onOpenSessions}>Erstes Training eintragen</PaddlioOneButton>
          </div>
        )}
      </PaddlioOneCard>
    </div>
  );
}
