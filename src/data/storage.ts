import { seedData } from "./seed";
import { academyInitialData } from "../features/academy/academyContent";
import { getWeekdayFromDate } from "../domain/trainingPlan";
import { writeLocalFirstCache } from "../services/localFirstCacheService";
import type {
  AgeClass,
  Athlete,
  AuthSession,
  AuthUser,
  BetaFeedback,
  BetaReadinessCheck,
  BetaTester,
  BoatClass,
  Club,
  ClubBoat,
  ClubDocument,
  ClubEvent,
  ClubMaterial,
  ClubMessage,
  ClubSettings,
  ClubPost,
  DirectMessage,
  FileAttachment,
  GroupMessage,
  ClubRequest,
  ClubRequestStatus,
  ClubStatus,
  CoachAthlete,
  CoachGroup,
  Competition,
  ExternalConnection,
  ExternalTrainingSession,
  InvitationCode,
  InvitationRole,
  MaterialItem,
  NotificationItem,
  PaddleMotionData,
  PersonalBest,
  PlanEntry,
  ResultImport,
  SeasonGoal,
  SmartCoachRecommendation,
  TeamTask,
  TeamTaskAssignment,
  TrainingFeedback,
  TrainingAttendance,
  TrainingJournalEntry,
  TrainingTemplate,
  TrainerRequest,
  TrainerRequestStatus,
  TrainingSession,
  User,
  UserProfile,
  UserRole,
  UserStatus,
} from "../domain/types";

const STORAGE_KEY = "paddlemotion:v0.6:data";
const USERS_KEY = "paddlio_users";
const SESSION_KEY = "paddlio_session";
const SESSIONS_KEY = "paddlio_sessions";
const INVITATION_CODES_KEY = "paddlio_invitation_codes";
const TRAINER_REQUESTS_KEY = "paddlio_trainer_requests";
const CLUBS_KEY = "paddlio_clubs";
const CLUB_REQUESTS_KEY = "paddlio_club_requests";
const ADMIN_EMAIL = "t.kanu@outlook.com";
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

type V02Data = Omit<PaddleMotionData, "plan" | "journal" | "goals"> & {
  plan?: PlanEntry[];
  journal?: TrainingJournalEntry[];
  goals?: SeasonGoal[];
};

type V03Data = Omit<PaddleMotionData, "activeUserId" | "users" | "journal" | "goals"> & {
  activeUserId?: string;
  users?: User[];
  journal?: TrainingJournalEntry[];
  goals?: SeasonGoal[];
};

type LegacyPlanEntry = Partial<PlanEntry> & {
  type?: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  clubId: string;
  club: string;
  suggestClub: boolean;
  password: string;
  passwordRepeat: string;
  privacyAccepted: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type InviteUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  club: string;
  role: InvitationRole;
  trainingGroupId: string;
  createdByUserId: string;
  coachId: string;
};

export type InvitationAcceptInput = {
  password: string;
  invitationCode: string;
};

export type TrainerRequestInput = {
  userId: string;
  club: string;
  message: string;
  hasLicense: boolean;
  licenseNumber: string;
  qualification: string;
  phone: string;
  remark: string;
};

export type ClubInput = {
  clubId?: string;
  name: string;
  shortName: string;
  city: string;
  contactName?: string;
  contactEmail?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: ClubStatus;
};

