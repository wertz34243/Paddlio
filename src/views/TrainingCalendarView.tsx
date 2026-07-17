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

type CalendarMode = "month" | "week" | "day" | "periodization";

type PeriodizationMonth = {
  key: string;
  label: string;
  phase: string;
  focus: string;
  minutes: number;
  hardUnits: number;
  entries: number;
  loadPercent: number;
};

type TrainingPrinciple = {
  code: string;
  title: string;
  target: string;
  use: string;
  weeks: string;
};

const trainingPrinciples: TrainingPrinciple[] = [
  {
    code: "KB",
    title: "Koordination & Beweglichkeit",
    target: "Regeneration, Beweglichkeit, Techniksauberkeit",
    use: "Sehr lockere Einheiten, Mobility, Technik ohne Druck.",
    weeks: "< 2",
  },
  {
    code: "GA1",
    title: "Grundlagenausdauer",
    target: "Aerobe Basis und ruhige Belastbarkeit",
    use: "Längere lockere Einheiten, saubere Technik, niedrige Intensität.",
    weeks: "6-8",
  },
  {
    code: "GA2",
    title: "Aerobe Kapazität",
    target: "Tempoausdauer und kontrollierte Belastung",
    use: "Intensivere Intervalle, längere Serien, Technik unter Last.",
    weeks: "6",
  },
  {
    code: "WA",
    title: "Wettkampfausdauer",
    target: "Rennhärte, Taktik, Ermüdungsresistenz",
    use: "Wettkampfähnliche Serien, Pausen, Simulationen.",
    weeks: "4",
  },
  {
    code: "SA",
    title: "Schnelligkeitsausdauer",
    target: "Belastungsspitzen und Starts unter Druck",
    use: "15-45 Sekunden hochintensiv, klare Erholungspausen.",
    weeks: "4",
  },
  {
    code: "S",
    title: "Schnelligkeit",
    target: "Maximale Geschwindigkeit und Reaktion",
    use: "Kurze Sprints, Startimpulse, viel Erholung.",
    weeks: "4",
  },
  {
    code: "Kaus",
    title: "Kraftausdauer",
    target: "Druck halten, Wiederholungen stabil fahren",
    use: "Zirkel, Wiederholungen, längere Serien.",
    weeks: "6",
  },
  {
    code: "HT",
    title: "Hypertrophie / Basis-Kraft",
    target: "Kraftbasis und Belastbarkeit",
    use: "8-12 Wiederholungen, 70-90 Sekunden Serien.",
    weeks: "6-12",
  },
  {
    code: "IK",
    title: "Maximalkraft",
    target: "Hohe Kraftspitzen und Ansteuerung",
    use: "Hohe Lasten, wenige Wiederholungen, lange Pausen.",
    weeks: "3-6",
  },
  {
    code: "Fs",
    title: "Explosivkraft",
    target: "Startkraft und dynamische Impulse",
    use: "Explosive Übungen, Sprünge, Starts, kurze Serien.",
    weeks: "2-4",
  },
];

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

const monthShortLabel = (monthIndex: number): string =>
  new Date(2026, monthIndex, 1).toLocaleDateString("de-DE", { month: "short" });

const phaseForMonth = (monthIndex: number): Pick<PeriodizationMonth, "phase" | "focus"> => {
  if ([10, 11, 0].includes(monthIndex)) {
    return { phase: "Grundlage", focus: "GA1, Technik, Kraftbasis" };
  }
  if ([1, 2].includes(monthIndex)) {
    return { phase: "Aufbau", focus: "GA2, Kraft, Technik unter Last" };
  }
  if ([3, 4].includes(monthIndex)) {
    return { phase: "Vorbereitung", focus: "WA, SA, Wettkampfsimulation" };
  }
  if ([5, 6, 7].includes(monthIndex)) {
    return { phase: "Wettkampf", focus: "Rennen, Tapering, Erholung" };
  }
  if (monthIndex === 8) {
    return { phase: "Saisonfinale", focus: "Form halten, Belastung dosieren" };
  }
  return { phase: "Übergang", focus: "Regeneration, Technik, Material" };
};

const intensityFactor = (entry: PlanEntry): number => {
  if (entry.intensity === "maximal") return 1.3;
  if (entry.intensity === "hart") return 1.15;
  if (entry.intensity === "mittel") return 1;
  return 0.75;
};

