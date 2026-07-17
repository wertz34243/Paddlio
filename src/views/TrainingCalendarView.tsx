import { useMemo, useState } from "react";
import {
  addCalendarDays,
  formatLocalDateOnly,
  getLocalWeekdayLabel,
  getTodayKey,
  isDoneStatus,
  isSkippedStatus,
  parseLocalDateOnly,
  planStatusLabels,
  sortPlanEntries,
  weekdays,
} from "../domain/trainingPlan";
import type { PlanEntry, PlanStatus, TrainingJournalEntry } from "../domain/types";

type CalendarMode = "month" | "week" | "day";

type TrainingCalendarViewProps = {
  entries: PlanEntry[];
  journal: TrainingJournalEntry[];
  onOpenPlan: () => void;
  onOpenJournal: () => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
};

const monthLabel = (dateKey: string): string =>
  parseLocalDateOnly(dateKey).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

const shortDateLabel = (dateKey: string): string =>
  parseLocalDateOnly(dateKey).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });

const dayNumber = (dateKey: string): string => String(parseLocalDateOnly(dateKey).getDate());

const getMonthGrid = (dateKey: string): string[] => {
  const base = parseLocalDateOnly(dateKey);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const firstWeekday = first.getDay() || 7;
  const cursor = new Date(first);
  cursor.setDate(first.getDate() - firstWeekday + 1);

  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + index);
    return formatLocalDateOnly(next);
  });
};

const getWeekGrid = (dateKey: string): string[] => {
  const current = parseLocalDateOnly(dateKey);
  const weekday = current.getDay() || 7;
  current.setDate(current.getDate() - weekday + 1);
  return weekdays.map((_, index) => addCalendarDays(formatLocalDateOnly(current), index));
};

const statusClass = (entry: PlanEntry): string =>
  isSkippedStatus(entry.status) ? "skipped" : isDoneStatus(entry.status) ? "done" : entry.status === "cancelled" ? "cancelled" : "planned";

