import type { PlanEntry, PlanStatus, TrainingArea, TrainingIntensity, TrainingPlanType, Weekday } from "./types";

export const weekdays: Weekday[] = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export const trainingIntensities: TrainingIntensity[] = ["locker", "mittel", "hart", "maximal"];

export const planStatuses: PlanStatus[] = ["geplant", "erledigt", "ausgelassen"];

export const trainingTypeGroups: Record<TrainingArea, TrainingPlanType[]> = {
  Wassertraining: [
    "K1 Technik",
    "C1 Technik",
    "Slalomstrecke",
    "Aufwaertstore",
    "Abwaertstore",
    "Starttraining",
    "Wettkampfsimulation",
    "Kehrwassertraining",
    "Linienwahl",
    "Bootskontrolle",
  ],
  Ausdauer: ["GA1", "GA2", "Intervalle", "Rhein-Ausdauer", "Regeneration", "Grundlagentraining"],
  Krafttraining: [
    "Kraftausdauer",
    "Maximalkraft",
    "Explosivkraft",
    "Rumpfstabilitaet",
    "Schulterstabilitaet",
    "Rotation",
    "Beweglichkeit",
  ],
  Trainerarbeit: ["Kindertraining", "Technikbetreuung", "Anfaengertraining", "Gruppenbetreuung"],
  Regeneration: ["Pause", "Mobilitaet", "Dehnen", "Spaziergang", "Schlaf/Erholung"],
  Wettkampf: ["K1 Rennen", "C1 Rennen", "Mannschaft", "Streckenbesichtigung", "Warmfahren"],
};

export const trainingAreas = Object.keys(trainingTypeGroups) as TrainingArea[];

export const getWeekdayFromDate = (date: string): Weekday => {
  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);
  const index = parsedDate.getDay();
  const mondayBasedIndex = index === 0 ? 6 : index - 1;
  return weekdays[mondayBasedIndex];
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

export const getTodayKey = (date = new Date()): string => date.toISOString().slice(0, 10);

