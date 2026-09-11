import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type MouseEvent, type ReactNode, type TouchEvent } from "react";
import {
  addCalendarDays,
  expandTrainingRepeatDates,
  formatLocalDateOnly,
  getLocalWeekdayLabel,
  getTodayKey,
  getTrainingRepeatSeriesEntries,
  getWeekdayFromDate,
  isDoneStatus,
  isSkippedStatus,
  parseLocalDateOnly,
  planStatusLabels,
  sortPlanEntries,
  trainingAreas,
  weekdays,
} from "../domain/trainingPlan";
import { createCalendarQuickTemplates, seasonPlanningBlocks, weeklyPlanningTemplates } from "../features/training/templates/planningBlocks";
import { createPeriodizationTemplates } from "../features/training/templates/trainingTemplates";
import type {
  CoachAthlete,
  CoachGroup,
  PaddleMotionData,
  PlanEntry,
  PlanStatus,
  TeamTask,
  TeamTaskAssignment,
  TeamTaskPriority,
  TeamTaskType,
  TrainingArea,
  TrainingAssignedType,
  TrainingBoatClass,
  TrainingFeedback,
  TrainingJournalEntry,
  TrainingRepeat,
  TrainingTemplate,
  User,
} from "../domain/types";
import type { DeviceClass } from "../lib/deviceCapabilities";
import {
  PaddlioOneButton,
  PaddlioOneCard,
  PaddlioOneMetricCard,
  PaddlioOnePageHeader,
  PaddlioOneStatusChip,
  PaddlioOneToolbar,
} from "../components/paddlio-one/PaddlioOneComponents";

type CalendarMode = "day" | "threeDays" | "week" | "month" | "year" | "list" | "season";
type TemplateScope = "favorites" | "recent" | "mine" | "club" | "system" | "weeks" | "season";
type DetailTab = "planning" | "execution" | "feedback" | "tasks";
type CompletionStatus = "completed" | "partially_completed" | "skipped";
type ContextMode = "templates" | "quickEdit" | "detail" | "filter";

type PlanEntryDraft = Omit<PlanEntry, "id" | "athleteId" | "createdAt" | "updatedAt" | "createdByUserId"> & { id?: string };
type JournalDraft = Omit<TrainingJournalEntry, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string };
type FeedbackDraft = Omit<TrainingFeedback, "id" | "completedAt"> & { id?: string };

type QuickEditState = {
  template: TrainingTemplate;
  entryId?: string;
  status?: PlanStatus;
  date: string;
  startTime: string;
  durationMinutes: number;
  assignedType: TrainingAssignedType;
  targetId: string;
  trainerId: string;
  place: string;
  boatClass: TrainingBoatClass;
  repeat: TrainingRepeat;
  repeatUntil: string;
  repeatMaxCount: number | "";
  individualNote: string;
};

type LiveTrainingState = {
  entry: PlanEntry;
  startedAt: number;
  paused: boolean;
  elapsedBeforePause: number;
  activeStep: number;
};

type TrainingCalendarViewProps = {
  entries: PlanEntry[];
  journal: TrainingJournalEntry[];
  templates?: TrainingTemplate[];
  clubId?: string;
  data?: PaddleMotionData;
  user?: User;
  onOpenPlan: () => void;
  onOpenJournal: () => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onTemplateInsert?: (template: TrainingTemplate, date: string) => void;
  onSave?: (entry: PlanEntryDraft) => void;
  onDelete?: (id: string) => void;
  onDeleteSeries?: (id: string) => void;
  onFeedbackSave?: (feedback: FeedbackDraft) => void;
  onSaveJournal?: (entry: JournalDraft) => void;
  onDataChange?: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
  deviceClass?: DeviceClass;
};

const modeLabels: Record<CalendarMode, string> = {
  day: "Tag",
  threeDays: "3 Tage",
  week: "Woche",
  month: "Monat",
  year: "Jahr",
  list: "Liste",
  season: "Saison",
};

const repeatLabels: Record<TrainingRepeat, string> = {
  none: "Keine",
  daily: "Täglich",
  weekly: "Wöchentlich",
  biweekly: "Alle 2 Wochen",
  monthly: "Monatlich",
};

const trainingTaskTypes: TeamTaskType[] = ["training", "technique", "material", "video", "competition", "mental", "recovery", "general"];
const trainingTaskPriorities: TeamTaskPriority[] = ["normal", "important", "urgent"];
const trainingTaskTypeLabels: Record<TeamTaskType, string> = {
  general: "Allgemein",
  technique: "Technik",
  material: "Material",
  video: "Video",
  competition: "Wettkampf",
  training: "Training",
  mental: "Mental",
  recovery: "Regeneration",
};
const trainingTaskPriorityLabels: Record<TeamTaskPriority, string> = {
  normal: "Normal",
  important: "Wichtig",
  urgent: "Dringend",
};

const categoryTone = (value?: string): "primary" | "success" | "warning" | "danger" | "info" | "muted" => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("wett")) return "danger";
  if (normalized.includes("kraft")) return "warning";
  if (normalized.includes("technik") || normalized.includes("slalom")) return "info";
  if (normalized.includes("regen") || normalized.includes("mobility") || normalized.includes("pause")) return "muted";
  return "success";
};

const mojibakePairs: Array<[string, string]> = [
  [String.fromCharCode(195, 131, 194, 188), "\u00fc"],
  [String.fromCharCode(195, 131, 194, 164), "\u00e4"],
  [String.fromCharCode(195, 131, 194, 182), "\u00f6"],
  [String.fromCharCode(195, 131, 197, 184), "\u00df"],
  [String.fromCharCode(195, 131, 197, 147), "\u00dc"],
  [String.fromCharCode(195, 131, 226, 8364, 382), "\u00c4"],
  [String.fromCharCode(195, 131, 226, 8364, 8220), "\u00d6"],
  [String.fromCharCode(195, 162, 203, 156, 226, 8364, 8482), "\u2605"],
  [String.fromCharCode(195, 162, 226, 8364, 160, 226, 8364, 8482), "\u2192"],
  [String.fromCharCode(195, 130, 194, 183), "\u00b7"],
];

const normalizeText = (value: string): string =>
  mojibakePairs.reduce((text, [broken, fixed]) => text.split(broken).join(fixed), value);
const monthLabel = (dateKey: string): string =>
  parseLocalDateOnly(dateKey).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

const shortDateLabel = (dateKey: string): string =>
  parseLocalDateOnly(dateKey).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

const fullDateLabel = (dateKey: string): string =>
  parseLocalDateOnly(dateKey).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });

const dayNumber = (dateKey: string): string => String(parseLocalDateOnly(dateKey).getDate());

const addMinutesToTime = (time: string, minutes: number): string => {
  const [hourValue, minuteValue] = (time || "17:30").split(":").map(Number);
  const base = new Date(2026, 0, 1, hourValue || 0, minuteValue || 0);
  base.setMinutes(base.getMinutes() + minutes);
  return `${String(base.getHours()).padStart(2, "0")}:${String(base.getMinutes()).padStart(2, "0")}`;
};

const shortTimeLabel = (time?: string): string => (time || "").slice(0, 5);

type CalendarTrainingSummary = {
  startTime: string;
  endTime: string;
  title: string;
  category: string;
  tone: ReturnType<typeof categoryTone>;
  statusLabel: string;
  done: boolean;
  skipped: boolean;
};

const findTrainingCategoryCode = (entry: PlanEntry): string => {
  const source = [
    entry.area,
    entry.trainingType,
    entry.title,
    entry.goal,
    entry.focus,
    entry.description,
  ].filter(Boolean).join(" ");
  const directCode = source.match(/\b(GA1|GA2|WA|SA|KB|S)\b/i)?.[1];
  if (directCode) return directCode.toUpperCase();

  const normalized = source.toLowerCase();
  if (normalized.includes("wett")) return "WA";
  if (normalized.includes("kraft")) return "KB";
  if (normalized.includes("technik") || normalized.includes("slalom")) return "TE";
  if (normalized.includes("sprint")) return "S";
  if (normalized.includes("regen") || normalized.includes("mobility") || normalized.includes("pause")) return "REG";
  return "GA1";
};

const calendarCategoryTone = (category: string, entry: PlanEntry): ReturnType<typeof categoryTone> => {
  if (category === "WA") return "danger";
  if (category === "KB") return "warning";
  if (category === "TE" || category === "SA" || category === "S") return "info";
  if (category === "REG") return "muted";
  return categoryTone(entry.area || entry.trainingType);
};

const buildCalendarTrainingSummary = (entry: PlanEntry): CalendarTrainingSummary => {
  const done = isDoneStatus(entry.status);
  const skipped = isSkippedStatus(entry.status);
  const startTime = shortTimeLabel(entry.startTime || entry.time) || "--";
  const endTime = shortTimeLabel(entry.endTime || addMinutesToTime(entry.startTime || entry.time, entry.durationMinutes)) || "--";
  const category = findTrainingCategoryCode(entry);

  return {
    startTime,
    endTime,
    title: entry.title || entry.trainingType,
    category,
    tone: skipped ? "danger" : done ? "success" : calendarCategoryTone(category, entry),
    statusLabel: skipped ? "!" : done ? "\u2713" : planStatusLabels[entry.status] ?? entry.status,
    done,
    skipped,
  };
};

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

const getThreeDays = (dateKey: string): string[] => [dateKey, addCalendarDays(dateKey, 1), addCalendarDays(dateKey, 2)];