export function TrainingCalendarView({
  entries,
  journal,
  onOpenPlan,
  onOpenJournal,
  onStatusChange,
}: TrainingCalendarViewProps) {
  const today = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<CalendarMode>("month");

  const sortedEntries = useMemo(() => sortPlanEntries(entries), [entries]);
  const journalByPlan = useMemo(
    () => new Map(journal.filter((entry) => entry.trainingPlanEntryId).map((entry) => [entry.trainingPlanEntryId, entry])),
    [journal],
  );
  const entriesByDate = useMemo(() => {
    const grouped = new Map<string, PlanEntry[]>();
    sortedEntries.forEach((entry) => {
      const list = grouped.get(entry.date) ?? [];
      list.push(entry);
      grouped.set(entry.date, list);
    });
    return grouped;
  }, [sortedEntries]);

  const selectedEntries = entriesByDate.get(selectedDate) ?? [];
  const monthDays = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekGrid(selectedDate), [selectedDate]);
  const selectedMonth = parseLocalDateOnly(selectedDate).getMonth();

  const moveMonth = (direction: -1 | 1) => {
    const date = parseLocalDateOnly(selectedDate);
    date.setMonth(date.getMonth() + direction);
    setSelectedDate(formatLocalDateOnly(date));
  };

  const moveDay = (direction: -1 | 1) => setSelectedDate(addCalendarDays(selectedDate, direction));

  return (
    <div className="stack training-calendar-page">
      <section className="section-block training-calendar-hero">
        <div>
          <p className="eyebrow">Trainingskalender</p>
          <h2>{monthLabel(selectedDate)}</h2>
          <p className="card-note">
            Plane, öffne und prüfe Einheiten in einer eigenen Kalenderansicht. Datum bleibt lokal und wird nicht per UTC verschoben.
          </p>
        </div>
        <div className="calendar-mode-control" role="tablist" aria-label="Kalenderansicht">
          {(["month", "week", "day"] as CalendarMode[]).map((item) => (
            <button
              key={item}
              type="button"
              className={mode === item ? "active" : ""}
              onClick={() => setMode(item)}
              aria-selected={mode === item}
              role="tab"
            >
              {item === "month" ? "Monat" : item === "week" ? "Woche" : "Tag"}
            </button>
          ))}
        </div>
      </section>

      <section className="section-block training-calendar-controls">
        <button type="button" className="ghost-button" onClick={() => moveMonth(-1)} aria-label="Vorherigen Monat anzeigen">
          Zurück
        </button>
        <button type="button" className="secondary-button" onClick={() => setSelectedDate(today)} aria-label="Heute im Kalender anzeigen">
          Heute
        </button>
        <button type="button" className="ghost-button" onClick={() => moveMonth(1)} aria-label="Nächsten Monat anzeigen">
          Weiter
        </button>
      </section>

      {mode === "month" ? (
        <section className="training-calendar-month" aria-label="Monatskalender">
          {weekdays.map((day) => (
            <span className="calendar-weekday" key={day}>{day.slice(0, 2)}</span>
          ))}
          {monthDays.map((dateKey) => {
            const dayEntries = entriesByDate.get(dateKey) ?? [];
            const isCurrentMonth = parseLocalDateOnly(dateKey).getMonth() === selectedMonth;
            return (
              <button
                type="button"
                key={dateKey}
                className={[
                  "training-calendar-day",
                  dateKey === selectedDate ? "selected" : "",
                  dateKey === today ? "today" : "",
                  !isCurrentMonth ? "muted" : "",
                  dayEntries.length > 0 ? "has-entry" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setSelectedDate(dateKey)}
                aria-label={`${getLocalWeekdayLabel(dateKey)}, ${shortDateLabel(dateKey)} mit ${dayEntries.length} Trainingseinheiten öffnen`}
              >
                <strong>{dayNumber(dateKey)}</strong>
                <span>{dayEntries.length ? `${dayEntries.length} Einh.` : ""}</span>
                <small>{dayEntries.slice(0, 3).map((entry) => <i key={entry.id} className={`dot ${statusClass(entry)}`} />)}</small>
              </button>
            );
          })}
        </section>
      ) : null}

      {mode === "week" ? (
        <section className="training-calendar-week" aria-label="Wochenkalender">
          {weekDays.map((dateKey) => (
            <button
              type="button"
              key={dateKey}
              className={dateKey === selectedDate ? "training-calendar-weekday selected" : "training-calendar-weekday"}
              onClick={() => setSelectedDate(dateKey)}
            >
              <span>{getLocalWeekdayLabel(dateKey).slice(0, 2)}</span>
              <strong>{dayNumber(dateKey)}</strong>
              <small>{entriesByDate.get(dateKey)?.length ?? 0}</small>
            </button>
          ))}
        </section>
      ) : null}

      {mode === "day" ? (
        <section className="section-block training-calendar-controls">
          <button type="button" className="ghost-button" onClick={() => moveDay(-1)} aria-label="Vorherigen Tag anzeigen">Vorheriger Tag</button>
          <strong>{getLocalWeekdayLabel(selectedDate)}, {shortDateLabel(selectedDate)}</strong>
          <button type="button" className="ghost-button" onClick={() => moveDay(1)} aria-label="Nächsten Tag anzeigen">Nächster Tag</button>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{getLocalWeekdayLabel(selectedDate)}, {shortDateLabel(selectedDate)}</p>
            <h3>{selectedEntries.length ? `${selectedEntries.length} Einheiten` : "Keine Einheit geplant"}</h3>
          </div>
          <button type="button" className="primary-button" onClick={onOpenPlan} aria-label="Neue Trainingseinheit im Plan erstellen">
            Planen
          </button>
        </div>

        <div className="training-calendar-agenda">
          {selectedEntries.length ? selectedEntries.map((entry) => {
            const linkedJournal = journalByPlan.get(entry.id);
            return (
              <article className={`calendar-training-card status-${statusClass(entry)}`} key={entry.id}>
                <div className="calendar-training-card-head">
                  <div>
                    <strong>{entry.title || entry.trainingType}</strong>
                    <span>{entry.startTime || entry.time || "Uhrzeit offen"} · {entry.durationMinutes} min · {entry.boatClass}</span>
                  </div>
                  <b>{linkedJournal ? "Journal" : planStatusLabels[entry.status] ?? "Geplant"}</b>
                </div>
                <p>{entry.goal || entry.focus || entry.description || "Kein Trainingsziel hinterlegt."}</p>
                <div className="card-actions">
                  <button type="button" className="edit-button" onClick={onOpenPlan} aria-label={`Training ${entry.title || entry.trainingType} im Plan öffnen`}>
                    Plan öffnen
                  </button>
                  {linkedJournal ? (
                    <button type="button" onClick={onOpenJournal} aria-label={`Journal zu ${entry.title || entry.trainingType} öffnen`}>
                      Journal öffnen
                    </button>
                  ) : (
                    <>
                      <button type="button" className="save-button" onClick={() => onStatusChange(entry.id, "completed")} aria-label={`${entry.title || entry.trainingType} als durchgeführt markieren`}>
                        Durchgeführt
                      </button>
                      <button type="button" onClick={() => onStatusChange(entry.id, "skipped")} aria-label={`${entry.title || entry.trainingType} als übersprungen markieren`}>
                        Übersprungen
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          }) : (
            <article className="empty-state action-empty">
              <strong>Für diesen Tag ist nichts geplant.</strong>
              <span>Erstelle eine neue Einheit oder dokumentiere später ein freies Training im Journal.</span>
              <div className="inline-actions">
                <button type="button" className="save-button" onClick={onOpenPlan}>Einheit planen</button>
                <button type="button" onClick={onOpenJournal}>Journal öffnen</button>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
