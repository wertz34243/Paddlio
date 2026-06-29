import { useMemo, useState, type FormEvent } from "react";
import {
  getWeekdayFromDate,
  planStatuses,
  sortPlanEntries,
  trainingAreas,
  trainingIntensities,
  trainingTypeGroups,
  weekdays,
} from "../domain/trainingPlan";
import type {
  PlanEntry,
  PlanStatus,
  TrainingArea,
  TrainingIntensity,
  TrainingPlanType,
  Weekday,
} from "../domain/types";

type PlanDraft = Omit<PlanEntry, "athleteId" | "createdAt" | "updatedAt" | "createdByUserId" | "assignedAthleteId">;

type PlanViewProps = {
  entries: PlanEntry[];
  onSave: (entry: Omit<PlanEntry, "id" | "athleteId" | "createdAt" | "updatedAt" | "createdByUserId" | "assignedAthleteId"> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
};

const statusLabel: Record<PlanStatus, string> = {
  geplant: "Geplant",
  erledigt: "Erledigt",
  ausgelassen: "Ausgelassen",
};

const intensityLabel: Record<TrainingIntensity, string> = {
  locker: "Locker",
  mittel: "Mittel",
  hart: "Hart",
  maximal: "Maximal",
};

const today = new Date().toISOString().slice(0, 10);

const emptyDraft: PlanDraft = {
  id: "",
  date: today,
  weekday: getWeekdayFromDate(today),
  time: "17:30",
  durationMinutes: 75,
  area: "Wassertraining",
  trainingType: "K1 Technik",
  goal: "",
  intensity: "mittel",
  note: "",
  status: "geplant",
  assignedGroupId: "",
  feedbackNote: "",
};

const toNumber = (value: FormDataEntryValue | null): number => Number(value ?? 0);

export function PlanView({ entries, onSave, onDelete, onToggleDone }: PlanViewProps) {
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [selectedArea, setSelectedArea] = useState<TrainingArea>("Wassertraining");
  const [selectedDate, setSelectedDate] = useState(today);

  const sortedEntries = useMemo(() => sortPlanEntries(entries), [entries]);

  const startCreate = () => {
    setSelectedArea(emptyDraft.area);
    setSelectedDate(emptyDraft.date);
    setDraft(emptyDraft);
  };

  const startEdit = (entry: PlanEntry) => {
    setSelectedArea(entry.area);
    setSelectedDate(entry.date);
    setDraft({
      id: entry.id,
      date: entry.date,
      weekday: entry.weekday,
      time: entry.time,
      durationMinutes: entry.durationMinutes,
      area: entry.area,
      trainingType: entry.trainingType,
      goal: entry.goal,
      intensity: entry.intensity,
      note: entry.note,
      status: entry.status,
      assignedGroupId: entry.assignedGroupId,
      feedbackNote: entry.feedbackNote,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const date = String(formData.get("date"));
    const area = String(formData.get("area")) as TrainingArea;

    onSave({
      id: draft?.id || undefined,
      date,
      weekday: getWeekdayFromDate(date),
      time: String(formData.get("time")),
      durationMinutes: toNumber(formData.get("durationMinutes")),
      area,
      trainingType: String(formData.get("trainingType")) as TrainingPlanType,
      goal: String(formData.get("goal")).trim(),
      intensity: String(formData.get("intensity")) as TrainingIntensity,
      note: String(formData.get("note")).trim(),
      status: String(formData.get("status")) as PlanStatus,
      assignedGroupId: String(formData.get("assignedGroupId")).trim(),
      feedbackNote: "",
    });

    setDraft(null);
  };

  const completedCount = entries.filter((entry) => entry.status === "erledigt").length;
  const skippedCount = entries.filter((entry) => entry.status === "ausgelassen").length;

  return (
    <div className="stack">
      <section className="summary-strip">
        <div>
          <span>Einheiten</span>
          <strong>{entries.length}</strong>
        </div>
        <div>
          <span>Erledigt</span>
          <strong>{completedCount}</strong>
        </div>
        <div>
          <span>Ausgelassen</span>
          <strong>{skippedCount}</strong>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trainingsplan</p>
            <h3>Wochenuebersicht</h3>
          </div>
          <button className="primary-button" type="button" onClick={startCreate}>
            +
          </button>
        </div>

        {draft ? (
          <form className="entry-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Datum
                <input
                  name="date"
                  type="date"
                  defaultValue={draft.date}
                  onChange={(event) => setSelectedDate(event.currentTarget.value)}
                  required
                />
              </label>
              <label>
                Wochentag
                <input value={getWeekdayFromDate(selectedDate)} readOnly />
              </label>
              <label>
                Uhrzeit
                <input name="time" type="time" defaultValue={draft.time} />
              </label>
              <label>
                Dauer
                <input name="durationMinutes" type="number" min="0" step="5" defaultValue={draft.durationMinutes} />
              </label>
              <label>
                Trainingsbereich
                <select
                  name="area"
                  defaultValue={draft.area}
                  onChange={(event) => setSelectedArea(event.currentTarget.value as TrainingArea)}
                >
                  {trainingAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Trainingsart
                <select name="trainingType" defaultValue={draft.trainingType}>
                  {trainingTypeGroups[selectedArea].map((trainingType) => (
                    <option key={trainingType} value={trainingType}>
                      {trainingType}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Intensitaet
                <select name="intensity" defaultValue={draft.intensity}>
                  {trainingIntensities.map((intensity) => (
                    <option key={intensity} value={intensity}>
                      {intensityLabel[intensity]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={draft.status}>
                  {planStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Trainingsziel
              <input name="goal" defaultValue={draft.goal} placeholder="z. B. Tor 6 sauber anfahren" />
            </label>
            <label>
              Notiz
              <textarea name="note" defaultValue={draft.note} rows={3} />
            </label>
            <label>
              Gruppe
              <input name="assignedGroupId" defaultValue={draft.assignedGroupId} placeholder="Optional fuer spaetere Trainerfunktion" />
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

        <div className="plan-week">
          {weekdays.map((weekday) => {
            const dayEntries = sortedEntries.filter((entry) => entry.weekday === weekday);

            return (
              <article className="plan-day" key={weekday}>
                <div className="plan-day-heading">
                  <strong>{weekday}</strong>
                  <span>{dayEntries.length || "frei"}</span>
                </div>
                <div className="plan-entry-list">
                  {dayEntries.length > 0 ? (
                    dayEntries.map((entry) => (
                      <div className={`plan-card ${entry.status} area-${entry.area.toLowerCase()}`} key={entry.id}>
                        <div className="plan-card-head">
                          <div>
                            <span>
                              {entry.date} - {entry.time || "--:--"} - {entry.durationMinutes} min
                            </span>
                            <h4>{entry.trainingType}</h4>
                          </div>
                          <b className={`status-pill ${entry.status}`}>{statusLabel[entry.status]}</b>
                        </div>
                        <div className="tag-row">
                          <small>{entry.area}</small>
                          <small>{intensityLabel[entry.intensity]}</small>
                        </div>
                        <p>{entry.goal || entry.note || "Noch kein Ziel eingetragen."}</p>
                        <div className="card-actions full-width">
                          <button className="save-button" type="button" onClick={() => onToggleDone(entry.id)}>
                            {entry.status === "erledigt" ? "Wieder geplant" : "Erledigt"}
                          </button>
                          <button
                            className="delete-button"
                            type="button"
                            onClick={() =>
                              onSave({
                                id: entry.id,
                                date: entry.date,
                                weekday: entry.weekday,
                                time: entry.time,
                                durationMinutes: entry.durationMinutes,
                                area: entry.area,
                                trainingType: entry.trainingType,
                                goal: entry.goal,
                                intensity: entry.intensity,
                                note: entry.note,
                                status: "ausgelassen",
                                assignedGroupId: entry.assignedGroupId,
                                feedbackNote: entry.feedbackNote,
                              })
                            }
                          >
                            Ausgelassen
                          </button>
                          <button className="edit-button" type="button" onClick={() => startEdit(entry)}>
                            Bearbeiten
                          </button>
                          <button className="delete-button" type="button" onClick={() => onDelete(entry.id)}>
                            Loeschen
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state compact">Kein Training geplant.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
