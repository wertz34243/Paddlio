import { useEffect, useMemo, useState, type DragEvent } from "react";
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
import { createCalendarQuickTemplates, seasonPlanningBlocks, weeklyPlanningTemplates } from "../features/training/templates/planningBlocks";
import { createPeriodizationTemplates } from "../features/training/templates/trainingTemplates";
import type { PlanEntry, PlanStatus, TrainingJournalEntry, TrainingTemplate } from "../domain/types";
import type { DeviceClass } from "../lib/deviceCapabilities";
import {
  PaddlioOneButton,
  PaddlioOneCard,
  PaddlioOneMetricCard,
  PaddlioOnePageHeader,
  PaddlioOneStatusChip,
  PaddlioOneToolbar,
} from "../components/paddlio-one/PaddlioOneComponents";

type CalendarMode = "month" | "week" | "day" | "periodization";

type TrainingCalendarViewProps = {
  entries: PlanEntry[];
  journal: TrainingJournalEntry[];
  templates?: TrainingTemplate[];
  clubId?: string;
  onOpenPlan: () => void;
  onOpenJournal: () => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onTemplateInsert?: (template: TrainingTemplate, date: string) => void;
  deviceClass?: DeviceClass;
};

const modeLabels: Record<CalendarMode, string> = {
  day: "Tag",
  week: "Woche",
  month: "Monat",
  periodization: "Jahr",
};

const categoryTone = (value?: string): "primary" | "success" | "warning" | "danger" | "info" | "muted" => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("wett")) return "danger";
  if (normalized.includes("kraft")) return "warning";
  if (normalized.includes("technik") || normalized.includes("slalom")) return "info";
  if (normalized.includes("regen") || normalized.includes("mobility")) return "muted";
  return "success";
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
  const firstOfMonth = new Date(base.getFullYear(), base.getMonth(), 1);
  const offset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(formatLocalDateOnly(start), index));
};

const getWeekDays = (dateKey: string): string[] => {
  const base = parseLocalDateOnly(dateKey);
  const mondayOffset = base.getDay() === 0 ? -6 : 1 - base.getDay();
  const monday = addCalendarDays(formatLocalDateOnly(base), mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(monday, index));
};

const getPeriodizationMonths = (entries: PlanEntry[]): Array<{
  key: string;
  label: string;
  phase: string;
  focus: string;
  minutes: number;
  entries: number;
  loadPercent: number;
}> => {
  const currentYear = new Date().getFullYear();
  const phaseNames = [
    "Grundlagen",
    "Aufbau",
    "Technik",
    "Wettkampfvorbereitung",
    "Wettkampf",
    "Regeneration",
  ];

  const months = Array.from({ length: 12 }, (_, month) => {
    const monthEntries = entries.filter((entry) => {
      const date = parseLocalDateOnly(entry.date);
      return date.getFullYear() === currentYear && date.getMonth() === month;
    });
    const minutes = monthEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
    const phase = phaseNames[Math.min(phaseNames.length - 1, Math.floor(month / 2))];
    return {
      key: `${currentYear}-${String(month + 1).padStart(2, "0")}`,
      label: new Date(currentYear, month, 1).toLocaleDateString("de-DE", { month: "short" }),
      phase,
      focus: monthEntries[0]?.area || phase,
      minutes,
      entries: monthEntries.length,
      loadPercent: Math.min(100, Math.round((minutes / 900) * 100)),
    };
  });

  return months;
};

function groupByDate(entries: PlanEntry[]): Map<string, PlanEntry[]> {
  const grouped = new Map<string, PlanEntry[]>();
  sortPlanEntries(entries).forEach((entry) => {
    const items = grouped.get(entry.date) ?? [];
    items.push(entry);
    grouped.set(entry.date, items);
  });
  return grouped;
}

