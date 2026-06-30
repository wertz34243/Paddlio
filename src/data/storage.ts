import { seedData } from "./seed";
import { getWeekdayFromDate } from "../domain/trainingPlan";
import type {
  AgeClass,
  Athlete,
  AuthSession,
  AuthUser,
  BoatClass,
  Competition,
  MaterialItem,
  PaddleMotionData,
  PlanEntry,
  TrainingJournalEntry,
  TrainingSession,
  User,
  UserProfile,
} from "../domain/types";

const STORAGE_KEY = "paddlemotion:v0.6:data";
const USERS_KEY = "paddlio_users";
const SESSION_KEY = "paddlio_session";
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

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult =
  | { ok: true; session: AuthSession; user: AuthUser }
  | { ok: false; message: string };

const memoryStorage = new Map<string, string>();

const now = (): string => new Date().toISOString();

const dataKey = (userId: string): string => `paddlio_data_${userId}`;

const getStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readStorage = (key: string): string | null => {
  const storage = getStorage();
  return storage?.getItem(key) ?? memoryStorage.get(key) ?? null;
};

const writeStorage = (key: string, value: string): void => {
  memoryStorage.set(key, value);

  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
    // Keep the in-memory fallback alive when browser storage is unavailable or full.
  }
};

const removeStorage = (key: string): void => {
  memoryStorage.delete(key);

  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Nothing to do; the fallback map has already been cleared.
  }
};

const normalizeBrandValue = (value: string): string =>
  value === "PaddleMotion" || value === "PaddeleMotion" ? "Paddlio" : value;

const ageClasses: AgeClass[] = ["U10", "U12", "U14", "U16", "U18", "U23", "Leistungsklasse", "Masters"];

const isBoatClass = (value: unknown): value is BoatClass => value === "K1" || value === "C1";

type LegacyProfileFields = Partial<UserProfile> & {
  mainBoatClass?: unknown;
  additionalBoatClasses?: unknown;
  performanceClass?: unknown;
};

const migrateBoatClasses = (profile: LegacyProfileFields): BoatClass[] => {
  const classes = new Set<BoatClass>();

  if (Array.isArray(profile.boatClasses)) {
    profile.boatClasses.filter(isBoatClass).forEach((boatClass) => classes.add(boatClass));
  }

  if (isBoatClass(profile.mainBoatClass)) {
    classes.add(profile.mainBoatClass);
  }

  if (Array.isArray(profile.additionalBoatClasses)) {
    profile.additionalBoatClasses.filter(isBoatClass).forEach((boatClass) => classes.add(boatClass));
  }

  return classes.size > 0 ? [...classes] : ["K1"];
};

const migrateAgeClass = (profile: LegacyProfileFields): AgeClass | "" => {
  const value = typeof profile.ageClass === "string" ? profile.ageClass : profile.performanceClass;
  return ageClasses.includes(value as AgeClass) ? (value as AgeClass) : "";
};

const migratePaddleSide = (profile: LegacyProfileFields, boatClasses: BoatClass[]): UserProfile["paddleSide"] => {
  if (!boatClasses.includes("C1")) {
    return "rechts";
  }

  return profile.paddleSide === "links" ? "links" : "rechts";
};

const normalizeProfile = (profile: LegacyProfileFields): UserProfile => {
  const boatClasses = migrateBoatClasses(profile);

  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    nickname: profile.nickname ?? "",
    birthDate: profile.birthDate ?? "",
    gender: profile.gender ?? "keine_angabe",
    heightCm: profile.heightCm ?? 0,
    weightKg: profile.weightKg ?? 0,
    club: normalizeBrandValue(profile.club ?? ""),
    federation: profile.federation ?? "",
    coach: profile.coach ?? "",
    licenseNumber: profile.licenseNumber ?? "",
    boatClasses,
    ageClass: migrateAgeClass(profile),
    paddleSide: migratePaddleSide(profile, boatClasses),
    trainingYears: profile.trainingYears ?? 0,
    competitionExperience: profile.competitionExperience ?? "",
    longTermGoal: profile.longTermGoal ?? "",
    seasonGoal: profile.seasonGoal ?? "",
    personalNotes: profile.personalNotes ?? "",
    profileImageDataUrl: profile.profileImageDataUrl ?? "",
    darkMode: profile.darkMode ?? true,
    measurementUnit: profile.measurementUnit ?? "metrisch",
    language: profile.language ?? "de",
  };
};

