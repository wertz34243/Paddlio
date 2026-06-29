import { seedData } from "./seed";
import { getWeekdayFromDate } from "../domain/trainingPlan";
import type { Athlete, Competition, MaterialItem, PaddleMotionData, PlanEntry, TrainingJournalEntry, TrainingSession, User } from "../domain/types";

const STORAGE_KEY = "paddlemotion:v0.6:data";
const LEGACY_V05_STORAGE_KEY = "paddlemotion:v0.5:data";
const LEGACY_V03_STORAGE_KEY = "paddlemotion:v0.3:data";
const LEGACY_V02_STORAGE_KEY = "paddlemotion:v0.2:data";
const LEGACY_STORAGE_KEY = "paddlemotion:v0.1:data";

type LegacyCompetition = {
  id: string;
  athleteId: string;
  venue: string;
  boatClass: "K1" | "C1";
  runTimeSeconds: number;
  penaltySeconds: number;
  date: string;
};

type LegacyTraining = {
  id: string;
  athleteId: string;
  title: string;
  focus: string;
  date: string;
  durationMinutes: number;
  load: number;
  notes: string;
};

type LegacyEquipment = {
  id: string;
  athleteId: string;
  type: string;
  name: string;
  condition: "bereit" | "wartung" | "pruefen";
  notes: string;
};

type LegacyData = {
  athlete?: PaddleMotionData["athlete"];
  results?: LegacyCompetition[];
  training?: LegacyTraining[];
  equipment?: LegacyEquipment[];
};

type V02Data = Omit<PaddleMotionData, "plan" | "journal"> & {
  plan?: PlanEntry[];
  journal?: TrainingJournalEntry[];
};

type V03Data = Omit<PaddleMotionData, "activeUserId" | "users" | "journal"> & {
  activeUserId?: string;
  users?: User[];
  journal?: TrainingJournalEntry[];
};

type LegacyPlanEntry = Partial<PlanEntry> & {
  type?: string;
};

const now = (): string => new Date().toISOString();

const normalizeBrandValue = (value: string): string =>
  value === "PaddleMotion" || value === "PaddeleMotion" ? "Paddlio" : value;

const normalizeBrandData = (data: PaddleMotionData): PaddleMotionData => ({
  ...data,
  athlete: {
    ...data.athlete,
    club: normalizeBrandValue(data.athlete.club),
  },
  users: data.users.map((user) => ({
    ...user,
    profile: {
      ...user.profile,
      club: normalizeBrandValue(user.profile.club),
    },
  })),
});