export function TrainingCalendarView({
  entries,
  journal,
  templates,
  clubId,
  onOpenPlan,
  onOpenJournal,
  onStatusChange,
  onTemplateInsert,
  deviceClass = "desktop",
}: TrainingCalendarViewProps) {
  const isPhone = deviceClass === "phone";
  const templateClubId = clubId ?? "paddlio-system";
  const [mode, setMode] = useState<CalendarMode>(isPhone ? "day" : "week");
  const [focusDate, setFocusDate] = useState(getTodayKey());
  const [dragTemplateId, setDragTemplateId] = useState<string | null>(null);

  const availableModes: CalendarMode[] = isPhone ? ["day", "week", "month"] : ["day", "week", "month", "periodization"];

  useEffect(() => {
    if (!availableModes.includes(mode)) {
      setMode(availableModes[0]);
    }
  }, [availableModes, mode]);

  const groupedEntries = useMemo(() => groupByDate(entries), [entries]);
  const calendarTemplates = useMemo(
    () => [...(templates ?? []), ...createCalendarQuickTemplates(templateClubId)].slice(0, 18),
    [templates, templateClubId],
  );
  const periodizationTemplates = useMemo(() => createPeriodizationTemplates(templateClubId), [templateClubId]);
  const monthDays = useMemo(() => getMonthGrid(focusDate), [focusDate]);
  const weekDays = useMemo(() => getWeekDays(focusDate), [focusDate]);
  const dayEntries = groupedEntries.get(focusDate) ?? [];
  const weekEntries = weekDays.flatMap((day) => groupedEntries.get(day) ?? []);
  const periodizationMonths = useMemo(() => getPeriodizationMonths(entries), [entries]);
  const completedJournal = journal.length;

  const move = (direction: -1 | 1) => {
    const amount = mode === "month" ? direction * 30 : mode === "week" ? direction * 7 : direction;
    setFocusDate(addCalendarDays(focusDate, amount));
  };

  const handleTemplateDrop = (date: string) => {
    if (!dragTemplateId || !onTemplateInsert) return;
    const template = calendarTemplates.find((item) => item.id === dragTemplateId);
    if (template) {
      onTemplateInsert(template, date);
    }
    setDragTemplateId(null);
  };

  const handleDragOver = (event: DragEvent) => {
    if (dragTemplateId) {
      event.preventDefault();
    }
  };

  return (
    <div className={`po-calendar-workspace po-calendar-${deviceClass}`}>
      <main className="po-calendar-main">
        <PaddlioOnePageHeader
          eyebrow="Kalender"
          title={mode === "periodization" ? "Saisonplanung" : monthLabel(focusDate)}
          description="Planen, verschieben und Vorlagen direkt in den Trainingskalender legen."
          action={
            <PaddlioOneButton variant="primary" icon="training" onClick={onOpenPlan}>
              Training hinzufügen
            </PaddlioOneButton>
          }
        />

        <PaddlioOneToolbar className="po-calendar-toolbar">
          <div className="po-calendar-toolbar-group">
            <PaddlioOneButton variant="ghost" onClick={() => move(-1)} aria-label="Vorheriger Zeitraum">Zurück</PaddlioOneButton>
            <PaddlioOneButton variant="secondary" icon="calendar" onClick={() => setFocusDate(getTodayKey())}>Heute</PaddlioOneButton>
            <PaddlioOneButton variant="ghost" onClick={() => move(1)} aria-label="Nächster Zeitraum">Weiter</PaddlioOneButton>
          </div>
          <div className="po-segmented-control" aria-label="Kalenderansicht">
            {availableModes.map((item) => (
              <button className={mode === item ? "is-active" : ""} key={item} type="button" onClick={() => setMode(item)}>
                {modeLabels[item]}
              </button>
            ))}
          </div>
          <PaddlioOneButton variant="secondary" icon="message" onClick={onOpenJournal}>
            Journal
          </PaddlioOneButton>
        </PaddlioOneToolbar>

        <section className="po-calendar-stats">
          <PaddlioOneMetricCard label="Woche" value={weekEntries.length} detail="Einheiten" icon="calendar" tone="primary" />
          <PaddlioOneMetricCard
            label="Minuten"
            value={weekEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)}
            detail="geplant"
            icon="timer"
          />
          <PaddlioOneMetricCard label="Journal" value={completedJournal} detail="Einträge" icon="message" tone="success" />
        </section>

        {mode === "month" ? (
          <MonthCalendar days={monthDays} groupedEntries={groupedEntries} focusDate={focusDate} onSelectDate={setFocusDate} onDrop={handleTemplateDrop} onDragOver={handleDragOver} />
        ) : null}

        {mode === "week" ? (
          <WeekCalendar days={weekDays} groupedEntries={groupedEntries} onStatusChange={onStatusChange} onDrop={handleTemplateDrop} onDragOver={handleDragOver} />
        ) : null}

        {mode === "day" ? (
          <DayCalendar date={focusDate} entries={dayEntries} onStatusChange={onStatusChange} onDrop={handleTemplateDrop} onDragOver={handleDragOver} />
        ) : null}

        {mode === "periodization" ? (
          <PeriodizationCalendar months={periodizationMonths} templates={periodizationTemplates} />
        ) : null}

        <PaddlioOneCard className="po-week-plan-strip">
          <div className="po-card-heading-row">
            <div>
              <p className="po-eyebrow">Wochenplan</p>
              <h2>Planbare Einheiten</h2>
            </div>
            <PaddlioOneStatusChip tone="info">{weekEntries.length} Einheiten</PaddlioOneStatusChip>
          </div>
          <div className="po-week-plan-list">
            {weekEntries.slice(0, 8).map((entry) => (
              <button className="po-week-row" key={entry.id} type="button" onClick={onOpenPlan}>
                <strong>{getLocalWeekdayLabel(entry.date).slice(0, 2)}</strong>
                <span>{entry.title || entry.trainingType}</span>
                <em>{entry.startTime || entry.time || "--"}</em>
              </button>
            ))}
            {weekEntries.length === 0 ? <p className="po-muted">Diese Woche ist noch frei. Ziehe eine Vorlage in den Kalender.</p> : null}
          </div>
        </PaddlioOneCard>
      </main>

      {!isPhone ? (
        <CalendarTemplateRail templates={calendarTemplates} onDragStart={setDragTemplateId} onOpenPlan={onOpenPlan} />
      ) : (
        <PaddlioOneCard className="po-phone-template-picker">
          <div className="po-card-heading-row">
            <div>
              <p className="po-eyebrow">Vorlagen</p>
              <h2>Schnell einfügen</h2>
            </div>
          </div>
          <div className="po-template-compact-list">
            {calendarTemplates.slice(0, 5).map((template) => (
              <button key={template.id} type="button" onClick={() => onTemplateInsert?.(template, focusDate)}>
                <span>{template.title}</span>
                <em>{template.defaultDurationMinutes ?? 60} min</em>
              </button>
            ))}
          </div>
        </PaddlioOneCard>
      )}
    </div>
  );
}

