import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getTrainingLoad, isDateInCurrentWeek } from "../domain/metrics";
import type { TrainingJournalEntry, TrainingSession, TrainingType } from "../domain/types";

type TrainingDraft = Omit<TrainingSession, "athleteId" | "createdAt" | "updatedAt">;
type TrainingFilter = "today" | "week" | "all";

type TrainingViewProps = {
  sessions: TrainingSession[];
  journal: TrainingJournalEntry[];
  onSave: (session: Omit<TrainingSession, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onSaveJournal: (
    entry: Omit<TrainingJournalEntry, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string },
  ) => void;
  openNewSignal?: number;
  openJournalSignal?: number;
};

const trainingTypes: TrainingType[] = ["K1", "C1", "Ausdauer", "Kraft", "Technik", "Kindertraining", "Pause"];

const emptyDraft: TrainingDraft = {
  id: "",
  date: new Date().toISOString().slice(0, 10),
  type: "Technik",
  durationMinutes: 60,
  rpe: 6,
  focus: "",
  note: "",
};

const toNumber = (value: FormDataEntryValue | null): number => Number(value ?? 0);
const todayKey = (): string => new Date().toISOString().slice(0, 10);

const intensityFromRpe = (rpe: number): string => {
  if (rpe >= 9) return "maximal";
  if (rpe >= 7) return "hart";
  if (rpe >= 4) return "mittel";
  return "locker";
};