const normalizeMaterialItems = (items: Array<Partial<MaterialItem> & Pick<MaterialItem, "id" | "name">>): MaterialItem[] =>
  items.map((item) => ({
    id: item.id,
    athleteId: item.athleteId ?? seedData.athlete.id,
    category: item.category ?? "Zubehoer",
    name: item.name,
    weightKg: item.weightKg ?? 0,
    lengthCm: item.lengthCm ?? 0,
    imageDataUrl: item.imageDataUrl ?? "",
    status: item.status ?? "bereit",
    rating: item.rating ?? 7,
    note: item.note ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeDataShape = (data: PaddleMotionData): PaddleMotionData => ({
  ...data,
  journal: Array.isArray(data.journal) ? data.journal : [],
  material: normalizeMaterialItems(data.material),
});

export const createId = (prefix: string): string => {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseStoredData = (value: string | null): unknown => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const createUserFromAthlete = (athlete: Athlete): User => {
  const timestamp = now();
  const [firstName = athlete.name, ...lastNameParts] = athlete.name.split(" ");

  return {
    id: "user-tobias",
    role: "athlete",
    profile: {
      firstName,
      lastName: lastNameParts.join(" "),
      nickname: athlete.name,
      birthDate: "",
      gender: "keine_angabe",
      heightCm: 0,
      weightKg: 0,
      club: athlete.club,
      federation: "",
      coach: "",
      licenseNumber: "",
      mainBoatClass: "K1",
      additionalBoatClasses: ["C1"],
      performanceClass: "",
      paddleSide: "rechts",
      trainingYears: 0,
      competitionExperience: "",
      longTermGoal: athlete.goals[0] ?? "",
      seasonGoal: athlete.goals[1] ?? "",
      personalNotes: athlete.goals.slice(2).join("\n"),
      profileImageDataUrl: "",
      darkMode: true,
      measurementUnit: "metrisch",
      language: "de",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const withUsers = (data: V03Data): PaddleMotionData => {
  const users = data.users && data.users.length > 0 ? data.users : [createUserFromAthlete(data.athlete)];

  return {
    ...data,
    activeUserId: data.activeUserId ?? users[0].id,
    users,
    journal: data.journal ?? [],
    material: normalizeMaterialItems(data.material),
    plan: normalizePlanEntries(data.plan ?? seedData.plan, data.athlete.id, data.activeUserId ?? users[0].id),
  };
};

const normalizePlanEntries = (entries: LegacyPlanEntry[], athleteId: string, userId: string): PlanEntry[] =>
  entries.map((entry, index) => {
    const fallback = seedData.plan[index % seedData.plan.length] ?? seedData.plan[0];
    const date = entry.date ?? fallback.date;
    const oldType = entry.type ?? entry.trainingType ?? fallback.trainingType;

    return {
      id: entry.id ?? `plan-migrated-${index}`,
      athleteId: entry.athleteId ?? athleteId,
      date,
      weekday: entry.weekday ?? getWeekdayFromDate(date),
      time: entry.time ?? fallback.time,
      durationMinutes: entry.durationMinutes ?? fallback.durationMinutes,
      area: entry.area ?? (oldType === "Pause" ? "Regeneration" : fallback.area),
      trainingType: entry.trainingType ?? fallback.trainingType,
      goal: entry.goal ?? entry.note ?? fallback.goal,
      intensity: entry.intensity ?? fallback.intensity,
      note: entry.note ?? "",
      status: entry.status ?? "geplant",
      createdByUserId: entry.createdByUserId ?? userId,
      assignedAthleteId: entry.assignedAthleteId ?? entry.athleteId ?? athleteId,
      assignedGroupId: entry.assignedGroupId ?? "",
      feedbackNote: entry.feedbackNote ?? "",
      createdAt: entry.createdAt ?? now(),
      updatedAt: entry.updatedAt ?? now(),
    };
  });

const isV05Data = (value: unknown): value is PaddleMotionData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PaddleMotionData>;
  return (
    typeof candidate.activeUserId === "string" &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.competitions) &&
    Array.isArray(candidate.training) &&
    Array.isArray(candidate.material) &&
    Array.isArray(candidate.plan)
  );
};

const isLegacyV03Data = (value: unknown): value is V03Data => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<V03Data>;
  return (
    Boolean(candidate.athlete) &&
    Array.isArray(candidate.competitions) &&
    Array.isArray(candidate.training) &&
    Array.isArray(candidate.material) &&
    Array.isArray(candidate.plan)
  );
};

const isLegacyV02Data = (value: unknown): value is V02Data => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<V02Data>;
  return Array.isArray(candidate.competitions) && Array.isArray(candidate.training) && Array.isArray(candidate.material);
};

const migrateV02Data = (data: V02Data): PaddleMotionData => withUsers({
  ...data,
  plan: data.plan ?? seedData.plan,
});

const migrateLegacyData = (legacy: LegacyData): PaddleMotionData => {
  const timestamp = now();
  const athlete = legacy.athlete ?? seedData.athlete;

  const competitions: Competition[] = (legacy.results ?? []).map((result) => ({
    id: result.id.replace("result", "competition"),
    athleteId: result.athleteId,
    date: result.date,
    location: result.venue,
    boatClass: result.boatClass,
    run1TimeSeconds: result.runTimeSeconds,
    run1PenaltySeconds: result.penaltySeconds,
    run2TimeSeconds: result.runTimeSeconds,
    run2PenaltySeconds: result.penaltySeconds,
    rank: 1,
    gapToWinnerSeconds: 0,
    feeling: 7,
    note: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const training: TrainingSession[] = (legacy.training ?? []).map((session) => ({
    id: session.id,
    athleteId: session.athleteId,
    date: session.date,
    type: "Technik",
    durationMinutes: session.durationMinutes,
    rpe: session.load,
    focus: session.focus || session.title,
    note: session.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const material: MaterialItem[] = (legacy.equipment ?? []).map((item) => ({
    id: item.id.replace("equipment", "material"),
    athleteId: item.athleteId,
    category: item.type === "Paddel" ? "Paddel" : item.type === "Boot" ? "Boot" : "Zubehoer",
    name: item.name,
    weightKg: 0,
    lengthCm: 0,
    imageDataUrl: "",
    status: item.condition,
    rating: item.condition === "bereit" ? 8 : 6,
    note: item.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  return {
    activeUserId: seedData.activeUserId,
    users: seedData.users,
    athlete,
    competitions: competitions.length > 0 ? competitions : seedData.competitions,
    training: training.length > 0 ? training : seedData.training,
    journal: [],
    material: material.length > 0 ? material : seedData.material,
    plan: seedData.plan,
  };
};

export const loadData = (): PaddleMotionData => {
  const storedData = parseStoredData(window.localStorage.getItem(STORAGE_KEY));

  if (isV05Data(storedData)) {
    const normalizedData = normalizeDataShape(normalizeBrandData(storedData));
    saveData(normalizedData);
    return normalizedData;
  }

  const v05Data = parseStoredData(window.localStorage.getItem(LEGACY_V05_STORAGE_KEY));
  if (isLegacyV03Data(v05Data)) {
    const migratedData = normalizeDataShape(normalizeBrandData(withUsers(v05Data)));
    saveData(migratedData);
    return migratedData;
  }

  const v03Data = parseStoredData(window.localStorage.getItem(LEGACY_V03_STORAGE_KEY));
  if (isLegacyV03Data(v03Data)) {
    const migratedData = normalizeDataShape(normalizeBrandData(withUsers(v03Data)));
    saveData(migratedData);
    return migratedData;
  }

  const v02Data = parseStoredData(window.localStorage.getItem(LEGACY_V02_STORAGE_KEY));
  if (isLegacyV02Data(v02Data)) {
    const migratedData = normalizeDataShape(normalizeBrandData(migrateV02Data(v02Data)));
    saveData(migratedData);
    return migratedData;
  }

  const legacyData = parseStoredData(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  const data = normalizeDataShape(normalizeBrandData(legacyData && typeof legacyData === "object" ? migrateLegacyData(legacyData as LegacyData) : seedData));
  saveData(data);
  return data;
};

export const saveData = (data: PaddleMotionData): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