function MonthCalendar({
  days,
  groupedEntries,
  focusDate,
  onSelectDate,
  onDrop,
  onDragOver,
}: {
  days: string[];
  groupedEntries: Map<string, PlanEntry[]>;
  focusDate: string;
  onSelectDate: (date: string) => void;
  onDrop: (date: string) => void;
  onDragOver: (event: DragEvent) => void;
}) {
  const focusMonth = parseLocalDateOnly(focusDate).getMonth();

  return (
    <PaddlioOneCard className="po-calendar-card">
      <div className="po-calendar-grid-head">
        {weekdays.map((day) => <span key={day}>{day.slice(0, 2)}</span>)}
      </div>
      <div className="po-calendar-month-grid">
        {days.map((day) => {
          const entries = groupedEntries.get(day) ?? [];
          const isOtherMonth = parseLocalDateOnly(day).getMonth() !== focusMonth;
          return (
            <button
              className={`po-calendar-day ${isOtherMonth ? "is-muted" : ""} ${day === focusDate ? "is-selected" : ""}`}
              key={day}
              type="button"
              onClick={() => onSelectDate(day)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(day)}
            >
              <strong>{dayNumber(day)}</strong>
              {entries.slice(0, 3).map((entry) => <TrainingPill entry={entry} key={entry.id} compact />)}
              {entries.length > 3 ? <small>+{entries.length - 3} weitere</small> : null}
            </button>
          );
        })}
      </div>
    </PaddlioOneCard>
  );
}

