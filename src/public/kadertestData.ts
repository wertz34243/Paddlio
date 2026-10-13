export const calendarAges = ["11.0", "11.5", "12.0", "12.5", "13.0", "13.5", "14.0", "14.5", "15.0", "15.5", "16.0", "16.5", "17.0", "18.0"] as const;
export const biologicalAges = ["10.0", "10.5", ...calendarAges] as const;

export type CalendarAge = typeof calendarAges[number];
export type BiologicalAge = typeof biologicalAges[number];
export type TestAge = CalendarAge;
export type TestGender = "male" | "female";
export type TestDiscipline = "kayak" | "canoe" | "both";

export type AthleticNorm = {
  sitAndReach: number;
  coreStrength: number;
  pullUps?: number;
  pushUps?: number;
  relativeStrength?: number;
  kayakSprint: number;
  kayakEndurance: number;
  canoeSprint: number;
  canoeEndurance: number;
};

type TechniqueNorm = { mean: number; tasks: Record<string, number> };

const maleRows: Record<BiologicalAge, Omit<AthleticNorm, "canoeSprint" | "canoeEndurance">> = {
  "10.0": { sitAndReach: 98, coreStrength: 45, pullUps: 1, pushUps: 5, kayakSprint: 9, kayakEndurance: 305 },
  "10.5": { sitAndReach: 98, coreStrength: 50, pullUps: 2, pushUps: 8, kayakSprint: 8.85, kayakEndurance: 300 },
  "11.0": { sitAndReach: 98, coreStrength: 55, pullUps: 3, pushUps: 10, kayakSprint: 8.7, kayakEndurance: 295 },
  "11.5": { sitAndReach: 99, coreStrength: 60, pullUps: 4, pushUps: 13, kayakSprint: 8.55, kayakEndurance: 290 },
  "12.0": { sitAndReach: 99, coreStrength: 65, pullUps: 5, pushUps: 15, relativeStrength: 130, kayakSprint: 8.4, kayakEndurance: 285 },
  "12.5": { sitAndReach: 100, coreStrength: 70, pullUps: 6, pushUps: 18, relativeStrength: 135, kayakSprint: 8.25, kayakEndurance: 280 },
  "13.0": { sitAndReach: 100, coreStrength: 75, pullUps: 7, pushUps: 20, relativeStrength: 140, kayakSprint: 8.1, kayakEndurance: 275 },
  "13.5": { sitAndReach: 101, coreStrength: 88, pullUps: 9, pushUps: 25, relativeStrength: 150, kayakSprint: 7.95, kayakEndurance: 270 },
  "14.0": { sitAndReach: 101, coreStrength: 100, pullUps: 10, pushUps: 30, relativeStrength: 160, kayakSprint: 7.8, kayakEndurance: 265 },
  "14.5": { sitAndReach: 102, coreStrength: 110, pullUps: 13, pushUps: 35, relativeStrength: 173, kayakSprint: 7.65, kayakEndurance: 260 },
  "15.0": { sitAndReach: 102, coreStrength: 120, pullUps: 15, pushUps: 40, relativeStrength: 186, kayakSprint: 7.5, kayakEndurance: 255 },
  "15.5": { sitAndReach: 103, coreStrength: 138, relativeStrength: 198, kayakSprint: 7.25, kayakEndurance: 250 },
  "16.0": { sitAndReach: 103, coreStrength: 155, relativeStrength: 210, kayakSprint: 7, kayakEndurance: 245 },
  "16.5": { sitAndReach: 104, coreStrength: 168, relativeStrength: 217, kayakSprint: 6.75, kayakEndurance: 243 },
  "17.0": { sitAndReach: 104, coreStrength: 180, relativeStrength: 223, kayakSprint: 6.5, kayakEndurance: 240 },
  "18.0": { sitAndReach: 104, coreStrength: 180, relativeStrength: 241, kayakSprint: 6, kayakEndurance: 235 },
};

