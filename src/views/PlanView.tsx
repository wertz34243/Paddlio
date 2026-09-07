import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
  canAccessPlanEntry,
  canEditTrainingTemplate,
  canUseCoachArea,
  getAthletesForCurrentUser,
  getGroupsForCurrentUser,
  getTrainingTemplatesForCurrentUser,
  getTrainingsForCurrentUser,
} from "../domain/accessControl";
import {
  addCalendarDays,
  getCalendarDayOffset,
  getDateParts,
  getLocalDateKey,
  getTodayKey,
  getWeekdayFromDate,
  expandTrainingRepeatDates,
  getTrainingRepeatSeriesEntries,
  isDoneStatus,
  isPlannedStatus,
  isSkippedStatus,
  planStatuses,
  parseLocalDateOnly,
  sortPlanEntries,
  trainingAreas,
  trainingIntensities,
  trainingTypeGroups,
  weekdays,
} from "../domain/trainingPlan";
import {
  buildExerciseDescription,
  createPeriodizationTemplates as createSystemTrainingTemplates,
  getTemplateGuidance,
  isSystemTemplate as isSystemTrainingTemplate,
  type TrainingTemplateExercise,
} from "../features/training/templates/trainingTemplates";
import {
  createCalendarQuickTemplates,
  seasonPlanningBlocks,
  weeklyPlanningTemplates,
  type WeeklyPlanningTemplate,
  type WeeklyPlanningTemplateItem,
} from "../features/training/templates/planningBlocks";
import type {
  BoatClass,
  CoachAthlete,
  CoachGroup,
  PaddleMotionData,
  PlanEntry,
  PlanStatus,
  TrainingArea,
  TrainingBoatClass,
  TrainingFeedback,
  TrainingIntensity,
  TrainingPlanType,
  TrainingRepeat,
  TrainingTemplate,
  TrainingTemplateCategory,
  TrainingTemplateVisibility,
  TeamTask,
  TeamTaskAssignment,
  TeamTaskPriority,
  TeamTaskType,
  User,
} from "../domain/types";
import type { DeviceClass } from "../lib/deviceCapabilities";

type PlanDraft = Omit<PlanEntry, "athleteId" | "createdAt" | "updatedAt" | "createdByUserId">;