function WeekCalendar({
  days,
  groupedEntries,
  onStatusChange,
  onDrop,
  onDragOver,
}: {
  days: string[];
  groupedEntries: Map<string, PlanEntry[]>;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onDrop: (date: string) => void;
  onDragOver: (event: DragEvent) => void;
}) {
  return (
    <PaddlioOneCard className="po-calendar-card po-week-calendar-card">
      <div className="po-calendar-week-grid">
        {days.map((day) => {
          const entries = groupedEntries.get(day) ?? [];
          return (
            <section className="po-calendar-week-day" key={day} onDragOver={onDragOver} onDrop={() => onDrop(day)}>
              <header>
                <span>{getLocalWeekdayLabel(day).slice(0, 2)}</span>
                <strong>{shortDateLabel(day)}</strong>
              </header>
              <div className="po-calendar-entry-stack">
                {entries.length > 0 ? entries.map((entry) => (
                  <TrainingBlock entry={entry} key={entry.id} onStatusChange={onStatusChange} />
                )) : <p className="po-calendar-empty-drop">Vorlage hier ablegen</p>}
              </div>
            </section>
          );
        })}
      </div>
    </PaddlioOneCard>
  );
}

function DayCalendar({
  date,
  entries,
  onStatusChange,
  onDrop,
  onDragOver,
}: {
  date: string;
  entries: PlanEntry[];
  onStatusChange: (id: string, status: PlanStatus) => void;
  onDrop: (date: string) => void;
  onDragOver: (event: DragEvent) => void;
}) {
  return (
    <PaddlioOneCard className="po-calendar-card po-day-calendar-card">
      <div className="po-card-heading-row">
        <div>
          <p className="po-eyebrow">{getLocalWeekdayLabel(date)}</p>
          <h2>{shortDateLabel(date)}</h2>
        </div>
      </div>
      <div className="po-day-timeline" onDragOver={onDragOver} onDrop={() => onDrop(date)}>
        {entries.length > 0 ? entries.map((entry) => (
          <TrainingBlock entry={entry} key={entry.id} onStatusChange={onStatusChange} />
        )) : <p className="po-calendar-empty-drop">Noch frei. Vorlage auswählen oder Training hinzufügen.</p>}
      </div>
    </PaddlioOneCard>
  );
}

function TrainingBlock({
  entry,
  onStatusChange,
}: {
  entry: PlanEntry;
  onStatusChange: (id: string, status: PlanStatus) => void;
}) {
  const done = isDoneStatus(entry.status);
  const skipped = isSkippedStatus(entry.status);
  const tone = skipped ? "danger" : done ? "success" : categoryTone(entry.area || entry.trainingType);
  return (
    <article className={`po-training-block po-tone-${tone}`}>
      <div>
        <strong>{entry.title || entry.trainingType}</strong>
        <small>{entry.startTime || entry.time || "--"} · {entry.durationMinutes} min · {entry.area}</small>
        <span>{entry.goal || entry.focus || "Fokus offen"}</span>
      </div>
      <div className="po-training-block-actions">
        <PaddlioOneStatusChip tone={done ? "success" : skipped ? "danger" : "info"}>
          {planStatusLabels[entry.status] ?? entry.status}
        </PaddlioOneStatusChip>
        {!done ? (
          <button type="button" onClick={() => onStatusChange(entry.id, "completed" as PlanStatus)}>
            erledigt
          </button>
        ) : null}
      </div>
    </article>
  );
}

function TrainingPill({ entry, compact = false }: { entry: PlanEntry; compact?: boolean }) {
  return (
    <span className={`po-training-pill po-tone-${categoryTone(entry.area || entry.trainingType)} ${compact ? "is-compact" : ""}`.trim()}>
      {entry.startTime || entry.time ? `${entry.startTime || entry.time} · ` : ""}{entry.title || entry.trainingType}
    </span>
  );
}

