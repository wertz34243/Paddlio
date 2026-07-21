import type { PlanEntry, PlanStatus, TrainingArea, TrainingIntensity, TrainingPlanType, Weekday } from "./types";
import {
  addDaysToDateKey,
  dateKeyFromLocalDate,
  dateKeyToLocalDate,
  getLocalWeekdayLabel as getDateOnlyWeekdayLabel,
  todayDateKey,
} from "../lib/dateOnly";

export const weekdays: Weekday[] = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export const trainingIntensities: TrainingIntensity[] = ["locker", "mittel", "hart", "maximal"];

export const planStatuses: PlanStatus[] = ["planned", "in_progress", "completed", "partially_completed", "skipped", "cancelled"];

export const planStatusLabels: Record<string, string> = {
  planned: "Geplant",
  in_progress: "Läuft",
  completed: "Durchgeführt",
  partially_completed: "Teilweise durchgeführt",
  skipped: "Übersprungen",
  cancelled: "Abgesagt",
  done: "Durchgeführt",
  geplant: "Geplant",
  erledigt: "Durchgeführt",
  ausgelassen: "Übersprungen",
};

export const trainingTypeGroups: Record<TrainingArea, TrainingPlanType[]> = {
  Wassertraining: [
    "K1 Technik",
    "C1 Technik",
    "Aufwaertstore",
    "Abwaertstore",
    "Kehrwasser",
    "Linienwahl",
    "Starttraining",
    "Wettkampfsimulation",
    "Bootskontrolle",
    "Slalomstrecke",
    "Kehrwassertraining",
    "neues Paddel testen",
  ],
  Ausdauer: ["GA1", "GA2", "Intervalle", "Rhein-Ausdauer", "Regeneration", "Grundlagentraining", "30-Minuten-Test"],
  Krafttraining: [
    "Kraftausdauer",
    "Maximalkraft",
    "Explosivkraft",
    "Rumpf",
    "Schulter",
    "Rotation",
    "Beweglichkeit",
    "Rumpfstabilitaet",
    "Schulterstabilitaet",
  ],
  Trainerarbeit: ["Kindertraining", "Technikbetreuung", "Anfaengertraining", "Gruppenbetreuung"],
  Regeneration: ["Pause", "Mobility", "Dehnen", "Spaziergang", "Schlaf/Erholung", "Mobilitaet"],
  Wettkampf: ["K1 Rennen", "C1 Rennen", "Streckenbesichtigung", "Warmfahren", "Rennanalyse", "Mannschaft", "Wettkampftag"],
};

export const trainingAreas = Object.keys(trainingTypeGroups) as TrainingArea[];

export const getDateParts = (date: string): [number, number, number] => {
  const [year, month, day] = date.split("-").map(Number);
  return [year, month, day];
};

export const parseLocalDateOnly = dateKeyToLocalDate;

export const formatLocalDateOnly = dateKeyFromLocalDate;

export const getLocalWeekdayLabel = (value: string): Weekday => {
  const weekday = getDateOnlyWeekdayLabel(value) as Weekday;
  return weekdays.includes(weekday) ? weekday : weekdays[0];
};

export const formatBerlinDateKey = (date: Date): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

export const getWeekdayFromDate = (date: string): Weekday => getLocalWeekdayLabel(date);

export const sortPlanEntries = (entries: PlanEntry[]): PlanEntry[] =>
  [...entries].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.time.localeCompare(b.time) ||
      weekdays.indexOf(a.weekday) - weekdays.indexOf(b.weekday) ||
      a.createdAt.localeCompare(b.createdAt),
  );

export const isPauseEntry = (entry: PlanEntry): boolean =>
  entry.area === "Regeneration" && entry.trainingType === "Pause";

export const getTodayKey = (date = new Date()): string => todayDateKey(date);

export const getLocalDateKey = (date: Date): string => {
  return formatLocalDateOnly(date);
};

export const addCalendarDays = (date: string, days: number): string => {
  return addDaysToDateKey(date, days);
};

export const getCalendarDayOffset = (from: string, to: string): number => {
  const fromTime = parseLocalDateOnly(from).getTime();
  const toTime = parseLocalDateOnly(to).getTime();
  return Math.round((toTime - fromTime) / 86400000);
};

export const expandTrainingRepeatDates = (
  startDate: string,
  repeat: PlanEntry["repeat"] = "none",
  repeatUntil = "",
  maxCount?: number,
): string[] => {
  const cursor = parseLocalDateOnly(startDate);
  const end = repeatUntil ? parseLocalDateOnly(repeatUntil) : cursor;
  const limit = maxCount && maxCount > 0 ? Math.min(maxCount, 90) : 90;
  const dates: string[] = [];

  if (repeat === "none" || !repeatUntil) {
    return [formatLocalDateOnly(cursor)];
  }

  if (repeatUntil && end < cursor) {
    return [formatLocalDateOnly(cursor)];
  }

  while (dates.length === 0 || (cursor <= end && dates.length < limit)) {
    dates.push(formatLocalDateOnly(cursor));

    if (repeat === "daily") cursor.setDate(cursor.getDate() + 1);
    else if (repeat === "weekly") cursor.setDate(cursor.getDate() + 7);
    else if (repeat === "biweekly") cursor.setDate(cursor.getDate() + 14);
    else if (repeat === "monthly") cursor.setMonth(cursor.getMonth() + 1);
    else break;
  }

  return dates;
};

export const isPlannedStatus = (status: PlanStatus): boolean => status === "planned" || status === "geplant" || status === "in_progress";

export const isDoneStatus = (status: PlanStatus): boolean => status === "done" || status === "erledigt" || status === "completed" || status === "partially_completed";

export const isSkippedStatus = (status: PlanStatus): boolean => status === "skipped" || status === "ausgelassen";
