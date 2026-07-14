import type { PlanEntry, TrainingJournalEntry, TrainingSession } from "../domain/types";

type TrainingJournalViewProps = {
  journal: TrainingJournalEntry[];
  sessions: TrainingSession[];
  plan: PlanEntry[];
  onOpenOverview: () => void;
  onOpenPlan: () => void;
  onOpenSessions: () => void;
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

  return (
    <section className="section-block segment-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reflexion</p>
          <h3>Trainingstagebuch</h3>
        </div>
      </div>

      <div className="training-journal-actions" aria-label="Trainingstagebuch Navigation">
        <button type="button" className="secondary-button" onClick={onOpenOverview} aria-label="Zur Training-Übersicht zurückkehren">
          Zur Übersicht
        </button>
        <button type="button" className="primary-action compact-action" onClick={onOpenPlan} aria-label="Vom Trainingstagebuch zum Trainingsplan wechseln">
          Trainingsplan öffnen
        </button>
        <button type="button" className="secondary-button" onClick={onOpenSessions} aria-label="Freies Training aus dem Trainingstagebuch eintragen">
          Freies Training
        </button>
      </div>

      <div className="result-list">
        {sortedJournal.length > 0 ? (
          sortedJournal.map((entry) => {
            const session = sessionsById.get(entry.trainingId);
            const planned = entry.trainingPlanEntryId ? planById.get(entry.trainingPlanEntryId) : undefined;

            return (
              <article className="result-row" key={entry.id}>
                <div>
                  <strong>{planned?.title || planned?.trainingType || session?.focus || session?.type || "Freies Training"}</strong>
                  <span>{new Date(entry.date).toLocaleDateString("de-DE")}</span>
                  {planned ? (
                    <span>
                      Geplant: {planned.durationMinutes} Minuten {planned.area}. Durchgeführt:{" "}
                      {entry.actualDurationMinutes ?? planned.durationMinutes} Minuten.
                    </span>
                  ) : (
                    <span>Freies Training ohne Planbezug.</span>
                  )}
                  <span>
                    Gefühl {entry.feeling}/10 - Müdigkeit {entry.fatigue}/10 - Schlaf {entry.sleep}/10 - Motivation {entry.motivation}/10
                  </span>
                  {entry.averageHeartRate ? <span>Durchschnittspuls {entry.averageHeartRate}</span> : null}
                  {entry.painNotes ? <small>Beschwerden: {entry.painNotes}</small> : null}
                  {entry.notes ? <small>{entry.notes}</small> : null}
                </div>
                <b>{entry.trainingRating}/10</b>
              </article>
            );
          })
        ) : (
          <p className="empty-state">Noch keine Journal-Einträge gespeichert.</p>
        )}
      </div>
    </section>
  );
}