const femaleRows: Record<BiologicalAge, Omit<AthleticNorm, "canoeSprint" | "canoeEndurance">> = {
  "10.0": { sitAndReach: 99, coreStrength: 30, pullUps: 1, pushUps: 3, kayakSprint: 9.3, kayakEndurance: 315 },
  "10.5": { sitAndReach: 99, coreStrength: 35, pullUps: 2, pushUps: 4, kayakSprint: 9.15, kayakEndurance: 310 },
  "11.0": { sitAndReach: 99, coreStrength: 40, pullUps: 2, pushUps: 5, kayakSprint: 9, kayakEndurance: 305 },
  "11.5": { sitAndReach: 100, coreStrength: 45, pullUps: 3, pushUps: 8, kayakSprint: 8.85, kayakEndurance: 300 },
  "12.0": { sitAndReach: 100, coreStrength: 50, pullUps: 4, pushUps: 10, relativeStrength: 110, kayakSprint: 8.7, kayakEndurance: 295 },
  "12.5": { sitAndReach: 101, coreStrength: 55, pullUps: 5, pushUps: 13, relativeStrength: 115, kayakSprint: 8.55, kayakEndurance: 290 },
  "13.0": { sitAndReach: 101, coreStrength: 60, pullUps: 6, pushUps: 15, relativeStrength: 120, kayakSprint: 8.4, kayakEndurance: 285 },
  "13.5": { sitAndReach: 102, coreStrength: 75, pullUps: 7, pushUps: 18, relativeStrength: 128, kayakSprint: 8.25, kayakEndurance: 280 },
  "14.0": { sitAndReach: 102, coreStrength: 90, pullUps: 8, pushUps: 20, relativeStrength: 135, kayakSprint: 8.1, kayakEndurance: 275 },
  "14.5": { sitAndReach: 103, coreStrength: 103, pullUps: 10, pushUps: 25, relativeStrength: 143, kayakSprint: 7.95, kayakEndurance: 270 },
  "15.0": { sitAndReach: 104, coreStrength: 115, pullUps: 12, pushUps: 30, relativeStrength: 150, kayakSprint: 7.8, kayakEndurance: 265 },
  "15.5": { sitAndReach: 105, coreStrength: 128, relativeStrength: 159, kayakSprint: 7.65, kayakEndurance: 260 },
  "16.0": { sitAndReach: 106, coreStrength: 140, relativeStrength: 167, kayakSprint: 7.5, kayakEndurance: 255 },
  "16.5": { sitAndReach: 107, coreStrength: 160, relativeStrength: 170, kayakSprint: 7.35, kayakEndurance: 253 },
  "17.0": { sitAndReach: 107, coreStrength: 180, relativeStrength: 173, kayakSprint: 7.2, kayakEndurance: 250 },
  "18.0": { sitAndReach: 108, coreStrength: 180, relativeStrength: 193, kayakSprint: 6.9, kayakEndurance: 245 },
};

const withCanoe = (row: Omit<AthleticNorm, "canoeSprint" | "canoeEndurance">, age: BiologicalAge, gender: TestGender): AthleticNorm => {
  const index = biologicalAges.indexOf(age);
  const canoeSprint = gender === "male"
    ? [11.5, 11.25, 11, 10.75, 10.5, 10.25, 10, 9.75, 9.5, 9.25, 9, 8.75, 8.5, 8.25, 8, 7.5][index]
    : [12.5, 12.25, 12, 11.75, 11.5, 11.25, 11, 10.75, 10.5, 10.25, 10, 9.75, 9.5, 9.25, 9, 8.5][index];
  const canoeEndurance = gender === "male"
    ? [325, 320, 315, 310, 305, 300, 295, 290, 285, 280, 275, 270, 265, 263, 260, 255][index]
    : [335, 330, 325, 320, 315, 310, 305, 300, 295, 290, 285, 280, 275, 273, 270, 265][index];
  return { ...row, canoeSprint, canoeEndurance };
};

export const athleticNorms: Record<TestGender, Record<BiologicalAge, AthleticNorm>> = {
  male: Object.fromEntries(biologicalAges.map((age) => [age, withCanoe(maleRows[age], age, "male")])) as Record<BiologicalAge, AthleticNorm>,
  female: Object.fromEntries(biologicalAges.map((age) => [age, withCanoe(femaleRows[age], age, "female")])) as Record<BiologicalAge, AthleticNorm>,
};

const kayakTaskValues: Record<string, number[]> = {
  "Grundschlag vorwärts": [1.8, 1.62, 1.44, 1.26, 1.08, 0.9, 0.72, 0.54],
  "Bogenschlag vorwärts/rückwärts": [2, 1.8, 1.6, 1.4],
  "Ziehschlag": [2, 1.8, 1.6, 1.4],
  "Grundschlag rückwärts": [1.8, 1.62, 1.44, 1.26],
  "Aufwärtstor mit Bogenschlag": [2, 1.8, 1.6, 1.4, 1.2, 1, 0.8, 0.6],
  "Abwärtstor": [1.8, 1.62, 1.44, 1.26, 1.08, 0.9, 0.72, 0.54],
  "Abwärtstor mit Rückwärtsdrehung": [1.9, 1.71, 1.52, 1.33, 1.14, 0.95, 0.76, 0.57],
  "Aufwärtstor mit Ziehschlag": [2, 1.8, 1.6, 1.5, 1.3, 1.1, 0.9, 0.7],
};