function CalendarTemplateRail({
  templates,
  onDragStart,
  onOpenPlan,
}: {
  templates: TrainingTemplate[];
  onDragStart: (id: string) => void;
  onOpenPlan: () => void;
}) {
  const favoriteTemplates = templates.filter((template) => template.isFavorite).slice(0, 6);
  const shownFavorites = favoriteTemplates.length > 0 ? favoriteTemplates : templates.slice(0, 6);

  return (
    <aside className="po-calendar-template-rail" aria-label="Vorlagenbibliothek">
      <PaddlioOneCard>
        <div className="po-card-heading-row">
          <div>
            <p className="po-eyebrow">Vorlagen</p>
            <h2>Bibliothek</h2>
          </div>
          <PaddlioOneButton variant="ghost" icon="more" onClick={onOpenPlan}>Alle</PaddlioOneButton>
        </div>
        <div className="po-template-tabs" aria-label="Vorlagenbereiche">
          <span>Favoriten</span>
          <span>Meine</span>
          <span>Verein</span>
        </div>
        <div className="po-template-card-list">
          {shownFavorites.map((template) => (
            <TemplateCard template={template} key={template.id} onDragStart={onDragStart} />
          ))}
        </div>
      </PaddlioOneCard>

      <PaddlioOneCard className="po-template-weeks">
        <div className="po-card-heading-row">
          <div>
            <p className="po-eyebrow">Wochenvorlagen</p>
            <h2>Schnell planen</h2>
          </div>
        </div>
        {weeklyPlanningTemplates.slice(0, 4).map((template) => (
          <button className="po-week-template-row" key={template.id} type="button">
            <strong>{template.title}</strong>
            <span>{template.description}</span>
            <em>{template.items.length} Einheiten</em>
          </button>
        ))}
      </PaddlioOneCard>

      <PaddlioOneCard className="po-template-season">
        <div className="po-card-heading-row">
          <div>
            <p className="po-eyebrow">Saisonbausteine</p>
            <h2>Periodisierung</h2>
          </div>
        </div>
        {seasonPlanningBlocks.slice(0, 3).map((block) => (
          <button className="po-week-template-row" key={block.id} type="button">
            <strong>{block.title}</strong>
            <span>{block.description}</span>
            <em>{block.weeklyTemplateIds.length} Wochen</em>
          </button>
        ))}
        <p className="po-muted">Vorlage ziehen und im Kalender ablegen.</p>
      </PaddlioOneCard>
    </aside>
  );
}

function TemplateCard({
  template,
  onDragStart,
}: {
  template: TrainingTemplate;
  onDragStart: (id: string) => void;
}) {
  const tone = categoryTone(template.category || template.trainingArea || template.trainingType);
  return (
    <article
      className={`po-template-card po-tone-${tone}`}
      draggable
      onDragStart={() => onDragStart(template.id)}
      aria-label={`${template.title} in Kalender ziehen`}
    >
      <span className="po-template-icon">{template.category.slice(0, 1)}</span>
      <div>
        <strong>{template.title}</strong>
        <small>{template.trainingArea} · {template.trainingType}</small>
        <span>{template.defaultDurationMinutes ?? 60} min · Intensität {template.defaultIntensity}</span>
      </div>
      <em>{template.isFavorite ? "★" : "↗"}</em>
    </article>
  );
}

function PeriodizationCalendar({
  months,
  templates,
}: {
  months: ReturnType<typeof getPeriodizationMonths>;
  templates: TrainingTemplate[];
}) {
  return (
    <PaddlioOneCard className="po-periodization-card">
      <div className="po-card-heading-row">
        <div>
          <p className="po-eyebrow">Jahresplan</p>
          <h2>Saisonphasen</h2>
        </div>
        <PaddlioOneStatusChip tone="info">{templates.length} Bausteine vorbereitet</PaddlioOneStatusChip>
      </div>
      <div className="po-periodization-grid">
        {months.map((month) => (
          <article className="po-periodization-month" key={month.key}>
            <strong>{month.label}</strong>
            <span>{month.phase}</span>
            <small>{month.entries} Einheiten · {month.minutes} min</small>
            <div className="po-mini-progress"><span style={{ width: `${month.loadPercent}%` }} /></div>
          </article>
        ))}
      </div>
    </PaddlioOneCard>
  );
}