type PlanViewProps = {
  data: PaddleMotionData;
  entries: PlanEntry[];
  user: User;
  onSave: (entry: Omit<PlanEntry, "id" | "athleteId" | "createdAt" | "updatedAt" | "createdByUserId"> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onDeleteSeries: (id: string) => void;
  onToggleDone: (id: string) => void;
  onFeedbackSave: (feedback: Omit<TrainingFeedback, "id" | "completedAt"> & { id?: string }) => void;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
  onOpenOverview: () => void;
  onOpenSessions: () => void;
  onOpenJournal: () => void;
  deviceClass?: DeviceClass;
  tabletBuilderOnly?: boolean;
  initialWorkflowTab?: WorkflowTab;
};

type CalendarView = "day" | "week" | "month" | "year" | "list";
type WorkflowTab = "today" | "week" | "month" | "templates" | "groups" | "feedback" | "upcoming" | "done";
type JournalRangeFilter = "all" | "7" | "30" | "90";
type TemplateSourceFilter = "all" | "favorites" | "mine" | "club" | "system";
type TabletBuilderSection = {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  intensity: TrainingIntensity;
  boatClass: TrainingBoatClass;
  focus: string;
  description: string;
  optional: boolean;
};
type WorkflowTabConfig = {
  id: WorkflowTab;
  label: string;
  calendarView?: CalendarView;
};

const coachWorkflowTabs: WorkflowTabConfig[] = [
  { id: "today", label: "Heute", calendarView: "day" },
  { id: "week", label: "Woche", calendarView: "week" },
  { id: "month", label: "Monat", calendarView: "month" },
  { id: "templates", label: "Vorlagen" },
  { id: "groups", label: "Gruppen" },
  { id: "feedback", label: "Rückmeldungen" },
];

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

const athleteWorkflowTabs: WorkflowTabConfig[] = [
  { id: "today", label: "Heute", calendarView: "day" },
  { id: "week", label: "Diese Woche", calendarView: "week" },
  { id: "upcoming", label: "Kommende" },
  { id: "done", label: "Erledigt" },
  { id: "feedback", label: "Rückmeldung" },
];

const today = getTodayKey();

const statusLabel: Record<PlanStatus, string> = {
  planned: "Geplant",
  in_progress: "Läuft",
  completed: "Durchgeführt",
  partially_completed: "Teilweise durchgeführt",
  done: "Erledigt",
  skipped: "Ausgelassen",
  cancelled: "Abgesagt",
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

const templateCategories: TrainingTemplateCategory[] = ["K1", "C1", "Ausdauer", "Kraft", "Technik", "Regeneration", "Wettkampf", "Allgemein"];
const templateTagFilters = ["all", "GA1", "GA2", "Technik", "Kraft", "Wettkampf", "Regeneration"] as const;
const templateSourceFilters: Array<{ id: TemplateSourceFilter; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "favorites", label: "Favoriten" },
  { id: "mine", label: "Meine" },
  { id: "club", label: "Verein" },
  { id: "system", label: "System" },
];

const visibilityLabel: Record<TrainingTemplateVisibility, string> = {
  private: "Privat",
  club: "Verein",
};

const areaLabel: Record<TrainingArea, string> = {
  Wassertraining: "water",
  Ausdauer: "endurance",
  Krafttraining: "strength",
  Trainerarbeit: "coach",
  Regeneration: "regeneration",
  Wettkampf: "competition",
};

const getTemplateCategoryGroup = (template: TrainingTemplate): string => {
  const source = [template.tags.join(" "), template.title, template.category, template.trainingArea, template.trainingType, template.focus].join(" ").toLowerCase();
  if (source.includes("ga1")) return "GA1";
  if (source.includes("ga2")) return "GA2";
  if (source.includes("kraft")) return "Kraft";
  if (source.includes("wett")) return "Wettkampf";
  if (source.includes("regen") || source.includes("mobility")) return "Regeneration";
  if (source.includes("technik") || source.includes("slalom")) return "Technik";
  return template.category || "Allgemein";
};

const getTemplateToneClass = (template: TrainingTemplate): string => {
  const group = getTemplateCategoryGroup(template);
  if (group === "GA1" || group === "GA2" || template.trainingArea === "Ausdauer") return "endurance";
  if (group === "Technik") return "technique";
  if (group === "Kraft") return "strength";
  if (group === "Wettkampf") return "competition";
  if (group === "Regeneration") return "regeneration";
  return "neutral";
};

const getBuilderSectionToneClass = (section: TabletBuilderSection): string => {
  const source = [section.category, section.title, section.focus, section.description].join(" ").toLowerCase();
  if (source.includes("ga1") || source.includes("ga2") || source.includes("ausdauer")) return "endurance";
  if (source.includes("technik") || source.includes("slalom")) return "technique";
  if (source.includes("kraft")) return "strength";
  if (source.includes("wett")) return "competition";
  if (source.includes("regen") || source.includes("mobility")) return "regeneration";
  return "neutral";
};

const emptyDraft = (user: User, athleteId: string): PlanDraft => ({
  id: "",
  ownerUserId: user.userId,
  clubId: user.profile.club,
  assignedType: "self",
  assignedAthleteIds: [athleteId],
  assignedGroupIds: [],
  title: "",
  date: today,
  weekday: getWeekdayFromDate(today),
  time: "17:30",
  startTime: "17:30",
  endTime: "",
  durationMinutes: 75,
  area: "Wassertraining",
  trainingType: "K1 Technik",
  boatClass: "K1",
  goal: "",
  focus: "",
  description: "",
  intensity: "mittel",
  note: "",
  notes: "",
  status: "planned",
  repeat: "none",
  repeatUntil: "",
  repeatMaxCount: undefined,
  assignedAthleteId: athleteId,
  assignedGroupId: "",
  feedbackNote: "",
});

const getMonday = (date: string): Date => {
  const current = parseLocalDateOnly(date);
  const weekday = current.getDay() || 7;
  current.setDate(current.getDate() - weekday + 1);
  return current;
};

const getWeekDates = (date: string): string[] => {
  const monday = getMonday(date);
  return weekdays.map((_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return getLocalDateKey(day);
  });
};

const getIsoWeekNumber = (date: string): number => {
  const current = parseLocalDateOnly(date);
  const thursday = new Date(current);
  thursday.setDate(current.getDate() + 3 - ((current.getDay() + 6) % 7));
  const weekOne = new Date(thursday.getFullYear(), 0, 4);
  return 1 + Math.round(((thursday.getTime() - weekOne.getTime()) / 86400000 - 3 + ((weekOne.getDay() + 6) % 7)) / 7);
};

const getMonthDates = (date: string): string[] => {
  const [year, month] = getDateParts(date);
  const cursor = new Date(year, month - 1, 1);
  const dates: string[] = [];
  while (cursor.getMonth() === month - 1) {
    dates.push(getLocalDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const getYearMonths = (date: string): string[] => {
  const [year] = getDateParts(date);
  return Array.from({ length: 12 }, (_, index) => getLocalDateKey(new Date(year, index, 1)));
};

const getEntryStatusClass = (status: PlanStatus): string =>
  isDoneStatus(status) ? "done" : isSkippedStatus(status) ? "skipped" : status === "cancelled" ? "cancelled" : "planned";

const includesBoat = (entry: PlanEntry, boat: string): boolean =>
  boat === "all" || entry.boatClass === boat || (boat === "K1" && entry.boatClass === "K1+C1") || (boat === "C1" && entry.boatClass === "K1+C1");

const addDays = addCalendarDays;

const getDateOffset = getCalendarDayOffset;

const parseTags = (value: string): string[] =>
  value.split(",").map((tag) => tag.trim()).filter(Boolean);

const addMinutesToTime = (time: string, minutes: number): string => {
  const [hourValue, minuteValue] = (time || "17:30").split(":").map(Number);
  const date = new Date(2026, 0, 1, Number.isFinite(hourValue) ? hourValue : 17, Number.isFinite(minuteValue) ? minuteValue : 30);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export function PlanView({
  data,
  entries,
  user,
  onSave,
  onDelete,
  onDeleteSeries,
  onToggleDone,
  onFeedbackSave,
  onDataChange,
  onOpenOverview,
  onOpenSessions,
  onOpenJournal,
  deviceClass = "desktop",
  tabletBuilderOnly = false,
  initialWorkflowTab = "week",
}: PlanViewProps) {
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TrainingTemplate | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>(initialWorkflowTab);
  const [selectedArea, setSelectedArea] = useState<TrainingArea>("Wassertraining");
  const [templateArea, setTemplateArea] = useState<TrainingArea>("Wassertraining");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedRepeat, setSelectedRepeat] = useState<TrainingRepeat>("none");
  const [selectedRepeatUntil, setSelectedRepeatUntil] = useState("");
  const [selectedRepeatMaxCount, setSelectedRepeatMaxCount] = useState<number | undefined>(undefined);
  const [feedbackEntry, setFeedbackEntry] = useState<PlanEntry | null>(null);
  const [copyEntry, setCopyEntry] = useState<PlanEntry | null>(null);
  const [taskEntry, setTaskEntry] = useState<PlanEntry | null>(null);
  const [showWeekCopy, setShowWeekCopy] = useState(false);
  const [showBlockCopy, setShowBlockCopy] = useState(false);
  const [areaFilter, setAreaFilter] = useState<"all" | TrainingArea>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");
  const [boatFilter, setBoatFilter] = useState<"all" | TrainingBoatClass>("all");
  const [intensityFilter, setIntensityFilter] = useState<"all" | TrainingIntensity>("all");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<"all" | TrainingTemplateCategory>("all");
  const [templateTagFilter, setTemplateTagFilter] = useState<(typeof templateTagFilters)[number]>("all");
  const [templateSourceFilter, setTemplateSourceFilter] = useState<TemplateSourceFilter>("all");
  const [selectedTemplateDetailId, setSelectedTemplateDetailId] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templatePickerSearch, setTemplatePickerSearch] = useState("");
  const [selectedFocusOptions, setSelectedFocusOptions] = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState("");
  const [manualGeneratedDescription, setManualGeneratedDescription] = useState("");
  const [pendingTemplateId, setPendingTemplateId] = useState("");
  const [athleteFilter, setAthleteFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [journalAthleteFilter, setJournalAthleteFilter] = useState("all");
  const [journalRangeFilter, setJournalRangeFilter] = useState<JournalRangeFilter>("30");
  const [tabletBuilderSections, setTabletBuilderSections] = useState<TabletBuilderSection[]>([]);
  const [selectedTabletSectionId, setSelectedTabletSectionId] = useState("");
  const [tabletBuilderSearch, setTabletBuilderSearch] = useState("");
  const [tabletBuilderCategory, setTabletBuilderCategory] = useState<(typeof templateTagFilters)[number]>("all");
  const [dragTemplateId, setDragTemplateId] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const isCoach = canUseCoachArea(user.role);
  const isPhone = deviceClass === "phone";
  const isTablet = deviceClass === "tablet";
  const workflowTabs = useMemo(() => {
    const baseTabs = isCoach ? coachWorkflowTabs : athleteWorkflowTabs;

    if (!isPhone) {
      return baseTabs;
    }

    const phoneTabs: WorkflowTab[] = isCoach ? ["today", "week", "feedback"] : ["today", "upcoming", "done", "feedback"];
    return baseTabs.filter((tab) => phoneTabs.includes(tab.id));
  }, [isPhone, isCoach]);
  const calendarViews = useMemo<CalendarView[]>(
    () => (isPhone ? ["day", "list"] : ["day", "week", "month", "year", "list"]),
    [isPhone],
  );

  useEffect(() => {
    if (!workflowTabs.some((tab) => tab.id === workflowTab)) {
      const fallbackTab = workflowTabs[0] ?? { id: "today", label: "Heute", calendarView: "day" };
      setWorkflowTab(fallbackTab.id);
      setCalendarView(fallbackTab.calendarView ?? "day");
    }
  }, [workflowTab, workflowTabs]);

  const visibleAthletes = useMemo(() => getAthletesForCurrentUser(data, user), [data, user]);
  const visibleGroups = useMemo(() => getGroupsForCurrentUser(data, user), [data, user]);
  const trainerTaskAssignees = useMemo(() => {
    const clubUsers = data.users.filter((item) => item.profile.club === user.profile.club && canUseCoachArea(item.role));
    const merged = [...clubUsers, user].filter((item, index, list) => list.findIndex((candidate) => candidate.userId === item.userId) === index);
    return merged.length > 0 ? merged : [user];
  }, [data.users, user]);
  const periodizationTemplates = useMemo(
    () => [...createSystemTrainingTemplates(user.profile.club), ...createCalendarQuickTemplates(user.profile.club)],
    [user.profile.club],
  );
  const visibleTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    const tagQuery = templateTagFilter.toLowerCase();
    return [...periodizationTemplates, ...getTrainingTemplatesForCurrentUser(data, user, [user.profile.club])]
      .filter((template) => template.title.trim().toLowerCase() !== "test")
      .filter((template) => templateCategoryFilter === "all" || template.category === templateCategoryFilter)
      .filter((template) => {
        if (templateSourceFilter === "all") return true;
        if (templateSourceFilter === "favorites") return template.isFavorite;
        if (templateSourceFilter === "mine") return template.visibility === "private" && !isSystemTrainingTemplate(template);
        if (templateSourceFilter === "club") return template.visibility === "club" && !isSystemTrainingTemplate(template);
        return isSystemTrainingTemplate(template);
      })
      .filter((template) => {
        if (templateTagFilter === "all") return true;
        return [template.title, template.category, template.trainingArea, template.trainingType, template.focus, template.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(tagQuery);
      })
      .filter((template) => {
        if (!query) return true;
        return [template.title, template.focus, template.trainingArea, template.trainingType, template.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => Number(isSystemTrainingTemplate(b)) - Number(isSystemTrainingTemplate(a)) || Number(b.isFavorite) - Number(a.isFavorite) || a.title.localeCompare(b.title));
  }, [data, periodizationTemplates, templateCategoryFilter, templateSearch, templateSourceFilter, templateTagFilter, user]);

  const visibleEntries = useMemo(() => {
    const scopedEntries = getTrainingsForCurrentUser({ ...data, plan: entries }, user);
    return sortPlanEntries(scopedEntries).filter((entry) => {
      if (areaFilter !== "all" && entry.area !== areaFilter) return false;
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (!includesBoat(entry, boatFilter)) return false;
      if (intensityFilter !== "all" && entry.intensity !== intensityFilter) return false;
      if (athleteFilter !== "all" && !entry.assignedAthleteIds.includes(athleteFilter) && entry.assignedAthleteId !== athleteFilter) return false;
      if (groupFilter !== "all" && !entry.assignedGroupIds.includes(groupFilter) && entry.assignedGroupId !== groupFilter) return false;
      return true;
    });
  }, [areaFilter, athleteFilter, boatFilter, data, entries, groupFilter, intensityFilter, statusFilter, user]);

  const todayEntries = visibleEntries.filter((entry) => entry.date === today);
  const weekDates = getWeekDates(selectedDate);
  const yearMonths = getYearMonths(selectedDate);
  const selectedYear = getDateParts(selectedDate)[0];
  const completedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date) && isDoneStatus(entry.status));
  const skippedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date) && isSkippedStatus(entry.status));
  const plannedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date));
  const weeklyMinutes = completedThisWeek.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const templateGroups = useMemo(() => {
    return visibleTemplates.reduce<Record<string, TrainingTemplate[]>>((groups, template) => {
      const key = getTemplateCategoryGroup(template);
      groups[key] = [...(groups[key] ?? []), template];
      return groups;
    }, {});
  }, [visibleTemplates]);
  const selectedTemplateDetail = useMemo(
    () => visibleTemplates.find((template) => template.id === selectedTemplateDetailId) ?? null,
    [selectedTemplateDetailId, visibleTemplates],
  );
  const journalFilteredEntries = useMemo(() => {
    const rangeStart = journalRangeFilter === "all" ? "" : addDays(today, -Number(journalRangeFilter));
    return visibleEntries.filter((entry) => {
      if (rangeStart && entry.date < rangeStart) return false;
      if (journalAthleteFilter === "all") return true;
      const entryFeedback = data.trainingFeedback.filter((feedback) => feedback.trainingId === entry.id);
      return entry.assignedAthleteIds.includes(journalAthleteFilter)
        || entry.assignedAthleteId === journalAthleteFilter
        || entryFeedback.some((feedback) => feedback.athleteUserId === journalAthleteFilter);
    });
  }, [data.trainingFeedback, journalAthleteFilter, journalRangeFilter, visibleEntries]);
  const entriesWithFeedback = journalFilteredEntries.filter((entry) => data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id));
  const openFeedbackEntries = journalFilteredEntries.filter((entry) => isDoneStatus(entry.status) && !data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id));
  const openFeedbackCount = openFeedbackEntries.length;
  const nextWeekDates = getWeekDates(addDays(selectedDate, 7));
  const nextWeekCount = visibleEntries.filter((entry) => nextWeekDates.includes(entry.date)).length;
  const selectedWeekNumber = getIsoWeekNumber(selectedDate);
  const selectedWeekLabel = `${weekDates[0]} - ${weekDates[6]}`;
  const navigateCalendar = (direction: -1 | 1) => {
    if (calendarView === "year") {
      setSelectedDate(getLocalDateKey(new Date(selectedYear + direction, 0, 1)));
      return;
    }
    const step = calendarView === "month" ? 28 : calendarView === "week" ? 7 : 1;
    setSelectedDate(addDays(selectedDate, step * direction));
  };
  const unplannedAthletes = visibleAthletes.filter((athlete) =>
    !plannedThisWeek.some((entry) => entry.assignedAthleteIds.includes(athlete.id) || entry.assignedAthleteId === athlete.id),
  );
  const upcomingEntries = visibleEntries.filter((entry) => entry.date >= today && isPlannedStatus(entry.status));
  const doneEntries = visibleEntries.filter((entry) => isDoneStatus(entry.status));
  const favoriteTemplates = visibleTemplates.filter((template) => template.isFavorite).slice(0, 6);
  const recentlyUsedTemplates = Array.from(
    new Set(
      visibleEntries
        .filter((entry) => entry.templateId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((entry) => entry.templateId),
    ),
  )
    .map((templateId) => visibleTemplates.find((template) => template.id === templateId))
    .filter((template): template is TrainingTemplate => Boolean(template))
    .slice(0, 5);
  const selectedTemplate = useMemo(
    () => visibleTemplates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, visibleTemplates],
  );
  const selectedTemplateGuidance = useMemo(() => getTemplateGuidance(selectedTemplate), [selectedTemplate]);
  const selectedExercises = useMemo(
    () => selectedExerciseIds
      .map((id) => selectedTemplateGuidance.exercises.find((exerciseItem) => exerciseItem.id === id))
      .filter((exerciseItem): exerciseItem is TrainingTemplateExercise => Boolean(exerciseItem)),
    [selectedExerciseIds, selectedTemplateGuidance.exercises],
  );
  const generatedDescription = useMemo(
    () => buildExerciseDescription(selectedExercises, customDescription),
    [customDescription, selectedExercises],
  );
  const effectiveGeneratedDescription = manualGeneratedDescription || generatedDescription;
  const focusText = useMemo(
    () => [...selectedFocusOptions, customFocus.trim()].filter(Boolean).join(", "),
    [customFocus, selectedFocusOptions],
  );
  const recentFocusOptions = useMemo(() => {
    const values = visibleEntries.flatMap((entry) => (entry.focus || entry.goal || "").split(","));
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 8);
  }, [visibleEntries]);
  const recentDescriptionOptions = useMemo(() => {
    const values = visibleEntries.flatMap((entry) => [entry.description, entry.notes, entry.note]);
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 5);
  }, [visibleEntries]);
  const pickerTemplates = useMemo(() => {
    const query = templatePickerSearch.trim().toLowerCase();
    return visibleTemplates.filter((template) => {
      if (!query) return true;
      return [template.title, template.focus, template.trainingArea, template.trainingType, template.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [templatePickerSearch, visibleTemplates]);

  const hasTemplateInput = (): boolean =>
    selectedFocusOptions.length > 0 || selectedExerciseIds.length > 0 || Boolean(customFocus.trim()) || Boolean(customDescription.trim());

  const applyTemplateSelection = (templateId: string, mode: "keep" | "replace" = "keep") => {
    const template = visibleTemplates.find((item) => item.id === templateId);
    const guidance = getTemplateGuidance(template);
    setSelectedTemplateId(templateId);
    setShowTemplatePicker(false);
    setPendingTemplateId("");
    setTemplatePickerSearch("");

    if (mode === "replace") {
      setSelectedFocusOptions(guidance.focusOptions.slice(0, 3));
      setSelectedExerciseIds(guidance.exercises.slice(0, 1).map((exerciseItem) => exerciseItem.id));
      setCustomFocus("");
      setCustomDescription("");
      setManualGeneratedDescription("");
    }
  };

  const requestTemplateSelection = (templateId: string) => {
    if (!selectedTemplateId || selectedTemplateId === templateId || !hasTemplateInput()) {
      applyTemplateSelection(templateId, selectedTemplateId === templateId ? "keep" : "replace");
      return;
    }
    setPendingTemplateId(templateId);
    setShowTemplatePicker(false);
  };

  const toggleFocusOption = (label: string) => {
    setSelectedFocusOptions((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  const toggleExerciseOption = (exerciseId: string) => {
    setSelectedExerciseIds((current) =>
      current.includes(exerciseId) ? current.filter((item) => item !== exerciseId) : [...current, exerciseId],
    );
  };

  const moveSelectedExercise = (exerciseId: string, direction: -1 | 1) => {
    setSelectedExerciseIds((current) => {
      const index = current.indexOf(exerciseId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const appendExerciseText = (exerciseItem: TrainingTemplateExercise) => {
    setCustomDescription((current) =>
      [current.trim(), `${exerciseItem.name}: ${exerciseItem.shortDescription}`].filter(Boolean).join("\n\n"),
    );
  };

  const groupedExerciseOptions = selectedTemplateGuidance.exercises.reduce<Record<string, TrainingTemplateExercise[]>>((groups, exerciseItem) => {
    groups[exerciseItem.category] = [...(groups[exerciseItem.category] ?? []), exerciseItem];
    return groups;
  }, {});

  const switchWorkflowTab = (tab: WorkflowTabConfig) => {
    setWorkflowTab(tab.id);
    if (isPhone && tab.id === "week") {
      setCalendarView("list");
      return;
    }
    if (tab.calendarView) {
      setCalendarView(tab.calendarView);
    }
  };

  const startCreate = () => {
    const nextDraft = emptyDraft(user, data.athlete.id);
    setSelectedArea(nextDraft.area);
    setSelectedDate(nextDraft.date);
    setSelectedRepeat(nextDraft.repeat);
    setSelectedRepeatUntil(nextDraft.repeatUntil);
    setSelectedRepeatMaxCount(nextDraft.repeatMaxCount);
    setTabletBuilderSections([]);
    setSelectedTabletSectionId("");
    setDraft(nextDraft);
  };

  const updateDraft = (patch: Partial<PlanDraft>) => {
    setDraft((current) => current ? { ...current, ...patch } : current);
  };

  const selectSingleTarget = (assignedType: PlanEntry["assignedType"], targetId = "") => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        assignedType,
        assignedAthleteIds: assignedType === "athlete" ? [targetId].filter(Boolean) : assignedType === "self" ? [data.athlete.id] : [],
        assignedGroupIds: assignedType === "group" ? [targetId].filter(Boolean) : [],
        assignedAthleteId: assignedType === "athlete" ? targetId : assignedType === "self" ? data.athlete.id : "",
        assignedGroupId: assignedType === "group" ? targetId : "",
      };
    });
  };

  const applyTemplateToDraft = (templateId: string) => {
    const template = visibleTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedArea(template.trainingArea);
    updateDraft({
      title: template.title,
      area: template.trainingArea,
      trainingType: template.trainingType,
      boatClass: template.boatClass ?? "K1",
      durationMinutes: template.defaultDurationMinutes ?? 75,
      intensity: template.defaultIntensity,
      goal: template.focus,
      focus: template.focus,
      description: template.description,
      notes: template.notes,
      note: template.notes,
    });
  };

  const createBuilderSectionFromTemplate = (template: TrainingTemplate): TabletBuilderSection => ({
    id: `builder-section-${crypto.randomUUID()}`,
    title: template.title,
    category: getTemplateCategoryGroup(template),
    durationMinutes: Math.max(10, Math.min(90, template.defaultDurationMinutes ?? 20)),
    intensity: template.defaultIntensity,
    boatClass: template.boatClass ?? "K1",
    focus: template.focus,
    description: template.description ?? "",
    optional: false,
  });

  const updateBuilderTotalDuration = (sections: TabletBuilderSection[]) => {
    const total = sections.reduce((sum, section) => sum + section.durationMinutes, 0);
    updateDraft({ durationMinutes: total || draft?.durationMinutes || 75, endTime: draft ? addMinutesToTime(draft.startTime || draft.time, total || draft.durationMinutes || 75) : "" });
  };

  const addBuilderSection = (template: TrainingTemplate) => {
    const section = createBuilderSectionFromTemplate(template);
    setTabletBuilderSections((current) => {
      const next = [...current, section];
      updateBuilderTotalDuration(next);
      return next;
    });
    setSelectedTabletSectionId(section.id);
    if (draft && !draft.title) {
      updateDraft({ title: template.title, area: template.trainingArea, trainingType: template.trainingType, intensity: template.defaultIntensity, boatClass: template.boatClass ?? "K1", focus: template.focus, goal: template.focus });
    }
  };

  const updateBuilderSection = (sectionId: string, patch: Partial<TabletBuilderSection>) => {
    setTabletBuilderSections((current) => {
      const next = current.map((section) => section.id === sectionId ? { ...section, ...patch } : section);
      if (patch.durationMinutes !== undefined) updateBuilderTotalDuration(next);
      return next;
    });
  };

  const moveBuilderSection = (sectionId: string, direction: -1 | 1) => {
    setTabletBuilderSections((current) => {
      const index = current.findIndex((section) => section.id === sectionId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const duplicateBuilderSection = (section: TabletBuilderSection) => {
    const duplicate = { ...section, id: `builder-section-${crypto.randomUUID()}`, title: `${section.title} Kopie` };
    setTabletBuilderSections((current) => {
      const index = current.findIndex((item) => item.id === section.id);
      const next = [...current];
      next.splice(index + 1, 0, duplicate);
      updateBuilderTotalDuration(next);
      return next;
    });
    setSelectedTabletSectionId(duplicate.id);
  };

  const deleteBuilderSection = (sectionId: string) => {
    setTabletBuilderSections((current) => {
      const next = current.filter((section) => section.id !== sectionId);
      updateBuilderTotalDuration(next);
      return next;
    });
    setSelectedTabletSectionId("");
  };

  const applyQuickBuild = () => {
    const baseIntensity = draft?.intensity ?? "mittel";
    const sections: TabletBuilderSection[] = [
      { id: `builder-section-${crypto.randomUUID()}`, title: "Warm-up", category: "GA1", durationMinutes: 15, intensity: "locker", boatClass: draft?.boatClass ?? "K1", focus: "Einpaddeln, Mobilisieren", description: "Locker einfahren und Technikgefuehl vorbereiten.", optional: false },
      { id: `builder-section-${crypto.randomUUID()}`, title: "Grundtechnik", category: "Technik", durationMinutes: 20, intensity: baseIntensity, boatClass: draft?.boatClass ?? "K1", focus: draft?.focus || "Linienwahl, Druck", description: "Technikblock mit sauberer Linienwahl und stabiler Druckphase.", optional: false },
      { id: `builder-section-${crypto.randomUUID()}`, title: "Slalomtechnik", category: "Technik", durationMinutes: 25, intensity: baseIntensity, boatClass: draft?.boatClass ?? "K1", focus: "Innenstab, Blickfuehrung", description: "Streckenabschnitt mit klaren Wiederholungen und kurzem Feedback.", optional: false },
      { id: `builder-section-${crypto.randomUUID()}`, title: "Cool-down", category: "Regeneration", durationMinutes: 10, intensity: "locker", boatClass: draft?.boatClass ?? "K1", focus: "Auspaddeln", description: "Belastung ruhig herunterfahren.", optional: false },
    ];
    setTabletBuilderSections(sections);
    setSelectedTabletSectionId(sections[1].id);
    updateBuilderTotalDuration(sections);
  };

  useEffect(() => {
    if (!tabletBuilderOnly || !isTablet || draft) return;
    startCreate();
  }, [draft, isTablet, tabletBuilderOnly]);

  const startTemplateCreate = () => {
    const timestamp = new Date().toISOString();
    setTemplateArea("Wassertraining");
    setTemplateDraft({
      id: "",
      ownerUserId: user.userId,
      clubId: user.profile.club,
      createdByUserId: user.userId,
      title: "",
      category: "Allgemein",
      trainingArea: "Wassertraining",
      trainingType: "K1 Technik",
      boatClass: "K1",
      defaultDurationMinutes: 75,
      defaultIntensity: "mittel",
      focus: "",
      description: "",
      notes: "",
      tags: [],
      isFavorite: false,
      visibility: isCoach ? "club" : "private",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  };

  const saveDraftAsTemplate = () => {
    if (!draft) return;
    const timestamp = new Date().toISOString();
    const totalDuration = tabletBuilderSections.reduce((sum, section) => sum + section.durationMinutes, 0) || draft.durationMinutes || 75;
    const sectionSummary = tabletBuilderSections.length > 0
      ? tabletBuilderSections.map((section, index) => `${index + 1}. ${section.title} (${section.durationMinutes} min): ${section.focus}`).join("\n")
      : "";
    const nextTemplate: TrainingTemplate = {
      id: `template-${crypto.randomUUID()}`,
      ownerUserId: user.userId,
      clubId: user.profile.club,
      createdByUserId: user.userId,
      title: draft.title.trim() || tabletBuilderSections[0]?.title || "Training Vorlage",
      category: (tabletBuilderSections[0]?.category as TrainingTemplateCategory) || "Allgemein",
      trainingArea: draft.area,
      trainingType: draft.trainingType,
      boatClass: draft.boatClass,
      defaultDurationMinutes: totalDuration,
      defaultIntensity: draft.intensity,
      focus: draft.focus || draft.goal,
      description: [draft.description, sectionSummary ? `Ablauf:\n${sectionSummary}` : ""].filter(Boolean).join("\n\n"),
      notes: draft.notes || draft.note,
      tags: Array.from(new Set(tabletBuilderSections.map((section) => section.category).filter(Boolean))),
      isFavorite: true,
      visibility: isCoach ? "club" : "private",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    onDataChange((current) => ({
      ...current,
      trainingTemplates: [nextTemplate, ...current.trainingTemplates],
    }));
    setTemplateSourceFilter("all");
    setSelectedTemplateDetailId(nextTemplate.id);
    setFormMessage("Training wurde als Vorlage gespeichert.");
  };

  const startEdit = (entry: PlanEntry) => {
    setSelectedArea(entry.area);
    setSelectedDate(entry.date);
    setSelectedRepeat(entry.repeat);
    setSelectedRepeatUntil(entry.repeatUntil);
    setSelectedRepeatMaxCount(entry.repeatMaxCount);
    setDraft({
      ...entry,
      focus: entry.focus || entry.goal,
      startTime: entry.startTime || entry.time,
      notes: entry.notes || entry.note,
    });
  };

  const getAthleteName = (athlete: CoachAthlete): string => athlete.name || `${athlete.firstName} ${athlete.lastName}`.trim() || athlete.email;
  const getGroupName = (group: CoachGroup): string => group.name;
  const getUserProfileName = (profileUser: User): string =>
    `${profileUser.profile.firstName} ${profileUser.profile.lastName}`.trim() || profileUser.profile.nickname || profileUser.id;
  const getAssignedAthleteName = (athleteId: string): string => {
    const athlete =
      visibleAthletes.find((item) => item.id === athleteId) ??
      data.coachAthletes.find((item) => item.id === athleteId);
    if (athlete) return getAthleteName(athlete);

    const profileUser = data.users.find((item) => item.userId === athleteId || item.id === athleteId);
    return profileUser ? getUserProfileName(profileUser) : "";
  };

  const getTargetSelection = (formData: FormData) => {
    const assignedType = String(formData.get("assignedType") ?? "self") as PlanEntry["assignedType"];
    const assignedAthleteIds = assignedType === "athlete" ? formData.getAll("assignedAthleteIds").map(String) : assignedType === "self" ? [data.athlete.id] : [];
    const assignedGroupIds = assignedType === "group" ? formData.getAll("assignedGroupIds").map(String) : [];
    return { assignedType, assignedAthleteIds, assignedGroupIds };
  };

  const validateTargetSelection = (assignedType: PlanEntry["assignedType"], assignedAthleteIds: string[], assignedGroupIds: string[]): boolean => {
    const allowedAthletes = new Set(visibleAthletes.map((athlete) => athlete.id));
    const allowedGroups = new Set(visibleGroups.flatMap((group) => [group.id, group.groupId]));
    const hasInvalidAthlete = assignedAthleteIds.some((id) => !allowedAthletes.has(id));
    const hasInvalidGroup = assignedGroupIds.some((id) => !allowedGroups.has(id));
    return !(assignedType === "athlete" && (assignedAthleteIds.length === 0 || hasInvalidAthlete)) && !(assignedType === "group" && (assignedGroupIds.length === 0 || hasInvalidGroup));
  };

  const saveTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!templateDraft) return;
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "Allgemein") as TrainingTemplateCategory;
    const trainingArea = String(formData.get("trainingArea") ?? "Wassertraining") as TrainingArea;
    const trainingType = String(formData.get("trainingType") ?? "K1 Technik") as TrainingPlanType;

    if (!title || !category || !trainingArea || !trainingType) {
      setFormMessage("Bitte fuelle Titel, Kategorie, Trainingsbereich und Trainingsart aus.");
      return;
    }

    const timestamp = new Date().toISOString();
    const nextTemplate: TrainingTemplate = {
      ...templateDraft,
      id: templateDraft.id || `template-${crypto.randomUUID()}`,
      ownerUserId: templateDraft.ownerUserId || user.userId,
      clubId: String(formData.get("visibility") ?? "private") === "club" ? user.profile.club : templateDraft.clubId,
      createdByUserId: templateDraft.createdByUserId || user.userId,
      title,
      category,
      trainingArea,
      trainingType,
      boatClass: String(formData.get("boatClass") ?? "K1") as TrainingBoatClass,
      defaultDurationMinutes: Number(formData.get("defaultDurationMinutes") ?? 0) || undefined,
      defaultIntensity: String(formData.get("defaultIntensity") ?? "mittel") as TrainingIntensity,
      focus: String(formData.get("focus") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      tags: parseTags(String(formData.get("tags") ?? "")),
      isFavorite: formData.get("isFavorite") === "on",
      visibility: String(formData.get("visibility") ?? "private") as TrainingTemplateVisibility,
      createdAt: templateDraft.createdAt || timestamp,
      updatedAt: timestamp,
    };

    onDataChange((current) => ({
      ...current,
      trainingTemplates: current.trainingTemplates.some((template) => template.id === nextTemplate.id)
        ? current.trainingTemplates.map((template) => (template.id === nextTemplate.id ? nextTemplate : template))
        : [nextTemplate, ...current.trainingTemplates],
    }));
    setFormMessage("Vorlage gespeichert.");
    setTemplateDraft(null);
  };

  const deleteTemplate = (template: TrainingTemplate) => {
    if (isSystemTrainingTemplate(template)) {
      setFormMessage("Paddlio-Systemvorlagen können nicht gelöscht werden.");
      return;
    }
    if (!canEditTrainingTemplate(user, template)) {
      setFormMessage("Du hast keine Berechtigung für diese Vorlage.");
      return;
    }

    onDataChange((current) => ({
      ...current,
      trainingTemplates: current.trainingTemplates.filter((item) => item.id !== template.id),
    }));
    setFormMessage("Vorlage gelöscht.");
  };

  const duplicateTemplate = (template: TrainingTemplate) => {
    const timestamp = new Date().toISOString();
    const nextTemplate: TrainingTemplate = {
      ...template,
      id: `template-${crypto.randomUUID()}`,
      ownerUserId: user.userId,
      clubId: user.profile.club,
      createdByUserId: user.userId,
      title: `${template.title} Kopie`,
      visibility: "private",
      isFavorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    onDataChange((current) => ({
      ...current,
      trainingTemplates: [nextTemplate, ...current.trainingTemplates],
    }));
    setTemplateSourceFilter("all");
    setSelectedTemplateDetailId(nextTemplate.id);
    setFormMessage("Vorlage dupliziert.");
  };

  const toggleTemplateFavorite = (template: TrainingTemplate) => {
    if (isSystemTrainingTemplate(template) || !canEditTrainingTemplate(user, template)) {
      setFormMessage("Systemvorlagen kannst du über Duplizieren als eigene Vorlage übernehmen.");
      return;
    }

    onDataChange((current) => ({
      ...current,
      trainingTemplates: current.trainingTemplates.map((item) =>
        item.id === template.id ? { ...item, isFavorite: !item.isFavorite, updatedAt: new Date().toISOString() } : item,
      ),
    }));
  };

  const useTemplateFromDetail = (template: TrainingTemplate) => {
    applyTemplateSelection(template.id, "replace");
    setShowTemplatePicker(false);
    setFormMessage(`${template.title} ist für die Planung ausgewählt.`);
  };

  const copyPlanEntry = (
    entry: PlanEntry,
    date: string,
    assignedType = entry.assignedType,
    assignedAthleteIds = entry.assignedAthleteIds,
    assignedGroupIds = entry.assignedGroupIds,
  ) => {
    if (!date) {
      setFormMessage("Bitte waehle ein Datum aus.");
      return;
    }
    if (!canAccessPlanEntry(data, user, entry) || !validateTargetSelection(assignedType, assignedAthleteIds, assignedGroupIds)) {
      setFormMessage("Dieses Training kann nicht kopiert werden.");
      return;
    }

    onSave({
      ...entry,
      id: undefined,
      ownerUserId: user.userId,
      clubId: user.profile.club,
      assignedType,
      assignedAthleteIds,
      assignedGroupIds,
      date,
      weekday: getWeekdayFromDate(date),
      status: "planned",
      repeat: "none",
      repeatUntil: "",
      assignedAthleteId: assignedAthleteIds[0] ?? "",
      assignedGroupId: assignedGroupIds[0] ?? "",
      feedbackNote: "",
    });
  };

  const planFromTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const template = visibleTemplates.find((item) => item.id === String(formData.get("templateId") ?? ""));
    if (!template) {
      setFormMessage("Bitte waehle eine Vorlage aus.");
      return;
    }
    const date = String(formData.get("date") ?? "");
    if (!date) {
      setFormMessage("Bitte waehle ein Datum aus.");
      return;
    }
    const { assignedType, assignedAthleteIds, assignedGroupIds } = getTargetSelection(formData);
    if (!validateTargetSelection(assignedType, assignedAthleteIds, assignedGroupIds)) {
      setFormMessage("Du hast keine Berechtigung für diese Gruppe oder diesen Sportler.");
      return;
    }

    const selectedFocus = String(formData.get("focus") ?? "").trim() || template.focus;
    const selectedDescription = String(formData.get("generatedDescription") ?? "").trim() || template.description || "";
    const selectedNotes = String(formData.get("notes") ?? template.notes ?? "").trim();
    const durationInput = String(formData.get("durationMinutes") ?? "").trim();
    const durationMinutes = durationInput ? Number(durationInput) : template.defaultDurationMinutes ?? 75;

    onSave({
      ownerUserId: user.userId,
      clubId: user.profile.club,
      assignedType,
      assignedAthleteIds,
      assignedGroupIds,
      title: template.title,
      date,
      weekday: getWeekdayFromDate(date),
      time: String(formData.get("startTime") ?? "17:30"),
      startTime: String(formData.get("startTime") ?? "17:30"),
      endTime: "",
      durationMinutes,
      area: template.trainingArea,
      trainingType: template.trainingType,
      boatClass: template.boatClass ?? "none",
      goal: selectedFocus,
      focus: selectedFocus,
      description: selectedDescription,
      intensity: String(formData.get("intensity") ?? template.defaultIntensity) as TrainingIntensity,
      note: selectedNotes,
      notes: selectedNotes,
      status: "planned",
      repeat: "none",
      repeatUntil: "",
      assignedAthleteId: assignedAthleteIds[0] ?? "",
      assignedGroupId: assignedGroupIds[0] ?? "",
      feedbackNote: "",
      templateId: template.id,
    });
    setFormMessage("Training aus Vorlage geplant.");
  };

  const getDefaultPlanningTarget = () => {
    if (isCoach && groupFilter !== "all") {
      return { assignedType: "group" as const, assignedAthleteIds: [], assignedGroupIds: [groupFilter] };
    }
    if (isCoach && athleteFilter !== "all") {
      return { assignedType: "athlete" as const, assignedAthleteIds: [athleteFilter], assignedGroupIds: [] };
    }
    return { assignedType: "self" as const, assignedAthleteIds: [data.athlete.id], assignedGroupIds: [] };
  };

  const saveTemplateAsPlanEntry = (template: TrainingTemplate, date: string, time = "17:30") => {
    const target = getDefaultPlanningTarget();
    if (!validateTargetSelection(target.assignedType, target.assignedAthleteIds, target.assignedGroupIds)) {
      setFormMessage("Wähle zuerst eine gültige Gruppe oder einen Sportler aus.");
      return false;
    }

    onSave({
      ownerUserId: user.userId,
      clubId: user.profile.club,
      assignedType: target.assignedType,
      assignedAthleteIds: target.assignedAthleteIds,
      assignedGroupIds: target.assignedGroupIds,
      title: template.title,
      date,
      weekday: getWeekdayFromDate(date),
      time,
      startTime: time,
      endTime: "",
      durationMinutes: template.defaultDurationMinutes ?? 75,
      area: template.trainingArea,
      trainingType: template.trainingType,
      boatClass: template.boatClass ?? "none",
      goal: template.focus,
      focus: template.focus,
      description: template.description ?? "",
      intensity: template.defaultIntensity,
      note: template.notes ?? "",
      notes: template.notes ?? "",
      status: "planned",
      repeat: "none",
      repeatUntil: "",
      assignedAthleteId: target.assignedAthleteIds[0] ?? "",
      assignedGroupId: target.assignedGroupIds[0] ?? "",
      feedbackNote: "",
      templateId: template.id,
    });
    return true;
  };

  const saveWeeklyItemAsPlanEntry = (item: WeeklyPlanningTemplateItem, date: string) => {
    const sourceTemplate = item.templateId ? visibleTemplates.find((template) => template.id === item.templateId) : undefined;
    if (sourceTemplate) return saveTemplateAsPlanEntry(sourceTemplate, date, item.time);

    const target = getDefaultPlanningTarget();
    if (!validateTargetSelection(target.assignedType, target.assignedAthleteIds, target.assignedGroupIds)) {
      setFormMessage("Wähle zuerst eine gültige Gruppe oder einen Sportler aus.");
      return false;
    }

    onSave({
      ownerUserId: user.userId,
      clubId: user.profile.club,
      assignedType: target.assignedType,
      assignedAthleteIds: target.assignedAthleteIds,
      assignedGroupIds: target.assignedGroupIds,
      title: item.title,
      date,
      weekday: getWeekdayFromDate(date),
      time: item.time,
      startTime: item.time,
      endTime: "",
      durationMinutes: item.durationMinutes,
      area: item.area,
      trainingType: item.trainingType,
      boatClass: item.boatClass,
      goal: item.focus,
      focus: item.focus,
      description: item.description,
      intensity: item.intensity,
      note: "",
      notes: "",
      status: "planned",
      repeat: "none",
      repeatUntil: "",
      assignedAthleteId: target.assignedAthleteIds[0] ?? "",
      assignedGroupId: target.assignedGroupIds[0] ?? "",
      feedbackNote: "",
      templateId: item.templateId ?? "",
    });
    return true;
  };

  const quickInsertTemplate = (templateId: string, date = selectedDate) => {
    const template = visibleTemplates.find((item) => item.id === templateId);
    if (!template) {
      setFormMessage("Vorlage nicht gefunden.");
      return;
    }
    if (saveTemplateAsPlanEntry(template, date)) {
      setCopyMessage(`${template.title} wurde am ${date} eingefügt.`);
      setSelectedDate(date);
    }
  };

  const applyWeeklyTemplate = (weeklyTemplate: WeeklyPlanningTemplate, targetDate = selectedDate) => {
    const targetWeekStart = getWeekDates(targetDate)[0];
    let inserted = 0;
    weeklyTemplate.items.forEach((item) => {
      if (saveWeeklyItemAsPlanEntry(item, addDays(targetWeekStart, item.dayOffset))) inserted += 1;
    });
    if (inserted > 0) {
      setCopyMessage(`${weeklyTemplate.title}: ${inserted} Einheiten wurden eingefügt.`);
      setWorkflowTab("week");
      setCalendarView("week");
    }
  };

  const applySeasonBlock = (seasonBlockId: string) => {
    const seasonBlock = seasonPlanningBlocks.find((block) => block.id === seasonBlockId);
    if (!seasonBlock) return;
    const firstWeekStart = getWeekDates(selectedDate)[0];
    let inserted = 0;
    seasonBlock.weeklyTemplateIds.forEach((weeklyTemplateId, weekIndex) => {
      const weeklyTemplate = weeklyPlanningTemplates.find((template) => template.id === weeklyTemplateId);
      if (!weeklyTemplate) return;
      weeklyTemplate.items.forEach((item) => {
        if (saveWeeklyItemAsPlanEntry(item, addDays(firstWeekStart, weekIndex * 7 + item.dayOffset))) inserted += 1;
      });
    });
    if (inserted > 0) {
      setCopyMessage(`${seasonBlock.title}: ${inserted} Einheiten wurden eingefügt.`);
      setWorkflowTab("month");
      setCalendarView("month");
    }
  };

  const handleTemplateDragStart = (event: DragEvent<HTMLElement>, templateId: string) => {
    if (isPhone) return;
    event.dataTransfer.setData("text/plain", templateId);
    event.dataTransfer.effectAllowed = "copy";
    setDragTemplateId(templateId);
  };

  const handleTemplateDragOver = (event: DragEvent<HTMLElement>) => {
    if (!isPhone) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleTemplateDrop = (event: DragEvent<HTMLElement>, date: string) => {
    event.preventDefault();
    const templateId = event.dataTransfer.getData("text/plain") || dragTemplateId;
    setDragTemplateId("");
    if (templateId) quickInsertTemplate(templateId, date);
  };

  const handleCopyEntrySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!copyEntry) return;
    const formData = new FormData(event.currentTarget);
    const mode = String(formData.get("copyMode") ?? "custom");
    const date = mode === "tomorrow" ? addDays(copyEntry.date, 1) : mode === "nextWeek" ? addDays(copyEntry.date, 7) : String(formData.get("date") ?? "");
    const { assignedType, assignedAthleteIds, assignedGroupIds } = getTargetSelection(formData);
    copyPlanEntry(copyEntry, date, assignedType, assignedAthleteIds, assignedGroupIds);
    setCopyEntry(null);
    setCopyMessage("1 Training wurde kopiert.");
  };

  const handleWeekCopySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const destinationDate = String(formData.get("destinationDate") ?? addDays(selectedDate, 7));
    const area = String(formData.get("area") ?? "all");
    const boat = String(formData.get("boat") ?? "all");
    const { assignedType, assignedAthleteIds, assignedGroupIds } = getTargetSelection(formData);
    const offset = getDateOffset(weekDates[0], getWeekDates(destinationDate)[0]);
    const sourceEntries = plannedThisWeek.filter((entry) => (area === "all" || entry.area === area) && includesBoat(entry, boat));

    if (sourceEntries.length === 0) {
      setFormMessage("Es wurden keine Trainings im ausgewaehlten Zeitraum gefunden.");
      return;
    }

    sourceEntries.forEach((entry) => copyPlanEntry(entry, addDays(entry.date, offset), assignedType, assignedAthleteIds, assignedGroupIds));
    setShowWeekCopy(false);
    setCopyMessage(`${sourceEntries.length} Trainings wurden kopiert.`);
  };

  const handleBlockCopySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? "");
    const targetStartDate = String(formData.get("targetStartDate") ?? "");
    const { assignedType, assignedAthleteIds, assignedGroupIds } = getTargetSelection(formData);
    if (!startDate || !endDate || !targetStartDate) {
      setFormMessage("Bitte waehle Zeitraum und Zielzeitraum aus.");
      return;
    }
    const offset = getDateOffset(startDate, targetStartDate);
    const sourceEntries = visibleEntries.filter((entry) => entry.date >= startDate && entry.date <= endDate);

    if (sourceEntries.length === 0) {
      setFormMessage("Es wurden keine Trainings im ausgewaehlten Zeitraum gefunden.");
      return;
    }

    sourceEntries.forEach((entry) => copyPlanEntry(entry, addDays(entry.date, offset), assignedType, assignedAthleteIds, assignedGroupIds));
    setShowBlockCopy(false);
    setCopyMessage(`${sourceEntries.length} Trainings wurden kopiert.`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const assignedType = String(formData.get("assignedType") ?? "self") as PlanEntry["assignedType"];
    const assignedAthleteIds = assignedType === "athlete" ? formData.getAll("assignedAthleteIds").map(String) : assignedType === "self" ? [data.athlete.id] : [];
    const assignedGroupIds = assignedType === "group" ? formData.getAll("assignedGroupIds").map(String) : [];
    const date = String(formData.get("date") ?? today);
    const title = String(formData.get("title") ?? "").trim();
    const area = String(formData.get("area") ?? "Wassertraining") as TrainingArea;
    const trainingType = String(formData.get("trainingType") ?? "K1 Technik") as TrainingPlanType;

    if (!title || !date || (assignedType === "athlete" && assignedAthleteIds.length === 0) || (assignedType === "group" && assignedGroupIds.length === 0)) {
      setFormMessage("Bitte fuelle alle Pflichtfelder aus und waehle bei Zuweisungen mindestens ein Ziel aus.");
      return;
    }

    const allowedAthletes = new Set(visibleAthletes.map((athlete) => athlete.id));
    const allowedGroups = new Set(visibleGroups.flatMap((group) => [group.id, group.groupId]));
    const hasInvalidAthlete = assignedAthleteIds.some((id) => !allowedAthletes.has(id));
    const hasInvalidGroup = assignedGroupIds.some((id) => !allowedGroups.has(id));

    if ((assignedType === "athlete" && hasInvalidAthlete) || (assignedType === "group" && hasInvalidGroup)) {
      setFormMessage("Du hast keine Berechtigung für mindestens eine ausgewaehlte Zuweisung.");
      return;
    }

    onSave({
      id: draft?.id || undefined,
      ownerUserId: draft?.ownerUserId || user.userId,
      clubId: user.profile.club,
      assignedType,
      assignedAthleteIds,
      assignedGroupIds,
      title,
      date,
      weekday: getWeekdayFromDate(date),
      time: String(formData.get("startTime") ?? ""),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes") ?? 0),
      area,
      trainingType,
      boatClass: String(formData.get("boatClass") ?? "none") as TrainingBoatClass,
      goal: String(formData.get("focus") ?? "").trim(),
      focus: String(formData.get("focus") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      intensity: String(formData.get("intensity") ?? "mittel") as TrainingIntensity,
      note: String(formData.get("notes") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      status: String(formData.get("status") ?? "planned") as PlanStatus,
      repeat: String(formData.get("repeat") ?? "none") as TrainingRepeat,
      repeatUntil: String(formData.get("repeatUntil") ?? ""),
      repeatMaxCount: Number(formData.get("repeatMaxCount") ?? 0) || undefined,
      repeatSeriesId: draft?.repeatSeriesId ?? "",
      assignedAthleteId: assignedAthleteIds[0] ?? "",
      assignedGroupId: assignedGroupIds[0] ?? "",
      feedbackNote: String(formData.get("feedbackNote") ?? draft?.feedbackNote ?? "").trim(),
    });

    setFormMessage("");
    setDraft(null);
  };

  const handleFeedbackSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!feedbackEntry) return;
    const formData = new FormData(event.currentTarget);
    onFeedbackSave({
      trainingId: feedbackEntry.id,
      athleteUserId: user.userId,
      coachUserId: feedbackEntry.createdByUserId === user.userId ? "" : feedbackEntry.createdByUserId,
      status: String(formData.get("status") ?? "done") as "done" | "skipped",
      feeling: Number(formData.get("feeling") ?? 7),
      difficulty: Number(formData.get("difficulty") ?? 5),
      fatigue: Number(formData.get("fatigue") ?? 5),
      motivation: Number(formData.get("motivation") ?? 7),
      sleep: Number(formData.get("sleep") ?? 7),
      reason: String(formData.get("reason") ?? ""),
      comment: String(formData.get("comment") ?? "").trim(),
    });
    setFeedbackEntry(null);
  };

  const createTrainingTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskEntry || !isCoach) return;

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const assignedTo = String(formData.get("assignedTo") ?? user.userId);
    if (!title) {
      setFormMessage("Bitte gib einen Titel für die Traineraufgabe ein.");
      return;
    }
    if (!trainerTaskAssignees.some((item) => item.userId === assignedTo)) {
      setFormMessage("Diese Traineraufgabe kann nur einem Trainer oder Admin im Verein zugewiesen werden.");
      return;
    }

    const timestamp = new Date().toISOString();
    const taskId = `task-${crypto.randomUUID()}`;
    const task: TeamTask = {
      id: taskId,
      clubId: user.profile.club,
      createdBy: user.userId,
      title,
      description: String(formData.get("description") ?? "").trim(),
      taskType: String(formData.get("taskType") ?? "training") as TeamTaskType,
      priority: String(formData.get("priority") ?? "normal") as TeamTaskPriority,
      dueDate: String(formData.get("dueDate") ?? taskEntry.date),
      relatedTrainingId: taskEntry.id,
      relatedCompetitionId: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: "",
    };
    const assignment: TeamTaskAssignment = {
      id: `task-assignment-${crypto.randomUUID()}`,
      taskId,
      assignedTo,
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
    setFormMessage("");
    setCopyMessage("Traineraufgabe wurde erstellt.");
  };

  const updateTrainingTaskAssignment = (assignment: TeamTaskAssignment, status: TeamTaskAssignment["status"]) => {
    const timestamp = new Date().toISOString();
    const nextAssignment: TeamTaskAssignment = {
      ...assignment,
      status,
      completedAt: status === "done" ? timestamp : assignment.completedAt,
      updatedAt: timestamp,
    };
    onDataChange((current) => ({
      ...current,
      taskAssignments: current.taskAssignments.map((item) => (item.id === nextAssignment.id ? nextAssignment : item)),
    }));
  };

  const deleteTrainingTask = (taskId: string) => {
    const timestamp = new Date().toISOString();
    onDataChange((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, deletedAt: timestamp, updatedAt: timestamp } : task)),
    }));
  };

  const renderTabletTrainingBuilder = () => {
    if (!draft) return null;
    const start = draft.startTime || draft.time || "17:30";
    const end = draft.endTime || addMinutesToTime(start, draft.durationMinutes || 75);
    const targetName = draft.assignedType === "group"
      ? visibleGroups.find((group) => draft.assignedGroupIds.includes(group.id) || draft.assignedGroupId === group.id)?.name ?? "Gruppe auswählen"
      : draft.assignedType === "athlete"
        ? visibleAthletes.find((athlete) => draft.assignedAthleteIds.includes(athlete.id) || draft.assignedAthleteId === athlete.id)?.name ?? "Sportler auswählen"
        : "Für mich";
    const focusParts = (draft.focus || draft.goal || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 4);
    const builderQuery = tabletBuilderSearch.trim().toLowerCase();
    const builderTemplates = visibleTemplates
      .filter((template) => tabletBuilderCategory === "all" || [template.title, template.category, template.trainingArea, template.trainingType, template.focus, template.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(tabletBuilderCategory.toLowerCase()))
      .filter((template) => !builderQuery || [template.title, template.focus, template.trainingArea, template.trainingType, template.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(builderQuery))
      .slice(0, 18);
    const selectedSection = tabletBuilderSections.find((section) => section.id === selectedTabletSectionId) ?? null;
    const totalDuration = tabletBuilderSections.reduce((sum, section) => sum + section.durationMinutes, 0) || draft.durationMinutes || 75;
    const plannedEnd = addMinutesToTime(start, totalDuration);
    const selectedAthleteId = draft.assignedAthleteIds[0] ?? draft.assignedAthleteId ?? "";
    const selectedGroupId = draft.assignedGroupIds[0] ?? draft.assignedGroupId ?? "";
    const timelineText = tabletBuilderSections.length > 0
      ? tabletBuilderSections.map((section, index) => `${index + 1}. ${section.title} (${section.durationMinutes} min, ${intensityLabel[section.intensity]}): ${section.focus}`).join("\n")
      : "";
    const savedDescription = [draft.description, timelineText ? `Ablauf:\n${timelineText}` : ""].filter(Boolean).join("\n\n");
    const savedNotes = [draft.notes || draft.note, tabletBuilderSections.length > 0 ? `Abschnitte: ${tabletBuilderSections.length} · Soll-Dauer: ${totalDuration} min` : ""].filter(Boolean).join("\n");
    const dragOverTimeline = (event: DragEvent<HTMLElement>) => {
      if (!dragTemplateId) return;
      event.preventDefault();
    };
    const dropTemplateOnTimeline = (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const templateId = event.dataTransfer.getData("text/plain") || dragTemplateId;
      const template = visibleTemplates.find((item) => item.id === templateId);
      if (template) addBuilderSection(template);
      setDragTemplateId("");
    };

    return (
      <section className="tablet-training-builder-shell" aria-label="Training erstellen Tablet">
        <form className="tablet-training-builder" onSubmit={handleSubmit}>
          <header className="tablet-builder-header">
              <button type="button" onClick={() => setDraft(null)}>Zurück</button>
            <div>
              <p className="eyebrow">Training</p>
              <h2>{draft.id ? "Training bearbeiten" : "Training erstellen"}</h2>
            </div>
            <div className="tablet-builder-actions">
              <button type="button" onClick={() => updateDraft({ id: "", title: `${draft.title || "Training"} Kopie` })}>Duplizieren</button>
              <button type="button" onClick={saveDraftAsTemplate}>Als Vorlage speichern</button>
              <button type="button" onClick={() => setDraft(null)}>Abbrechen</button>
              <button className="save-button" type="submit">Training planen</button>
            </div>
          </header>

          {formMessage ? <p className="auth-message">{formMessage}</p> : null}

          <input type="hidden" name="title" value={draft.title} />
          <input type="hidden" name="date" value={draft.date} />
          <input type="hidden" name="startTime" value={start} />
          <input type="hidden" name="endTime" value={plannedEnd} />
          <input type="hidden" name="durationMinutes" value={totalDuration} />
          <input type="hidden" name="status" value={draft.status} />
          <input type="hidden" name="assignedType" value={draft.assignedType} />
          {draft.assignedType === "athlete" ? draft.assignedAthleteIds.map((id) => <input key={id} type="hidden" name="assignedAthleteIds" value={id} />) : null}
          {draft.assignedType === "group" ? draft.assignedGroupIds.map((id) => <input key={id} type="hidden" name="assignedGroupIds" value={id} />) : null}
          <input type="hidden" name="area" value={draft.area} />
          <input type="hidden" name="trainingType" value={draft.trainingType} />
          <input type="hidden" name="boatClass" value={draft.boatClass} />
          <input type="hidden" name="focus" value={draft.focus || draft.goal} />
          <input type="hidden" name="description" value={savedDescription} />
          <input type="hidden" name="intensity" value={draft.intensity} />
          <input type="hidden" name="notes" value={savedNotes} />
          <input type="hidden" name="repeat" value={selectedRepeat} />
          <input type="hidden" name="repeatUntil" value={selectedRepeatUntil} />
          <input type="hidden" name="repeatMaxCount" value={selectedRepeatMaxCount ?? ""} />
          <input type="hidden" name="feedbackNote" value={draft.feedbackNote} />

          <div className="tablet-builder-workspace">
            <aside className="tablet-block-library" aria-label="Trainingsbausteine">
              <div className="tablet-panel-heading">
                <p className="eyebrow">Trainingsbausteine</p>
                <h3>Bausteine</h3>
              </div>
              <label className="tablet-builder-search">Suche<input value={tabletBuilderSearch} onChange={(event) => setTabletBuilderSearch(event.currentTarget.value)} placeholder="Baustein suchen" /></label>
              <div className="template-tag-filter compact" aria-label="Bausteine filtern">
                {templateTagFilters.map((tag) => (
                  <button key={tag} className={tabletBuilderCategory === tag ? "is-active" : ""} type="button" onClick={() => setTabletBuilderCategory(tag)}>
                    {tag === "all" ? "Alle" : tag}
                  </button>
                ))}
              </div>
              <div className="tablet-block-list">
                {builderTemplates.map((template) => (
                  <button
                    className={`tablet-block-card template-tone-${getTemplateToneClass(template)}`}
                    draggable
                    key={template.id}
                    type="button"
                    onClick={() => addBuilderSection(template)}
                    onDragStart={(event) => handleTemplateDragStart(event, template.id)}
                    onDragEnd={() => setDragTemplateId("")}
                  >
                    <span><i aria-hidden="true" />{getTemplateCategoryGroup(template)}</span>
                    <strong>{template.title}</strong>
                    <small>{template.defaultDurationMinutes ?? 20} min · {intensityLabel[template.defaultIntensity]}</small>
                    <em>{template.focus || template.trainingType}</em>
                  </button>
                ))}
              </div>
            </aside>

            <section className="tablet-training-timeline" aria-label="Training Timeline" onDragOver={dragOverTimeline} onDrop={dropTemplateOnTimeline}>
              <div className="tablet-timeline-top">
                <div>
                  <p className="eyebrow">Training erstellen</p>
                  <label>Titel<input value={draft.title} onChange={(event) => updateDraft({ title: event.currentTarget.value })} placeholder="K1 Technik - Linienwahl" /></label>
                </div>
                <div className="tablet-timeline-meta">
                  <label>Datum<input type="date" value={draft.date} onChange={(event) => updateDraft({ date: event.currentTarget.value, weekday: getWeekdayFromDate(event.currentTarget.value) })} /></label>
                  <label>Start<input type="time" value={start} onChange={(event) => updateDraft({ startTime: event.currentTarget.value, time: event.currentTarget.value, endTime: addMinutesToTime(event.currentTarget.value, totalDuration) })} /></label>
                </div>
              </div>

              <div className="tablet-assignment-strip" aria-label="Zuweisung">
                {(["self", "athlete", "group"] as PlanEntry["assignedType"][]).map((type) => (
                  <button
                    key={type}
                    className={draft.assignedType === type ? "is-active" : ""}
                    type="button"
                    onClick={() => selectSingleTarget(type, type === "athlete" ? visibleAthletes[0]?.id ?? "" : type === "group" ? visibleGroups[0]?.id ?? "" : "")}
                  >
                    {type === "self" ? "Mich" : type === "athlete" ? "Sportler" : "Gruppe"}
                  </button>
                ))}
                {draft.assignedType === "athlete" ? <select aria-label="Sportler" value={selectedAthleteId} onChange={(event) => selectSingleTarget("athlete", event.currentTarget.value)}>{visibleAthletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{getAthleteName(athlete)}</option>)}</select> : null}
                {draft.assignedType === "group" ? <select aria-label="Gruppe" value={selectedGroupId} onChange={(event) => selectSingleTarget("group", event.currentTarget.value)}>{visibleGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select> : null}
              </div>

              <div className={`tablet-drop-zone ${dragTemplateId ? "is-active" : ""}`}>
                {dragTemplateId ? "Hier ablegen und zur Timeline hinzufuegen" : "Baustein antippen oder hier ablegen"}
              </div>

              <div className="tablet-timeline-list">
                {tabletBuilderSections.length > 0 ? tabletBuilderSections.map((section, index) => {
                  const sectionStart = addMinutesToTime(start, tabletBuilderSections.slice(0, index).reduce((sum, item) => sum + item.durationMinutes, 0));
                  return (
                    <article className={`tablet-timeline-card template-tone-${getBuilderSectionToneClass(section)} ${selectedTabletSectionId === section.id ? "is-selected" : ""}`} key={section.id}>
                      <button type="button" onClick={() => setSelectedTabletSectionId(section.id)}>
                        <span>{sectionStart}</span>
                        <strong>{section.title}</strong>
                        <small>{section.category} · {intensityLabel[section.intensity]}{section.optional ? " · optional" : ""}</small>
                      </button>
                      <div className="tablet-duration-stepper">
                        <button type="button" onClick={() => updateBuilderSection(section.id, { durationMinutes: Math.max(5, section.durationMinutes - 5) })}>-5</button>
                        <b>{section.durationMinutes} min</b>
                        <button type="button" onClick={() => updateBuilderSection(section.id, { durationMinutes: section.durationMinutes + 5 })}>+5</button>
                      </div>
                      <menu>
                        <button type="button" onClick={() => duplicateBuilderSection(section)}>Duplizieren</button>
                        <button type="button" onClick={() => moveBuilderSection(section.id, -1)}>Hoch</button>
                        <button type="button" onClick={() => moveBuilderSection(section.id, 1)}>Runter</button>
                        <button type="button" onClick={() => updateBuilderSection(section.id, { optional: !section.optional })}>Optional</button>
                        <button className="delete-button" type="button" onClick={() => deleteBuilderSection(section.id)}>Loeschen</button>
                      </menu>
                    </article>
                  );
                }) : (
                  <div className="tablet-timeline-empty">
                    <h3>Noch kein Ablauf</h3>
                    <p>Fuege links Bausteine hinzu oder starte mit Quick Build.</p>
                    <button type="button" onClick={applyQuickBuild}>Quick Build uebernehmen</button>
                  </div>
                )}
              </div>

              <footer className="tablet-timeline-summary">
                <strong>Gesamt: {totalDuration} min</strong>
                <span>{start} - {plannedEnd} · {targetName}</span>
              </footer>
            </section>

            <aside className="tablet-builder-inspector" aria-label="Details und Vorschau">
              {selectedSection ? (
                <>
                  <div className="tablet-panel-heading">
                    <p className="eyebrow">{selectedSection.category}</p>
                    <h3>{selectedSection.title}</h3>
                  </div>
                  <label>Titel<input value={selectedSection.title} onChange={(event) => updateBuilderSection(selectedSection.id, { title: event.currentTarget.value })} /></label>
                  <label>Dauer<input type="number" min="5" step="5" value={selectedSection.durationMinutes} onChange={(event) => updateBuilderSection(selectedSection.id, { durationMinutes: Number(event.currentTarget.value) || 5 })} /></label>
                  <label>Intensität<select value={selectedSection.intensity} onChange={(event) => updateBuilderSection(selectedSection.id, { intensity: event.currentTarget.value as TrainingIntensity })}>{trainingIntensities.map((intensity) => <option key={intensity} value={intensity}>{intensityLabel[intensity]}</option>)}</select></label>
                  <label>Boot<select value={selectedSection.boatClass} onChange={(event) => updateBuilderSection(selectedSection.id, { boatClass: event.currentTarget.value as TrainingBoatClass })}><option value="K1">K1</option><option value="C1">C1</option><option value="K1+C1">K1+C1</option><option value="none">ohne Boot</option></select></label>
                  <label>Ziel / Fokus<textarea rows={3} value={selectedSection.focus} onChange={(event) => updateBuilderSection(selectedSection.id, { focus: event.currentTarget.value })} /></label>
                  <label>Beschreibung<textarea rows={4} value={selectedSection.description} onChange={(event) => updateBuilderSection(selectedSection.id, { description: event.currentTarget.value })} /></label>
                  <label className="toggle-row"><span>Optionaler Abschnitt</span><input type="checkbox" checked={selectedSection.optional} onChange={(event) => updateBuilderSection(selectedSection.id, { optional: event.currentTarget.checked })} /></label>
                </>
              ) : (
                <>
                  <div className="tablet-panel-heading">
                    <p className="eyebrow">Vorschau</p>
                    <h3>{draft.title || "Neues Training"}</h3>
                  </div>
                  <dl>
                    <div><dt>Datum</dt><dd>{draft.date}</dd></div>
                    <div><dt>Zeit</dt><dd>{start} - {plannedEnd}</dd></div>
                    <div><dt>Dauer</dt><dd>{totalDuration} min</dd></div>
                    <div><dt>Bereich</dt><dd>{draft.area}</dd></div>
                    <div><dt>Intensität</dt><dd>{intensityLabel[draft.intensity]}</dd></div>
                    <div><dt>Zuweisung</dt><dd>{targetName}</dd></div>
                    <div><dt>Trainer</dt><dd>{getUserProfileName(user)}</dd></div>
                  </dl>
                  {focusParts.length > 0 ? <div className="tablet-preview-chips">{focusParts.map((part) => <span key={part}>{part}</span>)}</div> : null}
                  <label>Fokus<textarea rows={3} value={draft.focus || draft.goal} onChange={(event) => updateDraft({ focus: event.currentTarget.value, goal: event.currentTarget.value })} /></label>
                  <label>Notizen<textarea rows={3} value={draft.notes || draft.note} onChange={(event) => updateDraft({ notes: event.currentTarget.value, note: event.currentTarget.value })} /></label>
                </>
              )}
              <div className="tablet-load-meter" aria-label="Belastung">
                <span>Belastung</span>
                <b>{intensityLabel[draft.intensity]}</b>
                <i />
              </div>
            </aside>
          </div>
        </form>
      </section>
    );
  };

  const renderEntryCard = (entry: PlanEntry) => {
    const entryFeedback = data.trainingFeedback.filter((feedback) => feedback.trainingId === entry.id);
    const assignedAthleteIds = Array.from(new Set([...entry.assignedAthleteIds, entry.assignedAthleteId].filter(Boolean)));
    const assignedAthleteNames = assignedAthleteIds.map(getAssignedAthleteName).filter(Boolean);
    const assignedGroups = visibleGroups.filter((group) => entry.assignedGroupIds.includes(group.id) || entry.assignedGroupId === group.id);
    const trainingTasks = data.tasks
      .filter((task) => task.relatedTrainingId === entry.id && !task.deletedAt)
      .filter((task) => {
        if (task.createdBy === user.userId) return true;
        return data.taskAssignments.some((assignment) => assignment.taskId === task.id && assignment.assignedTo === user.userId);
      });
    const canDeleteEntry = entry.createdByUserId === user.userId || user.role === "admin";
    const repeatSeriesEntries = canDeleteEntry ? getTrainingRepeatSeriesEntries(entries, entry) : [];
    const canDeleteSeries = repeatSeriesEntries.length > 1;
    const deleteSeries = () => {
      const confirmed = window.confirm(
        `Diese Wiederholungsserie enthält ${repeatSeriesEntries.length} Trainingseinheiten. Wirklich alle löschen?`,
      );
      if (confirmed) onDeleteSeries(entry.id);
    };

    return (
      <article className={`calendar-training-card status-${getEntryStatusClass(entry.status)}`} key={entry.id}>
        <div className="plan-card-head">
          <div>
            <span>{entry.date} - {entry.startTime || entry.time || "--:--"}{entry.endTime ? ` bis ${entry.endTime}` : ""}</span>
            <h4>{entry.title || entry.trainingType}</h4>
          </div>
          <b className={`status-pill ${getEntryStatusClass(entry.status)}`}>{statusLabel[entry.status]}</b>
        </div>
        <div className="smart-detail-grid">
          <span>{entry.trainingType}</span>
          <span>{entry.durationMinutes} min</span>
          <span>{intensityLabel[entry.intensity]}</span>
          <span>{entry.boatClass}</span>
        </div>
        <p>{entry.focus || entry.description || entry.notes || "Noch kein Fokus eingetragen."}</p>
        {entry.feedbackNote ? <small className="card-note">Individuelle Anpassung: {entry.feedbackNote}</small> : null}
        <small className="card-note">
          {entry.assignedType === "group"
            ? `Gruppe: ${assignedGroups.map(getGroupName).join(", ") || "nicht gefunden"}`
            : entry.assignedType === "athlete"
              ? `Sportler: ${assignedAthleteNames.join(", ") || "wird geladen"}`
              : "Eigenes Training"}
        </small>
        {entryFeedback.length > 0 ? (
          <div className="feedback-list">
            {entryFeedback.map((feedback) => (
              <span key={feedback.id}>
                Feedback: {feedback.status === "skipped" ? "ausgelassen" : "erledigt"} · Gefühl {feedback.feeling}/10 · Motivation {feedback.motivation}/10
                {feedback.comment ? ` · Kommentar: ${feedback.comment}` : ""}
                {feedback.reason ? ` · Grund: ${feedback.reason}` : ""}
              </span>
            ))}
          </div>
        ) : null}
        {isCoach && trainingTasks.length > 0 ? (
          <div className="training-task-list" aria-label="Private Traineraufgaben">
            {trainingTasks.map((task) => {
              const assignment = data.taskAssignments.find((item) => item.taskId === task.id);
              const assignee = data.users.find((item) => item.userId === assignment?.assignedTo);
              const canUpdateTask = assignment?.assignedTo === user.userId || task.createdBy === user.userId;
              return (
                <div className="training-task-row" key={task.id}>
                  <div>
                    <span>{trainingTaskTypeLabels[task.taskType]} · {trainingTaskPriorityLabels[task.priority]} · {assignee ? getUserProfileName(assignee) : "Trainer"}</span>
                    <strong>{task.title}</strong>
                    {task.description ? <small>{task.description}</small> : null}
                  </div>
                  <div className="inline-actions">
                    <b className={`status-pill ${assignment?.status === "done" ? "done" : "planned"}`}>{assignment?.status ?? "open"}</b>
                    {canUpdateTask && assignment ? <button type="button" onClick={() => updateTrainingTaskAssignment(assignment, "in_progress")}>In Arbeit</button> : null}
                    {canUpdateTask && assignment ? <button type="button" onClick={() => updateTrainingTaskAssignment(assignment, "done")}>Erledigt</button> : null}
                    {task.createdBy === user.userId ? <button className="delete-button" type="button" onClick={() => deleteTrainingTask(task.id)}>Löschen</button> : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="card-actions">
          <button className="save-button" type="button" onClick={() => onToggleDone(entry.id)} aria-label={`Training ${entry.title || entry.trainingType} am ${entry.date} ${isDoneStatus(entry.status) ? "wieder planen" : "als erledigt markieren"}`}>
            {isDoneStatus(entry.status) ? "Wieder planen" : "Erledigt"}
          </button>
          <button className="delete-button" type="button" onClick={() => setFeedbackEntry({ ...entry, status: "skipped" })} aria-label={`Training ${entry.title || entry.trainingType} am ${entry.date} als ausgelassen markieren`}>Ausgelassen</button>
          <button className="edit-button" type="button" onClick={() => setFeedbackEntry({ ...entry, status: "done" })} aria-label={`Feedback für Training ${entry.title || entry.trainingType} am ${entry.date} geben`}>Feedback</button>
          <button className="edit-button" type="button" onClick={() => setCopyEntry(entry)} aria-label={`Training ${entry.title || entry.trainingType} am ${entry.date} kopieren`}>Kopieren</button>
          {isCoach && entry.assignedType === "group" ? <button className="edit-button" type="button" onClick={() => { setCopyEntry(entry); setFormMessage("Kopiere die Gruppeneinheit auf einen einzelnen Sportler und ergänze danach die individuelle Anpassung."); }} aria-label={`Training ${entry.title || entry.trainingType} individuell anpassen`}>Individuell</button> : null}
          {isCoach ? <button className="edit-button" type="button" onClick={() => setTaskEntry(entry)} aria-label={`Traineraufgabe für ${entry.title || entry.trainingType} erstellen`}>Traineraufgabe</button> : null}
          {canDeleteEntry && canAccessPlanEntry(data, user, entry) ? <button className="edit-button" type="button" onClick={() => startEdit(entry)} aria-label={`Training ${entry.title || entry.trainingType} am ${entry.date} bearbeiten`}>Bearbeiten</button> : null}
          {canDeleteEntry ? <button className="delete-button" type="button" onClick={() => onDelete(entry.id)} aria-label={`Training ${entry.title || entry.trainingType} am ${entry.date} löschen`}>Löschen</button> : null}
          {canDeleteSeries ? <button className="delete-button" type="button" onClick={deleteSeries} aria-label={`Alle Wiederholungen von ${entry.title || entry.trainingType} löschen`}>Serie löschen</button> : null}
        </div>
      </article>
    );
  };

  const renderTargetControls = (
    defaultType: PlanEntry["assignedType"] = "self",
    defaultAthleteIds: string[] = [data.athlete.id],
    defaultGroupIds: string[] = [],
  ) => (
    <>
      <label>Zuweisung<select name="assignedType" defaultValue={defaultType}><option value="self">Für mich</option>{isCoach ? <option value="athlete">Einzelner Sportler</option> : null}{isCoach ? <option value="group">Trainingsgruppe</option> : null}</select></label>
      {isCoach ? <div className="choice-group"><span>Sportler</span><div className="tag-row">{visibleAthletes.map((athlete) => <label className="toggle-row" key={athlete.id}><span>{getAthleteName(athlete)}</span><input name="assignedAthleteIds" type="checkbox" value={athlete.id} defaultChecked={defaultAthleteIds.includes(athlete.id)} /></label>)}</div></div> : null}
      {isCoach ? <div className="choice-group"><span>Trainingsgruppen</span><div className="tag-row">{visibleGroups.map((group) => <label className="toggle-row" key={group.id}><span>{group.name}</span><input name="assignedGroupIds" type="checkbox" value={group.id} defaultChecked={defaultGroupIds.includes(group.id)} /></label>)}</div></div> : null}
    </>
  );

  const renderPlanningTemplateDock = () => {
    if (!isCoach || (workflowTab === "templates" && selectedTemplateDetail)) return null;
    const templateList = (favoriteTemplates.length > 0 ? favoriteTemplates : visibleTemplates).slice(0, 8);

    return (
      <aside className="planning-template-dock section-block" aria-label="Vorlagenkasten">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Vorlagenkasten</p>
            <h3>Schnell planen</h3>
            <p className="card-note">Drag & Drop auf einen Tag oder direkt in die aktuelle Woche einfügen.</p>
          </div>
        </div>

        <div className="template-dock-section">
          <div className="template-dock-tabs" aria-label="Vorlagenbereiche">
            <span className={favoriteTemplates.length > 0 ? "active" : ""}>Favoriten</span>
            <span>Meine</span>
            <span>Verein</span>
          </div>
          <strong>{favoriteTemplates.length > 0 ? "Favoriten" : "Trainingsvorlagen"}</strong>
          <div className="template-dock-list">
            {templateList.map((template) => (
              <button
                className="template-dock-item"
                draggable={!isPhone}
                key={template.id}
                type="button"
                onClick={() => quickInsertTemplate(template.id)}
                onDragStart={(event) => handleTemplateDragStart(event, template.id)}
              >
                <span className="template-dock-item-head">
                  <span className={`template-dock-icon ${areaLabel[template.trainingArea]}`} aria-hidden="true" />
                  <span>{template.category}</span>
                  <b>{template.defaultDurationMinutes ?? 0} min</b>
                </span>
                <strong>{template.title}</strong>
                <small>{template.focus}</small>
              </button>
            ))}
          </div>
        </div>

        {recentlyUsedTemplates.length > 0 ? (
          <div className="template-dock-section">
            <strong>Zuletzt verwendet</strong>
            <div className="suggestion-chip-row compact">
              {recentlyUsedTemplates.map((template) => (
                <button key={template.id} type="button" onClick={() => quickInsertTemplate(template.id)}>{template.title}</button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="template-dock-section">
          <strong>Wochenvorlagen</strong>
          <div className="template-dock-list">
            {weeklyPlanningTemplates.map((weeklyTemplate) => (
              <article className="template-dock-card" key={weeklyTemplate.id}>
                <div>
                  <span>{weeklyTemplate.category} · {weeklyTemplate.items.length} Einheiten</span>
                  <strong>{weeklyTemplate.title}</strong>
                  <small>{weeklyTemplate.description}</small>
                </div>
                <div className="template-week-preview">
                  {weeklyTemplate.items.map((item) => (
                    <span key={`${weeklyTemplate.id}-${item.dayOffset}-${item.title}`}>{weekdays[item.dayOffset]} {item.time} · {item.title}</span>
                  ))}
                </div>
                <button type="button" onClick={() => applyWeeklyTemplate(weeklyTemplate)}>In diese Woche einfügen</button>
              </article>
            ))}
          </div>
        </div>

        <div className="template-dock-section">
          <strong>Saisonbausteine</strong>
          <div className="template-dock-list">
            {seasonPlanningBlocks.map((seasonBlock) => (
              <article className="template-dock-card" key={seasonBlock.id}>
                <div>
                  <span>{seasonBlock.weeklyTemplateIds.length} Wochen</span>
                  <strong>{seasonBlock.title}</strong>
                  <small>{seasonBlock.description}</small>
                </div>
                <button type="button" onClick={() => applySeasonBlock(seasonBlock.id)}>Ab aktueller Woche einfügen</button>
              </article>
            ))}
          </div>
        </div>

        <div className="template-dock-section">
          <strong>Traineraufgaben</strong>
          <p className="card-note">Öffne eine Trainingseinheit und nutze „Traineraufgabe“, um Aufgaben wie Strecke aufbauen, Video aufnehmen oder Zeiten nehmen direkt einem Trainer zuzuweisen.</p>
        </div>
      </aside>
    );
  };

  const repeatPreviewCount = draft && selectedRepeat !== "none" && (selectedRepeatUntil || selectedRepeatMaxCount)
    ? expandTrainingRepeatDates(selectedDate, selectedRepeat, selectedRepeatUntil, selectedRepeatMaxCount).length
    : 1;

  if (tabletBuilderOnly && isTablet) {
    return (
      <div className="stack tablet-training-builder-page">
        {draft ? renderTabletTrainingBuilder() : (
          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Training</p>
                <h3>Training erstellen</h3>
              </div>
              <button className="primary-button" type="button" onClick={startCreate}>Training planen</button>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="stack calendar-shell planning-shell">
      <section className="summary-strip">
        <div><span>Diese Woche</span><strong>{plannedThisWeek.length}</strong></div>
        <div><span>Erledigt</span><strong>{completedThisWeek.length}</strong></div>
        <div><span>Ausgelassen</span><strong>{skippedThisWeek.length}</strong></div>
      </section>

      <section className="summary-strip">
        <div><span>Favorisierte Vorlagen</span><strong>{visibleTemplates.filter((template) => template.isFavorite).length}</strong></div>
        <div><span>Nächste Woche</span><strong>{nextWeekCount}</strong></div>
        <div><span>{isCoach ? "Ungeplante Sportler" : "Offene Rückmeldung"}</span><strong>{isCoach ? unplannedAthletes.length : openFeedbackCount}</strong></div>
      </section>

      <section className="training-workflow-hero section-block">
        <div>
          <p className="eyebrow">{isCoach ? "Coach Workflow" : "Mein Trainingsplan"}</p>
          <h3>{isCoach ? "Trainingsplanung 2.0" : "Deine nächsten Einheiten"}</h3>
          <p>{isCoach ? "Plane Tage, Wochen und Saisonblöcke aus Vorlagen, kopiere Einheiten und prüfe Rückmeldungen." : "Sieh deine Einheiten, hake Training ab und gib deinem Coach klares Feedback."}</p>
        </div>
        <div className="training-workflow-actions">
          <button className="primary-button" type="button" onClick={startCreate} aria-label="Neue Trainingseinheit im Plan eintragen">Training planen</button>
          {isCoach ? <button type="button" onClick={startTemplateCreate}>Vorlage erstellen</button> : null}
        </div>
      </section>

      <div className="training-journal-actions" aria-label="Trainingsplan Navigation">
        <button type="button" className="secondary-button" onClick={onOpenOverview} aria-label="Zur Training-Übersicht zurückkehren">
          Zur Übersicht
        </button>
        <button type="button" className="secondary-button" onClick={onOpenSessions} aria-label="Freies Training aus dem Trainingsplan eintragen">
          Freies Training
        </button>
        <button type="button" className="secondary-button" onClick={onOpenJournal} aria-label="Vom Trainingsplan zum Trainingstagebuch wechseln">
          Trainingstagebuch
        </button>
      </div>

      <nav className="calendar-view-tabs workflow-tabs" aria-label="Trainingsplanung Bereiche">
        {workflowTabs.map((tab) => (
          <button className={workflowTab === tab.id ? "active" : ""} key={tab.id} type="button" onClick={() => switchWorkflowTab(tab)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {(workflowTab === "today" || workflowTab === "week" || workflowTab === "month" || workflowTab === "templates") ? renderPlanningTemplateDock() : null}

      {workflowTab === "today" || workflowTab === "week" || workflowTab === "month" ? <section className="section-block planning-calendar-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Kalender</p>
            <h3>Trainingsplanung</h3>
            <p className="card-note">KW {selectedWeekNumber} · {selectedWeekLabel}</p>
          </div>
          <div className="card-actions">
            <button className="primary-button" type="button" onClick={startCreate} aria-label="Training aus Kalenderansicht planen">Training planen</button>
            <button type="button" onClick={() => setShowWeekCopy(true)}>Woche kopieren</button>
            <button type="button" onClick={() => setShowBlockCopy(true)}>Trainingsblock kopieren</button>
          </div>
        </div>
        {copyMessage ? <p className="auth-message">{copyMessage} <button type="button" onClick={() => setCalendarView("list")}>Trainings anzeigen</button></p> : null}
        <div className="planning-calendar-toolbar">
          <div className="calendar-mode-control" aria-label="Kalenderansicht">
            {calendarViews.map((view) => (
              <button className={calendarView === view ? "active" : ""} key={view} type="button" onClick={() => setCalendarView(view)}>
                {view === "day" ? "Tag" : view === "week" ? "Woche" : view === "month" ? "Monat" : view === "year" ? "Jahr" : "Liste"}
              </button>
            ))}
          </div>
          <div className="planning-date-controls" aria-label="Kalenderdatum steuern">
            <button type="button" onClick={() => navigateCalendar(-1)} aria-label="Vorheriger Zeitraum">‹</button>
            <button type="button" onClick={() => setSelectedDate(today)}>Heute</button>
            <button type="button" onClick={() => navigateCalendar(1)} aria-label="Nächster Zeitraum">›</button>
            <span>KW {selectedWeekNumber}</span>
          </div>
        </div>
        <div className="form-grid compact-form">
          <label>Datum<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
          <label>Bereich<select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as typeof areaFilter)}><option value="all">Alle</option>{trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
          <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Alle</option>{planStatuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label>
          <label>Boot<select value={boatFilter} onChange={(event) => setBoatFilter(event.target.value as typeof boatFilter)}><option value="all">Alle</option><option value="K1">K1</option><option value="C1">C1</option><option value="K1+C1">K1+C1</option><option value="none">ohne Boot</option></select></label>
          <label>Intensität<select value={intensityFilter} onChange={(event) => setIntensityFilter(event.target.value as typeof intensityFilter)}><option value="all">Alle</option>{trainingIntensities.map((intensity) => <option key={intensity} value={intensity}>{intensityLabel[intensity]}</option>)}</select></label>
          {isCoach ? <label>Sportler<select value={athleteFilter} onChange={(event) => setAthleteFilter(event.target.value)}><option value="all">Alle</option>{visibleAthletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{getAthleteName(athlete)}</option>)}</select></label> : null}
          {isCoach ? <label>Gruppe<select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option value="all">Alle</option>{visibleGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label> : null}
        </div>
      </section> : null}

      {workflowTab === "templates" || (!isCoach && workflowTab === "week") ? <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trainingsbibliothek</p>
            <h3>{visibleTemplates.length > 0 ? `${visibleTemplates.length} Vorlagen` : "Noch keine Trainingsvorlagen."}</h3>
            <p className="card-note">Paddlio-Vorlagen aus der Periodisierung helfen bei Grundlagen-, Aufbau-, Wettkampf- und Regenerationsphasen.</p>
          </div>
          <button className="primary-button" type="button" onClick={startTemplateCreate}>{visibleTemplates.length > 0 ? "Vorlage erstellen" : "Erste Vorlage erstellen"}</button>
        </div>
        <div className="form-grid compact-form">
          <label>Suche<input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Titel, Fokus, Tags" /></label>
          <label>Kategorie<select value={templateCategoryFilter} onChange={(event) => setTemplateCategoryFilter(event.target.value as typeof templateCategoryFilter)}><option value="all">Alle</option>{templateCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        </div>
        <div className="template-tag-filter" aria-label="Vorlagen nach Trainingsart filtern">
          {templateTagFilters.map((tag) => (
            <button key={tag} className={templateTagFilter === tag ? "is-active" : ""} type="button" onClick={() => setTemplateTagFilter(tag)}>
              {tag === "all" ? "Alle" : tag}
            </button>
          ))}
        </div>
        {!isPhone ? (
          <>
            <div className="template-source-filter" aria-label="Vorlagen nach Quelle filtern">
              {templateSourceFilters.map((source) => (
                <button key={source.id} className={templateSourceFilter === source.id ? "is-active" : ""} type="button" onClick={() => setTemplateSourceFilter(source.id)}>
                  {source.label}
                </button>
              ))}
            </div>
            <div className={`template-library-redesign-layout ${selectedTemplateDetail ? "has-detail" : ""}`}>
              <div className="template-grid-library">
                {visibleTemplates.length > 0 ? Object.entries(templateGroups).map(([groupName, groupTemplates]) => (
                  <section className="template-grid-section" key={groupName}>
                    <header>
                      <h4>{groupName}</h4>
                      <span>{groupTemplates.length} Vorlage{groupTemplates.length === 1 ? "" : "n"}</span>
                    </header>
                    <div className="template-tile-grid">
                      {groupTemplates.map((template) => (
                        <button
                          className={`template-library-tile template-tone-${getTemplateToneClass(template)} ${selectedTemplateDetailId === template.id ? "is-selected" : ""}`}
                          draggable={!isPhone}
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplateDetailId(template.id)}
                          onDragStart={(event) => handleTemplateDragStart(event, template.id)}
                        >
                          <span className="template-tile-head">
                            <span><i aria-hidden="true" />{getTemplateCategoryGroup(template).toUpperCase()}</span>
                            <b aria-label={template.isFavorite ? "Favorit" : "Kein Favorit"}>{template.isFavorite ? "★" : ""}</b>
                          </span>
                          <strong>{template.title}</strong>
                          <small>{template.defaultDurationMinutes ?? 0} min · {intensityLabel[template.defaultIntensity]}</small>
                          <em>{isSystemTrainingTemplate(template) ? "System" : template.visibility === "club" ? "Verein" : "Eigene"}</em>
                        </button>
                      ))}
                    </div>
                  </section>
                )) : (
                  <div className="template-empty-state">
                    <h4>Keine Vorlagen gefunden.</h4>
                    <p>Andere Kategorie wählen oder Filter zurücksetzen.</p>
                    <button type="button" onClick={() => { setTemplateSearch(""); setTemplateTagFilter("all"); setTemplateCategoryFilter("all"); setTemplateSourceFilter("all"); }}>Filter zurücksetzen</button>
                  </div>
                )}
              </div>
              {selectedTemplateDetail ? (
                <aside className="template-detail-panel" aria-label="Vorlagendetails">
                  <header>
                    <div>
                      <p className="eyebrow">{getTemplateCategoryGroup(selectedTemplateDetail)}</p>
                      <h4>{selectedTemplateDetail.title}</h4>
                      <span>{isSystemTrainingTemplate(selectedTemplateDetail) ? "Systemvorlage" : selectedTemplateDetail.visibility === "club" ? "Vereinsvorlage" : "Eigene Vorlage"}</span>
                    </div>
                    <button className="template-detail-close" type="button" onClick={() => setSelectedTemplateDetailId("")} aria-label="Vorlagendetails schließen">×</button>
                  </header>
                  <dl>
                    <div><dt>Kategorie</dt><dd>{selectedTemplateDetail.category}</dd></div>
                    <div><dt>Dauer</dt><dd>{selectedTemplateDetail.defaultDurationMinutes ?? 0} min</dd></div>
                    <div><dt>Intensität</dt><dd>{intensityLabel[selectedTemplateDetail.defaultIntensity]}</dd></div>
                    <div><dt>Trainingsart</dt><dd>{selectedTemplateDetail.trainingType}</dd></div>
                    <div><dt>Boot</dt><dd>{selectedTemplateDetail.boatClass ?? "none"}</dd></div>
                    <div><dt>Favorit</dt><dd>{selectedTemplateDetail.isFavorite ? "Ja" : "Nein"}</dd></div>
                  </dl>
                  <section>
                    <strong>Fokus</strong>
                    <p>{selectedTemplateDetail.focus || "Noch kein Fokus hinterlegt."}</p>
                  </section>
                  {selectedTemplateDetail.description ? (
                    <details>
                      <summary>Beschreibung</summary>
                      <p>{selectedTemplateDetail.description}</p>
                    </details>
                  ) : null}
                  {selectedTemplateDetail.tags.length > 0 ? <p className="template-detail-tags">{selectedTemplateDetail.tags.join(" · ")}</p> : null}
                  <div className="template-detail-actions">
                    <button className="save-button" type="button" onClick={() => useTemplateFromDetail(selectedTemplateDetail)}>Verwenden</button>
                    {!isSystemTrainingTemplate(selectedTemplateDetail) && canEditTrainingTemplate(user, selectedTemplateDetail) ? <button type="button" onClick={() => { setTemplateDraft(selectedTemplateDetail); setTemplateArea(selectedTemplateDetail.trainingArea); }}>Bearbeiten</button> : null}
                    <button type="button" onClick={() => duplicateTemplate(selectedTemplateDetail)}>Duplizieren</button>
                    <button type="button" onClick={() => toggleTemplateFavorite(selectedTemplateDetail)}>Favorit</button>
                  </div>
                </aside>
              ) : null}
            </div>
          </>
        ) : (
          <div className="template-group-list">
            {visibleTemplates.length > 0 ? Object.entries(templateGroups).map(([groupName, groupTemplates]) => (
              <section className="template-group-section" key={groupName}>
                <header>
                  <h4>{groupName}</h4>
                  <span>{groupTemplates.length} Vorlage{groupTemplates.length === 1 ? "" : "n"}</span>
                </header>
                <div className="template-group-rows">
                  {groupTemplates.map((template) => (
                    <article className="template-library-row" key={template.id}>
                      <span className={`template-dock-icon ${areaLabel[template.trainingArea]}`} aria-hidden="true" />
                      <div>
                        <strong>{template.isFavorite ? "* " : ""}{template.title}</strong>
                        <small>{template.category} · {template.trainingType} · {template.defaultDurationMinutes ?? 0} min · {intensityLabel[template.defaultIntensity]}</small>
                      </div>
                      <div className="template-library-actions">
                        {isSystemTrainingTemplate(template) ? <span className="status-pill planned">System</span> : null}
                        {!isSystemTrainingTemplate(template) && canEditTrainingTemplate(user, template) ? <button type="button" onClick={() => { setTemplateDraft(template); setTemplateArea(template.trainingArea); }} aria-label={`Vorlage ${template.title} bearbeiten`}>Bearbeiten</button> : null}
                        {!isSystemTrainingTemplate(template) && canEditTrainingTemplate(user, template) ? <button className="delete-button" type="button" onClick={() => deleteTemplate(template)} aria-label={`Vorlage ${template.title} löschen`}>Löschen</button> : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )) : <p className="empty-state">Noch keine Trainingsvorlagen. Erstelle deine erste Vorlage für schnelle Trainingsplanung.</p>}
          </div>
        )}
      </section> : null}

      {templateDraft ? (
        <section className="section-block planning-side-editor planning-template-editor">
          <div className="section-heading"><div><p className="eyebrow">Vorlage</p><h3>{templateDraft.id ? "Vorlage bearbeiten" : "Vorlage erstellen"}</h3></div></div>
          <form className="entry-form" onSubmit={saveTemplate}>
            <div className="form-grid">
              <label>Titel<input name="title" defaultValue={templateDraft.title} required /></label>
              <label>Kategorie<select name="category" defaultValue={templateDraft.category}>{templateCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label>Trainingsbereich<select name="trainingArea" defaultValue={templateDraft.trainingArea} onChange={(event) => setTemplateArea(event.currentTarget.value as TrainingArea)}>{trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
              <label>Trainingsart<select name="trainingType" defaultValue={templateDraft.trainingType}>{trainingTypeGroups[templateArea].map((trainingType) => <option key={trainingType} value={trainingType}>{trainingType}</option>)}</select></label>
              <label>Bootsklasse<select name="boatClass" defaultValue={templateDraft.boatClass ?? "none"}><option value="K1">K1</option><option value="C1">C1</option><option value="K1+C1">K1+C1</option><option value="none">ohne Boot</option></select></label>
              <label>Standarddauer<input name="defaultDurationMinutes" type="number" min="0" step="5" defaultValue={templateDraft.defaultDurationMinutes ?? 75} /></label>
              <label>Intensität<select name="defaultIntensity" defaultValue={templateDraft.defaultIntensity}>{trainingIntensities.map((intensity) => <option key={intensity} value={intensity}>{intensityLabel[intensity]}</option>)}</select></label>
              <label>Sichtbarkeit<select name="visibility" defaultValue={templateDraft.visibility}><option value="private">privat</option>{isCoach ? <option value="club">Verein</option> : null}</select></label>
            </div>
            <label>Ziel/Fokus<input name="focus" defaultValue={templateDraft.focus} placeholder="z. B. Strafsekunden reduzieren" /></label>
            <label>Beschreibung<textarea name="description" defaultValue={templateDraft.description} rows={3} /></label>
            <label>Notiz<textarea name="notes" defaultValue={templateDraft.notes} rows={3} /></label>
            <label>Tags<input name="tags" defaultValue={templateDraft.tags.join(", ")} placeholder="Technik, K1, Wettkampf" /></label>
            <label className="toggle-row"><span>Favorit</span><input name="isFavorite" type="checkbox" defaultChecked={templateDraft.isFavorite} /></label>
            <div className="form-actions"><button className="save-button" type="submit">Vorlage speichern</button><button className="ghost-button wide" type="button" onClick={() => setTemplateDraft(null)}>Abbrechen</button></div>
          </form>
        </section>
      ) : null}

      {workflowTab === "templates" || workflowTab === "week" ? <section className="section-block planning-side-editor planning-template-plan-panel">
        <div className="section-heading"><div><p className="eyebrow">Schnell planen</p><h3>Aus Vorlage planen</h3></div></div>
        {formMessage ? <p className="auth-message">{formMessage}</p> : null}
        {pendingTemplateId ? (
          <div className="template-change-confirm" role="alert">
            <strong>Die Vorlage wurde geändert.</strong>
            <p>Möchtest du Fokus und Beschreibung durch passende Vorschläge ersetzen oder deine bisherigen Angaben behalten?</p>
            <div className="card-actions">
              <button type="button" onClick={() => applyTemplateSelection(pendingTemplateId, "replace")}>Vorschläge übernehmen</button>
              <button type="button" onClick={() => applyTemplateSelection(pendingTemplateId, "keep")}>Angaben behalten</button>
              <button type="button" onClick={() => setPendingTemplateId("")}>Abbrechen</button>
            </div>
          </div>
        ) : null}
        {showTemplatePicker ? (
          <div className="template-picker-sheet" role="dialog" aria-label="Trainingsvorlage auswählen">
            <div className="template-picker-head">
              <div>
                <p className="eyebrow">Vorlage auswählen</p>
                <h4>Trainingsvorlagen</h4>
              </div>
              <button type="button" onClick={() => setShowTemplatePicker(false)} aria-label="Vorlagenauswahl schließen">Schließen</button>
            </div>
            <input
              value={templatePickerSearch}
              onChange={(event) => setTemplatePickerSearch(event.target.value)}
              placeholder="Vorlage suchen"
              aria-label="Vorlage suchen"
            />
            <div className="template-option-list">
              {pickerTemplates.map((template) => (
                <button
                  className={template.id === selectedTemplateId ? "active" : ""}
                  key={template.id}
                  type="button"
                  onClick={() => requestTemplateSelection(template.id)}
                >
                  <strong>{template.title}</strong>
                  <span>{template.trainingArea} · {template.trainingType} · {intensityLabel[template.defaultIntensity]}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <form className="entry-form" onSubmit={planFromTemplate}>
          <div className="form-grid">
            <div className="template-picker-field">
              <span>Vorlage</span>
              <button type="button" onClick={() => setShowTemplatePicker(true)}>
                {selectedTemplate ? selectedTemplate.title : "Vorlage wählen"}
              </button>
              <input name="templateId" type="hidden" value={selectedTemplateId} />
            </div>
            <label>Datum<input name="date" type="date" defaultValue={selectedDate} required /></label>
            <label>Uhrzeit<input name="startTime" type="time" defaultValue="17:30" /></label>
            <label>Dauer<input name="durationMinutes" type="number" min="0" step="5" placeholder="aus Vorlage" /></label>
            <label>Intensität<select name="intensity" defaultValue="mittel">{trainingIntensities.map((intensity) => <option key={intensity} value={intensity}>{intensityLabel[intensity]}</option>)}</select></label>
          </div>
          {renderTargetControls()}
          {selectedTemplate ? (
            <div className="template-guidance-panel">
              <div className="template-guidance-head">
                <div>
                  <p className="eyebrow">Vorlage</p>
                  <h4>{selectedTemplate.title}</h4>
                </div>
                <span className="status-pill planned">{selectedTemplateGuidance.focusOptions.length} Fokusoptionen</span>
              </div>

              <div className="template-suggestion-group">
                <strong>Fokus</strong>
                <p className="card-note">Mehrfachauswahl möglich. Für eine klare Trainingseinheit werden höchstens drei Hauptfokusse empfohlen.</p>
                <div className="suggestion-chip-row">
                  {selectedTemplateGuidance.focusOptions.map((option) => (
                    <button
                      className={selectedFocusOptions.includes(option) ? "active" : ""}
                      key={option}
                      type="button"
                      onClick={() => toggleFocusOption(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {recentFocusOptions.length > 0 ? (
                  <>
                    <span className="template-mini-label">Zuletzt verwendet</span>
                    <div className="suggestion-chip-row compact">
                      {recentFocusOptions.map((option) => (
                        <button key={option} type="button" onClick={() => toggleFocusOption(option)}>{option}</button>
                      ))}
                    </div>
                  </>
                ) : null}
                <label>Eigener Fokus<input value={customFocus} onChange={(event) => setCustomFocus(event.target.value)} placeholder="z. B. sauberer Ziehschlag am Innenstab" /></label>
                {selectedFocusOptions.length > 3 ? <p className="auth-message">Hinweis: Für eine klare Trainingseinheit sind höchstens drei Hauptfokusse empfohlen.</p> : null}
                <input name="focus" type="hidden" value={focusText} />
              </div>

              <div className="template-suggestion-group">
                <strong>Übungen</strong>
                {Object.entries(groupedExerciseOptions).map(([category, exercises]) => (
                  <div className="exercise-category" key={category}>
                    <span className="template-mini-label">{category}</span>
                    <div className="exercise-option-grid">
                      {exercises.map((exerciseItem) => (
                        <button
                          className={selectedExerciseIds.includes(exerciseItem.id) ? "active" : ""}
                          key={exerciseItem.id}
                          type="button"
                          onClick={() => toggleExerciseOption(exerciseItem.id)}
                        >
                          <strong>{exerciseItem.name}</strong>
                          <small>{exerciseItem.shortDescription}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedExercises.length > 0 ? (
                  <div className="selected-exercise-list">
                    {selectedExercises.map((exerciseItem, index) => (
                      <article className="selected-exercise-card" key={exerciseItem.id}>
                        <div>
                          <span>{index + 1}. {exerciseItem.category}</span>
                          <strong>{exerciseItem.name}</strong>
                          <p>{exerciseItem.shortDescription}</p>
                          <small>Ziel: {exerciseItem.trainingGoal}</small>
                        </div>
                        <div className="card-actions">
                          <button type="button" onClick={() => moveSelectedExercise(exerciseItem.id, -1)} aria-label={`${exerciseItem.name} nach oben verschieben`}>Hoch</button>
                          <button type="button" onClick={() => moveSelectedExercise(exerciseItem.id, 1)} aria-label={`${exerciseItem.name} nach unten verschieben`}>Runter</button>
                          <button type="button" onClick={() => appendExerciseText(exerciseItem)} aria-label={`${exerciseItem.name} in eigene Beschreibung kopieren`}>Kopieren</button>
                          <button type="button" onClick={() => toggleExerciseOption(exerciseItem.id)} aria-label={`${exerciseItem.name} entfernen`}>Entfernen</button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
                {recentDescriptionOptions.length > 0 ? (
                  <>
                    <span className="template-mini-label">Zuletzt verwendete Beschreibungen</span>
                    <div className="suggestion-chip-row compact">
                      {recentDescriptionOptions.map((description) => (
                        <button key={description} type="button" onClick={() => setCustomDescription((current) => [current.trim(), description].filter(Boolean).join("\n\n"))}>
                          {description.slice(0, 48)}{description.length > 48 ? "..." : ""}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
                <label>Eigene Beschreibung<textarea value={customDescription} onChange={(event) => setCustomDescription(event.target.value)} rows={3} placeholder="Eigene Ergänzung, Strecke, Dauer oder Trainerhinweis" /></label>
                <label>Erzeugte Beschreibung<textarea name="generatedDescription" value={effectiveGeneratedDescription} onChange={(event) => setManualGeneratedDescription(event.target.value)} rows={5} /></label>
              </div>
            </div>
          ) : null}
          <label>Notiz<textarea name="notes" rows={2} /></label>
          <button className="save-button" type="submit">Aus Vorlage planen</button>
        </form>
      </section> : null}

      {isCoach && workflowTab === "groups" ? (
        <section className="section-block">
          <div className="section-heading">
            <div><p className="eyebrow">Gruppenplanung</p><h3>{visibleGroups.length > 0 ? `${visibleGroups.length} Trainingsgruppen` : "Noch keine Trainingsgruppen"}</h3></div>
            <button className="primary-button" type="button" onClick={startCreate} aria-label="Training für ausgewählte Gruppe planen">Training für Gruppe planen</button>
          </div>
          <div className="calendar-list">
            {visibleGroups.length > 0 ? visibleGroups.map((group) => {
              const groupEntries = visibleEntries.filter((entry) => entry.assignedGroupIds.includes(group.id) || entry.assignedGroupId === group.id);
              const groupAthletes = visibleAthletes.filter((athlete) => athlete.groupId === group.id || athlete.groupId === group.groupId || athlete.groupIds.includes(group.id) || athlete.groupIds.includes(group.groupId));
              return (
                <article className="calendar-training-card" key={group.id}>
                  <div className="plan-card-head">
                    <div><span>{group.ageCategory || "Alle Altersklassen"} - {group.trainingFocus || "Allgemein"}</span><h4>{group.name}</h4></div>
                    <b className="status-pill planned">{groupEntries.length} Einheiten</b>
                  </div>
                  <div className="smart-detail-grid">
                    <span>{groupAthletes.length} Sportler</span>
                    <span>{group.boatClasses.join(" + ") || "K1/C1"}</span>
                    <span>{group.status}</span>
                  </div>
                  <p>{group.description || "Noch keine Beschreibung hinterlegt."}</p>
                  <div className="card-actions">
                    <button type="button" onClick={() => { setGroupFilter(group.id); setWorkflowTab("week"); setCalendarView("week"); }}>Wochenplan anzeigen</button>
                    <button type="button" onClick={startCreate} aria-label={`Training für Gruppe ${group.name} planen`}>Training planen</button>
                  </div>
                </article>
              );
            }) : <p className="empty-state">Noch keine Gruppen im Verein. Lege Gruppen im Coach-Bereich an und plane danach direkt aus der Wochenansicht.</p>}
          </div>
        </section>
      ) : null}

      {workflowTab === "feedback" ? (
        <section className="section-block">
          <div className="section-heading">
            <div><p className="eyebrow">Rückmeldungen</p><h3>{isCoach ? "Statusübersicht" : "Trainingstagebuch"}</h3></div>
            <span className="status-pill planned">{journalFilteredEntries.length} Treffer</span>
          </div>
          <div className="journal-filter-bar" aria-label="Journal filtern">
            {isCoach ? (
              <label>Sportler<select value={journalAthleteFilter} onChange={(event) => setJournalAthleteFilter(event.currentTarget.value)}>
                <option value="all">Alle Sportler</option>
                {visibleAthletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{getAthleteName(athlete)}</option>)}
              </select></label>
            ) : null}
            <label>Zeitraum<select value={journalRangeFilter} onChange={(event) => setJournalRangeFilter(event.currentTarget.value as JournalRangeFilter)}>
              <option value="7">Letzte 7 Tage</option>
              <option value="30">Letzte 30 Tage</option>
              <option value="90">Letzte 90 Tage</option>
              <option value="all">Alle</option>
            </select></label>
          </div>
          <div className="calendar-list">
            {isCoach && openFeedbackEntries.length > 0 ? openFeedbackEntries.map((entry) => (
              <article className="calendar-training-card status-planned" key={`open-${entry.id}`}>
                <div className="plan-card-head">
                  <div><span>{entry.date} - offen</span><h4>{entry.title || entry.trainingType}</h4></div>
                  <b className="status-pill planned">Offen</b>
                </div>
                <p>{entry.focus || "Rückmeldung steht noch aus."}</p>
              </article>
            )) : null}
            {entriesWithFeedback.length > 0 ? entriesWithFeedback.map((entry) => {
              const feedbackItems = data.trainingFeedback.filter((feedback) => feedback.trainingId === entry.id);
              const assignedAthleteIds = Array.from(new Set([...entry.assignedAthleteIds, entry.assignedAthleteId].filter(Boolean)));
              const assignedAthleteNames = assignedAthleteIds.map(getAssignedAthleteName).filter(Boolean);

              return (
                <article className={`calendar-training-card status-${getEntryStatusClass(entry.status)}`} key={`feedback-${entry.id}`}>
                  <div className="plan-card-head">
                    <div>
                      <span>{entry.date} · {assignedAthleteNames.join(", ") || "Sportler wird geladen"}</span>
                      <h4>{entry.title || entry.trainingType}</h4>
                    </div>
                    <b className="status-pill done">{feedbackItems.length} Rückmeldung{feedbackItems.length === 1 ? "" : "en"}</b>
                  </div>
                  <p>{entry.focus || entry.goal || "Kein Trainingsfokus hinterlegt."}</p>
                  <div className="feedback-list">
                    {feedbackItems.map((feedback) => (
                      <span key={feedback.id}>
                        {feedback.status === "skipped" ? "Ausgelassen" : "Erledigt"} · Gefühl {feedback.feeling}/10 · Schwierigkeit {feedback.difficulty}/10 · Müdigkeit {feedback.fatigue}/10 · Motivation {feedback.motivation}/10
                        {feedback.sleep ? ` · Schlaf ${feedback.sleep}/10` : ""}
                        {feedback.comment ? ` · Kommentar: ${feedback.comment}` : ""}
                        {feedback.reason ? ` · Grund: ${feedback.reason}` : ""}
                      </span>
                    ))}
                  </div>
                </article>
              );
            }) : null}
            {(!isCoach || openFeedbackEntries.length === 0) && entriesWithFeedback.length === 0 ? (
              <p className="empty-state">{isCoach ? "Noch keine Rückmeldungen vorhanden." : "Noch keine erledigten Trainings mit Rückmeldung."}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {isTablet && draft ? renderTabletTrainingBuilder() : null}

      {!isTablet && draft ? (
        <section className="section-block planning-side-editor planning-draft-editor">
          <div className="section-heading"><div><p className="eyebrow">Planung</p><h3>{draft.id ? "Training bearbeiten" : "Training planen"}</h3></div></div>
          {formMessage ? <p className="auth-message">{formMessage}</p> : null}
          <form className="entry-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>Titel<input name="title" defaultValue={draft.title} required /></label>
              <label>Datum<input name="date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.currentTarget.value)} required /></label>
              <label>Wochentag<input value={getWeekdayFromDate(selectedDate)} readOnly /></label>
              <label>Startzeit<input name="startTime" type="time" defaultValue={draft.startTime || draft.time} /></label>
              <label>Endzeit<input name="endTime" type="time" defaultValue={draft.endTime} /></label>
              <label>Dauer<input name="durationMinutes" type="number" min="0" step="5" defaultValue={draft.durationMinutes} /></label>
              <label>Zuweisung<select name="assignedType" defaultValue={draft.assignedType}><option value="self">Für mich</option>{isCoach ? <option value="athlete">Einzelner Sportler</option> : null}{isCoach ? <option value="group">Trainingsgruppe</option> : null}</select></label>
              <label>Trainingsbereich<select name="area" defaultValue={draft.area} onChange={(event) => setSelectedArea(event.currentTarget.value as TrainingArea)}>{trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
              <label>Trainingsart<select name="trainingType" defaultValue={draft.trainingType}>{trainingTypeGroups[selectedArea].map((trainingType) => <option key={trainingType} value={trainingType}>{trainingType}</option>)}</select></label>
              <label>Bootsklasse<select name="boatClass" defaultValue={draft.boatClass}><option value="K1">K1</option><option value="C1">C1</option><option value="K1+C1">K1+C1</option><option value="none">ohne Boot</option></select></label>
              <label>Intensität<select name="intensity" defaultValue={draft.intensity}>{trainingIntensities.map((intensity) => <option key={intensity} value={intensity}>{intensityLabel[intensity]}</option>)}</select></label>
              <label>Status<select name="status" defaultValue={draft.status}>{planStatuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label>
              <label>Wiederholung<select name="repeat" value={selectedRepeat} onChange={(event) => setSelectedRepeat(event.currentTarget.value as TrainingRepeat)}><option value="none">keine</option><option value="daily">täglich</option><option value="weekly">wöchentlich</option><option value="biweekly">alle 2 Wochen</option><option value="monthly">monatlich</option></select></label>
              <label>Wiederholen bis<input name="repeatUntil" type="date" value={selectedRepeatUntil} onChange={(event) => setSelectedRepeatUntil(event.currentTarget.value)} disabled={selectedRepeat === "none"} /></label>
              <label>Max. Termine<input name="repeatMaxCount" type="number" min="1" max="90" value={selectedRepeatMaxCount ?? ""} onChange={(event) => setSelectedRepeatMaxCount(Number(event.currentTarget.value) || undefined)} placeholder="optional" disabled={selectedRepeat === "none"} /></label>
            </div>
            {selectedRepeat !== "none" ? <p className="card-note">{selectedRepeatUntil || selectedRepeatMaxCount ? `Vorschau: Es werden ${repeatPreviewCount} Trainingseinheiten erstellt.` : "Wähle ein Enddatum oder eine maximale Terminanzahl, damit mehrere Termine erstellt werden."}</p> : null}
            {isCoach ? <div className="choice-group"><span>Sportler für Einzeltraining</span><div className="tag-row">{visibleAthletes.map((athlete) => <label className="toggle-row" key={athlete.id}><span>{getAthleteName(athlete)}</span><input name="assignedAthleteIds" type="checkbox" value={athlete.id} defaultChecked={draft.assignedAthleteIds.includes(athlete.id)} /></label>)}</div></div> : null}
            {isCoach ? <div className="choice-group"><span>Trainingsgruppen</span><div className="tag-row">{visibleGroups.map((group) => <label className="toggle-row" key={group.id}><span>{group.name}</span><input name="assignedGroupIds" type="checkbox" value={group.id} defaultChecked={draft.assignedGroupIds.includes(group.id)} /></label>)}</div></div> : null}
            <label>Ziel/Fokus<input name="focus" defaultValue={draft.focus || draft.goal} placeholder="z. B. Tor 6 sauber anfahren" /></label>
            <label>Beschreibung<textarea name="description" defaultValue={draft.description} rows={3} /></label>
            <label>Individuelle Anpassung / Sportlerhinweis<textarea name="feedbackNote" defaultValue={draft.feedbackNote} rows={2} placeholder="z. B. 45 min statt 60 min, Fokus Übergriff, geringere Intensität" /></label>
            <label>Notiz<textarea name="notes" defaultValue={draft.notes || draft.note} rows={3} /></label>
            <div className="form-actions"><button className="save-button" type="submit">Speichern</button><button className="ghost-button wide" type="button" onClick={() => setDraft(null)}>Abbrechen</button></div>
          </form>
        </section>
      ) : null}

      {copyEntry ? (
        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow">Kopieren</p><h3>{copyEntry.title || copyEntry.trainingType}</h3></div></div>
          <form className="entry-form" onSubmit={handleCopyEntrySubmit}>
            <div className="form-grid">
              <label>Option<select name="copyMode" defaultValue="nextWeek"><option value="custom">anderes Datum</option><option value="tomorrow">nächster Tag</option><option value="nextWeek">nächste Woche</option></select></label>
              <label>Datum<input name="date" type="date" defaultValue={addDays(copyEntry.date, 7)} /></label>
            </div>
            {renderTargetControls(copyEntry.assignedType, copyEntry.assignedAthleteIds, copyEntry.assignedGroupIds)}
            <div className="form-actions"><button className="save-button" type="submit">Training kopieren</button><button className="ghost-button wide" type="button" onClick={() => setCopyEntry(null)}>Abbrechen</button></div>
          </form>
        </section>
      ) : null}

      {taskEntry ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Traineraufgabe</p>
              <h3>{taskEntry.title || taskEntry.trainingType}</h3>
              <p className="card-note">Diese Aufgabe ist mit dem Training verknüpft und nur für berechtigte Trainer/Admins sichtbar.</p>
            </div>
          </div>
          {formMessage ? <p className="auth-message">{formMessage}</p> : null}
          <form className="entry-form" onSubmit={createTrainingTask}>
            <div className="form-grid">
              <label>Titel<input name="title" required placeholder="z. B. Video aufnehmen" /></label>
              <label>Typ<select name="taskType" defaultValue="training">{trainingTaskTypes.map((taskType) => <option key={taskType} value={taskType}>{trainingTaskTypeLabels[taskType]}</option>)}</select></label>
              <label>Priorität<select name="priority" defaultValue="normal">{trainingTaskPriorities.map((priority) => <option key={priority} value={priority}>{trainingTaskPriorityLabels[priority]}</option>)}</select></label>
              <label>Fällig<input name="dueDate" type="date" defaultValue={taskEntry.date} /></label>
              <label>Trainer<select name="assignedTo" defaultValue={user.userId}>{trainerTaskAssignees.map((assignee) => <option key={assignee.userId} value={assignee.userId}>{getUserProfileName(assignee)}</option>)}</select></label>
            </div>
            <label>Beschreibung<textarea name="description" rows={3} placeholder="z. B. Athlet A beobachten, Zeiten nehmen, Tore umhängen" /></label>
            <div className="form-actions">
              <button className="save-button" type="submit">Traineraufgabe erstellen</button>
              <button className="ghost-button wide" type="button" onClick={() => setTaskEntry(null)}>Abbrechen</button>
            </div>
          </form>
        </section>
      ) : null}

      {showWeekCopy ? (
        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow">Woche kopieren</p><h3>{plannedThisWeek.length} Einheiten in aktueller Woche</h3></div></div>
          <form className="entry-form" onSubmit={handleWeekCopySubmit}>
            <div className="form-grid">
              <label>Zielwoche<input name="destinationDate" type="date" defaultValue={addDays(selectedDate, 7)} /></label>
              <label>Bereich<select name="area" defaultValue="all"><option value="all">Alle</option>{trainingAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
              <label>Boot/Fokus<select name="boat" defaultValue="all"><option value="all">Alle</option><option value="K1">K1</option><option value="C1">C1</option><option value="none">Kraft/Ausdauer/ohne Boot</option></select></label>
            </div>
            {renderTargetControls()}
            <div className="form-actions"><button className="save-button" type="submit">Woche kopieren</button><button className="ghost-button wide" type="button" onClick={() => setShowWeekCopy(false)}>Abbrechen</button></div>
          </form>
        </section>
      ) : null}

      {showBlockCopy ? (
        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow">Trainingsblock kopieren</p><h3>Zeitraum planen</h3></div></div>
          <form className="entry-form" onSubmit={handleBlockCopySubmit}>
            <div className="form-grid">
              <label>Startdatum<input name="startDate" type="date" defaultValue={weekDates[0]} /></label>
              <label>Enddatum<input name="endDate" type="date" defaultValue={weekDates[6]} /></label>
              <label>Zielstart<input name="targetStartDate" type="date" defaultValue={addDays(weekDates[0], 28)} /></label>
            </div>
            {renderTargetControls()}
            <div className="form-actions"><button className="save-button" type="submit">Trainingsblock kopieren</button><button className="ghost-button wide" type="button" onClick={() => setShowBlockCopy(false)}>Abbrechen</button></div>
          </form>
        </section>
      ) : null}

      {workflowTab === "today" && calendarView !== "day" ? (
        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow">Heute</p><h3>{todayEntries.length > 0 ? "Heutiges Training" : "Für heute ist kein Training geplant."}</h3></div></div>
          <div className="calendar-list">{todayEntries.length > 0 ? todayEntries.map(renderEntryCard) : <p className="empty-state">Plane dein erstes Training.</p>}</div>
        </section>
      ) : null}

      {isPhone && workflowTab === "week" ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Diese Woche</p>
              <h3>{plannedThisWeek.length > 0 ? `${plannedThisWeek.length} Einheiten` : "Keine Einheit geplant"}</h3>
            </div>
            <button className="primary-button" type="button" onClick={startCreate}>Training planen</button>
          </div>
          <div className="calendar-list">
            {plannedThisWeek.length > 0 ? plannedThisWeek.map(renderEntryCard) : <p className="empty-state">Für diese Woche ist noch kein Training geplant.</p>}
          </div>
        </section>
      ) : calendarView === "year" ? (
        <section className="calendar-year-grid" aria-label={`Jahresplan ${selectedYear}`}>
          {yearMonths.map((monthDate) => {
            const monthDates = getMonthDates(monthDate);
            const monthEntries = visibleEntries.filter((entry) => monthDates.includes(entry.date));
            const loadMinutes = monthEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
            return (
              <button
                className={monthEntries.length > 0 ? "calendar-year-month has-training" : "calendar-year-month"}
                key={monthDate}
                type="button"
                onClick={() => { setSelectedDate(monthDate); setCalendarView("month"); setWorkflowTab("month"); }}
              >
                <span>{parseLocalDateOnly(monthDate).toLocaleDateString("de-DE", { month: "short" })}</span>
                <strong>{monthEntries.length}</strong>
                <small>{loadMinutes} min geplant</small>
              </button>
            );
          })}
        </section>
      ) : workflowTab === "week" && calendarView === "week" ? (
        <section className="calendar-week-grid planning-week-board">{weekDates.map((date, index) => {
          const dayEntries = visibleEntries.filter((entry) => entry.date === date);
          return (
            <article className="calendar-day-column" key={date} onDragOver={handleTemplateDragOver} onDrop={(event) => handleTemplateDrop(event, date)}>
              <div className="plan-day-heading"><strong>{weekdays[index]}</strong><span>{parseLocalDateOnly(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span></div>
              {dayEntries.map(renderEntryCard)}
              {dayEntries.length === 0 ? <p className="empty-state compact">Vorlage hier ablegen oder Training planen.</p> : null}
            </article>
          );
        })}</section>
      ) : workflowTab === "today" && calendarView === "day" ? (
        <section className="calendar-list">{visibleEntries.filter((entry) => entry.date === selectedDate).map(renderEntryCard)}{visibleEntries.filter((entry) => entry.date === selectedDate).length === 0 ? <p className="empty-state">Für diesen Tag ist noch kein Training geplant.</p> : null}</section>
      ) : workflowTab === "month" && calendarView === "month" ? (
        <section className="calendar-month-grid">{getMonthDates(selectedDate).map((date) => { const count = visibleEntries.filter((entry) => entry.date === date).length; return <button className={count > 0 ? "has-training" : ""} key={date} type="button" onClick={() => { setSelectedDate(date); setCalendarView("day"); setWorkflowTab("today"); }}><strong>{parseLocalDateOnly(date).getDate()}</strong><span>{count > 0 ? `${count} Einheiten` : "frei"}</span></button>; })}</section>
      ) : workflowTab === "upcoming" ? (
        <section className="calendar-list">{upcomingEntries.length > 0 ? upcomingEntries.map(renderEntryCard) : <p className="empty-state">Noch keine kommenden Einheiten geplant.</p>}</section>
      ) : workflowTab === "done" ? (
        <section className="calendar-list">{doneEntries.length > 0 ? doneEntries.map(renderEntryCard) : <p className="empty-state">Noch keine erledigten Einheiten.</p>}</section>
      ) : null}

      {feedbackEntry ? (
        <section className="section-block feedback-modal">
          <div className="section-heading"><div><p className="eyebrow">Rückmeldung</p><h3>{feedbackEntry.title || feedbackEntry.trainingType}</h3></div></div>
          <form className="entry-form" onSubmit={handleFeedbackSubmit}>
            <div className="form-grid">
              <label>Status<select name="status" defaultValue={isSkippedStatus(feedbackEntry.status) ? "skipped" : "done"}><option value="done">erledigt</option><option value="skipped">ausgelassen</option></select></label>
              <label>Gefühl 1-10<input name="feeling" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Schwierigkeit 1-10<input name="difficulty" type="number" min="1" max="10" defaultValue={5} /></label>
              <label>Müdigkeit 1-10<input name="fatigue" type="number" min="1" max="10" defaultValue={5} /></label>
              <label>Motivation 1-10<input name="motivation" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Schlaf 1-10<input name="sleep" type="number" min="1" max="10" defaultValue={7} /></label>
              <label>Grund<select name="reason" defaultValue=""><option value="">kein Grund</option><option value="krank">krank</option><option value="schule_arbeit">Schule/Arbeit</option><option value="wetter">Wetter</option><option value="keine_zeit">keine Zeit</option><option value="andere">andere</option></select></label>
            </div>
            <label>Kommentar<textarea name="comment" rows={3} /></label>
            <div className="form-actions"><button className="save-button" type="submit">Rückmeldung speichern</button><button className="ghost-button wide" type="button" onClick={() => setFeedbackEntry(null)}>Abbrechen</button></div>
          </form>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Wochenfortschritt</p><h3>{weeklyMinutes} Minuten</h3></div></div>
        <div className="smart-detail-grid"><span>{completedThisWeek.length} erledigt</span><span>{skippedThisWeek.length} ausgelassen</span><span>{openFeedbackCount} offene Rückmeldungen</span></div>
      </section>
    </div>
  );
}
