import type { TrainingJournalEntry, TrainingSession } from "../domain/types";

type TrainingJournalViewProps = {
  journal: TrainingJournalEntry[];
  sessions: TrainingSession[];
};

export function TrainingJournalView({ journal, sessions }: TrainingJournalViewProps) {
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  const sortedJournal = [...journal].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="section-block segment-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reflexion</p>
          <h3>Journal</h3>
        </div>
      </div>

      <div className="result-list">
        {sortedJournal.length > 0 ? (
          sortedJournal.map((entry) => {
            const session = sessionsById.get(entry.trainingId);

            return (
              <article className="result-row" key={entry.id}>
                <div>
                  <strong>{session?.focus || session?.type || "Training"}</strong>
                  <span>{new Date(entry.date).toLocaleDateString("de-DE")}</span>
                  {entry.notes ? <small>{entry.notes}</small> : null}
                </div>
                <b>{entry.trainingRating}/10</b>
              </article>
            );
          })
        ) : (
          <p className="empty-state">Noch keine Journal-Eintraege gespeichert.</p>
        )}
      </div>
    </section>
  );
}
