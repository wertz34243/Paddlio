export type TestAge = "13.0" | "13.5" | "14.0";
export type TestDiscipline = "kayak" | "canoe" | "both";

export type CalendarNorm = {
  sitAndReach: string;
  coreStrength: string;
  kayakTechnique?: string;
  canoeTechnique?: string;
};

export type BiologicalNorm = {
  pullUps: string;
  pushUps: string;
  relativeStrength: string;
  kayakSprint: string;
  kayakEndurance: string;
  canoeSprint: string;
  canoeEndurance: string;
};

export const calendarNorms: Record<TestAge, CalendarNorm> = {
  "13.0": { sitAndReach: "100 cm", coreStrength: "75 s", kayakTechnique: "Mittelwert 1,50", canoeTechnique: "Mittelwert 1,77" },
  "13.5": { sitAndReach: "101 cm", coreStrength: "88 s" },
  "14.0": { sitAndReach: "101 cm", coreStrength: "100 s", kayakTechnique: "Mittelwert 1,40", canoeTechnique: "Mittelwert 1,60" },
};

export const biologicalNorms: Record<TestAge, BiologicalNorm> = {
  "13.0": { pullUps: "7", pushUps: "20", relativeStrength: "140 %", kayakSprint: "8,10 s", kayakEndurance: "275 s / 4:35 min", canoeSprint: "10,00 s", canoeEndurance: "295 s / 4:55 min" },
  "13.5": { pullUps: "9", pushUps: "25", relativeStrength: "150 %", kayakSprint: "7,95 s", kayakEndurance: "270 s / 4:30 min", canoeSprint: "9,75 s", canoeEndurance: "290 s / 4:50 min" },
  "14.0": { pullUps: "10", pushUps: "30", relativeStrength: "160 %", kayakSprint: "7,80 s", kayakEndurance: "265 s / 4:25 min", canoeSprint: "9,50 s", canoeEndurance: "285 s / 4:45 min" },
};

export const kayakTechnique = [
  "Grundschlag vorwärts",
  "Bogenschlag vorwärts/rückwärts",
  "Ziehschlag",
  "Grundschlag rückwärts",
  "Aufwärtstor mit Bogenschlag",
  "Abwärtstor",
  "Abwärtstor mit Rückwärtsdrehung",
  "Aufwärtstor mit Ziehschlag",
] as const;

export const canoeTechnique = [
  "Grundschlag vorwärts",
  "Übergriffschlag vorwärts",
  "Bogenschlag",
  "Ziehschlag",
  "Grundschlag rückwärts",
  "Aufwärtstor klassisch mit Ziehschlag",
  "Aufwärtstor mit Konter-Ziehschlag",
  "Aufwärtstor mit Ziehschlag im Übergriff",
  "Abwärtstor klassisch",
  "Abwärtstor mit Rückwärtsdrehung",
] as const;

export const materialChecks = [
  "Körpergröße",
  "Körpergröße sitzend",
  "Körpergewicht",
  "Armspannweite",
  "Bootshersteller / Bootsgröße",
  "Paddelhersteller / Paddellänge",
  "Griffbreite IST / SOLL",
] as const;

export const includesKayak = (discipline: TestDiscipline): boolean => discipline !== "canoe";
export const includesCanoe = (discipline: TestDiscipline): boolean => discipline !== "kayak";

export const techniqueComparison = (discipline: "kayak" | "canoe"): string =>
  discipline === "kayak" ? "13 Jahre 1,50 / 14 Jahre 1,40" : "13 Jahre 1,77 / 14 Jahre 1,60";
