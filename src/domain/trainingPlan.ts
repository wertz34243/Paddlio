import type { PlanEntry, PlanStatus, TrainingArea, TrainingIntensity, TrainingPlanType, Weekday } from "./types";

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

export const getWeekdayFromDate = (date: string): Weekday => {
  const [year, month, day] = getDateParts(date);
  const parsedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "long",
  }).format(parsedDate) as Weekday;
  return weekdays.includes(weekday) ? weekday : weekdays[0];
};

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

export const getTodayKey = (date = new Date()): string => formatBerlinDateKey(date);

export const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addCalendarDays = (date: string, days: number): string => {
  const [year, month, day] = getDateParts(date);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + days);
  return getLocalDateKey(next);
};

export const getCalendarDayOffset = (from: string, to: string): number => {
  const [fromYear, fromMonth, fromDay] = getDateParts(from);
  const [toYear, toMonth, toDay] = getDateParts(to);
  const fromTime = new Date(fromYear, fromMonth - 1, fromDay).getTime();
  const toTime = new Date(toYear, toMonth - 1, toDay).getTime();
  return Math.round((toTime - fromTime) / 86400000);
};

export const isPlannedStatus = (status: PlanStatus): boolean => status === "planned" || status === "geplant" || status === "in_progress";

export const isDoneStatus = (status: PlanStatus): boolean => status === "done" || status === "erledigt" || status === "completed" || status === "partially_completed";

export const isSkippedStatus = (status: PlanStatus): boolean => status === "skipped" || status === "ausgelassen";