const getYearMonths = (dateKey: string): string[] => {
  const year = parseLocalDateOnly(dateKey).getFullYear();
  return Array.from({ length: 12 }, (_, month) => `${year}-${String(month + 1).padStart(2, "0")}-01`);
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
  const phaseNames = ["Grundlagen", "Aufbau", "Technik", "Wettkampfvorbereitung", "Wettkampf", "Regeneration"];

  return Array.from({ length: 12 }, (_, month) => {
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
function getAthleteName(athlete: CoachAthlete): string {
  return athlete.name || `${athlete.firstName} ${athlete.lastName}`.trim() || athlete.email;
}

function getUserName(user?: User): string {
  if (!user) return "Trainer";
  return `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.profile.nickname || user.userId;
}

function getAssignedLabel(entry: PlanEntry, groups: CoachGroup[], athletes: CoachAthlete[], users: User[]): string {
  if (entry.assignedType === "group") {
    const ids = [...entry.assignedGroupIds, entry.assignedGroupId].filter(Boolean);
    const names = ids.map((id) => groups.find((group) => group.id === id || group.groupId === id)?.name).filter(Boolean);
    return names.join(", ") || "Gruppe";
  }
  if (entry.assignedType === "athlete") {
    const ids = [...entry.assignedAthleteIds, entry.assignedAthleteId].filter(Boolean);
    const names = ids
      .map((id) => {
        const athlete = athletes.find((item) => item.id === id);
        const user = users.find((item) => item.userId === id || item.id === id);
        return athlete ? getAthleteName(athlete) : user ? getUserName(user) : "";
      })
      .filter(Boolean);
    return names.join(", ") || "Sportler";
  }
  return "Eigenes Training";
}

function getEntrySections(entry: PlanEntry): string[] {
  const source = [entry.focus, entry.description, entry.notes || entry.note].filter(Boolean).join("\n");
  const sections = source
    .split(/\n|;|•|-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 3)
    .slice(0, 5);
  return sections.length > 0 ? sections : ["Aufwärmen", entry.trainingType, "Feedback notieren"];
}

function createQuickEdit(template: TrainingTemplate, date: string, user?: User): QuickEditState {
  const durationMinutes = template.defaultDurationMinutes ?? 60;
  const startTime = "17:30";
  return {
    template,
    date,
    startTime,
    durationMinutes,
    assignedType: "self",
    targetId: user?.userId ?? "",
    trainerId: user?.userId ?? "",
    place: "",
    boatClass: template.boatClass || "none",
    repeat: "none",
    repeatUntil: "",
    repeatMaxCount: "",
    individualNote: "",
  };
}

export function TrainingCalendarView({
  entries,
  journal,
  templates,
  clubId,
  data,
  user,
  onOpenPlan,
  onOpenJournal,
  onStatusChange,
  onTemplateInsert,
  onSave,
  onDelete,
  onDeleteSeries,
  onFeedbackSave,
  onSaveJournal,
  onDataChange,
  deviceClass = "desktop",
}: TrainingCalendarViewProps) {
  const isPhone = deviceClass === "phone";
  const isDesktop = deviceClass === "desktop";
  const templateClubId = clubId ?? "paddlio-system";
  const [mode, setMode] = useState<CalendarMode>(isPhone ? "threeDays" : "week");
  const [focusDate, setFocusDate] = useState(getTodayKey());
  const [dragTemplateId, setDragTemplateId] = useState<string | null>(null);
  const [templateScope, setTemplateScope] = useState<TemplateScope>("favorites");
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? 1200 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  }));
  const [showTemplates, setShowTemplates] = useState(false);
  const [contextMode, setContextMode] = useState<ContextMode>("templates");
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<"all" | TrainingArea>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [quickEdit, setQuickEdit] = useState<QuickEditState | null>(null);
  const [feedbackEntry, setFeedbackEntry] = useState<PlanEntry | null>(null);
  const [taskEntry, setTaskEntry] = useState<PlanEntry | null>(null);
  const [liveTraining, setLiveTraining] = useState<LiveTrainingState | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ entry: PlanEntry; x: number; y: number } | null>(null);
  const [weekCopyOpen, setWeekCopyOpen] = useState(false);
  const isTablet = deviceClass === "tablet";
  const isTabletPortrait = isTablet && viewport.width < 1024 && viewport.height >= viewport.width;
  const usesOverlayContext = isTablet && viewport.width < 1024;
  const isTabletWorkspace = isTablet && !isPhone;
  const isWorkspaceDevice = !isPhone;

  const availableModes: CalendarMode[] = isPhone
    ? ["day", "threeDays", "week", "list"]
    : isDesktop
      ? ["day", "week", "month", "year", "season", "list"]
      : ["day", "threeDays", "week", "month", "list", "season"];
  const primaryModes: CalendarMode[] = isTabletWorkspace ? ["day", "threeDays", "week", "month"] : isDesktop ? ["day", "threeDays", "week", "month", "year", "list"] : availableModes;

  useEffect(() => {
    if (!availableModes.includes(mode)) setMode(availableModes[0]);
  }, [availableModes, mode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
    };
  }, []);

  useEffect(() => {
    setShowTemplates(false);
  }, [isPhone, usesOverlayContext]);

  useEffect(() => {
    if (isTabletPortrait && mode === "week") {
      setMode("threeDays");
    }
  }, [isTabletPortrait, mode]);

  useEffect(() => {
    if (!isPhone) return;
    const activeEntryId = feedbackEntry?.id ?? liveTraining?.entry.id ?? selectedEntryId;
    if (!activeEntryId) return;

    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-calendar-entry-id="${CSS.escape(activeEntryId)}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [feedbackEntry?.id, isPhone, liveTraining?.entry.id, selectedEntryId]);

  const groupOptions = data?.coachGroups.filter((group) => !clubId || group.clubId === clubId) ?? [];
  const athleteOptions = data?.coachAthletes.filter((athlete) => !clubId || athlete.clubId === clubId) ?? [];
  const trainerOptions = data?.users.filter((item) => item.role === "coach" || item.role === "admin" || item.role === "clubAdmin") ?? (user ? [user] : []);
  const taskItems = data?.tasks.filter((task) => !task.deletedAt) ?? [];
  const taskAssignments = data?.taskAssignments ?? [];

  const calendarTemplates = useMemo(
    () => [...(templates ?? []), ...createCalendarQuickTemplates(templateClubId)].map((template) => ({
      ...template,
      title: normalizeText(template.title),
      focus: normalizeText(template.focus),
      description: normalizeText(template.description ?? ""),
      notes: normalizeText(template.notes ?? ""),
    })).slice(0, 24),
    [templates, templateClubId],
  );
  const periodizationTemplates = useMemo(() => createPeriodizationTemplates(templateClubId), [templateClubId]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries
      .filter((entry) => !entry.deletedAt)
      .filter((entry) => areaFilter === "all" || entry.area === areaFilter)
      .filter((entry) => statusFilter === "all" || entry.status === statusFilter)
      .filter((entry) => {
        if (!normalizedQuery) return true;
        return [entry.title, entry.trainingType, entry.area, entry.focus, entry.goal, entry.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      });
  }, [areaFilter, entries, query, statusFilter]);

  const groupedEntries = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);
  const monthDays = useMemo(() => getMonthGrid(focusDate), [focusDate]);
  const weekDays = useMemo(() => getWeekDays(focusDate), [focusDate]);
  const threeDays = useMemo(() => getThreeDays(focusDate), [focusDate]);
  const yearMonths = useMemo(() => getYearMonths(focusDate), [focusDate]);
  const dayEntries = groupedEntries.get(focusDate) ?? [];
  const weekEntries = weekDays.flatMap((day) => groupedEntries.get(day) ?? []);
  const periodizationMonths = useMemo(() => getPeriodizationMonths(filteredEntries), [filteredEntries]);
  const selectedEntry = selectedEntryId ? filteredEntries.find((entry) => entry.id === selectedEntryId) ?? null : null;

  const move = (direction: -1 | 1) => {
    const amount = mode === "month" ? direction * 30 : mode === "year" || mode === "season" ? direction * 365 : mode === "week" ? direction * 7 : direction;
    setFocusDate(addCalendarDays(focusDate, amount));
  };

  const openQuickEdit = (template: TrainingTemplate, date = focusDate) => {
    setSelectedEntryId(null);
    setFeedbackEntry(null);
    setTaskEntry(null);
    setLiveTraining(null);
    setShowTemplates(false);
    setContextMode("quickEdit");
    setQuickEdit(createQuickEdit(template, date, user));
  };

  const openEntryQuickEdit = (entry: PlanEntry) => {
    setContextMenu(null);
    if (quickEdit?.entryId === entry.id) {
      setQuickEdit(null);
      setContextMode("detail");
      return;
    }
    setSelectedEntryId(null);
    setFeedbackEntry(null);
    setTaskEntry(null);
    setLiveTraining(null);
    setShowTemplates(false);
    setContextMode("quickEdit");
    setQuickEdit(createEntryQuickEdit(entry));
  };

  const openEntryDetail = (id: string) => {
    setContextMenu(null);
    if (selectionMode) {
      updateSelection(id, !selectedIds.includes(id));
      return;
    }
    setQuickEdit(null);
    setFeedbackEntry(null);
    setTaskEntry(null);
    setLiveTraining(null);
    setShowTemplates(false);
    setContextMode("detail");
    setSelectedEntryId(id);
  };

  const startLiveTraining = (entry: PlanEntry) => {
    setSelectedEntryId(null);
    setQuickEdit(null);
    setFeedbackEntry(null);
    setTaskEntry(null);
    setLiveTraining({ entry, startedAt: Date.now(), paused: false, elapsedBeforePause: 0, activeStep: 0 });
  };

  const openFeedback = (entry: PlanEntry) => {
    setSelectedEntryId(null);
    setQuickEdit(null);
    setTaskEntry(null);
    setLiveTraining(null);
    setFeedbackEntry(entry);
  };

  const handleTemplateDrop = (date: string) => {
    if (!dragTemplateId) return;
    const template = calendarTemplates.find((item) => item.id === dragTemplateId);
    if (template) openQuickEdit(template, date);
    setDragTemplateId(null);
  };

  const handleDragOver = (event: DragEvent) => {
    if (dragTemplateId) event.preventDefault();
  };

  const saveQuickEdit = (state: QuickEditState) => {
    const duration = Number(state.durationMinutes) || state.template.defaultDurationMinutes || 60;
    const targetId = state.targetId || user?.userId || "";
    const assignedAthleteIds = state.assignedType === "athlete" || state.assignedType === "self" ? [targetId].filter(Boolean) : [];
    const assignedGroupIds = state.assignedType === "group" ? [targetId].filter(Boolean) : [];
    const repeatMaxCount = typeof state.repeatMaxCount === "number" ? state.repeatMaxCount : undefined;

    if (state.entryId) {
      const existing = entries.find((entry) => entry.id === state.entryId);
      if (!existing || !onSave) return;
      const { athleteId: _athleteId, createdAt: _createdAt, updatedAt: _updatedAt, createdByUserId: _createdByUserId, ...draftBase } = existing;
      onSave({
        ...draftBase,
        id: existing.id,
        assignedType: state.assignedType,
        assignedAthleteIds,
        assignedGroupIds,
        assignedAthleteId: state.assignedType === "athlete" || state.assignedType === "self" ? targetId : "",
        assignedGroupId: state.assignedType === "group" ? targetId : "",
        date: state.date,
        weekday: getWeekdayFromDate(state.date),
        time: state.startTime,
        startTime: state.startTime,
        endTime: addMinutesToTime(state.startTime, duration),
        durationMinutes: duration,
        boatClass: state.boatClass,
        note: state.place ? `Ort: ${state.place}` : existing.note,
        status: state.status || existing.status,
        repeat: state.repeat,
        repeatUntil: state.repeatUntil,
        repeatMaxCount,
        feedbackNote: state.individualNote,
      });
      setFocusDate(state.date);
      setQuickEdit(null);
      setContextMode("detail");
      setSelectedEntryId(existing.id);
      return;
    }

    const draft: PlanEntryDraft = {
      ownerUserId: user?.userId ?? targetId,
      clubId: clubId ?? user?.profile.club ?? "",
      assignedType: state.assignedType,
      assignedAthleteIds,
      assignedGroupIds,
      title: state.template.title,
      date: state.date,
      weekday: getWeekdayFromDate(state.date),
      time: state.startTime,
      startTime: state.startTime,
      endTime: addMinutesToTime(state.startTime, duration),
      durationMinutes: duration,
      area: state.template.trainingArea,
      trainingType: state.template.trainingType,
      boatClass: state.boatClass,
      goal: state.template.focus,
      focus: state.template.focus,
      description: state.template.description ?? "",
      intensity: state.template.defaultIntensity,
      note: state.place ? `Ort: ${state.place}` : state.template.notes ?? "",
      notes: state.template.notes ?? "",
      status: "planned",
      repeat: state.repeat,
      repeatUntil: state.repeatUntil,
      repeatMaxCount,
      templateId: state.template.id,
      assignedAthleteId: state.assignedType === "athlete" || state.assignedType === "self" ? targetId : "",
      assignedGroupId: state.assignedType === "group" ? targetId : "",
      feedbackNote: state.individualNote,
    };

    if (onSave) onSave(draft);
    else onTemplateInsert?.(state.template, state.date);
    setFocusDate(state.date);
    if (isPhone) setMode("day");
    setQuickEdit(null);
  };

  const duplicateEntry = (entry: PlanEntry, date = entry.date) => {
    if (!onSave) return;
    const { id: _id, athleteId: _athleteId, createdAt: _createdAt, updatedAt: _updatedAt, createdByUserId: _createdByUserId, ...draft } = entry;
    onSave({ ...draft, date, weekday: getWeekdayFromDate(date), status: "planned", repeat: "none", repeatUntil: "", repeatMaxCount: undefined, repeatSeriesId: undefined });
  };

  const copyWeek = (targetMonday: string) => {
    if (!onSave) return;
    const sourceMonday = weekDays[0];
    const offset = Math.round((parseLocalDateOnly(targetMonday).getTime() - parseLocalDateOnly(sourceMonday).getTime()) / 86400000);
    weekEntries.forEach((entry) => duplicateEntry(entry, addCalendarDays(entry.date, offset)));
    setWeekCopyOpen(false);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectionMode(false);
    setContextMenu(null);
  };

  const activateSelection = (id: string) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(10);
    }
    setQuickEdit(null);
    setSelectedEntryId(null);
    setShowTemplates(false);
    setSelectionMode(true);
    setSelectedIds((current) => current.includes(id) ? current : [...current, id]);
  };

  const openContextMenu = (entry: PlanEntry, x: number, y: number) => {
    setContextMenu({ entry, x, y });
  };

  const deleteSelected = () => {
    if (!onDelete) return;
    const selectedEntries = selectedIds
      .map((id) => entries.find((entry) => entry.id === id))
      .filter((entry): entry is PlanEntry => Boolean(entry));
    if (selectedEntries.length === 0) return;

    const containsSeriesEntry = selectedEntries.some((entry) => getTrainingRepeatSeriesEntries(entries, entry).length > 1);
    const title = selectedEntries.length === 1 ? "Training löschen?" : "Trainings löschen?";
    const message = selectedEntries.length === 1
      ? "Möchtest du das ausgewählte Training wirklich löschen?"
      : `Möchtest du die ${selectedEntries.length} ausgewählten Trainings wirklich löschen?`;
    const seriesNote = containsSeriesEntry
      ? "\n\nMindestens ein Training gehört zu einer Wiederholungsserie. Es werden nur die ausgewählten Termine gelöscht, nicht automatisch die komplette Serie."
      : "";

    if (!window.confirm(`${title}\n\n${message}${seriesNote}`)) return;
    selectedEntries.forEach((entry) => onDelete(entry.id));
    clearSelection();
  };

  const updateSelection = (id: string, checked: boolean) => {
    const next = checked ? [...new Set([...selectedIds, id])] : selectedIds.filter((item) => item !== id);
    setSelectedIds(next);
    setSelectionMode(next.length > 0);
  };

  const copySelected = () => {
    selectedIds
      .map((id) => entries.find((entry) => entry.id === id))
      .filter(Boolean)
      .forEach((entry) => duplicateEntry(entry as PlanEntry));
    clearSelection();
  };

  const openFirstSelectedQuickEdit = () => {
    const entry = selectedIds.map((id) => entries.find((item) => item.id === id)).find(Boolean);
    if (entry) openEntryQuickEdit(entry);
  };

  const openFirstSelectedDetail = () => {
    const id = selectedIds[0];
    if (id) openEntryDetail(id);
  };

  const completeSelected = () => {
    selectedIds.forEach((id) => onStatusChange(id, "completed"));
    clearSelection();
  };

  useEffect(() => {
    if (!selectionMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionMode]);

  useEffect(() => {
    if (isPhone) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = Boolean(target?.closest("input,textarea,select,[contenteditable='true']"));
      if (event.key === "Escape") {
        setContextMenu(null);
        if (selectionMode) clearSelection();
        else closeContext();
        return;
      }
      if (isTyping) return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        onOpenPlan();
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setQuickEdit(null);
        setSelectedEntryId(null);
        setShowTemplates(false);
        setContextMode("filter");
      }
      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        setQuickEdit(null);
        setSelectedEntryId(null);
        setContextMode("templates");
        setShowTemplates((value) => !value);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (selectedEntry) duplicateEntry(selectedEntry);
        selectedIds.map((id) => entries.find((entry) => entry.id === id)).filter(Boolean).forEach((entry) => duplicateEntry(entry as PlanEntry));
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && selectedIds.length > 0) {
        event.preventDefault();
        copySelected();
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectionMode && selectedIds.length > 0) {
        event.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copySelected, deleteSelected, duplicateEntry, entries, isPhone, onOpenPlan, selectedEntry, selectedIds, selectionMode]);

  useEffect(() => {
    if (!contextMenu) return;
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [contextMenu]);

  const applyFeedback = (entry: PlanEntry, completionStatus: CompletionStatus, formData: FormData) => {
    const perceivedExertion = Number(formData.get("rpe") ?? 5);
    const feeling = Number(formData.get("feeling") ?? 4);
    const fatigue = Number(formData.get("fatigue") ?? 3);
    const motivation = Number(formData.get("motivation") ?? 4);
    const note = String(formData.get("note") ?? "").trim();
    const actualDuration = Number(formData.get("actualDuration") ?? entry.durationMinutes) || entry.durationMinutes;
    const feedbackStatus: TrainingFeedback["status"] = completionStatus === "skipped" ? "skipped" : "done";

    onFeedbackSave?.({
      trainingId: entry.id,
      athleteUserId: user?.userId ?? entry.ownerUserId,
      coachUserId: entry.createdByUserId || undefined,
      status: feedbackStatus,
      feeling,
      difficulty: perceivedExertion,
      fatigue,
      motivation,
      sleep: 4,
      reason: completionStatus === "skipped" ? note : "",
      comment: note,
    });

    onSaveJournal?.({
      trainingId: entry.id,
      trainingPlanEntryId: entry.id,
      date: entry.date,
      completionStatus,
      actualDurationMinutes: actualDuration,
      perceivedExertion,
      trainingRating: feeling,
      feeling,
      fatigue,
      sleep: 4,
      motivation,
      notes: note,
    });

    onStatusChange(entry.id, completionStatus);
    setFeedbackEntry(null);
    setLiveTraining(null);
  };

  const createTrainingTask = (entry: PlanEntry, formData: FormData) => {
    if (!onDataChange || !user) return;

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;

    const timestamp = new Date().toISOString();
    const taskId = `task-${crypto.randomUUID()}`;
    const task: TeamTask = {
      id: taskId,
      clubId: entry.clubId || clubId || user.profile.club || "",
      createdBy: user.userId,
      title,
      description: String(formData.get("description") ?? "").trim(),
      taskType: String(formData.get("taskType") ?? "training") as TeamTaskType,
      priority: String(formData.get("priority") ?? "normal") as TeamTaskPriority,
      dueDate: String(formData.get("dueDate") ?? entry.date),
      relatedTrainingId: entry.id,
      relatedCompetitionId: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: "",
    };
    const assignment: TeamTaskAssignment = {
      id: `task-assignment-${crypto.randomUUID()}`,
      taskId,
      assignedTo: String(formData.get("assignedTo") ?? user.userId),
      status: "open",
      completedAt: "",
      responseNote: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    onDataChange((current) => ({
      ...current,
      tasks: [task, ...current.tasks],
      taskAssignments: [assignment, ...current.taskAssignments],
    }));
    setTaskEntry(null);
    setSelectedEntryId(entry.id);
    setContextMode("detail");
  };

  const visibleModeTitle = mode === "season" ? "Saisonplanung" : mode === "year" ? `Jahr ${parseLocalDateOnly(focusDate).getFullYear()}` : monthLabel(focusDate);
  const nextTraining = [...filteredEntries].filter((entry) => entry.date >= getTodayKey()).sort((a, b) => `${a.date} ${a.startTime || a.time}`.localeCompare(`${b.date} ${b.startTime || b.time}`))[0];
  const weekLoad = weekEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const completedThisWeek = weekEntries.filter((entry) => isDoneStatus(entry.status)).length;
  const activeMobileFilters = [
    areaFilter !== "all" ? { id: "area", label: areaFilter, onClear: () => setAreaFilter("all" as const) } : null,
    statusFilter !== "all" ? { id: "status", label: planStatusLabels[statusFilter] ?? statusFilter, onClear: () => setStatusFilter("all" as const) } : null,
    query.trim() ? { id: "query", label: query.trim(), onClear: () => setQuery("") } : null,
  ].filter(Boolean) as Array<{ id: string; label: string; onClear: () => void }>;
  const activeFilters = activeMobileFilters;

  const hasContextContent = Boolean(quickEdit || selectedEntry || showTemplates || contextMode === "filter");
  const contextTitle = quickEdit ? "Quick Edit" : selectedEntry ? "Training" : contextMode === "filter" ? "Filter" : showTemplates ? "Vorlagen" : "Kontext";
  const contextContent = quickEdit ? (
    <TrainingQuickEdit
      state={quickEdit}
      groups={groupOptions}
      athletes={athleteOptions}
      trainers={trainerOptions}
      onChange={setQuickEdit}
      onCancel={() => setQuickEdit(null)}
      onSave={saveQuickEdit}
      onOpenFullPlan={() => {
        setQuickEdit(null);
        onOpenPlan();
      }}
      presentation="context"
    />
  ) : selectedEntry ? (
    <TrainingDetailDrawer
      entry={selectedEntry}
      journal={journal}
      feedback={data?.trainingFeedback ?? []}
      tasks={taskItems}
      taskAssignments={taskAssignments}
      groups={groupOptions}
      athletes={athleteOptions}
      users={data?.users ?? []}
      user={user}
      onClose={() => setSelectedEntryId(null)}
      onStatusChange={onStatusChange}
      onStartLive={startLiveTraining}
      onFeedback={openFeedback}
      onCreateTask={onDataChange && user ? (entry) => setTaskEntry(entry) : undefined}
      onDuplicate={duplicateEntry}
      onDelete={onDelete}
      onDeleteSeries={onDeleteSeries}
      entries={entries}
      presentation="context"
    />
  ) : showTemplates ? (
    <TemplatePanel templates={calendarTemplates} scope={templateScope} onScopeChange={setTemplateScope} onDragStart={setDragTemplateId} onDragEnd={() => setDragTemplateId(null)} onQuickInsert={(template) => openQuickEdit(template)} onOpenPlan={onOpenPlan} />
  ) : contextMode === "filter" ? (
    <CalendarFilterPanel
      query={query}
      areaFilter={areaFilter}
      statusFilter={statusFilter}
      onQueryChange={setQuery}
      onAreaChange={setAreaFilter}
      onStatusChange={setStatusFilter}
      onReset={() => {
        setQuery("");
        setAreaFilter("all");
        setStatusFilter("all");
      }}
    />
  ) : (
    <PaddlioOneCard className="master-context-empty">
      <p className="po-eyebrow">Kontext</p>
      <h2>Kalender bleibt sichtbar</h2>
      <p className="po-muted">Vorlagen, Trainingsdetails und Quick Edit erscheinen hier, ohne die Planung zu verdecken.</p>
    </PaddlioOneCard>
  );

  const closeContext = () => {
    setQuickEdit(null);
    setSelectedEntryId(null);
    setShowTemplates(false);
    setTaskEntry(null);
  };

  const renderPhoneEntryPanel = (entry: PlanEntry): ReactNode => {
    if (!isPhone) return null;

    if (liveTraining?.entry.id === entry.id) {
      return <LiveTrainingMode state={liveTraining} onChange={setLiveTraining} onEnd={openFeedback} presentation="inline" />;
    }

    if (feedbackEntry?.id === entry.id) {
      return <FeedbackSheet entry={feedbackEntry} onCancel={() => setFeedbackEntry(null)} onSave={applyFeedback} presentation="inline" />;
    }

    if (selectedEntryId === entry.id && selectedEntry) {
      return (
        <TrainingDetailDrawer
          entry={selectedEntry}
          journal={journal}
          feedback={data?.trainingFeedback ?? []}
          tasks={taskItems}
          taskAssignments={taskAssignments}
          groups={groupOptions}
          athletes={athleteOptions}
          users={data?.users ?? []}
          user={user}
          onClose={() => setSelectedEntryId(null)}
          onStatusChange={onStatusChange}
          onStartLive={startLiveTraining}
          onFeedback={openFeedback}
          onCreateTask={!isPhone && onDataChange && user ? (entry) => setTaskEntry(entry) : undefined}
          onDuplicate={duplicateEntry}
          onDelete={onDelete}
          onDeleteSeries={onDeleteSeries}
          entries={entries}
          presentation="inline"
        />
      );
    }

    return null;
  };

  return (
    <div className={`master-calendar-workspace master-calendar-${deviceClass}${hasContextContent ? " has-context" : ""}${isTabletPortrait ? " is-tablet-portrait" : ""}${usesOverlayContext ? " is-context-overlay" : ""}`}>
      <main
        className="master-calendar-main"
        onClick={(event) => {
          if (!selectionMode) return;
          const target = event.target as HTMLElement;
          if (target.closest("button,input,select,textarea,a,.master-training-block,.master-training-pill")) return;
          clearSelection();
        }}
      >
        <PaddlioOnePageHeader
          eyebrow="Kalender"
          title={visibleModeTitle}
          description={isPhone ? undefined : "Vorlagen planen, Einheiten durchführen, Feedback sichern und Soll/Ist direkt nachvollziehen."}
          action={
            <div className="master-calendar-header-actions">
              {!isPhone && !isTabletWorkspace ? <PaddlioOneButton variant="secondary" onClick={() => {
                setQuickEdit(null);
                setSelectedEntryId(null);
                setContextMode("templates");
                setShowTemplates((value) => !value);
              }}>
                Vorlagen
              </PaddlioOneButton> : null}
              {!isTabletWorkspace ? <PaddlioOneButton
                variant="primary"
                icon="training"
                className={isPhone ? "master-calendar-add-compact" : ""}
                onClick={onOpenPlan}
                aria-label="Individuelles Training hinzufügen"
              >
                {isPhone ? "+" : "Individuelles Training"}
              </PaddlioOneButton> : null}
            </div>
          }
        />

        <PaddlioOneToolbar className="master-calendar-toolbar">
          <div className="master-calendar-toolbar-group">
            <PaddlioOneButton variant="ghost" onClick={() => move(-1)} aria-label="Vorheriger Zeitraum">{isPhone ? "‹" : "Zurück"}</PaddlioOneButton>
            <PaddlioOneButton variant="secondary" icon="calendar" onClick={() => setFocusDate(getTodayKey())}>Heute</PaddlioOneButton>
            <PaddlioOneButton variant="ghost" onClick={() => move(1)} aria-label="Nächster Zeitraum">{isPhone ? "›" : "Weiter"}</PaddlioOneButton>
          </div>
          <div className="master-segmented-control" aria-label="Kalenderansicht">
            {primaryModes.map((item) => (
              <button className={mode === item ? "is-active" : ""} key={item} type="button" onClick={() => setMode(item)}>
                {modeLabels[item]}
              </button>
            ))}
          </div>
          {!isPhone ? <div className="master-calendar-toolbar-group">
            {isTabletWorkspace ? (
              <>
                <PaddlioOneButton variant="secondary" onClick={() => {
                  setQuickEdit(null);
                  setSelectedEntryId(null);
                  setContextMode("templates");
                  setShowTemplates((value) => !value);
                }}>Vorlagen</PaddlioOneButton>
                <PaddlioOneButton variant="secondary" onClick={() => {
                  setQuickEdit(null);
                  setSelectedEntryId(null);
                  setShowTemplates(false);
                  setContextMode("filter");
                }}>Filter</PaddlioOneButton>
                <PaddlioOneButton variant="primary" onClick={onOpenPlan}>Individuelles Training</PaddlioOneButton>
                <select
                  className="master-calendar-overflow-select"
                  aria-label="Weitere Kalenderansichten"
                  value={mode === "season" || mode === "list" ? mode : ""}
                  onChange={(event) => {
                    const nextMode = event.currentTarget.value as CalendarMode | "";
                    if (nextMode) setMode(nextMode);
                  }}
                >
                  <option value="">Mehr</option>
                  <option value="list">Liste</option>
                  <option value="season">Saison</option>
                </select>
              </>
            ) : (
              <>
                <PaddlioOneButton variant="secondary" onClick={() => {
                  setQuickEdit(null);
                  setSelectedEntryId(null);
                  setContextMode("templates");
                  setShowTemplates((value) => !value);
                }}>Vorlagen</PaddlioOneButton>
                <PaddlioOneButton variant="secondary" onClick={() => {
                  setQuickEdit(null);
                  setSelectedEntryId(null);
                  setShowTemplates(false);
                  setContextMode("filter");
                }}>Filter</PaddlioOneButton>
                <PaddlioOneButton variant="primary" onClick={onOpenPlan}>Individuelles Training</PaddlioOneButton>
                <PaddlioOneButton variant="secondary" onClick={() => setWeekCopyOpen(true)}>Aktionen</PaddlioOneButton>
                <PaddlioOneButton
                  variant={selectionMode ? "primary" : "secondary"}
                  onClick={() => {
                    setSelectionMode((value) => !value);
                    if (selectionMode) setSelectedIds([]);
                  }}
                  aria-pressed={selectionMode}
                >
                  Auswählen
                </PaddlioOneButton>
              </>
            )}
          </div> : null}
        </PaddlioOneToolbar>

        {isPhone ? (
          <section className="mobile-calendar-filter-row" aria-label="Kalenderfilter">
            <button type="button" className="mobile-filter-button" onClick={() => setMobileFiltersOpen(true)}>
              Filter
            </button>
            <div className="mobile-filter-chips" aria-label="Aktive Filter">
              {activeMobileFilters.length > 0 ? activeMobileFilters.map((filter) => (
                <button key={filter.id} type="button" onClick={filter.onClear}>
                  {filter.label} ×
                </button>
              )) : <span>Alle Einträge</span>}
            </div>
          </section>
        ) : null}

        {!isPhone && !isTabletWorkspace ? <section className="master-calendar-controls" aria-label="Kalenderfilter">
          <label>
            Suche
            <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Training, Fokus, Gruppe ..." />
          </label>
          <label>
            Bereich
            <select value={areaFilter} onChange={(event) => setAreaFilter(event.currentTarget.value as "all" | TrainingArea)}>
              <option value="all">Alle</option>
              {trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.currentTarget.value as "all" | PlanStatus)}>
              <option value="all">Alle</option>
              {Object.entries(planStatusLabels).slice(0, 6).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
            </select>
          </label>
        </section> : null}

        {activeFilters.length > 0 && isTabletWorkspace ? (
          <section className="master-calendar-active-filters" aria-label="Aktive Filter">
            {activeFilters.map((filter) => (
              <button key={filter.id} type="button" onClick={filter.onClear}>{filter.label} ×</button>
            ))}
          </section>
        ) : null}

        {!isPhone && !isTabletWorkspace ? <section className="master-calendar-stats">
          <PaddlioOneMetricCard label="Diese Woche" value={weekEntries.length} detail="Einheiten" icon="calendar" tone="primary" />
          <PaddlioOneMetricCard label="Belastung" value={`${weekLoad} min`} detail="geplante Zeit" icon="timer" tone="info" />
          <PaddlioOneMetricCard label="Durchgeführt" value={`${completedThisWeek}/${weekEntries.length}`} detail="Soll/Ist" icon="target" tone="success" />
          <PaddlioOneMetricCard label="Journal" value={journal.length} detail="Einträge" icon="message" tone="muted" />
        </section> : null}

        {selectionMode && selectedIds.length > 0 ? (
          <PaddlioOneCard
            className={`master-selection-bar ${isPhone ? "is-phone" : isTabletWorkspace ? "is-tablet" : "is-desktop"}`}
          >
            <div className="master-selection-inner" role="region" aria-label="Mehrfachauswahl Kalender" aria-live="polite">
              <strong>{selectedIds.length} ausgewählt</strong>
              <div className="master-selection-actions" aria-label="Aktionen für markierte Trainings">
                {!isPhone ? <PaddlioOneButton variant="secondary" onClick={openFirstSelectedQuickEdit}>Verschieben</PaddlioOneButton> : null}
                <PaddlioOneButton variant="secondary" onClick={copySelected}>Kopieren</PaddlioOneButton>
                <PaddlioOneButton variant="secondary" onClick={completeSelected}>Status</PaddlioOneButton>
                {!isPhone ? <PaddlioOneButton variant="secondary" onClick={openFirstSelectedDetail}>Zuweisen</PaddlioOneButton> : null}
                <PaddlioOneButton variant="danger" onClick={deleteSelected} aria-label={`${selectedIds.length} ausgewählte Trainings löschen`}>
                  Löschen
                </PaddlioOneButton>
                {!isPhone ? <details className="master-selection-more">
                  <summary aria-label="Weitere Auswahlaktionen">...</summary>
                  <div>
                    <button type="button" onClick={copySelected}>Duplizieren</button>
                    <button type="button" onClick={completeSelected}>Als erledigt markieren</button>
                    <button className="is-danger" type="button" onClick={deleteSelected}>Löschen</button>
                  </div>
                </details> : null}
                <button className="master-selection-close" type="button" onClick={clearSelection} aria-label="Auswahl beenden">×</button>
              </div>
            </div>
          </PaddlioOneCard>
        ) : null}

        {mode === "month" ? (
        <MonthCalendar days={monthDays} groupedEntries={groupedEntries} focusDate={focusDate} onSelectDate={setFocusDate} onDrop={handleTemplateDrop} onDragOver={handleDragOver} onOpenEntry={openEntryDetail} onQuickEdit={openEntryQuickEdit} onLongPressSelect={activateSelection} onContextMenuEntry={openContextMenu} selectionMode={selectionMode} selectedIds={selectedIds} onSelect={updateSelection} showDropHint={Boolean(dragTemplateId) && !isPhone} />
        ) : null}

        {mode === "week" ? (
          <WeekCalendar days={weekDays} groupedEntries={groupedEntries} onStatusChange={onStatusChange} onDrop={handleTemplateDrop} onDragOver={handleDragOver} onOpenEntry={openEntryDetail} onQuickEdit={openEntryQuickEdit} onLongPressSelect={activateSelection} onContextMenuEntry={openContextMenu} onStartLive={startLiveTraining} onFeedback={openFeedback} onDuplicate={duplicateEntry} onDelete={onDelete} selectionMode={selectionMode} selectedIds={selectedIds} onSelect={updateSelection} groups={groupOptions} athletes={athleteOptions} users={data?.users ?? []} showDropHint={Boolean(dragTemplateId) && !isPhone} renderEntryPanel={renderPhoneEntryPanel} compactActions={isWorkspaceDevice} />
        ) : null}

        {mode === "day" ? (
          <DayCalendar date={focusDate} entries={dayEntries} onStatusChange={onStatusChange} onDrop={handleTemplateDrop} onDragOver={handleDragOver} onOpenEntry={openEntryDetail} onQuickEdit={openEntryQuickEdit} onLongPressSelect={activateSelection} onContextMenuEntry={openContextMenu} onStartLive={startLiveTraining} onFeedback={openFeedback} onDuplicate={duplicateEntry} onDelete={onDelete} selectionMode={selectionMode} selectedIds={selectedIds} onSelect={updateSelection} groups={groupOptions} athletes={athleteOptions} users={data?.users ?? []} showDropHint={false} renderEntryPanel={renderPhoneEntryPanel} compactActions={isWorkspaceDevice} />
        ) : null}

        {mode === "threeDays" ? (
          <WeekCalendar days={threeDays} groupedEntries={groupedEntries} onStatusChange={onStatusChange} onDrop={handleTemplateDrop} onDragOver={handleDragOver} onOpenEntry={openEntryDetail} onQuickEdit={openEntryQuickEdit} onLongPressSelect={activateSelection} onContextMenuEntry={openContextMenu} onStartLive={startLiveTraining} onFeedback={openFeedback} onDuplicate={duplicateEntry} onDelete={onDelete} selectionMode={selectionMode} selectedIds={selectedIds} onSelect={updateSelection} groups={groupOptions} athletes={athleteOptions} users={data?.users ?? []} compact showDropHint={false} renderEntryPanel={renderPhoneEntryPanel} compactActions={isWorkspaceDevice} />
        ) : null}

        {mode === "list" ? (
          <AgendaList entries={filteredEntries} onOpenEntry={openEntryDetail} onStartLive={startLiveTraining} onFeedback={openFeedback} groups={groupOptions} athletes={athleteOptions} users={data?.users ?? []} renderEntryPanel={renderPhoneEntryPanel} />
        ) : null}

        {mode === "year" ? (
          <YearCalendar months={yearMonths} groupedEntries={groupedEntries} onSelectDate={(date) => { setFocusDate(date); setMode("month"); }} />
        ) : null}

        {mode === "season" ? (
          <PeriodizationCalendar months={periodizationMonths} templates={periodizationTemplates} />
        ) : null}

      </main>

      {contextMenu ? (
        <div className="master-card-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} role="menu" aria-label="Training Kontextmenü">
          <button type="button" role="menuitem" onClick={() => { activateSelection(contextMenu.entry.id); setContextMenu(null); }}>Auswählen</button>
          <button type="button" role="menuitem" onClick={() => openEntryDetail(contextMenu.entry.id)}>Öffnen</button>
          <button type="button" role="menuitem" onClick={() => openEntryQuickEdit(contextMenu.entry)}>Bearbeiten</button>
          <button type="button" role="menuitem" onClick={() => { duplicateEntry(contextMenu.entry); setContextMenu(null); }}>Duplizieren</button>
          <button type="button" role="menuitem" onClick={() => { onStatusChange(contextMenu.entry.id, "completed"); setContextMenu(null); }}>Status erledigt</button>
          <button type="button" role="menuitem" onClick={() => { setTaskEntry(contextMenu.entry); setContextMenu(null); }}>Traineraufgabe</button>
          <button type="button" role="menuitem" onClick={() => openEntryQuickEdit(contextMenu.entry)}>Als Vorlage speichern</button>
          {onDelete ? <button className="is-danger" type="button" role="menuitem" onClick={() => { if (window.confirm("Training löschen?")) onDelete(contextMenu.entry.id); setContextMenu(null); }}>Löschen</button> : null}
        </div>
      ) : null}

      {!isPhone && hasContextContent ? (
        <>
          {usesOverlayContext ? <button type="button" className="master-calendar-context-backdrop" aria-label="Kalender-Kontext schliessen" onClick={closeContext} /> : null}
          <aside className={`master-calendar-context${usesOverlayContext ? " is-overlay" : ""}`} aria-label="Kalender-Kontext">
            {usesOverlayContext ? (
              <header className="master-calendar-context-header">
                <strong>{contextTitle}</strong>
                <button type="button" onClick={closeContext} aria-label="Kalender-Kontext schliessen">Schliessen</button>
              </header>
            ) : null}
            {contextContent}
          </aside>
        </>
      ) : null}

      {isPhone && quickEdit ? (
        <TrainingQuickEdit
          state={quickEdit}
          groups={groupOptions}
          athletes={athleteOptions}
          trainers={trainerOptions}
          onChange={setQuickEdit}
          onCancel={() => setQuickEdit(null)}
          onSave={saveQuickEdit}
          onOpenFullPlan={() => {
            setQuickEdit(null);
            onOpenPlan();
          }}
        />
      ) : null}

      {!isPhone && feedbackEntry ? (
        <FeedbackSheet entry={feedbackEntry} onCancel={() => setFeedbackEntry(null)} onSave={applyFeedback} />
      ) : null}

      {!isPhone && taskEntry && onDataChange && user ? (
        <TrainingTaskSheet entry={taskEntry} trainers={trainerOptions} user={user} onCancel={() => setTaskEntry(null)} onSave={createTrainingTask} />
      ) : null}

      {!isPhone && liveTraining ? (
        <LiveTrainingMode state={liveTraining} onChange={setLiveTraining} onEnd={openFeedback} />
      ) : null}

      {weekCopyOpen ? (
        <WeekCopyDialog sourceWeek={weekDays} entries={weekEntries} onCancel={() => setWeekCopyOpen(false)} onCopy={copyWeek} />
      ) : null}

      {isPhone && mobileFiltersOpen ? (
        <MobileFilterSheet
          query={query}
          areaFilter={areaFilter}
          statusFilter={statusFilter}
          onQueryChange={setQuery}
          onAreaChange={setAreaFilter}
          onStatusChange={setStatusFilter}
          onClose={() => setMobileFiltersOpen(false)}
        />
      ) : null}
    </div>
  );
}

function MobileFilterSheet({
  query,
  areaFilter,
  statusFilter,
  onQueryChange,
  onAreaChange,
  onStatusChange,
  onClose,
}: {
  query: string;
  areaFilter: "all" | TrainingArea;
  statusFilter: "all" | PlanStatus;
  onQueryChange: (value: string) => void;
  onAreaChange: (value: "all" | TrainingArea) => void;
  onStatusChange: (value: "all" | PlanStatus) => void;
  onClose: () => void;
}) {
  const swipeHandlers = useMobileSwipeDismiss(onClose);
  return (
    <div className="mobile-sheet-backdrop" role="dialog" aria-modal="true" aria-label="Kalenderfilter" {...swipeHandlers}>
      <section className="mobile-filter-sheet">
        <header>
          <div>
            <p className="po-eyebrow">Kalender</p>
            <h2>Filter</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Filter schließen">×</button>
        </header>
        <label>
          Suche
          <input value={query} onChange={(event) => onQueryChange(event.currentTarget.value)} placeholder="Training, Fokus, Gruppe" />
        </label>
        <label>
          Kategorie
          <select value={areaFilter} onChange={(event) => onAreaChange(event.currentTarget.value as "all" | TrainingArea)}>
            <option value="all">Alle</option>
            {trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => onStatusChange(event.currentTarget.value as "all" | PlanStatus)}>
            <option value="all">Alle</option>
            {Object.entries(planStatusLabels).slice(0, 6).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
          </select>
        </label>
        <footer>
          <PaddlioOneButton variant="secondary" onClick={() => { onQueryChange(""); onAreaChange("all"); onStatusChange("all"); }}>Zurücksetzen</PaddlioOneButton>
          <PaddlioOneButton variant="primary" onClick={onClose}>Anwenden</PaddlioOneButton>
        </footer>
      </section>
    </div>
  );
}

function createEntryQuickEdit(entry: PlanEntry): QuickEditState {
  return {
    template: {
      id: entry.templateId || `entry-template-${entry.id}`,
      ownerUserId: entry.ownerUserId,
      clubId: entry.clubId,
      createdByUserId: entry.createdByUserId,
      title: entry.title || entry.trainingType,
      category: (entry.area || entry.trainingType) as TrainingTemplate["category"],
      trainingArea: entry.area,
      trainingType: entry.trainingType,
      boatClass: entry.boatClass,
      defaultDurationMinutes: entry.durationMinutes,
      defaultIntensity: entry.intensity,
      focus: entry.focus || entry.goal || "",
      description: entry.description || "",
      notes: entry.notes || entry.note || "",
      tags: [entry.area, entry.trainingType].filter(Boolean),
      isFavorite: false,
      visibility: "private",
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    },
    entryId: entry.id,
    status: entry.status,
    date: entry.date,
    startTime: entry.startTime || entry.time || "17:30",
    durationMinutes: entry.durationMinutes,
    assignedType: entry.assignedType,
    targetId: entry.assignedGroupId || entry.assignedGroupIds[0] || entry.assignedAthleteId || entry.assignedAthleteIds[0] || entry.ownerUserId,
    trainerId: entry.createdByUserId,
    place: entry.note?.startsWith("Ort: ") ? entry.note.slice(5) : "",
    boatClass: entry.boatClass || "none",
    repeat: entry.repeat || "none",
    repeatUntil: entry.repeatUntil || "",
    repeatMaxCount: entry.repeatMaxCount ?? "",
    individualNote: entry.feedbackNote || "",
  };
}

function CalendarFilterPanel({
  query,
  areaFilter,
  statusFilter,
  onQueryChange,
  onAreaChange,
  onStatusChange,
  onReset,
}: {
  query: string;
  areaFilter: "all" | TrainingArea;
  statusFilter: "all" | PlanStatus;
  onQueryChange: (value: string) => void;
  onAreaChange: (value: "all" | TrainingArea) => void;
  onStatusChange: (value: "all" | PlanStatus) => void;
  onReset: () => void;
}) {
  return (
    <PaddlioOneCard className="master-filter-panel">
      <div className="po-card-heading-row">
        <div>
          <p className="po-eyebrow">Kalender</p>
          <h2>Filter</h2>
        </div>
        <PaddlioOneButton variant="ghost" onClick={onReset}>Reset</PaddlioOneButton>
      </div>
      <div className="master-filter-form">
        <label>
          Suche
          <input value={query} onChange={(event) => onQueryChange(event.currentTarget.value)} placeholder="Training, Fokus, Gruppe" />
        </label>
        <label>
          Bereich
          <select value={areaFilter} onChange={(event) => onAreaChange(event.currentTarget.value as "all" | TrainingArea)}>
            <option value="all">Alle</option>
            {trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => onStatusChange(event.currentTarget.value as "all" | PlanStatus)}>
            <option value="all">Alle</option>
            {Object.entries(planStatusLabels).slice(0, 6).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
          </select>
        </label>
      </div>
    </PaddlioOneCard>
  );
}

function MonthCalendar({
  days,
  groupedEntries,
  focusDate,
  onSelectDate,
  onDrop,
  onDragOver,
  onOpenEntry,
  onQuickEdit,
  onLongPressSelect,
  onContextMenuEntry,
  selectionMode,
  selectedIds,
  onSelect,
  showDropHint = false,
}: {
  days: string[];
  groupedEntries: Map<string, PlanEntry[]>;
  focusDate: string;
  onSelectDate: (date: string) => void;
  onDrop: (date: string) => void;
  onDragOver: (event: DragEvent) => void;
  onOpenEntry: (id: string) => void;
  onQuickEdit: (entry: PlanEntry) => void;
  onLongPressSelect: (id: string) => void;
  onContextMenuEntry: (entry: PlanEntry, x: number, y: number) => void;
  selectionMode: boolean;
  selectedIds: string[];
  onSelect: (id: string, checked: boolean) => void;
  showDropHint?: boolean;
}) {
  const focusMonth = parseLocalDateOnly(focusDate).getMonth();
  return (
    <PaddlioOneCard className="master-calendar-card">
      <div className="master-calendar-grid-head">
        {weekdays.map((day) => <span key={day}>{day.slice(0, 2)}</span>)}
      </div>
      <div className="master-calendar-month-grid">
        {days.map((day) => {
          const entries = groupedEntries.get(day) ?? [];
          const isOtherMonth = parseLocalDateOnly(day).getMonth() !== focusMonth;
          return (
            <button className={`master-calendar-day ${isOtherMonth ? "is-muted" : ""} ${day === focusDate ? "is-selected" : ""}`} key={day} type="button" onClick={() => onSelectDate(day)} onDragOver={onDragOver} onDrop={() => onDrop(day)}>
              <strong>{dayNumber(day)}</strong>
              {showDropHint && entries.length === 0 ? <p className="master-calendar-empty-drop is-active">Hier ablegen</p> : null}
              {entries.slice(0, 3).map((entry) => (
                <TrainingPill entry={entry} key={entry.id} compact onOpen={onOpenEntry} onQuickEdit={onQuickEdit} onLongPressSelect={onLongPressSelect} onContextMenuEntry={onContextMenuEntry} selectionMode={selectionMode} selected={selectedIds.includes(entry.id)} onSelect={onSelect} />
              ))}
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
  onOpenEntry,
  onQuickEdit,
  onLongPressSelect,
  onContextMenuEntry,
  onStartLive,
  onFeedback,
  onDuplicate,
  onDelete,
  selectionMode,
  selectedIds,
  onSelect,
  groups,
  athletes,
  users,
  compact = false,
  showDropHint = true,
  renderEntryPanel,
  compactActions = false,
}: {
  days: string[];
  groupedEntries: Map<string, PlanEntry[]>;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onDrop: (date: string) => void;
  onDragOver: (event: DragEvent) => void;
  onOpenEntry: (id: string) => void;
  onQuickEdit: (entry: PlanEntry) => void;
  onLongPressSelect: (id: string) => void;
  onContextMenuEntry: (entry: PlanEntry, x: number, y: number) => void;
  onStartLive: (entry: PlanEntry) => void;
  onFeedback: (entry: PlanEntry) => void;
  onDuplicate: (entry: PlanEntry) => void;
  onDelete?: (id: string) => void;
  selectionMode: boolean;
  selectedIds: string[];
  onSelect: (id: string, checked: boolean) => void;
  groups: CoachGroup[];
  athletes: CoachAthlete[];
  users: User[];
  compact?: boolean;
  showDropHint?: boolean;
  renderEntryPanel?: (entry: PlanEntry) => ReactNode;
  compactActions?: boolean;
}) {
  return (
    <PaddlioOneCard className={`master-calendar-card master-week-calendar-card ${compact ? "is-compact" : ""}`.trim()}>
      <div className="master-calendar-week-grid">
        {days.map((day) => {
          const entries = groupedEntries.get(day) ?? [];
          return (
            <section className="master-calendar-week-day" key={day} onDragOver={onDragOver} onDrop={() => onDrop(day)}>
              <header>
                <span>{getLocalWeekdayLabel(day).slice(0, 2)}</span>
                <strong>{shortDateLabel(day)}</strong>
              </header>
              <div className="master-calendar-entry-stack">
                {entries.length > 0 ? entries.map((entry) => (
                  <div className="master-calendar-entry-with-panel" data-calendar-entry-id={entry.id} key={entry.id}>
                    <TrainingBlock entry={entry} onStatusChange={onStatusChange} onOpenEntry={onOpenEntry} onQuickEdit={onQuickEdit} onLongPressSelect={onLongPressSelect} onContextMenuEntry={onContextMenuEntry} onStartLive={onStartLive} onFeedback={onFeedback} onDuplicate={onDuplicate} onDelete={onDelete} selectionMode={selectionMode} selected={selectedIds.includes(entry.id)} onSelect={onSelect} assignedLabel={getAssignedLabel(entry, groups, athletes, users)} compactActions={compactActions} />
                    {renderEntryPanel?.(entry)}
                  </div>
                )) : <p className="master-calendar-empty-drop">{showDropHint ? "Vorlage hier ablegen" : "Keine Einträge"}</p>}
              </div>
            </section>
          );
        })}
      </div>
    </PaddlioOneCard>
  );
}

function DayCalendar(props: Omit<Parameters<typeof WeekCalendar>[0], "days" | "compact" | "groupedEntries"> & { date: string; entries: PlanEntry[] }) {
  const grouped = new Map<string, PlanEntry[]>([[props.date, props.entries]]);
  return <WeekCalendar {...props} days={[props.date]} groupedEntries={grouped} compact />;
}

function TrainingBlock({
  entry,
  assignedLabel,
  onStatusChange,
  onOpenEntry,
  onQuickEdit,
  onLongPressSelect,
  onContextMenuEntry,
  onStartLive,
  onFeedback,
  onDuplicate,
  onDelete,
  selectionMode,
  selected,
  onSelect,
  compactActions = false,
}: {
  entry: PlanEntry;
  assignedLabel: string;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onOpenEntry: (id: string) => void;
  onQuickEdit: (entry: PlanEntry) => void;
  onLongPressSelect: (id: string) => void;
  onContextMenuEntry: (entry: PlanEntry, x: number, y: number) => void;
  onStartLive: (entry: PlanEntry) => void;
  onFeedback: (entry: PlanEntry) => void;
  onDuplicate: (entry: PlanEntry) => void;
  onDelete?: (id: string) => void;
  selectionMode: boolean;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  compactActions?: boolean;
}) {
  const summary = buildCalendarTrainingSummary(entry);
  const tone = summary.tone;
  const timeRange = `${summary.startTime} - ${summary.endTime}`;
  const pressTimerRef = useRef<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const clearPressTimer = () => {
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  };
  const clearClickTimer = () => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = null;
  };
  const startPressTimer = () => {
    clearPressTimer();
    longPressFiredRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      onLongPressSelect(entry.id);
    }, 420);
  };
  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (selectionMode || event.shiftKey || event.ctrlKey || event.metaKey) {
      clearClickTimer();
      onSelect(entry.id, !selected);
      return;
    }
    clearClickTimer();
    clickTimerRef.current = window.setTimeout(() => onOpenEntry(entry.id), 220);
  };
  return (
    <article
      className={`master-training-block po-tone-${tone}${compactActions ? " is-tablet-compact is-vivendi-summary" : ""}${selected ? " is-selected" : ""}`}
      role="option"
      aria-selected={selected}
    >
      {selectionMode ? (
        <input className="master-training-select" aria-label={`${entry.title || entry.trainingType} auswählen`} checked={selected} type="checkbox" onChange={(event) => onSelect(entry.id, event.currentTarget.checked)} />
      ) : null}
      <button
        className="master-training-block-main"
        type="button"
        onClick={handleOpen}
        onDoubleClick={(event) => {
          event.preventDefault();
          clearClickTimer();
          onQuickEdit(entry);
        }}
        onPointerDown={startPressTimer}
        onPointerUp={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onPointerCancel={clearPressTimer}
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenuEntry(entry, event.clientX, event.clientY);
        }}
        aria-label={`${summary.startTime} bis ${summary.endTime}, ${summary.title}, ${summary.category}`}
      >
        {compactActions ? (
          <>
            <small className="master-training-time">{timeRange}</small>
            <strong>{summary.title}</strong>
            <span className="master-training-summary-meta">
              <b>{summary.category}</b>
              {summary.done || summary.skipped ? <span aria-label={`Status ${planStatusLabels[entry.status] ?? summary.statusLabel}`}>{summary.statusLabel}</span> : null}
            </span>
          </>
        ) : (
          <>
            <strong>{summary.title}</strong>
            <small>{`${timeRange} · ${entry.durationMinutes} min · ${assignedLabel}`}</small>
            <span>{entry.focus || entry.goal || "Fokus offen"}</span>
          </>
        )}
      </button>
      <div className="master-training-block-actions">
        {compactActions ? (
          <span className={`master-status-mini po-tone-${summary.done ? "success" : summary.skipped ? "danger" : "info"}`} aria-label={`Status ${planStatusLabels[entry.status] ?? entry.status}`}>
            <span aria-hidden="true" />
            {summary.statusLabel}
          </span>
        ) : (
          <PaddlioOneStatusChip tone={summary.done ? "success" : summary.skipped ? "danger" : "info"}>{planStatusLabels[entry.status] ?? entry.status}</PaddlioOneStatusChip>
        )}
        {compactActions ? (
          <button
            className="master-training-menu-button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              onContextMenuEntry(entry, rect.left, rect.bottom + 6);
            }}
            aria-label="Training Aktionen öffnen"
          >
            ...
          </button>
        ) : (
          <>
            <button type="button" onClick={() => onStartLive(entry)}>Start</button>
            <button type="button" onClick={() => onFeedback(entry)}>Feedback</button>
            <button type="button" onClick={() => onDuplicate(entry)}>Kopie</button>
            {!summary.done ? <button type="button" onClick={() => onStatusChange(entry.id, "completed")}>Erledigt</button> : null}
            {onDelete ? <button className="is-danger" type="button" onClick={() => onDelete(entry.id)}>Löschen</button> : null}
          </>
        )}
      </div>
    </article>
  );
}

function TrainingPill({
  entry,
  compact = false,
  onOpen,
  onQuickEdit,
  onLongPressSelect,
  onContextMenuEntry,
  selectionMode,
  selected,
  onSelect,
}: {
  entry: PlanEntry;
  compact?: boolean;
  onOpen: (id: string) => void;
  onQuickEdit: (entry: PlanEntry) => void;
  onLongPressSelect: (id: string) => void;
  onContextMenuEntry: (entry: PlanEntry, x: number, y: number) => void;
  selectionMode: boolean;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) {
  const pressTimerRef = useRef<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const clearPressTimer = () => {
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  };
  const clearClickTimer = () => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = null;
  };
  const startPressTimer = () => {
    clearPressTimer();
    longPressFiredRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      onLongPressSelect(entry.id);
    }, 420);
  };
  return (
    <span
      className={`master-training-pill po-tone-${categoryTone(entry.area || entry.trainingType)} ${compact ? "is-compact" : ""} ${selected ? "is-selected" : ""}`.trim()}
      role="option"
      aria-selected={selected}
    >
      {selectionMode ? <input aria-label={`${entry.title || entry.trainingType} auswählen`} checked={selected} type="checkbox" onChange={(event) => onSelect(entry.id, event.currentTarget.checked)} onClick={(event) => event.stopPropagation()} /> : null}
      <span
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
          if (longPressFiredRef.current) {
            longPressFiredRef.current = false;
            return;
          }
          if (selectionMode || event.shiftKey || event.ctrlKey || event.metaKey) {
            clearClickTimer();
            onSelect(entry.id, !selected);
          } else {
            clearClickTimer();
            clickTimerRef.current = window.setTimeout(() => onOpen(entry.id), 220);
          }
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          clearClickTimer();
          onQuickEdit(entry);
        }}
        onPointerDown={startPressTimer}
        onPointerUp={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onPointerCancel={clearPressTimer}
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenuEntry(entry, event.clientX, event.clientY);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (selectionMode) onSelect(entry.id, !selected);
            else onOpen(entry.id);
          }
        }}
      >
        {entry.startTime || entry.time ? `${shortTimeLabel(entry.startTime || entry.time)} · ` : ""}{entry.title || entry.trainingType}
      </span>
    </span>
  );
}

function TemplatePanel({
  templates,
  scope,
  onScopeChange,
  onDragStart,
  onDragEnd,
  onQuickInsert,
  onOpenPlan,
}: {
  templates: TrainingTemplate[];
  scope: TemplateScope;
  onScopeChange: (scope: TemplateScope) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onQuickInsert: (template: TrainingTemplate) => void;
  onOpenPlan: () => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const templateMode: "training" | "week" | "season" = scope === "weeks" ? "week" : scope === "season" ? "season" : "training";
  const filteredTemplates = templates.filter((template) => {
    if (scope === "favorites") return template.isFavorite || template.id.startsWith("system-calendar");
    if (scope === "mine") return template.visibility === "private";
    if (scope === "club") return template.visibility === "club";
    if (scope === "system") return template.ownerUserId === "paddlio-system";
    return true;
  }).filter((template) => {
    const haystack = [template.title, template.category, template.trainingArea, template.trainingType, template.focus, ...template.tags].join(" ").toLowerCase();
    const normalizedCategory = categoryFilter.toLowerCase();
    const categoryMatch = categoryFilter === "all" || haystack.includes(normalizedCategory) || (categoryFilter === "ga" && /\bga[12]\b/i.test(haystack));
    const searchMatch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    return categoryMatch && searchMatch;
  });
  const categoryFilters = [
    ["all", "Alle"],
    ["ga", "GA"],
    ["technik", "Technik"],
    ["kraft", "Kraft"],
    ["wettkampf", "Wettkampf"],
    ["regeneration", "Regeneration"],
  ];

  return (
    <section className="master-template-panel" aria-label="Vorlagenbibliothek">
      <PaddlioOneCard className="master-template-picker-card">
        <div className="po-card-heading-row">
          <div>
            <p className="po-eyebrow">Vorlagen</p>
            <h2>{templateMode === "week" ? "Wochen" : templateMode === "season" ? "Saison" : "Training"}</h2>
          </div>
          <PaddlioOneButton variant="ghost" icon="more" onClick={onOpenPlan}>Alle</PaddlioOneButton>
        </div>
        <div className="master-template-primary-tabs" aria-label="Vorlagenart">
          {([
            ["favorites", "Training"],
            ["weeks", "Woche"],
            ["season", "Saison"],
          ] as Array<[TemplateScope, string]>).map(([item, label]) => (
            <button key={item} className={scope === item ? "is-active" : ""} type="button" onClick={() => onScopeChange(item)}>
              {label}
            </button>
          ))}
        </div>
        {templateMode === "training" ? (
          <>
            <label className="master-template-search">
              <span>Suche</span>
              <input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Training suchen..." />
            </label>
            <div className="master-template-tabs" aria-label="Vorlagenquelle filtern">
              {([
                ["favorites", "Favoriten"],
                ["mine", "Meine"],
                ["club", "Verein"],
                ["system", "System"],
              ] as Array<[TemplateScope, string]>).map(([item, label]) => (
                <button key={item} className={scope === item ? "is-active" : ""} type="button" onClick={() => onScopeChange(item)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="master-template-category-tabs" aria-label="Vorlagenkategorie filtern">
              {categoryFilters.map(([value, label]) => (
                <button key={value} className={categoryFilter === value ? "is-active" : ""} type="button" onClick={() => setCategoryFilter(value)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="master-template-card-list">
              {filteredTemplates.slice(0, 10).map((template) => (
                <TemplateCard template={template} key={template.id} onDragStart={onDragStart} onDragEnd={onDragEnd} onQuickInsert={onQuickInsert} />
              ))}
              {filteredTemplates.length === 0 ? (
                <div className="master-template-empty">
                  <strong>Keine Vorlagen gefunden.</strong>
                  <button type="button" onClick={() => { setSearch(""); setCategoryFilter("all"); onScopeChange("favorites"); }}>Filter zurücksetzen</button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {templateMode === "week" ? (
          <div className="master-template-card-list">
            {weeklyPlanningTemplates.slice(0, 6).map((template) => (
              <button className="master-week-template-row" key={template.id} type="button" onClick={onOpenPlan}>
                <strong>{normalizeText(template.title)}</strong>
                <span>{template.items.length} Einheiten</span>
                <em>Details</em>
              </button>
            ))}
          </div>
        ) : null}
        {templateMode === "season" ? (
          <div className="master-template-card-list">
            {seasonPlanningBlocks.slice(0, 6).map((block) => (
              <button className="master-week-template-row" key={block.id} type="button" onClick={onOpenPlan}>
                <strong>{normalizeText(block.title)}</strong>
                <span>{block.weeklyTemplateIds.length} Wochen</span>
                <em>Details</em>
              </button>
            ))}
          </div>
        ) : null}
      </PaddlioOneCard>
    </section>
  );
}

function TemplateCard({ template, onDragStart, onDragEnd, onQuickInsert }: { template: TrainingTemplate; onDragStart: (id: string) => void; onDragEnd: () => void; onQuickInsert: (template: TrainingTemplate) => void }) {
  const tone = categoryTone(template.category || template.trainingArea || template.trainingType);
  return (
    <article className={`master-template-card po-tone-${tone}`} draggable onDragStart={() => onDragStart(template.id)} onDragEnd={onDragEnd} aria-label={`${template.title} in Kalender ziehen`}>
      <span className="master-template-icon" aria-hidden="true" />
      <button type="button" onClick={() => onQuickInsert(template)}>
        <strong>{template.title}</strong>
        <small>{template.category || template.trainingArea} - {template.defaultDurationMinutes ?? 60} min - {template.defaultIntensity}</small>
      </button>
      <em aria-label={template.isFavorite ? "Favorit" : "Vorlage verwenden"}>{template.isFavorite ? "*" : ">"}</em>
    </article>
  );
}

function useMobileSwipeDismiss(onDismiss: () => void, confirmMessage?: string) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const dismiss = () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    onDismiss();
  };
  return {
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      startRef.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      const start = startRef.current;
      const touch = event.changedTouches[0];
      startRef.current = null;
      if (!start || !touch) return;
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const edgeBack = start.x <= 32 && deltaX > 72 && Math.abs(deltaY) < 80;
      const sheetDown = deltaY > 90 && Math.abs(deltaX) < 80;
      if (edgeBack || sheetDown) dismiss();
    },
  };
}

function TrainingQuickEdit({
  state,
  groups,
  athletes,
  trainers,
  onChange,
  onCancel,
  onSave,
  onOpenFullPlan,
  presentation = "modal",
}: {
  state: QuickEditState;
  groups: CoachGroup[];
  athletes: CoachAthlete[];
  trainers: User[];
  onChange: (state: QuickEditState) => void;
  onCancel: () => void;
  onSave: (state: QuickEditState) => void;
  onOpenFullPlan: () => void;
  presentation?: "modal" | "context";
}) {
  const requestCancel = () => {
    if (window.confirm("Änderungen verwerfen?")) onCancel();
  };
  const swipeHandlers = useMobileSwipeDismiss(requestCancel);
  const repeatCount = state.repeat === "none" ? 1 : expandTrainingRepeatDates(state.date, state.repeat, state.repeatUntil, typeof state.repeatMaxCount === "number" ? state.repeatMaxCount : undefined).length;
  const submitLabel = state.entryId ? "Speichern" : "Einfügen";
  const adjustDuration = (amount: number) => onChange({ ...state, durationMinutes: Math.max(10, Math.min(360, Number(state.durationMinutes) + amount)) });
  const form = (
      <form className="master-quick-edit" onSubmit={(event) => { event.preventDefault(); onSave(state); }} {...swipeHandlers}>
        <header>
          <div>
            <p className="po-eyebrow">Quick Edit</p>
            <h2>{state.template.title}</h2>
          </div>
          <div className="master-quick-edit-header-actions">
            <details>
              <summary aria-label="Weitere Aktionen">...</summary>
              <div>
                <button type="button" onClick={onOpenFullPlan}>Vollständig bearbeiten</button>
                <button type="button" onClick={onOpenFullPlan}>Als Vorlage speichern</button>
              </div>
            </details>
            <button type="button" onClick={requestCancel} aria-label="Schließen">×</button>
          </div>
        </header>
        <div className="master-quick-status-row">
          <span>Status</span>
          <select aria-label="Status" value={state.status || "planned"} onChange={(event) => onChange({ ...state, status: event.currentTarget.value as PlanStatus })}>
            {Object.entries(planStatusLabels).slice(0, 6).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
          </select>
        </div>
        <div className="master-quick-inline-list">
          <label>Datum<input type="date" value={state.date} onChange={(event) => onChange({ ...state, date: event.currentTarget.value })} /></label>
          <label>Start<input type="time" value={state.startTime} onChange={(event) => onChange({ ...state, startTime: event.currentTarget.value })} /></label>
          <label className="master-duration-inline">Dauer<span><button type="button" onClick={() => adjustDuration(-5)} aria-label="5 Minuten verringern">-5</button><input aria-label="Dauer" type="number" min="10" max="360" value={state.durationMinutes} onChange={(event) => onChange({ ...state, durationMinutes: Number(event.currentTarget.value) || 60 })} /><button type="button" onClick={() => adjustDuration(5)} aria-label="5 Minuten erhöhen">+5</button></span></label>
          <label>Boot<select value={state.boatClass} onChange={(event) => onChange({ ...state, boatClass: event.currentTarget.value as TrainingBoatClass })}><option value="none">Kein Boot</option><option value="K1">K1</option><option value="C1">C1</option><option value="K1+C1">K1+C1</option></select></label>
          <label>Zuweisung<select value={state.assignedType} onChange={(event) => onChange({ ...state, assignedType: event.currentTarget.value as TrainingAssignedType, targetId: "" })}><option value="self">Eigenes Training</option><option value="group">Gruppe</option><option value="athlete">Sportler</option></select></label>
          <label>Ziel<select value={state.targetId} onChange={(event) => onChange({ ...state, targetId: event.currentTarget.value })}>
            <option value="">Automatisch</option>
            {state.assignedType === "group" ? groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>) : null}
            {state.assignedType === "athlete" ? athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{getAthleteName(athlete)}</option>) : null}
          </select></label>
          <label>Ort<input value={state.place} onChange={(event) => onChange({ ...state, place: event.currentTarget.value })} placeholder="optional" /></label>
        </div>
        <details className="master-quick-more">
          <summary>Weitere Details</summary>
          <div className="master-form-grid">
            <label>Trainer<select value={state.trainerId} onChange={(event) => onChange({ ...state, trainerId: event.currentTarget.value })}>{trainers.map((trainer) => <option key={trainer.userId} value={trainer.userId}>{getUserName(trainer)}</option>)}</select></label>
            <label>Wiederholung<select value={state.repeat} onChange={(event) => onChange({ ...state, repeat: event.currentTarget.value as TrainingRepeat })}>{Object.entries(repeatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Bis<input type="date" value={state.repeatUntil} disabled={state.repeat === "none"} onChange={(event) => onChange({ ...state, repeatUntil: event.currentTarget.value })} /></label>
            <label>Anzahl<input type="number" min="1" max="90" value={state.repeatMaxCount} disabled={state.repeat === "none"} onChange={(event) => onChange({ ...state, repeatMaxCount: Number(event.currentTarget.value) || "" })} /></label>
            <label className="master-full-field">Individuelle Anpassung<textarea value={state.individualNote} onChange={(event) => onChange({ ...state, individualNote: event.currentTarget.value })} placeholder="z. B. Fokus, Material, Athlet beachten" /></label>
          </div>
        </details>
        {state.repeat !== "none" ? <p className="master-hint">Vorschau: {repeatCount} Termine werden angelegt. Nichts wird überschrieben.</p> : null}
        <footer>
          <PaddlioOneButton variant="ghost" onClick={requestCancel}>Abbrechen</PaddlioOneButton>
          <PaddlioOneButton variant="primary" type="submit">{submitLabel}</PaddlioOneButton>
        </footer>
      </form>
  );
  if (presentation === "context") {
    return (
      <section className="master-context-section" aria-label="Training schnell einfügen">
        {form}
      </section>
    );
  }
  return (
    <div className="master-modal-backdrop" role="dialog" aria-modal="true" aria-label="Training schnell einfügen">
      {form}
    </div>
  );
}

function TrainingDetailDrawer({
  entry,
  journal,
  feedback,
  tasks,
  taskAssignments,
  groups,
  athletes,
  users,
  user,
  onClose,
  onStatusChange,
  onStartLive,
  onFeedback,
  onCreateTask,
  onDuplicate,
  onDelete,
  onDeleteSeries,
  entries,
  presentation = "drawer",
}: {
  entry: PlanEntry;
  journal: TrainingJournalEntry[];
  feedback: TrainingFeedback[];
  tasks: PaddleMotionData["tasks"];
  taskAssignments: PaddleMotionData["taskAssignments"];
  groups: CoachGroup[];
  athletes: CoachAthlete[];
  users: User[];
  user?: User;
  onClose: () => void;
  onStatusChange: (id: string, status: PlanStatus) => void;
  onStartLive: (entry: PlanEntry) => void;
  onFeedback: (entry: PlanEntry) => void;
  onCreateTask?: (entry: PlanEntry) => void;
  onDuplicate: (entry: PlanEntry) => void;
  onDelete?: (id: string) => void;
  onDeleteSeries?: (id: string) => void;
  entries: PlanEntry[];
  presentation?: "drawer" | "context" | "inline";
}) {
  const [tab, setTab] = useState<DetailTab>("planning");
  const [showDescription, setShowDescription] = useState(false);
  const trainingJournal = journal.find((item) => item.trainingPlanEntryId === entry.id || item.trainingId === entry.id);
  const trainingFeedback = feedback.filter((item) => item.trainingId === entry.id);
  const trainingTasks = tasks.filter((task) => task.relatedTrainingId === entry.id && !task.deletedAt);
  const repeatSeriesEntries = getTrainingRepeatSeriesEntries(entries, entry);
  const canDeleteSeries = repeatSeriesEntries.length > 1;
  const plannedDuration = entry.durationMinutes;
  const actualDuration = trainingJournal?.actualDurationMinutes;
  const plannedIntensity = entry.intensity;
  const actualIntensity = trainingJournal?.perceivedExertion;
  const feedbackState = trainingFeedback.length > 0 ? "Gespeichert" : "Offen";
  const assignedLabel = getAssignedLabel(entry, groups, athletes, users);
  const isCoach = user?.role === "coach" || user?.role === "admin" || user?.role === "clubAdmin";
  const swipeHandlers = useMobileSwipeDismiss(onClose);
  const startTime = entry.startTime || entry.time;
  const endTime = entry.endTime || addMinutesToTime(startTime, entry.durationMinutes);
  const focusText = entry.focus || entry.goal || "Noch offen";

  return (
    <aside className={`master-detail-drawer ${presentation === "context" ? "is-context" : ""} ${presentation === "inline" ? "is-inline" : ""}`.trim()} aria-label="Training Details" data-testid="training-detail-panel" data-training-entry-id={entry.id} {...swipeHandlers}>
      <header>
        <div>
          <p className="po-eyebrow">{entry.area}</p>
          <h2>{entry.title || entry.trainingType}</h2>
          <span>{fullDateLabel(entry.date)} · {startTime}-{endTime} · {planStatusLabels[entry.status] ?? entry.status}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Details schließen">×</button>
      </header>
      <nav className="master-detail-tabs" aria-label="Training Detailbereiche">
        {(["planning", "execution", "feedback", "tasks"] as DetailTab[]).map((item) => (
          <button key={item} className={tab === item ? "is-active" : ""} type="button" onClick={() => setTab(item)}>
            {item === "planning" ? "Planung" : item === "execution" ? "Durchführung" : item === "feedback" ? "Feedback" : "Aufgaben"}
          </button>
        ))}
      </nav>
      {tab === "planning" ? (
        <section className="master-detail-section">
          <InfoRow label="Status" value={planStatusLabels[entry.status] ?? entry.status} />
          <InfoRow label="Zeit" value={`${startTime}-${endTime}`} />
          <InfoRow label="Dauer" value={`${entry.durationMinutes} min`} />
          <InfoRow label="Bootsklasse" value={entry.boatClass} />
          <InfoRow label="Rückmeldung" value={feedbackState} />
          <div className="master-focus-summary">
            <span>Fokus</span>
            <p>{focusText}</p>
          </div>
          {entry.feedbackNote ? <InfoRow label="Anpassung" value={entry.feedbackNote} /> : null}
          {entry.description ? (
            <div className="master-collapsible-detail">
              {showDescription ? <p className="master-detail-text">{entry.description}</p> : null}
              <button type="button" onClick={() => setShowDescription((value) => !value)}>
                {showDescription ? "Weniger anzeigen" : "Mehr anzeigen"}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
      {tab === "execution" ? (
        <section className="master-detail-section">
          <PaddlioOneButton variant="primary" onClick={() => onStartLive(entry)}>Live-Modus starten</PaddlioOneButton>
          <InfoRow label="Status" value={planStatusLabels[entry.status] ?? entry.status} />
          <InfoRow label="Ist-Dauer" value={actualDuration ? `${actualDuration} min` : "Offen"} />
          <InfoRow label="Abschluss" value={trainingJournal?.completionStatus ?? "Noch nicht abgeschlossen"} />
          <div className="master-action-grid">
            <button type="button" onClick={() => onStatusChange(entry.id, "in_progress")}>Läuft</button>
            <button type="button" onClick={() => onStatusChange(entry.id, "completed")}>Durchgeführt</button>
            <button type="button" onClick={() => onStatusChange(entry.id, "partially_completed")}>Teilweise</button>
            <button type="button" onClick={() => onStatusChange(entry.id, "skipped")}>Übersprungen</button>
          </div>
        </section>
      ) : null}
      {tab === "feedback" ? (
        <section className="master-detail-section">
          <PaddlioOneButton variant="primary" onClick={() => onFeedback(entry)}>Feedback erfassen</PaddlioOneButton>
          {trainingFeedback.length > 0 ? trainingFeedback.map((item) => (
            <article className="master-feedback-row" key={item.id}>
              <strong>{item.status === "done" ? "Durchgeführt" : "Übersprungen"}</strong>
              <span>Gefühl {item.feeling}/5 · Belastung {item.difficulty}/10</span>
              {item.comment ? <p>{item.comment}</p> : null}
            </article>
          )) : <p className="po-muted">Noch kein Feedback gespeichert.</p>}
          <div className="master-target-actual-summary">
            <InfoRow label="Dauer" value={`Geplant ${plannedDuration} min · Ist ${actualDuration ? `${actualDuration} min` : "offen"}`} />
            <InfoRow label="Intensität" value={`Geplant ${plannedIntensity} · Empfunden ${actualIntensity ? `${actualIntensity}/10` : "offen"}`} />
          </div>
        </section>
      ) : null}
      {tab === "tasks" ? (
        <section className="master-detail-section">
          {isCoach && onCreateTask ? <PaddlioOneButton variant="primary" onClick={() => onCreateTask(entry)}>Traineraufgabe erstellen</PaddlioOneButton> : null}
          {trainingTasks.length > 0 ? trainingTasks.map((task) => {
            const assignment = taskAssignments.find((item) => item.taskId === task.id);
            const assignee = users.find((item) => item.userId === assignment?.assignedTo);
            return (
              <article className="master-task-row" key={task.id}>
                <strong>{task.title}</strong>
                <span>{trainingTaskTypeLabels[task.taskType]} · {trainingTaskPriorityLabels[task.priority]} · {assignee ? getUserName(assignee) : "Trainer"} · {assignment?.status ?? "offen"}</span>
                {task.description ? <p>{task.description}</p> : null}
              </article>
            );
          }) : <p className="po-muted">Noch keine Traineraufgaben an dieser Einheit.</p>}
        </section>
      ) : null}
      <footer className="master-detail-actions">
        <details>
          <summary>Aktionen</summary>
          <div>
            <button type="button" onClick={() => onDuplicate(entry)}>Duplizieren</button>
            {canDeleteSeries && onDeleteSeries ? <button className="is-danger" type="button" onClick={() => onDeleteSeries(entry.id)}>Serie löschen</button> : null}
            {onDelete ? <button className="is-danger" type="button" onClick={() => onDelete(entry.id)}>Löschen</button> : null}
          </div>
        </details>
      </footer>
    </aside>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return <div className="master-info-row"><span>{label}</span><strong>{value}</strong></div>;
}

function FeedbackSheet({
  entry,
  onCancel,
  onSave,
  presentation = "modal",
}: {
  entry: PlanEntry;
  onCancel: () => void;
  onSave: (entry: PlanEntry, status: CompletionStatus, formData: FormData) => void;
  presentation?: "modal" | "inline";
}) {
  const [status, setStatus] = useState<CompletionStatus>("completed");
  const [rpe, setRpe] = useState(5);
  const [feeling, setFeeling] = useState(4);
  const [fatigue, setFatigue] = useState(3);
  const [motivation, setMotivation] = useState(4);
  const requestCancel = () => {
    if (window.confirm("Feedback verwerfen?")) onCancel();
  };
  const swipeHandlers = useMobileSwipeDismiss(requestCancel);
  const form = (
      <form className={`master-feedback-sheet ${presentation === "inline" ? "master-feedback-inline-panel" : ""}`.trim()} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(entry, status, new FormData(event.currentTarget)); }} {...swipeHandlers}>
        <header>
          <div>
            <p className="po-eyebrow">Feedback</p>
            <h2>{entry.title || entry.trainingType}</h2>
          </div>
          <button type="button" onClick={requestCancel} aria-label="Schließen">×</button>
        </header>
        <div className="master-segmented-control">
          {(["completed", "partially_completed", "skipped"] as CompletionStatus[]).map((item) => (
            <button key={item} className={status === item ? "is-active" : ""} type="button" onClick={() => setStatus(item)}>
              {item === "completed" ? "Durchgeführt" : item === "partially_completed" ? "Teilweise" : "Übersprungen"}
            </button>
          ))}
        </div>
        <div className="master-feedback-grid">
          <label className="master-feedback-duration">Ist-Dauer<input name="actualDuration" type="number" min="0" defaultValue={entry.durationMinutes} /></label>
          <label className="master-feedback-range"><span>RPE <b>{rpe} / 10</b></span><input name="rpe" type="range" min="1" max="10" value={rpe} onChange={(event) => setRpe(Number(event.currentTarget.value))} /></label>
          <label className="master-feedback-range"><span>Gefühl <b>{feeling} / 5</b></span><input name="feeling" type="range" min="1" max="5" value={feeling} onChange={(event) => setFeeling(Number(event.currentTarget.value))} /></label>
          <label className="master-feedback-range"><span>Müdigkeit <b>{fatigue} / 5</b></span><input name="fatigue" type="range" min="1" max="5" value={fatigue} onChange={(event) => setFatigue(Number(event.currentTarget.value))} /></label>
          <label className="master-feedback-range"><span>Motivation <b>{motivation} / 5</b></span><input name="motivation" type="range" min="1" max="5" value={motivation} onChange={(event) => setMotivation(Number(event.currentTarget.value))} /></label>
        </div>
        <label className="master-full-field">Kurze Notiz<textarea name="note" rows={3} placeholder="Was lief gut? Was soll der Trainer wissen?" /></label>
        <footer>
          <PaddlioOneButton variant="ghost" onClick={requestCancel}>Abbrechen</PaddlioOneButton>
          <PaddlioOneButton variant="primary" type="submit">Speichern</PaddlioOneButton>
        </footer>
      </form>
  );
  if (presentation === "inline") {
    return <section className="master-entry-inline-feedback" role="region" aria-label="Feedback schreiben">{form}</section>;
  }
  return (
    <div className="master-modal-backdrop" role="dialog" aria-modal="true" aria-label="Feedback schreiben">
      {form}
    </div>
  );
}

function TrainingTaskSheet({
  entry,
  trainers,
  user,
  onCancel,
  onSave,
}: {
  entry: PlanEntry;
  trainers: User[];
  user: User;
  onCancel: () => void;
  onSave: (entry: PlanEntry, formData: FormData) => void;
}) {
  const [priority, setPriority] = useState<TeamTaskPriority>("normal");
  const requestCancel = () => {
    if (window.confirm("Traineraufgabe verwerfen?")) onCancel();
  };
  const swipeHandlers = useMobileSwipeDismiss(requestCancel);

  return (
    <div className="master-modal-backdrop" role="dialog" aria-modal="true" aria-label="Traineraufgabe erstellen">
      <form className="master-task-sheet" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(entry, new FormData(event.currentTarget)); }} {...swipeHandlers}>
        <header>
          <div>
            <p className="po-eyebrow">Traineraufgabe</p>
            <h2>{entry.title || entry.trainingType}</h2>
            <span>{fullDateLabel(entry.date)} · {(entry.startTime || entry.time)}-{entry.endTime || addMinutesToTime(entry.startTime || entry.time, entry.durationMinutes)}</span>
          </div>
          <button type="button" onClick={requestCancel} aria-label="Schließen">×</button>
        </header>
        <div className="master-task-grid">
          <label className="master-full-field">Titel<input name="title" required placeholder="z. B. Video aufnehmen" /></label>
          <label>Typ<select name="taskType" defaultValue="training">{trainingTaskTypes.map((taskType) => <option key={taskType} value={taskType}>{trainingTaskTypeLabels[taskType]}</option>)}</select></label>
          <label>Priorität<select name="priority" value={priority} onChange={(event) => setPriority(event.currentTarget.value as TeamTaskPriority)}>{trainingTaskPriorities.map((item) => <option key={item} value={item}>{trainingTaskPriorityLabels[item]}</option>)}</select></label>
          <label>Fällig<input name="dueDate" type="date" defaultValue={entry.date} /></label>
          <label>Trainer<select name="assignedTo" defaultValue={user.userId}>{trainers.map((trainer) => <option key={trainer.userId} value={trainer.userId}>{getUserName(trainer)}</option>)}</select></label>
        </div>
        <label className="master-full-field">Beschreibung<textarea name="description" rows={3} placeholder="z. B. Athlet beobachten, Zeiten nehmen, Material prüfen" /></label>
        <p className={`master-task-priority-hint is-${priority}`}>{trainingTaskPriorityLabels[priority]} · wird direkt mit dieser Einheit verknüpft.</p>
        <footer>
          <PaddlioOneButton variant="ghost" onClick={requestCancel}>Abbrechen</PaddlioOneButton>
          <PaddlioOneButton variant="primary" type="submit">Aufgabe erstellen</PaddlioOneButton>
        </footer>
      </form>
    </div>
  );
}

function LiveTrainingMode({ state, onChange, onEnd, presentation = "fullscreen" }: { state: LiveTrainingState; onChange: (state: LiveTrainingState | null) => void; onEnd: (entry: PlanEntry) => void; presentation?: "fullscreen" | "inline" }) {
  const [tick, setTick] = useState(0);
  const closeLive = () => {
    if (window.confirm("Live-Training schließen?")) onChange(null);
  };
  const swipeHandlers = useMobileSwipeDismiss(closeLive);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const elapsed = state.paused ? state.elapsedBeforePause : state.elapsedBeforePause + Math.floor((Date.now() - state.startedAt) / 1000) + tick * 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const sections = getEntrySections(state.entry);
  const pause = () => onChange({ ...state, paused: true, elapsedBeforePause: elapsed });
  const resume = () => onChange({ ...state, paused: false, startedAt: Date.now(), elapsedBeforePause: elapsed });
  return (
    <div className={`master-live-training ${presentation === "inline" ? "is-inline" : ""}`.trim()} role="dialog" aria-modal={presentation === "fullscreen"} aria-label="Live Training" {...swipeHandlers}>
      <header>
        <p className="po-eyebrow">Live Training</p>
        <h2>{state.entry.title || state.entry.trainingType}</h2>
        <button type="button" onClick={closeLive} aria-label="Live Training schließen">×</button>
      </header>
      <strong className="master-live-timer">{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong>
      <p>{state.entry.focus || state.entry.goal}</p>
      <div className="master-live-steps">
        {sections.map((section, index) => (
          <button key={`${section}-${index}`} className={state.activeStep === index ? "is-active" : ""} type="button" onClick={() => onChange({ ...state, activeStep: index })}>{section}</button>
        ))}
      </div>
      <footer>
        <PaddlioOneButton variant="secondary" onClick={state.paused ? resume : pause}>{state.paused ? "Weiter" : "Pause"}</PaddlioOneButton>
        <PaddlioOneButton variant="secondary" onClick={() => onChange({ ...state, activeStep: Math.min(sections.length - 1, state.activeStep + 1) })}>Nächster Abschnitt</PaddlioOneButton>
        <PaddlioOneButton variant="primary" onClick={() => onEnd(state.entry)}>Beenden & Feedback</PaddlioOneButton>
      </footer>
    </div>
  );
}

function WeekCopyDialog({ sourceWeek, entries, onCancel, onCopy }: { sourceWeek: string[]; entries: PlanEntry[]; onCancel: () => void; onCopy: (targetMonday: string) => void }) {
  const [targetMonday, setTargetMonday] = useState(addCalendarDays(sourceWeek[0], 7));
  return (
    <div className="master-modal-backdrop" role="dialog" aria-modal="true" aria-label="Woche kopieren">
      <form className="master-week-copy" onSubmit={(event) => { event.preventDefault(); onCopy(targetMonday); }}>
        <header>
          <p className="po-eyebrow">Woche kopieren</p>
          <h2>{shortDateLabel(sourceWeek[0])} - {shortDateLabel(sourceWeek[6])}</h2>
          <button type="button" onClick={onCancel} aria-label="Schließen">×</button>
        </header>
        <label>Zielwoche beginnt am<input type="date" value={targetMonday} onChange={(event) => setTargetMonday(event.currentTarget.value)} /></label>
        <div className="master-week-copy-preview">
          {entries.map((entry) => {
            const offset = Math.round((parseLocalDateOnly(targetMonday).getTime() - parseLocalDateOnly(sourceWeek[0]).getTime()) / 86400000);
            return <span key={entry.id}>{entry.title || entry.trainingType} -&gt; {shortDateLabel(addCalendarDays(entry.date, offset))}</span>;
          })}
        </div>
        <p className="master-hint">Die Zielwoche wird ergänzt. Bestehende Trainings werden nicht überschrieben.</p>
        <footer>
          <PaddlioOneButton variant="ghost" onClick={onCancel}>Abbrechen</PaddlioOneButton>
          <PaddlioOneButton variant="primary" type="submit">Kopieren</PaddlioOneButton>
        </footer>
      </form>
    </div>
  );
}

function AgendaList({ entries, onOpenEntry, onStartLive, onFeedback, groups, athletes, users, renderEntryPanel }: { entries: PlanEntry[]; onOpenEntry: (id: string) => void; onStartLive: (entry: PlanEntry) => void; onFeedback: (entry: PlanEntry) => void; groups: CoachGroup[]; athletes: CoachAthlete[]; users: User[]; renderEntryPanel?: (entry: PlanEntry) => ReactNode }) {
  return (
    <PaddlioOneCard className="master-agenda-card">
      {sortPlanEntries(entries).slice(0, 40).map((entry) => (
        <div className="master-calendar-entry-with-panel" data-calendar-entry-id={entry.id} key={entry.id}>
        <article className="master-agenda-row">
          <button type="button" onClick={() => onOpenEntry(entry.id)}>
            <strong>{entry.title || entry.trainingType}</strong>
            <span>{fullDateLabel(entry.date)} · {entry.startTime || entry.time} · {getAssignedLabel(entry, groups, athletes, users)}</span>
          </button>
          <PaddlioOneStatusChip tone={isDoneStatus(entry.status) ? "success" : "info"}>{planStatusLabels[entry.status] ?? entry.status}</PaddlioOneStatusChip>
          <div>
            <button type="button" onClick={() => onStartLive(entry)}>Start</button>
            <button type="button" onClick={() => onFeedback(entry)}>Feedback</button>
          </div>
        </article>
        {renderEntryPanel?.(entry)}
        </div>
      ))}
      {entries.length === 0 ? <p className="po-muted">Keine Einheiten für die aktuellen Filter.</p> : null}
    </PaddlioOneCard>
  );
}

function YearCalendar({ months, groupedEntries, onSelectDate }: { months: string[]; groupedEntries: Map<string, PlanEntry[]>; onSelectDate: (date: string) => void }) {
  return (
    <PaddlioOneCard className="master-year-card">
      <div className="master-year-grid">
        {months.map((monthStart) => {
          const days = getMonthGrid(monthStart).filter((day) => day.slice(0, 7) === monthStart.slice(0, 7));
          const monthEntries = days.flatMap((day) => groupedEntries.get(day) ?? []);
          return (
            <button className="master-year-month" type="button" key={monthStart} onClick={() => onSelectDate(monthStart)}>
              <strong>{parseLocalDateOnly(monthStart).toLocaleDateString("de-DE", { month: "long" })}</strong>
              <span>{monthEntries.length} Einheiten</span>
              <em>{monthEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)} min</em>
            </button>
          );
        })}
      </div>
    </PaddlioOneCard>
  );
}

function PeriodizationCalendar({ months, templates }: { months: ReturnType<typeof getPeriodizationMonths>; templates: TrainingTemplate[] }) {
  return (
    <PaddlioOneCard className="master-periodization-card">
      <div className="po-card-heading-row">
        <div>
          <p className="po-eyebrow">Jahresplan</p>
          <h2>Saisonphasen</h2>
        </div>
        <PaddlioOneStatusChip tone="info">{templates.length} Bausteine vorbereitet</PaddlioOneStatusChip>
      </div>
      <div className="master-season-band" aria-label="Saisonphasen als Jahresband">
        {months.map((month) => (
          <article className={`master-season-month po-tone-${categoryTone(month.phase)}`} key={month.key}>
            <strong>{month.label}</strong>
            <span>{month.phase}</span>
            <small>{month.entries} Einheiten · {month.minutes} min</small>
            <div className="master-mini-progress"><span style={{ width: `${month.loadPercent}%` }} /></div>
          </article>
        ))}
      </div>
    </PaddlioOneCard>
  );
}
