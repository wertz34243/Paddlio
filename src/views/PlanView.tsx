import { useEffect, useMemo, useState, type FormEvent } from "react";
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
};

type CalendarView = "day" | "week" | "month" | "list";
type WorkflowTab = "today" | "week" | "month" | "templates" | "groups" | "feedback" | "upcoming" | "done";
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

const getEntryStatusClass = (status: PlanStatus): string =>
  isDoneStatus(status) ? "done" : isSkippedStatus(status) ? "skipped" : status === "cancelled" ? "cancelled" : "planned";

const includesBoat = (entry: PlanEntry, boat: string): boolean =>
  boat === "all" || entry.boatClass === boat || (boat === "K1" && entry.boatClass === "K1+C1") || (boat === "C1" && entry.boatClass === "K1+C1");

const addDays = addCalendarDays;

const getDateOffset = getCalendarDayOffset;

const parseTags = (value: string): string[] =>
  value.split(",").map((tag) => tag.trim()).filter(Boolean);

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
}: PlanViewProps) {
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TrainingTemplate | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>("week");
  const [selectedArea, setSelectedArea] = useState<TrainingArea>("Wassertraining");
  const [templateArea, setTemplateArea] = useState<TrainingArea>("Wassertraining");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedRepeat, setSelectedRepeat] = useState<TrainingRepeat>("none");
  const [selectedRepeatUntil, setSelectedRepeatUntil] = useState("");
  const [selectedRepeatMaxCount, setSelectedRepeatMaxCount] = useState<number | undefined>(undefined);
  const [feedbackEntry, setFeedbackEntry] = useState<PlanEntry | null>(null);
  const [copyEntry, setCopyEntry] = useState<PlanEntry | null>(null);
  const [showWeekCopy, setShowWeekCopy] = useState(false);
  const [showBlockCopy, setShowBlockCopy] = useState(false);
  const [areaFilter, setAreaFilter] = useState<"all" | TrainingArea>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");
  const [boatFilter, setBoatFilter] = useState<"all" | TrainingBoatClass>("all");
  const [intensityFilter, setIntensityFilter] = useState<"all" | TrainingIntensity>("all");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<"all" | TrainingTemplateCategory>("all");
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
  const [formMessage, setFormMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const isCoach = canUseCoachArea(user.role);
  const isPhone = deviceClass === "phone";
  const workflowTabs = useMemo(() => {
    const baseTabs = isCoach ? coachWorkflowTabs : athleteWorkflowTabs;

    if (!isPhone) {
      return baseTabs;
    }

    const phoneTabs: WorkflowTab[] = isCoach ? ["today", "week", "feedback"] : ["today", "upcoming", "done", "feedback"];
    return baseTabs.filter((tab) => phoneTabs.includes(tab.id));
  }, [isPhone, isCoach]);
  const calendarViews = useMemo<CalendarView[]>(
    () => (isPhone ? ["day", "list"] : ["day", "week", "month", "list"]),
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
  const periodizationTemplates = useMemo(() => createSystemTrainingTemplates(user.profile.club), [user.profile.club]);
  const visibleTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    return [...periodizationTemplates, ...getTrainingTemplatesForCurrentUser(data, user, [user.profile.club])]
      .filter((template) => template.title.trim().toLowerCase() !== "test")
      .filter((template) => templateCategoryFilter === "all" || template.category === templateCategoryFilter)
      .filter((template) => {
        if (!query) return true;
        return [template.title, template.focus, template.trainingArea, template.trainingType, template.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => Number(isSystemTrainingTemplate(b)) - Number(isSystemTrainingTemplate(a)) || Number(b.isFavorite) - Number(a.isFavorite) || a.title.localeCompare(b.title));
  }, [data, periodizationTemplates, templateCategoryFilter, templateSearch, user]);

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
  const completedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date) && isDoneStatus(entry.status));
  const skippedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date) && isSkippedStatus(entry.status));
  const plannedThisWeek = visibleEntries.filter((entry) => weekDates.includes(entry.date));
  const weeklyMinutes = completedThisWeek.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const entriesWithFeedback = visibleEntries.filter((entry) => data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id));
  const openFeedbackEntries = visibleEntries.filter((entry) => isDoneStatus(entry.status) && !data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id));
  const openFeedbackCount = openFeedbackEntries.length;
  const nextWeekDates = getWeekDates(addDays(selectedDate, 7));
  const nextWeekCount = visibleEntries.filter((entry) => nextWeekDates.includes(entry.date)).length;
  const unplannedAthletes = visibleAthletes.filter((athlete) =>
    !plannedThisWeek.some((entry) => entry.assignedAthleteIds.includes(athlete.id) || entry.assignedAthleteId === athlete.id),
  );
  const upcomingEntries = visibleEntries.filter((entry) => entry.date >= today && isPlannedStatus(entry.status));
  const doneEntries = visibleEntries.filter((entry) => isDoneStatus(entry.status));
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
    setDraft(nextDraft);
  };

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
      feedbackNote: draft?.feedbackNote ?? "",
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

  const renderEntryCard = (entry: PlanEntry) => {
    const entryFeedback = data.trainingFeedback.filter((feedback) => feedback.trainingId === entry.id);
    const assignedAthleteIds = Array.from(new Set([...entry.assignedAthleteIds, entry.assignedAthleteId].filter(Boolean)));
    const assignedAthleteNames = assignedAthleteIds.map(getAssignedAthleteName).filter(Boolean);
    const assignedGroups = visibleGroups.filter((group) => entry.assignedGroupIds.includes(group.id) || entry.assignedGroupId === group.id);
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
        <div className="card-actions">
          <button className="save-button" type="button" onClick={() => onToggleDone(entry.id)} aria-label={`Training ${entry.title || entry.trainingType} am ${entry.date} ${isDoneStatus(entry.status) ? "wieder planen" : "als erledigt markieren"}`}>
            {isDoneStatus(entry.status) ? "Wieder planen" : "Erledigt"}
          </button>
          <button className="delete-button" type="button" onClick={() => setFeedbackEntry({ ...entry, status: "skipped" })} aria-label={`Training ${entry.title || entry.trainingType} am ${entry.date} als ausgelassen markieren`}>Ausgelassen</button>
          <button className="edit-button" type="button" onClick={() => setFeedbackEntry({ ...entry, status: "done" })} aria-label={`Feedback für Training ${entry.title || entry.trainingType} am ${entry.date} geben`}>Feedback</button>
          <button className="edit-button" type="button" onClick={() => setCopyEntry(entry)} aria-label={`Training ${entry.title || entry.trainingType} am ${entry.date} kopieren`}>Kopieren</button>
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

  const repeatPreviewCount = draft && selectedRepeat !== "none" && (selectedRepeatUntil || selectedRepeatMaxCount)
    ? expandTrainingRepeatDates(selectedDate, selectedRepeat, selectedRepeatUntil, selectedRepeatMaxCount).length
    : 1;

  return (
    <div className="stack calendar-shell">
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

      {workflowTab === "today" || workflowTab === "week" || workflowTab === "month" ? <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Kalender</p>
            <h3>Trainingsplanung</h3>
          </div>
          <div className="card-actions">
            <button className="primary-button" type="button" onClick={startCreate} aria-label="Training aus Kalenderansicht planen">Training planen</button>
            <button type="button" onClick={() => setShowWeekCopy(true)}>Woche kopieren</button>
            <button type="button" onClick={() => setShowBlockCopy(true)}>Trainingsblock kopieren</button>
          </div>
        </div>
        {copyMessage ? <p className="auth-message">{copyMessage} <button type="button" onClick={() => setCalendarView("list")}>Trainings anzeigen</button></p> : null}
        <div className="calendar-view-tabs">
          {calendarViews.map((view) => (
            <button className={calendarView === view ? "active" : ""} key={view} type="button" onClick={() => setCalendarView(view)}>
              {view === "day" ? "Tag" : view === "week" ? "Woche" : view === "month" ? "Monat" : "Liste"}
            </button>
          ))}
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
        <div className="calendar-list">
          {visibleTemplates.length > 0 ? visibleTemplates.map((template) => (
            <article className="calendar-training-card" key={template.id}>
              <div className="plan-card-head">
                <div><span>{isSystemTrainingTemplate(template) ? "Paddlio-Periodisierung" : `${template.category} - ${visibilityLabel[template.visibility]}`}</span><h4>{template.isFavorite ? "* " : ""}{template.title}</h4></div>
                <b className="status-pill planned">{template.defaultDurationMinutes ?? 0} min</b>
              </div>
              <div className="smart-detail-grid">
                <span>{template.trainingArea}</span>
                <span>{template.trainingType}</span>
                <span>{template.boatClass ?? "none"}</span>
                <span>{intensityLabel[template.defaultIntensity]}</span>
              </div>
              <p>{template.focus || "Noch kein Fokus eingetragen."}</p>
              {template.tags.length > 0 ? <small className="card-note">{template.tags.join(" - ")}</small> : null}
              <div className="card-actions">
                {isSystemTrainingTemplate(template) ? <span className="status-pill planned">Systemvorlage</span> : null}
                {!isSystemTrainingTemplate(template) && canEditTrainingTemplate(user, template) ? <button type="button" onClick={() => { setTemplateDraft(template); setTemplateArea(template.trainingArea); }} aria-label={`Vorlage ${template.title} bearbeiten`}>Bearbeiten</button> : null}
                {!isSystemTrainingTemplate(template) && canEditTrainingTemplate(user, template) ? <button type="button" onClick={() => deleteTemplate(template)} aria-label={`Vorlage ${template.title} löschen`}>Löschen</button> : null}
              </div>
            </article>
          )) : <p className="empty-state">Noch keine Trainingsvorlagen. Erstelle deine erste Vorlage für schnelle Trainingsplanung.</p>}
        </div>
      </section> : null}

      {templateDraft ? (
        <section className="section-block">
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

      {workflowTab === "templates" || workflowTab === "week" ? <section className="section-block">
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

      {draft ? (
        <section className="section-block">
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
      ) : workflowTab === "week" && calendarView === "week" ? (
        <section className="calendar-week-grid">{weekDates.map((date, index) => <article className="calendar-day-column" key={date}><div className="plan-day-heading"><strong>{weekdays[index]}</strong><span>{parseLocalDateOnly(date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span></div>{visibleEntries.filter((entry) => entry.date === date).map(renderEntryCard)}{visibleEntries.filter((entry) => entry.date === date).length === 0 ? <p className="empty-state compact">Noch kein Training geplant.</p> : null}</article>)}</section>
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