export function TrainingView({
  sessions,
  journal,
  onSave,
  onDelete,
  onSaveJournal,
  openNewSignal = 0,
  openJournalSignal = 0,
}: TrainingViewProps) {
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  const [filter, setFilter] = useState<TrainingFilter>("week");
  const [openId, setOpenId] = useState<string>("");
  const latestSession = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))[0],
    [sessions],
  );

  useEffect(() => {
    if (openNewSignal > 0) {
      setDraft({ ...emptyDraft, date: todayKey() });
    }
  }, [openNewSignal]);

  useEffect(() => {
    if (openJournalSignal > 0) {
      setFilter("all");
      if (latestSession) {
        setOpenId(latestSession.id);
      } else {
        setDraft({ ...emptyDraft, date: todayKey() });
      }
    }
  }, [latestSession, openJournalSignal]);

  const journalByTraining = useMemo(
    () => new Map(journal.map((entry) => [entry.trainingId, entry])),
    [journal],
  );

  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));

    if (filter === "today") {
      return sorted.filter((session) => session.date === todayKey());
    }

    if (filter === "week") {
      return sorted.filter((session) => isDateInCurrentWeek(session.date));
    }

    return sorted;
  }, [filter, sessions]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSave({
      id: draft?.id || undefined,
      date: String(formData.get("date")),
      type: String(formData.get("type")) as TrainingType,
      durationMinutes: toNumber(formData.get("durationMinutes")),
      rpe: toNumber(formData.get("rpe")),
      focus: String(formData.get("focus")).trim(),
      note: String(formData.get("note")).trim(),
    });

    setDraft(null);
  };

  const handleJournalSubmit = (event: FormEvent<HTMLFormElement>, session: TrainingSession) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const existing = journalByTraining.get(session.id);

    onSaveJournal({
      id: existing?.id,
      trainingId: session.id,
      date: session.date,
      trainingRating: toNumber(formData.get("trainingRating")),
      feeling: toNumber(formData.get("feeling")),
      fatigue: toNumber(formData.get("fatigue")),
      sleep: toNumber(formData.get("sleep")),
      motivation: toNumber(formData.get("motivation")),
      notes: String(formData.get("notes")).trim(),
    });
  };

  const startEdit = (session: TrainingSession) => {
    setDraft({
      id: session.id,
      date: session.date,
      type: session.type,
      durationMinutes: session.durationMinutes,
      rpe: session.rpe,
      focus: session.focus,
      note: session.note,
    });
  };

  return (
    <div className="stack">
      <section className="summary-strip">
        <div>
          <span>Einheiten</span>
          <strong>{sessions.length}</strong>
        </div>
        <div>
          <span>Belastung</span>
          <strong>{getTrainingLoad(sessions)}</strong>
        </div>
        <div>
          <span>Journal</span>
          <strong>{journal.length}</strong>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trainingstagebuch</p>
            <h3>Training</h3>
          </div>
          <button className="primary-button" type="button" onClick={() => setDraft(emptyDraft)} aria-label="Training hinzufuegen">
            +
          </button>
        </div>

        <div className="filter-tabs" aria-label="Trainingsfilter">
          {[
            ["today", "Heute"],
            ["week", "Diese Woche"],
            ["all", "Alle"],
          ].map(([id, label]) => (
            <button
              className={filter === id ? "active" : ""}
              key={id}
              type="button"
              onClick={() => setFilter(id as TrainingFilter)}
            >
              {label}
            </button>
          ))}
        </div>

        {draft ? (
          <form className="entry-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Datum
                <input name="date" type="date" defaultValue={draft.date} required />
              </label>
              <label>
                Typ
                <select name="type" defaultValue={draft.type}>
                  {trainingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dauer
                <input name="durationMinutes" type="number" min="0" step="1" defaultValue={draft.durationMinutes} />
              </label>
              <label>
                RPE 1-10
                <input name="rpe" type="number" min="1" max="10" step="1" defaultValue={draft.rpe} />
              </label>
            </div>
            <label>
              Fokus
              <input name="focus" defaultValue={draft.focus} placeholder="z. B. Linie, Start, Druck" />
            </label>
            <label>
              Notiz
              <textarea name="note" defaultValue={draft.note} rows={3} />
            </label>
            <div className="form-actions">
              <button className="save-button" type="submit">
                Speichern
              </button>
              <button className="ghost-button wide" type="button" onClick={() => setDraft(null)}>
                Abbrechen
              </button>
            </div>
          </form>
        ) : null}

        <div className="fitness-list">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => {
              const isOpen = openId === session.id;
              const intensity = intensityFromRpe(session.rpe);
              const journalEntry = journalByTraining.get(session.id);

              return (
                <article className={`fitness-card type-${session.type.toLowerCase()}`} key={session.id}>
                  <button className="fitness-card-main" type="button" onClick={() => setOpenId(isOpen ? "" : session.id)}>
                    <span className="activity-ring">{session.durationMinutes}</span>
                    <div>
                      <strong>{session.type}</strong>
                      <small>{new Date(session.date).toLocaleDateString("de-DE")}</small>
                      <p>{session.focus || "Ohne Fokus"}</p>
                    </div>
                    <b>{journalEntry ? "reflektiert" : intensity}</b>
                  </button>

                  {isOpen ? (
                    <div className="fitness-details">
                      <div className="split-grid">
                        <div>
                          <span>Beschreibung</span>
                          <b>{session.type}</b>
                        </div>
                        <div>
                          <span>Ziel</span>
                          <b>{session.focus || "--"}</b>
                        </div>
                        <div>
                          <span>Dauer</span>
                          <b>{session.durationMinutes} min</b>
                        </div>
                        <div>
                          <span>Intensität</span>
                          <b>{intensity}</b>
                        </div>
                        <div>
                          <span>Status</span>
                          <b>dokumentiert</b>
                        </div>
                        <div>
                          <span>RPE</span>
                          <b>{session.rpe}/10</b>
                        </div>
                      </div>

                      <form className="journal-form" onSubmit={(event) => handleJournalSubmit(event, session)}>
                        <p className="eyebrow">Persänliches Journal</p>
                        <div className="form-grid">
                          <label>
                            Wie war das Training?
                            <input name="trainingRating" type="number" min="1" max="10" defaultValue={journalEntry?.trainingRating ?? 7} />
                          </label>
                          <label>
                            Wie fuehlst du dich?
                            <input name="feeling" type="number" min="1" max="10" defaultValue={journalEntry?.feeling ?? 7} />
                          </label>
                          <label>
                            Wie muede bist du?
                            <input name="fatigue" type="number" min="1" max="10" defaultValue={journalEntry?.fatigue ?? 4} />
                          </label>
                          <label>
                            Wie war dein Schlaf?
                            <input name="sleep" type="number" min="1" max="10" defaultValue={journalEntry?.sleep ?? 7} />
                          </label>
                          <label>
                            Motivation
                            <input name="motivation" type="number" min="1" max="10" defaultValue={journalEntry?.motivation ?? 7} />
                          </label>
                        </div>
                        <label>
                          Notizen
                          <textarea name="notes" rows={2} defaultValue={journalEntry?.notes ?? ""} />
                        </label>
                        <button className="save-button" type="submit">
                          Journal speichern
                        </button>
                      </form>

                      <p className="card-note">{session.note || "Keine Notiz gespeichert."}</p>
                      <div className="card-actions">
                        <button className="edit-button" type="button" onClick={() => startEdit(session)}>
                          Bearbeiten
                        </button>
                        <button className="delete-button" type="button" onClick={() => onDelete(session.id)}>
                          Loeschen
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <p className="empty-state">Keine Einheiten fär diesen Filter.</p>
          )}
        </div>
      </section>
    </div>
  );
}