export type ClubRequestInput = {
  requestedByUserId: string;
  name: string;
  shortName: string;
  city: string;
  contactName?: string;
  contactEmail?: string;
  website?: string;
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
    category: item.category ?? "Zubehör",
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
    trainingPlanEntryId: item.trainingPlanEntryId ?? undefined,
    date: item.date,
    completionStatus: item.completionStatus ?? undefined,
    actualDurationMinutes: item.actualDurationMinutes ?? undefined,
    actualDistanceKm: item.actualDistanceKm ?? undefined,
    averageHeartRate: item.averageHeartRate ?? undefined,
    perceivedExertion: item.perceivedExertion ?? undefined,
    painNotes: item.painNotes ?? "",
    trainingRating: item.trainingRating ?? 7,
    feeling: item.feeling ?? 7,
    fatigue: item.fatigue ?? 4,
    sleep: item.sleep ?? 7,
    motivation: item.motivation ?? item.feeling ?? 7,
    notes: item.notes ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeCoachGroups = (items: Array<Partial<CoachGroup> & Pick<CoachGroup, "id" | "name">>, fallbackClubId: string): CoachGroup[] =>
  items.map((group) => ({
    id: group.id,
    groupId: group.groupId ?? group.id,
    clubId: group.clubId ?? fallbackClubId,
    coachUserId: group.coachUserId ?? group.coachId ?? "",
    coachId: group.coachId ?? group.coachUserId ?? "",
    name: group.name,
    description: group.description ?? "",
    ageCategory: group.ageCategory ?? "",
    ageRange: group.ageRange ?? "",
    boatClasses: Array.isArray(group.boatClasses) && group.boatClasses.length > 0 ? group.boatClasses : ["K1"],
    trainingFocus: group.trainingFocus ?? "Allgemein",
    color: group.color ?? "#00B4D8",
    status: group.status ?? "active",
    athleteIds: Array.isArray(group.athleteIds) ? group.athleteIds : [],
    createdAt: group.createdAt ?? now(),
    updatedAt: group.updatedAt ?? now(),
  }));

const normalizeCoachAthletes = (items: Array<Partial<CoachAthlete> & Pick<CoachAthlete, "id">>, fallbackClub: string, fallbackClubId: string): CoachAthlete[] =>
  items.map((athlete) => {
    const nameParts = (athlete.name ?? `${athlete.firstName ?? ""} ${athlete.lastName ?? ""}`).trim().split(/\s+/).filter(Boolean);
    const firstName = athlete.firstName ?? nameParts[0] ?? "";
    const lastName = athlete.lastName ?? nameParts.slice(1).join(" ");
    const groupIds = Array.isArray(athlete.groupIds) && athlete.groupIds.length > 0
      ? athlete.groupIds
      : athlete.groupId
        ? [athlete.groupId]
        : [];

    return {
      id: athlete.id,
      coachUserId: athlete.coachUserId ?? "",
      clubId: athlete.clubId ?? fallbackClubId,
      firstName,
      lastName,
      email: athlete.email ?? "",
      name: athlete.name ?? `${firstName} ${lastName}`.trim(),
      birthDate: athlete.birthDate ?? "",
      ageClass: athlete.ageClass ?? "",
      club: normalizeBrandValue(athlete.club ?? fallbackClub),
      boatClasses: Array.isArray(athlete.boatClasses) && athlete.boatClasses.length > 0 ? athlete.boatClasses : ["K1"],
      paddleSide: athlete.paddleSide ?? "rechts",
      groupId: athlete.groupId ?? groupIds[0] ?? "",
      groupIds,
      goals: athlete.goals ?? "",
      trainerNotes: athlete.trainerNotes ?? athlete.notes ?? "",
      notes: athlete.notes ?? "",
      status: athlete.status ?? "aktiv",
      invitationStatus: athlete.invitationStatus ?? "aktiv",
      createdAt: athlete.createdAt ?? now(),
      updatedAt: athlete.updatedAt ?? now(),
    };
  });

const normalizeTrainingFeedback = (items: Array<Partial<TrainingFeedback> & Pick<TrainingFeedback, "id" | "trainingId">>): TrainingFeedback[] =>
  items.map((feedback) => ({
    id: feedback.id,
    trainingId: feedback.trainingId,
    athleteUserId: feedback.athleteUserId ?? "",
    coachUserId: feedback.coachUserId ?? "",
    status: feedback.status ?? "done",
    feeling: feedback.feeling ?? 7,
    difficulty: feedback.difficulty ?? 5,
    fatigue: feedback.fatigue ?? 5,
    motivation: feedback.motivation ?? 7,
    sleep: feedback.sleep ?? 7,
    reason: feedback.reason ?? "",
    comment: feedback.comment ?? "",
    completedAt: feedback.completedAt ?? now(),
  }));

const normalizeTrainingTemplates = (items: Array<Partial<TrainingTemplate> & Pick<TrainingTemplate, "id" | "title">>, userId: string, clubId: string): TrainingTemplate[] =>
  items.map((template) => ({
    id: template.id,
    ownerUserId: template.ownerUserId ?? userId,
    clubId: template.clubId ?? clubId,
    createdByUserId: template.createdByUserId ?? template.ownerUserId ?? userId,
    title: template.title,
    category: template.category ?? "Allgemein",
    trainingArea: template.trainingArea ?? "Wassertraining",
    trainingType: template.trainingType ?? "K1 Technik",
    boatClass: template.boatClass ?? "K1",
    defaultDurationMinutes: template.defaultDurationMinutes ?? 75,
    defaultIntensity: template.defaultIntensity ?? "mittel",
    focus: template.focus ?? "",
    description: template.description ?? "",
    notes: template.notes ?? "",
    tags: Array.isArray(template.tags) ? template.tags : [],
    isFavorite: Boolean(template.isFavorite),
    visibility: template.visibility ?? "private",
    createdAt: template.createdAt ?? now(),
    updatedAt: template.updatedAt ?? now(),
  }));

const normalizeNotifications = (
  items: Array<Partial<NotificationItem> & { id?: string; user_id?: string; body?: string | null; read_at?: string | null; created_at?: string }>,
  userId: string,
): NotificationItem[] =>
  items.map((item) => ({
    id: item.id ?? createId("notification"),
    userId: item.userId ?? item.user_id ?? userId,
    title: item.title ?? "Benachrichtigung",
    message: item.message ?? item.body ?? "",
    type: item.type ?? "info",
    read: Boolean(item.read ?? item.read_at),
    createdAt: item.createdAt ?? item.created_at ?? now(),
    relatedEntityType: item.relatedEntityType,
    relatedEntityId: item.relatedEntityId,
  }));

const normalizeSmartCoachRecommendations = (
  items: Array<Partial<SmartCoachRecommendation> & Pick<SmartCoachRecommendation, "id" | "title">>,
  userId: string,
): SmartCoachRecommendation[] =>
  items.map((item) => ({
    id: item.id,
    ownerUserId: item.ownerUserId ?? userId,
    createdForUserId: item.createdForUserId ?? userId,
    createdBySystem: item.createdBySystem ?? true,
    clubId: item.clubId ?? "",
    category: item.category ?? "training",
    priority: item.priority ?? "medium",
    title: item.title,
    message: item.message ?? "",
    reason: item.reason ?? "",
    suggestedAction: item.suggestedAction ?? "",
    status: item.status ?? "open",
    relatedEntityType: item.relatedEntityType,
    relatedEntityId: item.relatedEntityId,
    note: item.note ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizePersonalBests = (items: Array<Partial<PersonalBest> & Pick<PersonalBest, "id">>): PersonalBest[] =>
  items.map((item) => ({
    id: item.id,
    athleteId: item.athleteId ?? "",
    clubId: item.clubId ?? "",
    boatClass: item.boatClass ?? "K1",
    courseName: item.courseName ?? "",
    location: item.location ?? "",
    bestTimeSeconds: item.bestTimeSeconds ?? 0,
    resultId: item.resultId ?? "",
    achievedAt: item.achievedAt ?? now().slice(0, 10),
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeResultImports = (items: Array<Partial<ResultImport> & Pick<ResultImport, "id">>, userId: string): ResultImport[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    uploadedBy: item.uploadedBy ?? userId,
    sourceType: item.sourceType ?? "manual",
    sourceName: item.sourceName ?? "",
    sourceUrl: item.sourceUrl ?? "",
    filePath: item.filePath ?? "",
    importStatus: item.importStatus ?? "draft",
    detectedResultsCount: item.detectedResultsCount ?? 0,
    importedResultsCount: item.importedResultsCount ?? 0,
    errorMessage: item.errorMessage ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeExternalConnections = (items: Array<Partial<ExternalConnection> & Pick<ExternalConnection, "id">>, userId: string): ExternalConnection[] =>
  items.map((item) => ({
    id: item.id,
    userId: item.userId ?? userId,
    provider: item.provider ?? "polar",
    providerUserId: item.providerUserId ?? "",
    status: item.status ?? "disconnected",
    lastSyncAt: item.lastSyncAt ?? "",
    errorMessage: item.errorMessage ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeExternalTrainingSessions = (items: Array<Partial<ExternalTrainingSession> & Pick<ExternalTrainingSession, "id">>, userId: string): ExternalTrainingSession[] =>
  items.map((item) => ({
    id: item.id,
    userId: item.userId ?? userId,
    athleteId: item.athleteId ?? "",
    clubId: item.clubId ?? "",
    provider: item.provider ?? "manual",
    providerActivityId: item.providerActivityId ?? "",
    title: item.title ?? "Externes Training",
    sportType: item.sportType ?? "other",
    startedAt: item.startedAt ?? now(),
    durationSeconds: item.durationSeconds ?? 0,
    distanceMeters: item.distanceMeters ?? 0,
    avgHeartRate: item.avgHeartRate ?? 0,
    maxHeartRate: item.maxHeartRate ?? 0,
    calories: item.calories ?? 0,
    trainingLoad: item.trainingLoad ?? 0,
    recoveryStatus: item.recoveryStatus ?? "",
    rawData: item.rawData ?? {},
    linkedTrainingId: item.linkedTrainingId ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeBetaReadinessChecks = (items: Array<Partial<BetaReadinessCheck> & Pick<BetaReadinessCheck, "id" | "checkKey">>, userId: string): BetaReadinessCheck[] =>
  items.map((item) => ({
    id: item.id,
    checkedBy: item.checkedBy ?? userId,
    checkKey: item.checkKey,
    status: item.status ?? "manual",
    message: item.message ?? "",
    createdAt: item.createdAt ?? now(),
  }));

const normalizeBetaFeedback = (items: Array<Partial<BetaFeedback> & Pick<BetaFeedback, "id" | "title">>, userId: string): BetaFeedback[] =>
  items.map((item) => ({
    id: item.id,
    userId: item.userId ?? userId,
    clubId: item.clubId ?? "",
    userRole: item.userRole ?? "athlete",
    appVersion: item.appVersion ?? "4.0.0-beta",
    category: item.category ?? "Sonstiges",
    priority: item.priority ?? "normal",
    title: item.title,
    description: item.description ?? "",
    pagePath: item.pagePath ?? "",
    deviceInfo: item.deviceInfo ?? "",
    browserInfo: item.browserInfo ?? "",
    status: item.status ?? "open",
    adminNote: item.adminNote ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
    deletedAt: item.deletedAt ?? "",
  }));

const normalizeBetaTesters = (items: Array<Partial<BetaTester> & Pick<BetaTester, "id" | "userId">>): BetaTester[] =>
  items.map((item) => ({
    id: item.id,
    userId: item.userId,
    clubId: item.clubId ?? "",
    testerRole: item.testerRole ?? "athlete",
    status: item.status ?? "active",
    invitedAt: item.invitedAt ?? now(),
    lastSeenAt: item.lastSeenAt ?? "",
    notes: item.notes ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeClubMaterial = (items: Array<Partial<ClubMaterial> & Pick<ClubMaterial, "id" | "name">>): ClubMaterial[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    inventoryNumber: item.inventoryNumber ?? "",
    category: item.category ?? "Vereinsmaterial",
    name: item.name,
    condition: item.condition ?? "bereit",
    ownerUserId: item.ownerUserId ?? "",
    ownerName: item.ownerName ?? "",
    photoUrl: item.photoUrl ?? "",
    lastInspectionDate: item.lastInspectionDate ?? "",
    remark: item.remark ?? "",
    status: item.status ?? "active",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeClubBoats = (items: Array<Partial<ClubBoat> & Pick<ClubBoat, "id">>): ClubBoat[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    manufacturer: item.manufacturer ?? "",
    model: item.model ?? "",
    boatClass: item.boatClass ?? "K1",
    lengthCm: item.lengthCm ?? 0,
    weightKg: item.weightKg ?? 0,
    buildYear: item.buildYear ?? 0,
    ownerUserId: item.ownerUserId ?? "",
    ownerName: item.ownerName ?? "",
    isClubBoat: Boolean(item.isClubBoat ?? true),
    linkedAthleteIds: Array.isArray(item.linkedAthleteIds) ? item.linkedAthleteIds : [],
    status: item.status ?? "active",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeClubEvents = (items: Array<Partial<ClubEvent> & Pick<ClubEvent, "id" | "title" | "date">>): ClubEvent[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    title: item.title,
    date: item.date,
    time: item.time ?? "",
    category: item.category ?? "training",
    groupId: item.groupId ?? "",
    trainerUserId: item.trainerUserId ?? "",
    athleteUserId: item.athleteUserId ?? "",
    note: item.note ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeClubDocuments = (items: Array<Partial<ClubDocument> & Pick<ClubDocument, "id" | "title">>): ClubDocument[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    folder: item.folder ?? "Formulare",
    title: item.title,
    fileName: item.fileName ?? "",
    fileUrl: item.fileUrl ?? "",
    mimeType: item.mimeType ?? "",
    visibleForRoles: Array.isArray(item.visibleForRoles) ? item.visibleForRoles : ["coach", "teamAdmin", "clubAdmin", "admin"],
    uploadedByUserId: item.uploadedByUserId ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeClubMessages = (items: Array<Partial<ClubMessage> & Pick<ClubMessage, "id" | "title">>): ClubMessage[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    senderUserId: item.senderUserId ?? "",
    audience: item.audience ?? "club",
    groupId: item.groupId ?? "",
    recipientUserId: item.recipientUserId ?? "",
    title: item.title,
    body: item.body ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeClubSettings = (items: Array<Partial<ClubSettings> & Pick<ClubSettings, "clubId">>): ClubSettings[] =>
  items.map((item) => ({
    clubId: item.clubId,
    logoUrl: item.logoUrl ?? "",
    primaryColor: item.primaryColor ?? "#00B4D8",
    secondaryColor: item.secondaryColor ?? "#0077B6",
    address: item.address ?? "",
    homepage: item.homepage ?? "",
    contactName: item.contactName ?? "",
    contactEmail: item.contactEmail ?? "",
    clubNumber: item.clubNumber ?? "",
    imprint: item.imprint ?? "",
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeDirectMessages = (items: Array<Partial<DirectMessage> & Pick<DirectMessage, "id" | "message">>): DirectMessage[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    senderId: item.senderId ?? "",
    receiverId: item.receiverId ?? "",
    message: item.message,
    isRead: Boolean(item.isRead),
    readAt: item.readAt ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
    deletedAt: item.deletedAt ?? "",
  }));

const normalizeGroupMessages = (items: Array<Partial<GroupMessage> & Pick<GroupMessage, "id" | "message">>): GroupMessage[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    groupId: item.groupId ?? "",
    senderId: item.senderId ?? "",
    message: item.message,
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
    deletedAt: item.deletedAt ?? "",
  }));

const normalizeClubPosts = (items: Array<Partial<ClubPost> & Pick<ClubPost, "id" | "title">>): ClubPost[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    authorId: item.authorId ?? "",
    title: item.title,
    content: item.content ?? "",
    category: item.category ?? "info",
    priority: item.priority ?? "normal",
    targetType: item.targetType ?? "club",
    targetGroupId: item.targetGroupId ?? "",
    targetUserId: item.targetUserId ?? "",
    expiresAt: item.expiresAt ?? "",
    isPinned: Boolean(item.isPinned),
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
    deletedAt: item.deletedAt ?? "",
  }));

const normalizeTasks = (items: Array<Partial<TeamTask> & Pick<TeamTask, "id" | "title">>): TeamTask[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    createdBy: item.createdBy ?? "",
    title: item.title,
    description: item.description ?? "",
    taskType: item.taskType ?? "general",
    priority: item.priority ?? "normal",
    dueDate: item.dueDate ?? "",
    relatedTrainingId: item.relatedTrainingId ?? "",
    relatedCompetitionId: item.relatedCompetitionId ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
    deletedAt: item.deletedAt ?? "",
  }));

const normalizeTaskAssignments = (items: Array<Partial<TeamTaskAssignment> & Pick<TeamTaskAssignment, "id" | "taskId">>): TeamTaskAssignment[] =>
  items.map((item) => ({
    id: item.id,
    taskId: item.taskId,
    assignedTo: item.assignedTo ?? "",
    status: item.status ?? "open",
    completedAt: item.completedAt ?? "",
    responseNote: item.responseNote ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeTrainingAttendance = (items: Array<Partial<TrainingAttendance> & Pick<TrainingAttendance, "id" | "trainingId">>): TrainingAttendance[] =>
  items.map((item) => ({
    id: item.id,
    trainingId: item.trainingId,
    athleteId: item.athleteId ?? "",
    clubId: item.clubId ?? "",
    groupId: item.groupId ?? "",
    status: item.status ?? "pending",
    reason: item.reason ?? "",
    note: item.note ?? "",
    respondedAt: item.respondedAt ?? "",
    createdAt: item.createdAt ?? now(),
    updatedAt: item.updatedAt ?? now(),
  }));

const normalizeFileAttachments = (items: Array<Partial<FileAttachment> & Pick<FileAttachment, "id" | "fileName">>): FileAttachment[] =>
  items.map((item) => ({
    id: item.id,
    clubId: item.clubId ?? "",
    ownerId: item.ownerId ?? "",
    relatedType: item.relatedType ?? "training",
    relatedId: item.relatedId ?? "",
    fileName: item.fileName,
    filePath: item.filePath ?? "",
    fileType: item.fileType ?? "",
    fileSize: item.fileSize ?? 0,
    createdAt: item.createdAt ?? now(),
    deletedAt: item.deletedAt ?? "",
  }));

const normalizeDataShape = (data: PaddleMotionData): PaddleMotionData => ({
  ...data,
  journal: Array.isArray(data.journal) ? normalizeJournalEntries(data.journal) : [],
  material: normalizeMaterialItems(data.material),
  goals: Array.isArray(data.goals) ? normalizeSeasonGoals(data.goals, data.athlete.id, data.activeUserId) : [],
  personalBests: Array.isArray(data.personalBests) ? normalizePersonalBests(data.personalBests) : [],
  resultImports: Array.isArray(data.resultImports) ? normalizeResultImports(data.resultImports, data.activeUserId) : [],
  externalConnections: Array.isArray(data.externalConnections) ? normalizeExternalConnections(data.externalConnections, data.activeUserId) : [],
  externalTrainingSessions: Array.isArray(data.externalTrainingSessions) ? normalizeExternalTrainingSessions(data.externalTrainingSessions, data.activeUserId) : [],
  betaReadinessChecks: Array.isArray(data.betaReadinessChecks) ? normalizeBetaReadinessChecks(data.betaReadinessChecks, data.activeUserId) : [],
  betaFeedback: Array.isArray(data.betaFeedback) ? normalizeBetaFeedback(data.betaFeedback, data.activeUserId) : [],
  betaTesters: Array.isArray(data.betaTesters) ? normalizeBetaTesters(data.betaTesters) : [],
  coachAthletes: Array.isArray(data.coachAthletes) ? normalizeCoachAthletes(data.coachAthletes, data.athlete.club, "") : [],
  coachGroups: Array.isArray(data.coachGroups) ? normalizeCoachGroups(data.coachGroups, "") : [],
  trainingTemplates: Array.isArray(data.trainingTemplates) ? normalizeTrainingTemplates(data.trainingTemplates, data.activeUserId, data.athlete.club) : [],
  trainingFeedback: Array.isArray(data.trainingFeedback) ? normalizeTrainingFeedback(data.trainingFeedback) : [],
  notifications: Array.isArray(data.notifications) ? normalizeNotifications(data.notifications, data.activeUserId) : [],
  smartCoachRecommendations: Array.isArray(data.smartCoachRecommendations) ? normalizeSmartCoachRecommendations(data.smartCoachRecommendations, data.activeUserId) : [],
  clubMaterial: Array.isArray(data.clubMaterial) ? normalizeClubMaterial(data.clubMaterial) : [],
  clubBoats: Array.isArray(data.clubBoats) ? normalizeClubBoats(data.clubBoats) : [],
  clubEvents: Array.isArray(data.clubEvents) ? normalizeClubEvents(data.clubEvents) : [],
  clubDocuments: Array.isArray(data.clubDocuments) ? normalizeClubDocuments(data.clubDocuments) : [],
  clubMessages: Array.isArray(data.clubMessages) ? normalizeClubMessages(data.clubMessages) : [],
  clubSettings: Array.isArray(data.clubSettings) ? normalizeClubSettings(data.clubSettings) : [],
  directMessages: Array.isArray(data.directMessages) ? normalizeDirectMessages(data.directMessages) : [],
  groupMessages: Array.isArray(data.groupMessages) ? normalizeGroupMessages(data.groupMessages) : [],
  clubPosts: Array.isArray(data.clubPosts) ? normalizeClubPosts(data.clubPosts) : [],
  tasks: Array.isArray(data.tasks) ? normalizeTasks(data.tasks) : [],
  taskAssignments: Array.isArray(data.taskAssignments) ? normalizeTaskAssignments(data.taskAssignments) : [],
  trainingAttendance: Array.isArray(data.trainingAttendance) ? normalizeTrainingAttendance(data.trainingAttendance) : [],
  fileAttachments: Array.isArray(data.fileAttachments) ? normalizeFileAttachments(data.fileAttachments) : [],
  academyCategories: Array.isArray(data.academyCategories) && data.academyCategories.length > 0 ? data.academyCategories : academyInitialData.academyCategories,
  academyCourses: Array.isArray(data.academyCourses) && data.academyCourses.length > 0 ? data.academyCourses : academyInitialData.academyCourses,
  academyLessons: Array.isArray(data.academyLessons) && data.academyLessons.length > 0 ? data.academyLessons : academyInitialData.academyLessons,
  academyContentBlocks: Array.isArray(data.academyContentBlocks) && data.academyContentBlocks.length > 0 ? data.academyContentBlocks : academyInitialData.academyContentBlocks,
  academyLearningPaths: Array.isArray(data.academyLearningPaths) && data.academyLearningPaths.length > 0 ? data.academyLearningPaths : academyInitialData.academyLearningPaths,
  academyLearningPathItems: Array.isArray(data.academyLearningPathItems) && data.academyLearningPathItems.length > 0 ? data.academyLearningPathItems : academyInitialData.academyLearningPathItems,
  academyProgress: Array.isArray(data.academyProgress) ? data.academyProgress : [],
  academyAssignments: Array.isArray(data.academyAssignments) ? data.academyAssignments : [],
  academyQuizzes: Array.isArray(data.academyQuizzes) && data.academyQuizzes.length > 0 ? data.academyQuizzes : academyInitialData.academyQuizzes,
  academyQuizQuestions: Array.isArray(data.academyQuizQuestions) && data.academyQuizQuestions.length > 0 ? data.academyQuizQuestions : academyInitialData.academyQuizQuestions,
  academyQuizAttempts: Array.isArray(data.academyQuizAttempts) ? data.academyQuizAttempts : [],
  academyFavorites: Array.isArray(data.academyFavorites) ? data.academyFavorites : [],
  academyMedia: Array.isArray(data.academyMedia) ? data.academyMedia : [],
});

const normalizeSeasonGoals = (
  items: Array<Partial<SeasonGoal> & Pick<SeasonGoal, "id" | "title">>,
  athleteId: string,
  userId: string,
): SeasonGoal[] =>
  items.map((goal) => ({
    id: goal.id,
    athleteId: goal.athleteId ?? athleteId,
    ownerUserId: goal.ownerUserId ?? userId,
    assignedByUserId: goal.assignedByUserId ?? userId,
    title: goal.title,
    description: goal.description ?? "",
    category: goal.category ?? "personal",
    metric: goal.metric ?? "manual",
    direction: goal.direction ?? "over",
    targetValue: goal.targetValue ?? 1,
    unit: goal.unit ?? "",
    startDate: goal.startDate ?? now().slice(0, 10),
    dueDate: goal.dueDate ?? "",
    status: goal.status ?? "active",
    priority: goal.priority ?? "medium",
    currentValueOverride: goal.currentValueOverride ?? "",
    coachNote: goal.coachNote ?? "",
    athleteNote: goal.athleteNote ?? "",
    createdAt: goal.createdAt ?? now(),
    updatedAt: goal.updatedAt ?? now(),
  }));

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

const normalizeComparable = (value: string): string => normalizeBrandValue(value).trim().toLowerCase();

const splitDisplayName = (displayName: string): { firstName: string; lastName: string } => {
  const [firstName = "", ...lastNameParts] = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
};

const getRoleForEmail = (email: string, fallback: UserRole = "athlete"): UserRole =>
  normalizeEmail(email) === ADMIN_EMAIL ? "admin" : fallback;

const uniqueRoles = (roles: UserRole[]): UserRole[] => [...new Set(roles)];

const getRolesForEmail = (email: string, fallback: UserRole[] = ["athlete"]): UserRole[] =>
  normalizeEmail(email) === ADMIN_EMAIL ? ["admin"] : uniqueRoles(fallback.filter((role) => role !== "admin"));

const getPrimaryRole = (roles: UserRole[]): UserRole => {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("clubAdmin")) return "clubAdmin";
  if (roles.includes("teamAdmin")) return "teamAdmin";
  if (roles.includes("coach")) return "coach";
  return "athlete";
};

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

const normalizeAuthUser = (user: AuthUser, inferRolesFromEmail = true): AuthUser => {
  const fallbackRoles = uniqueRoles(Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role ?? "athlete"]);
  const roles = inferRolesFromEmail ? getRolesForEmail(user.email, fallbackRoles) : fallbackRoles;

  return {
    ...user,
    email: normalizeEmail(user.email),
    firstName: user.firstName ?? splitDisplayName(user.displayName).firstName,
    lastName: user.lastName ?? splitDisplayName(user.displayName).lastName,
    clubId: user.clubId ?? "",
    club: normalizeBrandValue(user.club ?? ""),
    trainingGroupId: user.trainingGroupId ?? "",
    coachId: user.coachId ?? "",
    status: user.status ?? "active",
    role: inferRolesFromEmail ? getRoleForEmail(user.email, getPrimaryRole(roles)) : getPrimaryRole(roles),
    roles,
    updatedAt: user.updatedAt ?? now(),
  };
};

export const loadUsers = (): AuthUser[] => {
  const value = parseStoredData(readStorage(USERS_KEY));
  const users = Array.isArray(value) ? value.filter(isAuthUser).map((user) => normalizeAuthUser(user)) : [];
  if (users.length > 0) {
    saveUsers(users);
  }
  return users;
};

const saveUsers = (users: AuthUser[]): void => {
  writeStorage(USERS_KEY, JSON.stringify(users));
};

export const cacheCloudAuthUsers = (users: AuthUser[]): void => {
  saveUsers(users.map((user) => normalizeAuthUser(user, false)));
};

export const clearCachedAuthUser = (userId: string): void => {
  saveUsers(loadUsers().filter((user) => user.userId !== userId));
};

export const clearCachedUserData = (userId: string): void => {
  removeStorage(dataKey(userId));
};

const isClub = (value: unknown): value is Club => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Club>;
  return typeof candidate.clubId === "string" && typeof candidate.name === "string";
};

const normalizeClub = (club: Club): Club => ({
  clubId: club.clubId,
  name: normalizeBrandValue(club.name ?? ""),
  shortName: club.shortName ?? "",
  city: club.city ?? "",
  contactName: club.contactName ?? "",
  contactEmail: club.contactEmail ?? "",
  website: club.website ?? "",
  logoUrl: club.logoUrl ?? "",
  primaryColor: club.primaryColor ?? "#00B4D8",
  secondaryColor: club.secondaryColor ?? "#0077B6",
  status: club.status ?? "active",
  createdAt: club.createdAt ?? now(),
  updatedAt: club.updatedAt ?? now(),
});

export const loadClubs = (): Club[] => {
  const value = parseStoredData(readStorage(CLUBS_KEY));
  const clubs = Array.isArray(value) ? value.filter(isClub).map(normalizeClub) : [];
  if (clubs.length > 0) saveClubs(clubs);
  return clubs;
};

const saveClubs = (clubs: Club[]): void => {
  writeStorage(CLUBS_KEY, JSON.stringify(clubs));
};

export const cacheCloudClubs = (clubs: Club[]): void => {
  saveClubs(clubs.map(normalizeClub));
};

export const upsertClub = (input: ClubInput): Club[] => {
  const timestamp = now();
  const clubs = loadClubs();
  const normalizedInputName = normalizeComparable(input.name);
  const existing = input.clubId
    ? clubs.find((club) => club.clubId === input.clubId)
    : clubs.find((club) => normalizeComparable(club.name) === normalizedInputName);
  const club: Club = {
    clubId: existing?.clubId ?? input.clubId ?? createId("club"),
    name: normalizeBrandValue(input.name.trim()),
    shortName: input.shortName.trim(),
    city: input.city.trim(),
    contactName: input.contactName?.trim() ?? "",
    contactEmail: input.contactEmail?.trim() ?? "",
    website: input.website?.trim() ?? "",
    logoUrl: input.logoUrl?.trim() ?? "",
    primaryColor: input.primaryColor?.trim() ?? "#00B4D8",
    secondaryColor: input.secondaryColor?.trim() ?? "#0077B6",
    status: input.status,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  const nextClubs = existing ? clubs.map((item) => (item.clubId === club.clubId ? club : item)) : [club, ...clubs];
  saveClubs(nextClubs);
  if (existing) {
    const users = loadUsers().map((user) =>
      user.clubId === club.clubId || normalizeComparable(user.club) === normalizeComparable(existing.name)
        ? { ...user, clubId: club.clubId, club: club.name, updatedAt: timestamp }
        : user,
    );
    saveUsers(users);
  }
  return nextClubs;
};

export const deleteClub = (clubId: string): Club[] => {
  const clubs = loadClubs().filter((club) => club.clubId !== clubId);
  saveClubs(clubs);
  return clubs;
};

const isClubRequest = (value: unknown): value is ClubRequest => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ClubRequest>;
  return typeof candidate.requestId === "string" && typeof candidate.name === "string";
};

const normalizeClubRequest = (request: ClubRequest): ClubRequest => ({
  requestId: request.requestId,
  requestedByUserId: request.requestedByUserId ?? "",
  name: normalizeBrandValue(request.name ?? ""),
  shortName: request.shortName ?? "",
  city: request.city ?? "",
  contactName: request.contactName ?? "",
  contactEmail: request.contactEmail ?? "",
  website: request.website ?? "",
  status: request.status ?? "open",
  createdAt: request.createdAt ?? now(),
  reviewedAt: request.reviewedAt ?? "",
  reviewedBy: request.reviewedBy ?? "",
});

const saveClubRequests = (requests: ClubRequest[]): void => {
  writeStorage(CLUB_REQUESTS_KEY, JSON.stringify(requests));
};

const ensureClubRequestsForLegacyUsers = (requests: ClubRequest[]): ClubRequest[] => {
  const clubs = loadClubs();
  const existingNames = new Set([
    ...clubs.map((club) => normalizeComparable(club.name)),
    ...requests.map((request) => normalizeComparable(request.name)),
  ]);
  const timestamp = now();
  const generated = loadUsers()
    .filter((user) => user.club && !existingNames.has(normalizeComparable(user.club)))
    .map((user) => {
      existingNames.add(normalizeComparable(user.club));
      return {
        requestId: createId("club-request"),
        requestedByUserId: user.userId,
        name: user.club,
        shortName: user.club.slice(0, 4).toUpperCase(),
        city: "",
        contactName: "",
        contactEmail: "",
        website: "",
        status: "open" as ClubRequestStatus,
        createdAt: timestamp,
        reviewedAt: "",
        reviewedBy: "",
      };
    });

  return generated.length > 0 ? [...generated, ...requests] : requests;
};

export const loadClubRequests = (): ClubRequest[] => {
  const value = parseStoredData(readStorage(CLUB_REQUESTS_KEY));
  const stored = Array.isArray(value) ? value.filter(isClubRequest).map(normalizeClubRequest) : [];
  const requests = ensureClubRequestsForLegacyUsers(stored);
  if (requests.length > 0) saveClubRequests(requests);
  return requests;
};

export const cacheCloudClubRequests = (requests: ClubRequest[]): void => {
  saveClubRequests(requests.map(normalizeClubRequest));
};

export const createClubRequest = (input: ClubRequestInput): ClubRequest => {
  const existing = loadClubRequests();
  const existingRequest = existing.find((request) => normalizeComparable(request.name) === normalizeComparable(input.name));
  if (existingRequest) return existingRequest;

  const timestamp = now();
  const request: ClubRequest = {
    requestId: createId("club-request"),
    requestedByUserId: input.requestedByUserId,
    name: normalizeBrandValue(input.name.trim()),
    shortName: input.shortName.trim(),
    city: input.city.trim(),
    contactName: input.contactName?.trim() ?? "",
    contactEmail: input.contactEmail?.trim() ?? "",
    website: input.website?.trim() ?? "",
    status: "open",
    createdAt: timestamp,
    reviewedAt: "",
    reviewedBy: "",
  };
  saveClubRequests([request, ...existing]);
  return request;
};

export const reviewClubRequest = (
  requestId: string,
  status: Exclude<ClubRequestStatus, "open">,
  reviewedBy: string,
  clubPatch?: Partial<ClubInput>,
): { requests: ClubRequest[]; clubs: Club[] } => {
  const timestamp = now();
  let acceptedClubId = "";
  let acceptedClubName = "";
  const requests = loadClubRequests().map((request) => {
    if (request.requestId !== requestId) return request;
    if (status === "approved") {
      const clubs = upsertClub({
        name: clubPatch?.name ?? request.name,
        shortName: clubPatch?.shortName ?? request.shortName,
        city: clubPatch?.city ?? request.city,
        contactName: clubPatch?.contactName ?? request.contactName,
        contactEmail: clubPatch?.contactEmail ?? request.contactEmail,
        website: clubPatch?.website ?? request.website,
        logoUrl: clubPatch?.logoUrl ?? "",
        primaryColor: clubPatch?.primaryColor ?? "#00B4D8",
        secondaryColor: clubPatch?.secondaryColor ?? "#0077B6",
        status: clubPatch?.status ?? "active",
      });
      const acceptedName = clubPatch?.name ?? request.name;
      const acceptedClub = clubs.find((club) => normalizeComparable(club.name) === normalizeComparable(acceptedName)) ?? clubs[0];
      acceptedClubId = acceptedClub?.clubId ?? "";
      acceptedClubName = acceptedClub?.name ?? "";
    }
    return { ...request, status, reviewedAt: timestamp, reviewedBy };
  });
  saveClubRequests(requests);
  if (acceptedClubId && acceptedClubName) {
    const users = loadUsers().map((user) =>
      normalizeComparable(user.club) === normalizeComparable(acceptedClubName)
        ? { ...user, clubId: acceptedClubId, club: acceptedClubName, updatedAt: timestamp }
        : user,
    );
    saveUsers(users);
  }
  return { requests, clubs: loadClubs() };
};

export const loadInvitationCodes = (): InvitationCode[] => {
  const value = parseStoredData(readStorage(INVITATION_CODES_KEY));
  const codes = Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map(normalizeInvitationCode)
        .filter((item): item is InvitationCode => Boolean(item))
    : [];

  if (codes.length > 0) {
    saveInvitationCodes(codes);
  }
  return codes;
};

const saveInvitationCodes = (codes: InvitationCode[]): void => {
  writeStorage(INVITATION_CODES_KEY, JSON.stringify(codes));
};

const normalizeInvitationStatus = (invite: Record<string, unknown>, expiresAt: string): InvitationCode["status"] => {
  const status = invite.status;
  if (status === "offen" || status === "angenommen" || status === "abgelaufen") {
    if (status === "offen" && new Date(expiresAt).getTime() < Date.now()) {
      return "abgelaufen";
    }
    return status;
  }

  if (typeof invite.usedByUserId === "string" && invite.usedByUserId) {
    return "angenommen";
  }

  return new Date(expiresAt).getTime() < Date.now() ? "abgelaufen" : "offen";
};

const normalizeInvitationRole = (role: unknown): InvitationRole =>
  role === "coach" ? "coach" : "athlete";

const normalizeInvitationCode = (invite: Record<string, unknown>): InvitationCode | null => {
  const invitationCode = typeof invite.invitationCode === "string"
    ? invite.invitationCode
    : typeof invite.code === "string"
      ? invite.code
      : "";

  if (!invitationCode) {
    return null;
  }

  const createdAt = typeof invite.createdAt === "string" ? invite.createdAt : now();
  const expiresAt = typeof invite.expiresAt === "string"
    ? invite.expiresAt
    : new Date(new Date(createdAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  return {
    invitationId: typeof invite.invitationId === "string" ? invite.invitationId : typeof invite.id === "string" ? invite.id : createId("invite"),
    firstName: typeof invite.firstName === "string" ? invite.firstName : "",
    lastName: typeof invite.lastName === "string" ? invite.lastName : "",
    email: typeof invite.email === "string" ? normalizeEmail(invite.email) : "",
    club: typeof invite.club === "string" ? normalizeBrandValue(invite.club) : "",
    role: normalizeInvitationRole(invite.role),
    trainingGroupId: typeof invite.trainingGroupId === "string" ? invite.trainingGroupId : "",
    coachId: typeof invite.coachId === "string" ? invite.coachId : "",
    invitationCode: invitationCode.toUpperCase(),
    status: normalizeInvitationStatus(invite, expiresAt),
    expiresAt,
    createdByUserId: typeof invite.createdByUserId === "string" ? invite.createdByUserId : "",
    acceptedByUserId: typeof invite.acceptedByUserId === "string" ? invite.acceptedByUserId : typeof invite.usedByUserId === "string" ? invite.usedByUserId : "",
    createdAt,
    acceptedAt: typeof invite.acceptedAt === "string" ? invite.acceptedAt : typeof invite.usedAt === "string" ? invite.usedAt : "",
  };
};

const generateInvitationCode = (role: InvitationRole): string =>
  `${role.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const createUserInvitation = (input: InviteUserInput): InvitationCode => {
  const timestamp = now();
  const invitation: InvitationCode = {
    invitationId: createId("invite"),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: normalizeEmail(input.email),
    club: normalizeBrandValue(input.club.trim()),
    role: input.role,
    trainingGroupId: input.trainingGroupId,
    coachId: input.coachId,
    invitationCode: generateInvitationCode(input.role),
    status: "offen",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdByUserId: input.createdByUserId,
    acceptedByUserId: "",
    createdAt: timestamp,
    acceptedAt: "",
  };

  saveInvitationCodes([invitation, ...loadInvitationCodes()]);
  return invitation;
};

export const updateAuthUserRole = (userId: string, role: UserRole): AuthUser[] => {
  const users = loadUsers().map((user) =>
    user.userId === userId
      ? {
          ...user,
          roles: getRolesForEmail(user.email, [role]),
          role: getRoleForEmail(user.email, role === "admin" ? "athlete" : role),
          updatedAt: now(),
        }
      : user,
  );
  saveUsers(users);
  return users;
};

export const updateAuthUserStatus = (userId: string, status: UserStatus): AuthUser[] => {
  const users = loadUsers().map((user) =>
    user.userId === userId
      ? {
          ...user,
          status,
          updatedAt: now(),
        }
      : user,
  );
  saveUsers(users);
  return users;
};

export const updateAuthUserProfileFields = (
  userId: string,
  fields: Partial<Pick<AuthUser, "firstName" | "lastName" | "clubId" | "club" | "trainingGroupId" | "coachId">>,
): AuthUser[] => {
  const users = loadUsers().map((user) =>
    user.userId === userId
      ? {
          ...user,
          ...fields,
          displayName: `${fields.firstName ?? user.firstName} ${fields.lastName ?? user.lastName}`.trim() || user.displayName,
          updatedAt: now(),
        }
      : user,
  );
  saveUsers(users);
  return users;
};

export const deleteAuthUser = (userId: string): AuthUser[] => {
  const users = loadUsers().filter((user) => user.userId !== userId);
  saveUsers(users);
  if (loadSession()?.userId === userId) {
    clearSession();
  }
  return users;
};

const isTrainerRequest = (value: unknown): value is TrainerRequest => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<TrainerRequest>;
  return typeof candidate.requestId === "string" && typeof candidate.userId === "string";
};

const normalizeTrainerRequest = (request: TrainerRequest): TrainerRequest => ({
  requestId: request.requestId,
  userId: request.userId,
  club: normalizeBrandValue(request.club ?? ""),
  message: request.message ?? "",
  hasLicense: Boolean(request.hasLicense),
  licenseNumber: request.licenseNumber ?? "",
  qualification: request.qualification ?? "",
  phone: request.phone ?? "",
  remark: request.remark ?? "",
  status: request.status ?? "open",
  createdAt: request.createdAt ?? now(),
  reviewedAt: request.reviewedAt ?? "",
  reviewedBy: request.reviewedBy ?? "",
});

export const loadTrainerRequests = (): TrainerRequest[] => {
  const value = parseStoredData(readStorage(TRAINER_REQUESTS_KEY));
  const requests = Array.isArray(value) ? value.filter(isTrainerRequest).map(normalizeTrainerRequest) : [];
  if (requests.length > 0) {
    saveTrainerRequests(requests);
  }
  return requests;
};

const saveTrainerRequests = (requests: TrainerRequest[]): void => {
  writeStorage(TRAINER_REQUESTS_KEY, JSON.stringify(requests));
};

export const cacheCloudTrainerRequests = (requests: TrainerRequest[]): void => {
  saveTrainerRequests(requests.map(normalizeTrainerRequest));
};

export const createTrainerRequest = (input: TrainerRequestInput): TrainerRequest => {
  const existingRequests = loadTrainerRequests();
  const existingOpenRequest = existingRequests.find((request) => request.userId === input.userId && request.status === "open");

  if (existingOpenRequest) {
    return existingOpenRequest;
  }

  const timestamp = now();
  const request: TrainerRequest = {
    requestId: createId("trainer-request"),
    userId: input.userId,
    club: normalizeBrandValue(input.club.trim()),
    message: input.message.trim(),
    hasLicense: input.hasLicense,
    licenseNumber: input.licenseNumber.trim(),
    qualification: input.qualification.trim(),
    phone: input.phone.trim(),
    remark: input.remark.trim(),
    status: "open",
    createdAt: timestamp,
    reviewedAt: "",
    reviewedBy: "",
  };

  saveTrainerRequests([request, ...existingRequests]);
  return request;
};

export const reviewTrainerRequest = (
  requestId: string,
  status: Exclude<TrainerRequestStatus, "open">,
  reviewedBy: string,
): { requests: TrainerRequest[]; users: AuthUser[] } => {
  const timestamp = now();
  let targetUserId = "";
  const requests = loadTrainerRequests().map((request) => {
    if (request.requestId !== requestId) {
      return request;
    }

    targetUserId = request.userId;
    return {
      ...request,
      status,
      reviewedAt: timestamp,
      reviewedBy,
    };
  });

  saveTrainerRequests(requests);

  const users = status === "approved" && targetUserId
    ? loadUsers().map((user) => {
        if (user.userId !== targetUserId) {
          return user;
        }
        const roles = getRolesForEmail(user.email, ["coach"]);
        return {
          ...user,
          roles,
          role: getRoleForEmail(user.email, getPrimaryRole(roles)),
          updatedAt: timestamp,
        };
      })
    : loadUsers();

  saveUsers(users);
  return { requests, users };
};

export const loadSession = (): AuthSession | null => {
  const value = parseStoredData(readStorage(SESSION_KEY) ?? readStorage(SESSIONS_KEY));

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = (Array.isArray(value) ? value[0] : value) as Partial<AuthSession>;
  const users = loadUsers();
  const sessionUser = users.find((user) => user.userId === candidate.userId);

  if (typeof candidate.userId !== "string" || !sessionUser || sessionUser.status === "inactive") {
    return null;
  }

  return {
    userId: candidate.userId,
    token: typeof candidate.token === "string" ? candidate.token : createId("session"),
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : now(),
  };
};

const saveSession = (session: AuthSession): void => {
  writeStorage(SESSION_KEY, JSON.stringify(session));
  writeStorage(SESSIONS_KEY, JSON.stringify([session]));
};

export const clearSession = (): void => {
  removeStorage(SESSION_KEY);
  removeStorage(SESSIONS_KEY);
};

const createSession = (userId: string): AuthSession => {
  const session = {
    userId,
    token: createId("session"),
    createdAt: now(),
  };

  saveSession(session);
  return session;
};

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const passwordHasRecommendedShape = (password: string): boolean =>
  /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

export const registerLocalUser = (input: RegisterInput): AuthResult => {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = normalizeEmail(input.email);
  const clubs = loadClubs();
  const selectedClub = clubs.find((club) => club.clubId === input.clubId);
  const club = (selectedClub?.name ?? input.club).trim();
  const password = input.password.trim();
  const passwordRepeat = input.passwordRepeat.trim();

  if (firstName.length < 2) {
    return { ok: false, message: "Der Vorname braucht mindestens 2 Zeichen." };
  }

  if (lastName.length < 2) {
    return { ok: false, message: "Der Nachname braucht mindestens 2 Zeichen." };
  }

  if (!isValidEmail(email)) {
    return { ok: false, message: "Bitte gib eine gueltige E-Mail-Adresse ein." };
  }

  if (password.length < 8) {
    return { ok: false, message: "Das Passwort braucht mindestens 8 Zeichen." };
  }

  if (!passwordHasRecommendedShape(password)) {
    return { ok: false, message: "Nutze bitte Grossbuchstaben, Kleinbuchstaben und mindestens eine Zahl." };
  }

  if (password !== passwordRepeat) {
    return { ok: false, message: "Die Passwärter stimmen nicht überein." };
  }

  if (!club) {
    return { ok: false, message: "Bitte gib deinen Verein an." };
  }

  if (!input.privacyAccepted) {
    return { ok: false, message: "Bitte akzeptiere die Datenschutzbedingungen." };
  }

  const users = loadUsers();
  if (users.some((user) => user.email === email)) {
    return { ok: false, message: "Diese E-Mail ist bereits registriert." };
  }

  const timestamp = now();
  const roles = getRolesForEmail(email, ["athlete"]);
  const role = getRoleForEmail(email, getPrimaryRole(roles));
  const user: AuthUser = {
    userId: createId("user"),
    email,
    displayName: `${firstName} ${lastName}`.trim(),
    passwordHash: hashPassword(password),
    role,
    roles,
    firstName,
    lastName,
    clubId: selectedClub?.clubId ?? "",
    club: normalizeBrandValue(club),
    trainingGroupId: "",
    coachId: "",
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveUsers([...users, user]);
  if (input.suggestClub && !selectedClub) {
    createClubRequest({
      requestedByUserId: user.userId,
      name: club,
      shortName: club.slice(0, 4).toUpperCase(),
      city: "",
      contactEmail: email,
    });
  }
  const session = createSession(user.userId);
  return { ok: true, session, user };
};

export const acceptInvitationLocalUser = (input: InvitationAcceptInput): AuthResult => {
  const invitationCode = input.invitationCode.trim().toUpperCase();
  const password = input.password.trim();

  if (!invitationCode || !password) {
    return { ok: false, message: "Einladungscode und Passwort sind erforderlich." };
  }

  if (password.length < 4) {
    return { ok: false, message: "Das Passwort braucht mindestens 4 Zeichen." };
  }

  const codes = loadInvitationCodes();
  const invite = codes.find((code) => code.invitationCode.toUpperCase() === invitationCode);
  if (!invite || invite.status !== "offen") {
    return { ok: false, message: "Einladungscode ist ungueltig oder wurde bereits verwendet." };
  }

  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    saveInvitationCodes(codes.map((code) => code.invitationId === invite.invitationId ? { ...code, status: "abgelaufen" } : code));
    return { ok: false, message: "Diese Einladung ist abgelaufen." };
  }

  if (!invite.email || !invite.firstName) {
    return { ok: false, message: "Diese Einladung ist unvollständig. Bitte den Admin um eine neue Einladung." };
  }

  const email = normalizeEmail(invite.email);
  const users = loadUsers();
  if (users.some((user) => user.email === email)) {
    return { ok: false, message: "Diese E-Mail ist bereits registriert." };
  }

  const timestamp = now();
  const displayName = `${invite.firstName} ${invite.lastName}`.trim();
  const roles = getRolesForEmail(email, [invite.role]);

  const user: AuthUser = {
    userId: createId("user"),
    email,
    displayName,
    passwordHash: hashPassword(password),
    role: getRoleForEmail(email, getPrimaryRole(roles)),
    roles,
    firstName: invite.firstName,
    lastName: invite.lastName,
    clubId: "",
    club: invite.club,
    trainingGroupId: invite.trainingGroupId,
    coachId: invite.coachId,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveUsers([...users, user]);
  saveInvitationCodes(codes.map((code) =>
    code.invitationId === invite.invitationId
      ? {
          ...code,
          status: "angenommen",
          acceptedByUserId: user.userId,
          acceptedAt: timestamp,
        }
      : code,
  ));
  const session = createSession(user.userId);
  return { ok: true, session, user };
};

export const loginLocalUser = (input: LoginInput): AuthResult => {
  const email = normalizeEmail(input.email);
  const passwordHash = hashPassword(input.password.trim());
  const users = loadUsers();
  const user = users.find((item) => item.email === email);

  if (!user || user.passwordHash !== passwordHash) {
    return { ok: false, message: "E-Mail oder Passwort ist nicht korrekt." };
  }

  const normalizedUser = normalizeAuthUser(user);
  if (normalizedUser.status === "inactive") {
    return { ok: false, message: "Dieses Konto ist deaktiviert." };
  }

  saveUsers(users.map((item) => (item.userId === user.userId ? normalizedUser : item)));

  const session = createSession(normalizedUser.userId);
  return { ok: true, session, user: normalizedUser };
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
  const names = splitDisplayName(authUser.displayName);
  const firstName = authUser.firstName || names.firstName || "Athlet";
  const lastName = authUser.lastName || names.lastName;

  return {
    firstName,
    lastName,
    nickname: firstName,
    birthDate: "",
    gender: "keine_angabe",
    heightCm: 0,
    weightKg: 0,
    club: authUser.club,
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
        role: authUser.role,
        profile,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    athlete: {
      id: athleteId,
      name: profile.nickname || profile.firstName || authUser.displayName || "Athlet",
      club: profile.club,
      goals: [],
    },
    competitions: [],
    training: [],
    journal: [],
    material: [],
    plan: [],
    trainingTemplates: [],
    trainingFeedback: [],
    goals: [],
    personalBests: [],
    resultImports: [],
    externalConnections: [],
    externalTrainingSessions: [],
    betaReadinessChecks: [],
    betaFeedback: [],
    betaTesters: [],
    coachAthletes: [],
    coachGroups: [],
    notifications: [],
    smartCoachRecommendations: [],
    clubMaterial: [],
    clubBoats: [],
    clubEvents: [],
    clubDocuments: [],
    clubMessages: [],
    clubSettings: [],
    directMessages: [],
    groupMessages: [],
    clubPosts: [],
    tasks: [],
    taskAssignments: [],
    trainingAttendance: [],
    fileAttachments: [],
    ...academyInitialData,
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
    trainingTemplates: data.trainingTemplates ?? [],
    trainingFeedback: data.trainingFeedback ?? [],
    goals: data.goals ?? [],
    personalBests: data.personalBests ?? [],
    resultImports: data.resultImports ?? [],
    externalConnections: data.externalConnections ?? [],
    externalTrainingSessions: data.externalTrainingSessions ?? [],
    betaReadinessChecks: data.betaReadinessChecks ?? [],
    betaFeedback: data.betaFeedback ?? [],
    betaTesters: data.betaTesters ?? [],
    coachAthletes: data.coachAthletes ?? [],
    coachGroups: data.coachGroups ?? [],
    notifications: data.notifications ?? [],
    smartCoachRecommendations: data.smartCoachRecommendations ?? [],
    clubMaterial: data.clubMaterial ?? [],
    clubBoats: data.clubBoats ?? [],
    clubEvents: data.clubEvents ?? [],
    clubDocuments: data.clubDocuments ?? [],
    clubMessages: data.clubMessages ?? [],
    clubSettings: data.clubSettings ?? [],
    directMessages: data.directMessages ?? [],
    groupMessages: data.groupMessages ?? [],
    clubPosts: data.clubPosts ?? [],
    tasks: data.tasks ?? [],
    taskAssignments: data.taskAssignments ?? [],
    trainingAttendance: data.trainingAttendance ?? [],
    fileAttachments: data.fileAttachments ?? [],
    academyCategories: data.academyCategories ?? academyInitialData.academyCategories,
    academyCourses: data.academyCourses ?? academyInitialData.academyCourses,
    academyLessons: data.academyLessons ?? academyInitialData.academyLessons,
    academyContentBlocks: data.academyContentBlocks ?? academyInitialData.academyContentBlocks,
    academyLearningPaths: data.academyLearningPaths ?? academyInitialData.academyLearningPaths,
    academyLearningPathItems: data.academyLearningPathItems ?? academyInitialData.academyLearningPathItems,
    academyProgress: data.academyProgress ?? [],
    academyAssignments: data.academyAssignments ?? [],
    academyQuizzes: data.academyQuizzes ?? academyInitialData.academyQuizzes,
    academyQuizQuestions: data.academyQuizQuestions ?? academyInitialData.academyQuizQuestions,
    academyQuizAttempts: data.academyQuizAttempts ?? [],
    academyFavorites: data.academyFavorites ?? [],
    academyMedia: data.academyMedia ?? [],
  };
};

const normalizePlanEntries = (entries: LegacyPlanEntry[], athleteId: string, userId: string): PlanEntry[] =>
  entries.map((entry, index) => {
    const fallback = seedData.plan[index % seedData.plan.length] ?? seedData.plan[0];
    const date = entry.date ?? fallback.date;
    const oldType = entry.type ?? entry.trainingType ?? fallback.trainingType;

    return {
      id: entry.id ?? `plan-migrated-${index}`,
      ownerUserId: entry.ownerUserId ?? userId,
      athleteId: entry.athleteId ?? athleteId,
      clubId: entry.clubId ?? "",
      assignedType: entry.assignedType ?? (entry.assignedGroupId ? "group" : entry.assignedAthleteId ? "athlete" : "self"),
      assignedAthleteIds: Array.isArray(entry.assignedAthleteIds) ? entry.assignedAthleteIds : [entry.assignedAthleteId ?? entry.athleteId ?? athleteId].filter(Boolean),
      assignedGroupIds: Array.isArray(entry.assignedGroupIds) ? entry.assignedGroupIds : [entry.assignedGroupId ?? ""].filter(Boolean),
      title: entry.title ?? entry.trainingType ?? fallback.trainingType,
      date,
      weekday: entry.weekday ?? getWeekdayFromDate(date),
      time: entry.time ?? fallback.time,
      startTime: entry.startTime ?? entry.time ?? fallback.time,
      endTime: entry.endTime ?? "",
      durationMinutes: entry.durationMinutes ?? fallback.durationMinutes,
      area: entry.area ?? (oldType === "Pause" ? "Regeneration" : fallback.area),
      trainingType: entry.trainingType ?? fallback.trainingType,
      boatClass: entry.boatClass ?? (String(entry.trainingType ?? fallback.trainingType).includes("C1") ? "C1" : String(entry.trainingType ?? fallback.trainingType).includes("K1") ? "K1" : "none"),
      goal: entry.goal ?? entry.note ?? fallback.goal,
      focus: entry.focus ?? entry.goal ?? entry.note ?? fallback.goal,
      description: entry.description ?? "",
      intensity: entry.intensity ?? fallback.intensity,
      note: entry.note ?? "",
      notes: entry.notes ?? entry.note ?? "",
      status: entry.status ?? "planned",
      repeat: entry.repeat ?? "none",
      repeatUntil: entry.repeatUntil ?? "",
      createdByUserId: entry.createdByUserId ?? userId,
      assignedAthleteId: entry.assignedAthleteId ?? entry.athleteId ?? athleteId,
      assignedGroupId: entry.assignedGroupId ?? "",
      feedbackNote: entry.feedbackNote ?? "",
      deletedAt: entry.deletedAt ?? "",
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
  plan: normalizePlanEntries(data.plan ?? seedData.plan, data.athlete.id, data.activeUserId ?? data.users?.[0]?.id ?? ""),
  trainingFeedback: data.trainingFeedback ?? [],
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
    category: item.type === "Paddel" ? "Paddel" : item.type === "Boot" ? "Boot" : "Zubehör",
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
    plan: normalizePlanEntries(seedData.plan, athlete.id, "legacy-user"),
    trainingTemplates: [],
    trainingFeedback: [],
    goals: [],
    personalBests: [],
    resultImports: [],
    externalConnections: [],
    externalTrainingSessions: [],
    betaReadinessChecks: [],
    betaFeedback: [],
    betaTesters: [],
    coachAthletes: [],
    coachGroups: [],
    notifications: [],
    smartCoachRecommendations: [],
    clubMaterial: [],
    clubBoats: [],
    clubEvents: [],
    clubDocuments: [],
    clubMessages: [],
    clubSettings: [],
    directMessages: [],
    groupMessages: [],
    clubPosts: [],
    tasks: [],
    taskAssignments: [],
    trainingAttendance: [],
    fileAttachments: [],
    ...academyInitialData,
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
    role: "athlete",
    roles: ["athlete"],
    firstName: "Athlet",
    lastName: "",
    clubId: "",
    club: "",
    trainingGroupId: "",
    coachId: "",
    status: "active",
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
    role: authUser.role,
    profile: normalizeProfile({
      ...(user ?? fallback.users[0]).profile,
      firstName: (user ?? fallback.users[0]).profile.firstName || authUser.firstName,
      lastName: (user ?? fallback.users[0]).profile.lastName || authUser.lastName,
      club: (user ?? fallback.users[0]).profile.club || authUser.club,
    }),
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
      ownerUserId: entry.ownerUserId || authUser.userId,
      athleteId: athlete.id,
      clubId: entry.clubId || authUser.clubId,
      assignedAthleteId: entry.assignedAthleteId || athlete.id,
      assignedAthleteIds: entry.assignedAthleteIds.length > 0 ? entry.assignedAthleteIds : [athlete.id],
      createdByUserId: authUser.userId,
    })),
    trainingFeedback: normalized.trainingFeedback,
    goals: normalized.goals.map((goal) => ({
      ...goal,
      athleteId: athlete.id,
      ownerUserId: authUser.userId,
    })),
    notifications: normalized.notifications.map((notification) => ({
      ...notification,
      userId: authUser.userId,
    })),
    smartCoachRecommendations: normalized.smartCoachRecommendations.map((recommendation) => ({
      ...recommendation,
      ownerUserId: recommendation.ownerUserId || authUser.userId,
      createdForUserId: recommendation.createdForUserId || authUser.userId,
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
  const normalized = bindDataToUser(data, getAuthUser(userId));
  writeStorage(dataKey(userId), JSON.stringify(normalized));
  void writeLocalFirstCache(userId, normalized).catch(() => {
    // IndexedDB is an optimization. LocalStorage remains the synchronous startup cache.
  });
};