const canoeTaskValues: Record<string, { start: number; values: number[] }> = {
  "Grundschlag vorwärts": { start: 11, values: [2, 1.9, 1.7, 1.5, 1.3, 1.1, 0.9, 0.7] },
  "Übergriffschlag vorwärts": { start: 11, values: [2, 1.9, 1.7, 1.5, 1.3, 1.1, 0.9, 0.7] },
  "Bogenschlag": { start: 11, values: [1.8, 1.62, 1.44, 1.26] },
  "Ziehschlag": { start: 11, values: [1.8, 1.62, 1.44, 1.26] },
  "Grundschlag rückwärts": { start: 11, values: [2.2, 2.1, 2, 1.8] },
  "Aufwärtstor klassisch mit Ziehschlag": { start: 11, values: [2, 1.9, 1.7, 1.5, 1.3, 1.1, 0.9, 0.7] },
  "Aufwärtstor mit Konter-Ziehschlag": { start: 13, values: [2, 1.75, 1.5, 1.25, 1, 0.75] },
  "Aufwärtstor mit Ziehschlag im Übergriff": { start: 13, values: [2, 1.75, 1.5, 1.25, 1, 0.75] },
  "Aufwärtstor Staken": { start: 15, values: [2, 1.6, 1.2, 0.9] },
  "Abwärtstor klassisch": { start: 11, values: [2, 1.9, 1.7, 1.5, 1.3, 1.1, 0.9, 0.7] },
  "Abwärtstor verkanten": { start: 14, values: [2, 1.7, 1.4, 1.1, 0.9] },
  "Abwärtstor mit Rückwärtsdrehung": { start: 11, values: [2.2, 2.1, 2, 1.8, 1.5, 1.2, 0.9, 0.7] },
};

const techniqueMeans = {
  kayak: [1.9, 1.7, 1.5, 1.4, 1.2, 1, 0.8, 0.6],
  canoe: [2, 1.88, 1.77, 1.6, 1.49, 1.23, 0.98, 0.76],
};
const wholeAges = [11, 12, 13, 14, 15, 16, 17, 18];

export const techniqueNorms: Record<"kayak" | "canoe", Record<number, TechniqueNorm>> = {
  kayak: Object.fromEntries(wholeAges.map((age, index) => [age, {
    mean: techniqueMeans.kayak[index],
    tasks: Object.fromEntries(Object.entries(kayakTaskValues).filter(([, values]) => values[index] !== undefined).map(([name, values]) => [name, values[index]])),
  }])) as Record<number, TechniqueNorm>,
  canoe: Object.fromEntries(wholeAges.map((age, index) => [age, {
    mean: techniqueMeans.canoe[index],
    tasks: Object.fromEntries(Object.entries(canoeTaskValues).filter(([, config]) => config.values[age - config.start] !== undefined).map(([name, config]) => [name, config.values[age - config.start]])),
  }])) as Record<number, TechniqueNorm>,
};

export const materialChecks = ["Körpergröße", "Körpergröße sitzend", "Körpergewicht", "Armspannweite", "Bootshersteller / Bootsgröße", "Paddelhersteller / Paddellänge", "Griffbreite IST / SOLL"] as const;
export const includesKayak = (discipline: TestDiscipline): boolean => discipline !== "canoe";
export const includesCanoe = (discipline: TestDiscipline): boolean => discipline !== "kayak";
export const formatAge = (age: string): string => age.replace(".", ",");
export const formatDecimal = (value: number, digits = 2): string => value.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const formatDuration = (seconds: number): string => `${seconds} s / ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} min`;
export const getCalendarNorm = (age: CalendarAge, gender: TestGender): AthleticNorm => athleticNorms[gender][age];
export const getBiologicalNorm = (age: BiologicalAge, gender: TestGender): AthleticNorm => athleticNorms[gender][age];
export const getTechniqueAge = (age: CalendarAge): number | null => Number.isInteger(Number(age)) ? Number(age) : null;
export const getTechniqueComparison = (age: CalendarAge, discipline: "kayak" | "canoe"): string => {
  const lower = Math.floor(Number(age));
  const upper = Math.ceil(Number(age));
  return `${lower} Jahre ${formatDecimal(techniqueNorms[discipline][lower].mean, discipline === "kayak" ? 1 : 2)} / ${upper} Jahre ${formatDecimal(techniqueNorms[discipline][upper].mean, discipline === "kayak" ? 1 : 2)}`;
};