const buildPeriodizationMonths = (entries: PlanEntry[], selectedDate: string): PeriodizationMonth[] => {
  const year = parseLocalDateOnly(selectedDate).getFullYear();
  const months = Array.from({ length: 12 }, (_, monthIndex) => {
    const { phase, focus } = phaseForMonth(monthIndex);
    const monthEntries = entries.filter((entry) => {
      const date = parseLocalDateOnly(entry.date);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    });
    const minutes = monthEntries.reduce((sum, entry) => sum + Math.max(0, entry.durationMinutes || 0), 0);
    const hardUnits = monthEntries.filter((entry) => entry.intensity === "hart" || entry.intensity === "maximal").length;
    return {
      key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      label: monthShortLabel(monthIndex),
      phase,
      focus,
      minutes,
      hardUnits,
      entries: monthEntries.length,
      loadPercent: 0,
    };
  });

  const maxLoad = Math.max(
    1,
    ...months.map((month) => {
      const matchingEntries = entries.filter((entry) => entry.date.startsWith(month.key));
      return matchingEntries.reduce((sum, entry) => sum + (entry.durationMinutes || 0) * intensityFactor(entry), 0);
    }),
  );

  return months.map((month) => {
    const matchingEntries = entries.filter((entry) => entry.date.startsWith(month.key));
    const weightedLoad = matchingEntries.reduce((sum, entry) => sum + (entry.durationMinutes || 0) * intensityFactor(entry), 0);
    const suggestedLoad = [45, 55, 65, 72, 78, 82, 75, 70, 58, 36, 48, 52][Number(month.key.slice(5, 7)) - 1];
    return {
      ...month,
      loadPercent: Math.round(weightedLoad > 0 ? (weightedLoad / maxLoad) * 100 : suggestedLoad),
    };
  });
};

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
  const periodizationMonths = useMemo(() => buildPeriodizationMonths(sortedEntries, selectedDate), [sortedEntries, selectedDate]);
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
          {(["month", "week", "day", "periodization"] as CalendarMode[]).map((item) => (
            <button
              key={item}
              type="button"
              className={mode === item ? "active" : ""}
              onClick={() => setMode(item)}
              aria-selected={mode === item}
              role="tab"
            >
              {item === "month" ? "Monat" : item === "week" ? "Woche" : item === "day" ? "Tag" : "Periodisierung"}
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

      {mode === "periodization" ? (
        <PeriodizationPanel months={periodizationMonths} entryCount={sortedEntries.length} />
      ) : null}

      {mode !== "periodization" ? (
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
      ) : null}
    </div>
  );
}

function PeriodizationPanel({ months, entryCount }: { months: PeriodizationMonth[]; entryCount: number }) {
  const highestLoad = months.reduce((current, month) => (month.loadPercent > current.loadPercent ? month : current), months[0]);
  const recoveryMonths = months.filter((month) => month.phase === "Übergang" || month.phase === "Grundlage").length;

  return (
    <section className="periodization-panel" aria-label="Periodisierung und Trainingsprinzipien">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Saisonplanung</p>
          <h3>Periodisierung</h3>
          <p className="card-note">
            Jahresüberblick für Belastungsaufbau, Erholung und Schwerpunktwechsel. Mit echten Planeinheiten gefüllt, sonst als Trainingsmodell sichtbar.
          </p>
        </div>
        <div className="periodization-summary">
          <strong>{entryCount}</strong>
          <span>geplante Einheiten</span>
        </div>
      </div>

      <div className="periodization-timeline" role="list" aria-label="Monatsphasen">
        {months.map((month) => (
          <article className={`periodization-month phase-${month.phase.toLowerCase()}`} key={month.key} role="listitem">
            <div>
              <strong>{month.label}</strong>
              <span>{month.phase}</span>
            </div>
            <div className="periodization-load-track" aria-label={`Belastung ${month.loadPercent} Prozent`}>
              <i style={{ height: `${Math.max(12, month.loadPercent)}%` }} />
            </div>
            <small>{month.entries ? `${month.entries} Einh. · ${month.minutes} min` : month.focus}</small>
          </article>
        ))}
      </div>

      <div className="periodization-insights">
        <article>
          <span>Belastung</span>
          <strong>{highestLoad?.label ?? "--"} · {highestLoad?.phase ?? "offen"}</strong>
          <small>Höchster geplanter Belastungsblock im aktuellen Kalenderjahr.</small>
        </article>
        <article>
          <span>Entlastung</span>
          <strong>{recoveryMonths} Monate</strong>
          <small>Grundlage, Übergang und Regeneration bleiben bewusst sichtbar.</small>
        </article>
        <article>
          <span>Prinzip</span>
          <strong>3:1 Aufbau</strong>
          <small>Belastung steigern, danach gezielt entlasten und Technik stabilisieren.</small>
        </article>
      </div>

      <section className="section-block periodization-principles">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trainingsprinzipien</p>
            <h3>Belastungen kombinieren</h3>
          </div>
        </div>
        <div className="principle-grid">
          {trainingPrinciples.map((principle) => (
            <article className="principle-card" key={principle.code}>
              <b>{principle.code}</b>
              <div>
                <strong>{principle.title}</strong>
                <span>{principle.target}</span>
                <small>{principle.use}</small>
              </div>
              <em>{principle.weeks} Wo.</em>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