const normalizeBrandData = (data: PaddleMotionData): PaddleMotionData => ({
  ...data,
  athlete: {
    ...data.athlete,
    club: normalizeBrandValue(data.athlete.club),
  },
  users: data.users.map((user) => ({
    ...user,
    userId: user.userId ?? user.id,
    profile: normalizeProfile(user.profile),
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

const normalizeJournalEntries = (items: Array<Partial<TrainingJournalEntry> & Pick<TrainingJournalEntry, "id" | "trainingId" | "date">>): TrainingJournalEntry[] =>
  items.map((item) => ({
    id: item.id,
    athleteId: item.athleteId ?? seedData.athlete.id,
    trainingId: item.trainingId,
    date: item.date,
    trainingRating: item.trainingRating ?? 7,
    feeling: item.feeling ?? 7,
    fatigue: item.fatigue ?? 4,
    sleep: item.sleep ?? 7,
    motivation: item.motivation ?? item.feeling ?? 7,
    notes: item.notes ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeDataShape = (data: PaddleMotionData): PaddleMotionData => ({
  ...data,
  journal: Array.isArray(data.journal) ? normalizeJournalEntries(data.journal) : [],
  material: normalizeMaterialItems(data.material),
});

export const createId = (prefix: string): string => {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
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

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashPassword = (password: string): string => {
  const encoded = globalThis.btoa
    ? globalThis.btoa(unescape(encodeURIComponent(password)))
    : encodeURIComponent(password);
  return `local-demo:${encoded}`;
};

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.userId === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.passwordHash === "string"
  );
};

export const loadUsers = (): AuthUser[] => {
  const value = parseStoredData(readStorage(USERS_KEY));
  return Array.isArray(value) ? value.filter(isAuthUser) : [];
};

const saveUsers = (users: AuthUser[]): void => {
  writeStorage(USERS_KEY, JSON.stringify(users));
};

export const loadSession = (): AuthSession | null => {
  const value = parseStoredData(window.localStorage.getItem(SESSION_KEY));

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<AuthSession>;
  const users = loadUsers();

  if (typeof candidate.userId !== "string" || !users.some((user) => user.userId === candidate.userId)) {
    return null;
  }

  return {
    userId: candidate.userId,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : now(),
  };
};

const saveSession = (session: AuthSession): void => {
  writeStorage(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  removeStorage(SESSION_KEY);
};

const createSession = (userId: string): AuthSession => {
  const session = {
    userId,
    createdAt: now(),
  };

  saveSession(session);
  return session;
};

export const registerLocalUser = (input: RegisterInput): AuthResult => {
  const email = normalizeEmail(input.email);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const password = input.password.trim();

  if (!firstName || !email || !password) {
    return { ok: false, message: "Vorname, E-Mail und Passwort sind erforderlich." };
  }

  if (password.length < 4) {
    return { ok: false, message: "Das Passwort braucht mindestens 4 Zeichen." };
  }

  const users = loadUsers();
  if (users.some((user) => user.email === email)) {
    return { ok: false, message: "Diese E-Mail ist bereits registriert." };
  }

  const timestamp = now();
  const displayName = `${firstName} ${lastName}`.trim();
  const user: AuthUser = {
    userId: createId("user"),
    email,
    displayName,
    passwordHash: hashPassword(password),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveUsers([...users, user]);
  const session = createSession(user.userId);
  return { ok: true, session, user };
};

export const loginLocalUser = (input: LoginInput): AuthResult => {
  const email = normalizeEmail(input.email);
  const passwordHash = hashPassword(input.password.trim());
  const user = loadUsers().find((item) => item.email === email);

  if (!user || user.passwordHash !== passwordHash) {
    return { ok: false, message: "E-Mail oder Passwort ist nicht korrekt." };
  }

  const session = createSession(user.userId);
  return { ok: true, session, user };
};

const createUserFromAthlete = (athlete: Athlete): User => {
  const timestamp = now();
  const [firstName = athlete.name, ...lastNameParts] = athlete.name.split(" ");

  return {
    id: "user-tobias",
    userId: "user-tobias",
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
      boatClasses: ["K1", "C1"],
      ageClass: "",
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

const createProfileForAuthUser = (authUser: AuthUser): UserProfile => {
  const [firstName = authUser.displayName || "Athlet", ...lastNameParts] = authUser.displayName.split(" ");

  return {
    firstName,
    lastName: lastNameParts.join(" "),
    nickname: firstName,
    birthDate: "",
    gender: "keine_angabe",
    heightCm: 0,
    weightKg: 0,
    club: "",
    federation: "",
    coach: "",
    licenseNumber: "",
    boatClasses: ["K1"],
    ageClass: "",
    paddleSide: "rechts",
    trainingYears: 0,
    competitionExperience: "",
    longTermGoal: "",
    seasonGoal: "",
    personalNotes: "",
    profileImageDataUrl: "",
    darkMode: true,
    measurementUnit: "metrisch",
    language: "de",
  };
};

const createEmptyDataForUser = (authUser: AuthUser): PaddleMotionData => {
  const timestamp = now();
  const athleteId = `athlete-${authUser.userId}`;
  const profile = createProfileForAuthUser(authUser);

  return {
    activeUserId: authUser.userId,
    users: [
      {
        id: authUser.userId,
        userId: authUser.userId,
        role: "athlete",
        profile,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    athlete: {
      id: athleteId,
      name: profile.nickname || profile.firstName || authUser.displayName || "Athlet",
      club: "",
      goals: [],
    },
    competitions: [],
    training: [],
    journal: [],
    material: [],
    plan: [],
  };
};

const withUsers = (data: V03Data): PaddleMotionData => {
  const users = (data.users && data.users.length > 0 ? data.users : [createUserFromAthlete(data.athlete)]).map((user) => ({
    ...user,
    userId: user.userId ?? user.id,
  }));

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

const getAuthUser = (userId: string): AuthUser => {
  const user = loadUsers().find((item) => item.userId === userId);

  if (user) {
    return user;
  }

  const timestamp = now();
  return {
    userId,
    email: "",
    displayName: "Athlet",
    passwordHash: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const bindDataToUser = (data: PaddleMotionData, authUser: AuthUser): PaddleMotionData => {
  const fallback = createEmptyDataForUser(authUser);
  const user = data.users.find((item) => item.id === authUser.userId || item.userId === authUser.userId);
  const normalizedUser: User = {
    ...(user ?? fallback.users[0]),
    id: authUser.userId,
    userId: authUser.userId,
  };
  const athlete = {
    ...fallback.athlete,
    ...data.athlete,
    id: fallback.athlete.id,
  };

  const normalized = normalizeDataShape(normalizeBrandData({
    ...data,
    activeUserId: authUser.userId,
    users: [normalizedUser],
    athlete,
  }));

  return {
    ...normalized,
    competitions: normalized.competitions.map((competition) => ({
      ...competition,
      athleteId: athlete.id,
    })),
    training: normalized.training.map((session) => ({
      ...session,
      athleteId: athlete.id,
    })),
    journal: normalized.journal.map((entry) => ({
      ...entry,
      athleteId: athlete.id,
    })),
    material: normalized.material.map((item) => ({
      ...item,
      athleteId: athlete.id,
    })),
    plan: normalized.plan.map((entry) => ({
      ...entry,
      athleteId: athlete.id,
      assignedAthleteId: athlete.id,
      createdByUserId: authUser.userId,
    })),
  };
};

export const loadData = (userId: string): PaddleMotionData => {
  const authUser = getAuthUser(userId);
  const storedData = parseStoredData(readStorage(dataKey(userId)));

  if (isV05Data(storedData)) {
    const normalizedData = bindDataToUser(storedData, authUser);
    saveData(userId, normalizedData);
    return normalizedData;
  }

  const data = createEmptyDataForUser(authUser);
  saveData(userId, data);
  return data;
};

export const saveData = (userId: string, data: PaddleMotionData): void => {
  writeStorage(dataKey(userId), JSON.stringify(bindDataToUser(data, getAuthUser(userId))));
};
