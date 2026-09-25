import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, getSupabaseClient } from "../lib/supabase";
import { getSupabaseConfigMessage, isSupabaseConfigured } from "../lib/supabaseConfig";
import { isDevelopmentEnvironment } from "../lib/appEnvironment";
import { PROFILE_SYNC_RETRY_MESSAGE } from "./authMessages";
import {
  cacheCloudAuthUsers,
  cacheCloudClubRequests,
  cacheCloudClubs,
  cacheCloudTrainerRequests,
  clearCachedAuthUser,
  clearCachedUserData,
  clearSession,
  loadData,
  saveData,
  type LoginInput,
  type RegisterInput,
} from "../data/storage";
import type {
  AuthUser,
  Club,
  ClubRequest,
  CoachAthlete,
  CoachGroup,
  PaddleMotionData,
  TrainerRequest,
  User,
  UserProfile,
  UserRole,
} from "../domain/types";
import { buildCloudRoles, ensureCloudProfile, getCloudProfile, listCloudProfiles, type CloudProfile } from "../services/profileService";
import { listCloudClubRequests, listCloudClubs, type CloudClub, type CloudClubRequest } from "../services/clubService";
import { listCloudGroupMembers, listCloudTrainerRequests, listCloudTrainingGroups, type CloudGroupMember, type CloudTrainerRequest, type CloudTrainingGroup } from "../services/coachService";
import { listCloudFeedback, listCloudTraining } from "../services/trainingService";
import { listCloudJournalEntries } from "../services/journalService";
import { listCloudTrainingTemplates } from "../services/trainingTemplateService";
import { listCloudGoals } from "../services/goalService";
import { listCloudCompetitions } from "../services/competitionService";
import {
  listCloudBetaReadinessChecks,
  listCloudExternalConnections,
  listCloudExternalTrainingSessions,
  listCloudPersonalBests,
  listCloudResultImports,
} from "../services/resultsReadinessService";
import { listCloudBetaFeedback, listCloudBetaTesters } from "../services/betaService";
import { listCloudMaterials } from "../services/materialService";
import { getSyncQueueStats } from "../services/syncService";
import { getOfflineQueueDiagnostics, setOfflineQueueUser } from "../services/offlineQueueService";
import { cloudValueOrCached, didCloudReadFail, mapCloudRead, markCloudReadFailed } from "../services/cloudReadState";
import { backgroundSyncEngine } from "../services/backgroundSyncService";
import { classifyOptionalSyncError, classifySyncError, getFailedSyncMessage, getSyncErrorMessage, resolveCloudConnectionState, type SyncErrorCategory } from "../services/syncStatus";
import { listCloudNotifications } from "../services/notificationService";
import { listCloudSmartCoachRecommendations } from "../services/smartCoachService";
import {
  listCloudClubBoats,
  listCloudClubDocuments,
  listCloudClubEvents,
  listCloudClubMaterial,
  listCloudClubMessages,
  listCloudClubSettings,
} from "../services/clubPortalService";
import {
  listCloudClubPosts,
  listCloudDirectMessages,
  listCloudFileAttachments,
  listCloudGroupMessages,
  listCloudTaskAssignments,
  listCloudTasks,
  listCloudTrainingAttendance,
} from "../services/communicationService";
import {
  listCloudAcademyAssignments,
  listCloudAcademyCategories,
  listCloudAcademyContentBlocks,
  listCloudAcademyCourses,
  listCloudAcademyFavorites,
  listCloudAcademyLearningPathItems,
  listCloudAcademyLearningPaths,
  listCloudAcademyLessons,
  listCloudAcademyMedia,
  listCloudAcademyProgress,
  listCloudAcademyQuizAttempts,
  listCloudAcademyQuizQuestions,
  listCloudAcademyQuizzes,
} from "../services/academyService";
import { migrateLocalDataToCloud, syncDataSnapshotToCloud } from "../services/migrationService";
import { subscribeToCoachClub, subscribeToNotifications, subscribeToUserTrainings, unsubscribeAll, type RealtimeConnectionState } from "../services/realtimeService";

export type CloudConnectionState = "connected" | "syncing" | "offline" | "pending" | "limited" | "disabled" | "error";

export type CloudAuthResult = { ok: true; message?: string } | { ok: false; message: string };

type AuthContextValue = {
  session: Session | null;
  currentUser: SupabaseUser | null;
  passwordRecovery: boolean;
  profile: CloudProfile | null;
  roles: UserRole[];
  club: Club | null;
  data: PaddleMotionData | null;
  setData: (updater: PaddleMotionData | ((current: PaddleMotionData | null) => PaddleMotionData | null)) => void;
  loading: boolean;
  cloudStatus: CloudConnectionState;
  syncCount: number;
  pendingSyncCount: number;
  failedSyncCount: number;
  lastSyncAt: string;
  cloudMessage: string;
  profileSyncDiagnostics: ProfileSyncDiagnostics;
  signIn: (input: LoginInput) => Promise<CloudAuthResult>;
  signUp: (input: RegisterInput) => Promise<CloudAuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<CloudAuthResult>;
  updatePassword: (password: string) => Promise<CloudAuthResult>;
  cancelPasswordRecovery: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<CloudAuthResult>;
  refreshCloudData: () => Promise<void>;
};

export type ProfileSyncDiagnostics = {
  ownProfileFetch: "idle" | "ok" | "failed";
  profileDirectoryFetch: "idle" | "ok" | "failed";
  realtime: "idle" | RealtimeConnectionState;
  profileRowPresent: boolean;
  roleLoaded: boolean;
  clubLoaded: boolean;
  activeClubLoaded: boolean;
  profileWarningReason: string;
  partialSyncReason: string;
  lastErrorCode: string;
  lastErrorScope: string;
  lastErrorMessage: string;
  lastErrorStatus: string;
  lastSuccessAt: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const toLocalRole = (role: string): UserRole =>
  role === "Admin" ? "admin" : role === "ClubAdmin" ? "clubAdmin" : role === "Coach" ? "coach" : role === "TeamAdmin" ? "teamAdmin" : "athlete";

const describeCloudError = (error: unknown): string => {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === "string" ? record.message : "";
    const details = typeof record.details === "string" ? record.details : "";
    const hint = typeof record.hint === "string" ? record.hint : "";
    const code = typeof record.code === "string" ? record.code : "";
    return [code, message, details, hint].filter(Boolean).join(" | ") || JSON.stringify(record);
  }

  return String(error);
};

const isAuthRateLimitError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  const status = typeof record.status === "number" ? record.status : Number(record.status);
  const message = typeof record.message === "string" ? record.message.toLowerCase() : "";
  return status === 429 || message.includes("rate limit") || message.includes("email rate limit");
};

const logCloudError = (scope: string, error: unknown) => {
  console.error(`[Paddlio Cloud] ${scope} fehlgeschlagen: ${describeCloudError(error)}`, error);
};

const getAuthEmailRedirectTo = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const configuredRedirect = typeof import.meta.env.VITE_AUTH_REDIRECT_URL === "string" ? import.meta.env.VITE_AUTH_REDIRECT_URL.trim() : "";
  if (configuredRedirect) return configuredRedirect;
  if (isDevelopmentEnvironment) return "https://dev.paddlio.de/";
  return `${window.location.origin}${window.location.pathname}`;
};

const PASSWORD_RECOVERY_STORAGE_KEY = "paddlio-password-recovery";
const EMAIL_CONFIRMATION_STORAGE_KEY = "paddlio-email-confirmed";

const hasPasswordRecoveryUrlHint = (): boolean => {
  if (typeof window === "undefined") return false;
  const search = new URLSearchParams(window.location.search);
  const hashValue = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const hash = new URLSearchParams(hashValue);
  return search.get("type") === "recovery" || hash.get("type") === "recovery";
};

const hasEmailConfirmationUrlHint = (): boolean => {
  if (typeof window === "undefined") return false;
  const search = new URLSearchParams(window.location.search);
  const hashValue = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const hash = new URLSearchParams(hashValue);
  const type = search.get("type") ?? hash.get("type");
  return type === "signup" || type === "email_confirmation";
};

const clearAuthUrlParameters = () => {
  if (typeof window === "undefined") return;
  if (!window.location.search && !window.location.hash) return;
  window.history.replaceState(null, "", window.location.pathname);
};

let optionalCloudErrorCount = 0;
let optionalCloudErrorCategories = new Set<SyncErrorCategory>();
type SyncDiagnosticError = {
  scope: string;
  code: string;
  message: string;
  status: string;
  occurredAt: string;
};

let optionalCloudErrors: SyncDiagnosticError[] = [];

const getSafeErrorCode = (error: unknown): string => {
  if (!error || typeof error !== "object") return "unknown";
  const value = error as { code?: string | number; status?: string | number };
  return String(value.code ?? value.status ?? "unknown");
};

const redactDiagnosticText = (value: string): string => value
  .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
  .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[id]")
  .slice(0, 240);

const getSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return redactDiagnosticText(error.message);
  if (!error || typeof error !== "object") return redactDiagnosticText(String(error ?? ""));
  const value = error as { message?: unknown; details?: unknown; hint?: unknown };
  return redactDiagnosticText([value.message, value.details, value.hint].filter(Boolean).join(" "));
};

const getSafeErrorStatus = (error: unknown): string => {
  if (!error || typeof error !== "object") return "";
  const value = error as { status?: string | number; statusCode?: string | number };
  return String(value.status ?? value.statusCode ?? "");
};

const toSyncDiagnosticError = (scope: string, error: unknown): SyncDiagnosticError => ({
  scope,
  code: getSafeErrorCode(error),
  message: getSafeErrorMessage(error),
  status: getSafeErrorStatus(error),
  occurredAt: new Date().toISOString(),
});

const withTimeout = async <T,>(scope: string, promise: Promise<T>, timeoutMs = 15000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${scope} Timeout nach ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const loadOptionalCloudData = async <T,>(
  scope: string,
  loader: () => Promise<T>,
  fallback: T,
  categoryOverride?: SyncErrorCategory,
): Promise<T> => {
  try {
    return await withTimeout(scope, loader(), 12000);
  } catch (error) {
    optionalCloudErrorCount += 1;
    optionalCloudErrorCategories.add(classifyOptionalSyncError(scope, error, categoryOverride));
    optionalCloudErrors.push(toSyncDiagnosticError(scope, error));
    logCloudError(scope, error);
    return markCloudReadFailed(fallback);
  }
};

const getPrimaryRole = (roles: string[]): UserRole => {
  if (roles.includes("Admin")) return "admin";
  if (roles.includes("ClubAdmin")) return "clubAdmin";
  if (roles.includes("Coach")) return "coach";
  if (roles.includes("TeamAdmin")) return "teamAdmin";
  return "athlete";
};

const getCloudTruthRoles = (profile: Pick<CloudProfile, "email" | "roles">): CloudProfile["roles"] =>
  buildCloudRoles(profile.email, null, profile.roles.length > 0 ? profile.roles : ["Athlete"]);

const createFallbackProfile = (user: SupabaseUser): CloudProfile => {
  const metadata = user.user_metadata ?? {};
  const firstName = String(metadata.firstName ?? "");
  const lastName = String(metadata.lastName ?? "");
  const email = user.email ?? "";
  const now = new Date().toISOString();

  return {
    id: user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    display_name: `${firstName} ${lastName}`.trim() || email,
    club_id: null,
    roles: buildCloudRoles(email, metadata, ["Athlete"]),
    status: "active",
    avatar_url: null,
    age_category: null,
    boat_classes: ["K1"],
    paddle_side: null,
    profile_data: {},
    created_at: now,
    updated_at: now,
  };
};

const toAuthUser = (profile: CloudProfile, clubName = ""): AuthUser => {
  const cloudRoles = getCloudTruthRoles(profile);
  const roles = cloudRoles.map(toLocalRole);
  const displayName = profile.display_name || `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.email;
  return {
    userId: profile.id,
    email: profile.email,
    displayName,
    passwordHash: "",
    role: getPrimaryRole(cloudRoles),
    roles,
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    clubId: profile.club_id ?? "",
    club: clubName,
    trainingGroupId: "",
    coachId: "",
    status: profile.status === "active" ? "active" : "inactive",
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
};

const toClub = (club: CloudClub): Club => ({
  clubId: club.id,
  name: club.name,
  shortName: club.short_name ?? "",
  city: club.city ?? "",
  contactName: club.contact_name ?? "",
  contactEmail: club.contact_email ?? "",
  website: club.website ?? "",
  logoUrl: club.logo_url ?? "",
  primaryColor: club.primary_color ?? "#00B4D8",
  secondaryColor: club.secondary_color ?? "#0077B6",
  status: club.status,
  createdAt: club.created_at,
  updatedAt: club.updated_at,
});

const toTrainerRequest = (request: CloudTrainerRequest): TrainerRequest => ({
  requestId: request.id,
  userId: request.user_id ?? "",
  club: request.club_name ?? "",
  message: request.message ?? "",
  hasLicense: request.has_license,
  licenseNumber: request.license_number ?? "",
  qualification: request.qualification ?? "",
  phone: request.phone ?? "",
  remark: "",
  status: request.status,
  createdAt: request.created_at,
  reviewedAt: request.reviewed_at ?? "",
  reviewedBy: request.reviewed_by ?? "",
});

const toClubRequest = (request: CloudClubRequest): ClubRequest => ({
  requestId: request.id,
  requestedByUserId: request.requested_by ?? "",
  name: request.name,
  shortName: request.short_name ?? "",
  city: request.city ?? "",
  contactName: "",
  contactEmail: "",
  website: "",
  status: request.status,
  createdAt: request.created_at,
  reviewedAt: request.reviewed_at ?? "",
  reviewedBy: request.reviewed_by ?? "",
});

const toCoachGroup = (group: CloudTrainingGroup, members: CloudGroupMember[] = []): CoachGroup => ({
  id: group.id,
  groupId: group.id,
  clubId: group.club_id,
  coachUserId: group.coach_id ?? "",
  coachId: group.coach_id ?? "",
  name: group.name,
  description: group.description ?? "",
  ageCategory: (group.age_category ?? "") as CoachGroup["ageCategory"],
  ageRange: group.age_category ?? "",
  boatClasses: group.boat_classes.filter((boat): boat is "K1" | "C1" => boat === "K1" || boat === "C1"),
  trainingFocus: (group.training_focus ?? "Allgemein") as CoachGroup["trainingFocus"],
  color: group.color ?? "#00B4D8",
  status: group.status,
  athleteIds: members.filter((member) => member.group_id === group.id).map((member) => member.athlete_id),
  createdAt: group.created_at,
  updatedAt: group.updated_at,
});

const toCoachAthlete = (profile: CloudProfile, clubName = "", members: CloudGroupMember[] = []): CoachAthlete => {
  const groupIds = members.filter((member) => member.athlete_id === profile.id).map((member) => member.group_id);
  return {
  id: profile.id,
  coachUserId: "",
  clubId: profile.club_id ?? "",
  firstName: profile.first_name ?? "",
  lastName: profile.last_name ?? "",
  email: profile.email,
  name: profile.display_name || `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.email,
  birthDate: "",
  ageClass: (profile.age_category ?? "") as CoachAthlete["ageClass"],
  club: clubName,
  boatClasses: profile.boat_classes.filter((boat): boat is "K1" | "C1" => boat === "K1" || boat === "C1"),
  paddleSide: profile.paddle_side === "Links" ? "links" : "rechts",
  groupId: groupIds[0] ?? "",
  groupIds,
  goals: "",
  trainerNotes: "",
  notes: "",
  status: profile.status === "active" ? "aktiv" : "pausiert",
  invitationStatus: "aktiv",
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
  };
};

const getQueueFailureMessage = (): string => {
  const diagnostics = getOfflineQueueDiagnostics();
  return getFailedSyncMessage(diagnostics.map((item) => item.table), diagnostics.length);
};

const getCloudProfileData = (profile: CloudProfile): Partial<UserProfile> => {
  const value = profile.profile_data;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Partial<UserProfile>;
};

const mergeCloudData = (
  userId: string,
  profile: CloudProfile,
  clubs: Club[],
  profiles: CloudProfile[],
  groups: CloudTrainingGroup[],
  members: CloudGroupMember[] = [],
  cloudData?: Partial<PaddleMotionData>,
): PaddleMotionData => {
  const club = clubs.find((item) => item.clubId === profile.club_id);
  const cloudTruthProfile: CloudProfile = { ...profile, roles: getCloudTruthRoles(profile), email: profile.email.trim().toLowerCase() };
  const cloudDisplayName =
    cloudTruthProfile.display_name ||
    `${cloudTruthProfile.first_name ?? ""} ${cloudTruthProfile.last_name ?? ""}`.trim() ||
    cloudTruthProfile.email;
  const authUsers = profiles.map((item) => toAuthUser(item, clubs.find((clubItem) => clubItem.clubId === item.club_id)?.name ?? ""));
  cacheCloudAuthUsers(authUsers.length > 0 ? authUsers : [toAuthUser(profile, club?.name ?? "")]);
  cacheCloudClubs(clubs);

  const cached = loadData(userId);
  const activeGroups = groups.filter((group) => group.status !== "inactive");
  const activeGroupIds = new Set(activeGroups.map((group) => group.id));
  const activeMembers = members.filter((member) => activeGroupIds.has(member.group_id));
  const groupCloudReadFailed = didCloudReadFail(groups) || didCloudReadFail(members);
  const cloudBoatClasses = cloudTruthProfile.boat_classes.filter((boat): boat is "K1" | "C1" => boat === "K1" || boat === "C1");
  const cloudPaddleSide = cloudTruthProfile.paddle_side === "Links" ? "links" : cloudTruthProfile.paddle_side === "Rechts" ? "rechts" : undefined;
  const cloudProfileData = getCloudProfileData(cloudTruthProfile);
  const localUser: User = {
    ...cached.users[0],
    id: userId,
    userId,
    role: getPrimaryRole(cloudTruthProfile.roles),
    roles: cloudTruthProfile.roles.map(toLocalRole),
    profile: {
      ...cached.users[0].profile,
      ...cloudProfileData,
      firstName: cloudTruthProfile.first_name ?? cloudProfileData.firstName ?? "",
      lastName: cloudTruthProfile.last_name ?? cloudProfileData.lastName ?? "",
      nickname: cloudTruthProfile.display_name ?? cloudProfileData.nickname ?? "",
      club: club?.name ?? cloudProfileData.club ?? "",
      ageClass: (cloudTruthProfile.age_category ?? cloudProfileData.ageClass ?? "") as User["profile"]["ageClass"],
      boatClasses: cloudBoatClasses.length > 0 ? cloudBoatClasses : cloudProfileData.boatClasses ?? cached.users[0].profile.boatClasses,
      paddleSide: cloudPaddleSide ?? cloudProfileData.paddleSide ?? cached.users[0].profile.paddleSide,
      profileImageDataUrl: cloudTruthProfile.avatar_url ?? cloudProfileData.profileImageDataUrl ?? cached.users[0].profile.profileImageDataUrl,
    },
    updatedAt: cloudTruthProfile.updated_at,
  };

  const nextData: PaddleMotionData = {
    ...cached,
    activeUserId: userId,
    users: [localUser],
    athlete: {
      ...cached.athlete,
      id: userId,
      name: cloudDisplayName,
      club: club?.name ?? localUser.profile.club,
    },
    coachAthletes: groupCloudReadFailed
      ? cached.coachAthletes
      : profiles.filter((item) => item.roles.includes("Athlete")).map((item) => toCoachAthlete(item, clubs.find((clubItem) => clubItem.clubId === item.club_id)?.name ?? "", activeMembers)),
    coachGroups: groupCloudReadFailed ? cached.coachGroups : activeGroups.map((group) => toCoachGroup(group, activeMembers)),
    plan: cloudValueOrCached(cloudData?.plan, cached.plan),
    trainingTemplates: cloudValueOrCached(cloudData?.trainingTemplates, cached.trainingTemplates),
    trainingFeedback: cloudValueOrCached(cloudData?.trainingFeedback, cached.trainingFeedback),
    journal: cloudValueOrCached(cloudData?.journal, cached.journal),
    goals: cloudValueOrCached(cloudData?.goals, cached.goals),
    personalBests: cloudValueOrCached(cloudData?.personalBests, cached.personalBests ?? []),
    resultImports: cloudValueOrCached(cloudData?.resultImports, cached.resultImports ?? []),
    externalConnections: cloudValueOrCached(cloudData?.externalConnections, cached.externalConnections ?? []),
    externalTrainingSessions: cloudValueOrCached(cloudData?.externalTrainingSessions, cached.externalTrainingSessions ?? []),
    betaReadinessChecks: cloudValueOrCached(cloudData?.betaReadinessChecks, cached.betaReadinessChecks ?? []),
    betaFeedback: cloudValueOrCached(cloudData?.betaFeedback, cached.betaFeedback ?? []),
    betaTesters: cloudValueOrCached(cloudData?.betaTesters, cached.betaTesters ?? []),
    competitions: cloudValueOrCached(cloudData?.competitions, cached.competitions),
    material: cloudValueOrCached(cloudData?.material, cached.material),
    notifications: cloudValueOrCached(cloudData?.notifications, cached.notifications ?? []),
    smartCoachRecommendations: cloudValueOrCached(cloudData?.smartCoachRecommendations, cached.smartCoachRecommendations ?? []),
    clubMaterial: cloudValueOrCached(cloudData?.clubMaterial, cached.clubMaterial ?? []),
    clubBoats: cloudValueOrCached(cloudData?.clubBoats, cached.clubBoats ?? []),
    clubEvents: cloudValueOrCached(cloudData?.clubEvents, cached.clubEvents ?? []),
    clubDocuments: cloudValueOrCached(cloudData?.clubDocuments, cached.clubDocuments ?? []),
    clubMessages: cloudValueOrCached(cloudData?.clubMessages, cached.clubMessages ?? []),
    clubSettings: cloudValueOrCached(cloudData?.clubSettings, cached.clubSettings ?? []),
    directMessages: cloudValueOrCached(cloudData?.directMessages, cached.directMessages ?? []),
    groupMessages: cloudValueOrCached(cloudData?.groupMessages, cached.groupMessages ?? []),
    clubPosts: cloudValueOrCached(cloudData?.clubPosts, cached.clubPosts ?? []),
    tasks: cloudValueOrCached(cloudData?.tasks, cached.tasks ?? []),
    taskAssignments: cloudValueOrCached(cloudData?.taskAssignments, cached.taskAssignments ?? []),
    trainingAttendance: cloudValueOrCached(cloudData?.trainingAttendance, cached.trainingAttendance ?? []),
    fileAttachments: cloudValueOrCached(cloudData?.fileAttachments, cached.fileAttachments ?? []),
    academyCategories: cloudValueOrCached(cloudData?.academyCategories, cached.academyCategories),
    academyCourses: cloudValueOrCached(cloudData?.academyCourses, cached.academyCourses),
    academyLessons: cloudValueOrCached(cloudData?.academyLessons, cached.academyLessons),
    academyContentBlocks: cloudValueOrCached(cloudData?.academyContentBlocks, cached.academyContentBlocks),
    academyLearningPaths: cloudValueOrCached(cloudData?.academyLearningPaths, cached.academyLearningPaths),
    academyLearningPathItems: cloudValueOrCached(cloudData?.academyLearningPathItems, cached.academyLearningPathItems),
    academyProgress: cloudValueOrCached(cloudData?.academyProgress, cached.academyProgress ?? []),
    academyAssignments: cloudValueOrCached(cloudData?.academyAssignments, cached.academyAssignments ?? []),
    academyQuizzes: cloudValueOrCached(cloudData?.academyQuizzes, cached.academyQuizzes),
    academyQuizQuestions: cloudValueOrCached(cloudData?.academyQuizQuestions, cached.academyQuizQuestions),
    academyQuizAttempts: cloudValueOrCached(cloudData?.academyQuizAttempts, cached.academyQuizAttempts ?? []),
    academyFavorites: cloudValueOrCached(cloudData?.academyFavorites, cached.academyFavorites ?? []),
    academyMedia: cloudValueOrCached(cloudData?.academyMedia, cached.academyMedia ?? []),
  };

  saveData(userId, nextData);
  return nextData;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<CloudProfile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [data, setDataState] = useState<PaddleMotionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(() => {
    if (hasPasswordRecoveryUrlHint()) return true;
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === "active";
  });
  const [cloudStatus, setCloudStatus] = useState<CloudConnectionState>(isSupabaseConfigured ? "syncing" : "disabled");
  const [syncCount, setSyncCount] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [failedSyncCount, setFailedSyncCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [cloudMessage, setCloudMessage] = useState("");
  const [profileSyncDiagnostics, setProfileSyncDiagnostics] = useState<ProfileSyncDiagnostics>({
    ownProfileFetch: "idle",
    profileDirectoryFetch: "idle",
    realtime: "idle",
    profileRowPresent: false,
    roleLoaded: false,
    clubLoaded: false,
    activeClubLoaded: false,
    profileWarningReason: "",
    partialSyncReason: "",
    lastErrorCode: "",
    lastErrorScope: "",
    lastErrorMessage: "",
    lastErrorStatus: "",
    lastSuccessAt: "",
  });
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncRunningRef = useRef(false);
  const latestSyncDataRef = useRef<PaddleMotionData | null>(null);
  const refreshGenerationRef = useRef(0);
  const cloudRefreshRunningRef = useRef(false);

  const finishEmailConfirmationFlow = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(EMAIL_CONFIRMATION_STORAGE_KEY, "done");
    }
    setPasswordRecovery(false);
    setCloudStatus(isSupabaseConfigured ? "connected" : "disabled");
    setCloudMessage("E-Mail-Adresse bestätigt. Du kannst dich jetzt anmelden.");
    clearAuthUrlParameters();
    if (supabase) await supabase.auth.signOut();
    clearSession();
    setSession(null);
    setCurrentUser(null);
    setProfile(null);
    setDataState(null);
    setLoading(false);
  };

  const refreshCloudData = async () => {
    if (cloudRefreshRunningRef.current) return;
    cloudRefreshRunningRef.current = true;
    const refreshGeneration = ++refreshGenerationRef.current;
    if (!isSupabaseConfigured || !supabase) {
      setCloudStatus("disabled");
      setCloudMessage(getSupabaseConfigMessage());
      setLoading(false);
      cloudRefreshRunningRef.current = false;
      return;
    }

    let activeSession: Session | null;
    try {
      activeSession = (await withTimeout("Supabase Session laden", supabase.auth.getSession(), 12000)).data.session;
    } catch (error) {
      cloudRefreshRunningRef.current = false;
      throw error;
    }
    if (!activeSession?.user) {
      setOfflineQueueUser(null);
      setSession(null);
      setCurrentUser(null);
      setProfile(null);
      setDataState(null);
      setLoading(false);
      cloudRefreshRunningRef.current = false;
      return;
    }

    try {
      setOfflineQueueUser(activeSession.user.id);
      optionalCloudErrorCount = 0;
      optionalCloudErrorCategories = new Set<SyncErrorCategory>();
      optionalCloudErrors = [];
      setCloudStatus(navigator.onLine ? "syncing" : "offline");
      setSession(activeSession);
      setCurrentUser(activeSession.user);
      const provisionalProfile = createFallbackProfile(activeSession.user);
      const cachedSnapshot = mergeCloudData(activeSession.user.id, provisionalProfile, [], [provisionalProfile], [], []);
      setProfile(provisionalProfile);
      setDataState(cachedSnapshot);
      setLoading(false);
      let profileIsFallback = false;
      let nextProfile: CloudProfile | null = null;

      try {
        nextProfile = (await ensureCloudProfile(activeSession.user)) ?? (await withTimeout("Profil laden", getCloudProfile(activeSession.user.id), 15000));
        setProfileSyncDiagnostics((current) => ({
          ...current,
          ownProfileFetch: nextProfile ? "ok" : "failed",
          profileRowPresent: Boolean(nextProfile),
          roleLoaded: Boolean(nextProfile?.roles?.length),
          clubLoaded: Boolean(nextProfile?.club_id),
          activeClubLoaded: Boolean((nextProfile as CloudProfile & { active_club_id?: string | null } | null)?.active_club_id),
          profileWarningReason: nextProfile ? "" : "own_profile_missing",
          lastErrorCode: nextProfile ? "" : "PROFILE_MISSING",
          lastErrorScope: nextProfile ? "" : "Profil laden",
          lastErrorMessage: nextProfile ? "" : "Es wurde keine eigene Profilzeile gefunden.",
          lastErrorStatus: "",
          lastSuccessAt: nextProfile ? new Date().toISOString() : current.lastSuccessAt,
        }));
      } catch (error) {
        profileIsFallback = true;
        logCloudError("Profil synchronisieren", error);
        nextProfile = createFallbackProfile(activeSession.user);
        setCloudMessage("");
        setProfileSyncDiagnostics((current) => ({
          ...current,
          ownProfileFetch: "failed",
          profileRowPresent: false,
          profileWarningReason: "own_profile_fetch_failed",
          lastErrorCode: getSafeErrorCode(error),
          lastErrorScope: "Profil synchronisieren",
          lastErrorMessage: getSafeErrorMessage(error),
          lastErrorStatus: getSafeErrorStatus(error),
        }));
      }

      if (!nextProfile) {
        profileIsFallback = true;
        nextProfile = createFallbackProfile(activeSession.user);
        setCloudMessage("");
      }
      const clubs = mapCloudRead(await loadOptionalCloudData("clubs lesen", listCloudClubs, []), toClub);
      const allProfiles = await loadOptionalCloudData(
        "Profilverzeichnis lesen",
        () => listCloudProfiles(nextProfile),
        [nextProfile],
        "supplemental_sync_error",
      );
      const directoryError = optionalCloudErrors.find((error) => error.scope === "Profilverzeichnis lesen");
      setProfileSyncDiagnostics((current) => ({
        ...current,
        profileDirectoryFetch: directoryError ? "failed" : "ok",
        ...(directoryError ? {
          lastErrorCode: directoryError.code,
          lastErrorScope: directoryError.scope,
          lastErrorMessage: directoryError.message,
          lastErrorStatus: directoryError.status,
        } : {}),
      }));
      const requests = mapCloudRead(await loadOptionalCloudData("trainer_requests lesen", listCloudTrainerRequests, []), toTrainerRequest);
      const clubRequests = mapCloudRead(await loadOptionalCloudData("club_requests lesen", listCloudClubRequests, []), toClubRequest);
      const groups = await loadOptionalCloudData("training_groups lesen", listCloudTrainingGroups, []);
      const groupMembers = await loadOptionalCloudData("group_members lesen", listCloudGroupMembers, []);
      cacheCloudTrainerRequests(requests);
      cacheCloudClubRequests(clubRequests);
      const cachedBeforeMerge = loadData(activeSession.user.id);
      const migratedCount = navigator.onLine
        ? await loadOptionalCloudData("lokale Daten migrieren", () => migrateLocalDataToCloud(activeSession.user.id, cachedBeforeMerge, nextProfile, nextProfile.club_id ?? undefined), 0)
        : 0;
      const [
        cloudPlan,
        cloudFeedback,
        cloudJournal,
        cloudTemplates,
        cloudGoals,
        cloudCompetitions,
        cloudMaterials,
        cloudNotifications,
        cloudSmartCoach,
        cloudClubMessages,
        cloudDirectMessages,
        cloudGroupMessages,
        cloudTasks,
        cloudTaskAssignments,
        cloudTrainingAttendance,
      ] = await Promise.all([
        loadOptionalCloudData("training_plan_items lesen", () => listCloudTraining(activeSession.user.id), []),
        loadOptionalCloudData("training_feedback lesen", listCloudFeedback, []),
        loadOptionalCloudData("training_journal_entries lesen", listCloudJournalEntries, []),
        loadOptionalCloudData("training_templates lesen", listCloudTrainingTemplates, []),
        loadOptionalCloudData("season_goals lesen", listCloudGoals, []),
        loadOptionalCloudData("competitions lesen", listCloudCompetitions, []),
        loadOptionalCloudData("materials lesen", listCloudMaterials, []),
        loadOptionalCloudData("notifications lesen", () => listCloudNotifications(activeSession.user.id), []),
        loadOptionalCloudData("smart_coach_recommendations lesen", listCloudSmartCoachRecommendations, []),
        loadOptionalCloudData("club_messages lesen", listCloudClubMessages, []),
        loadOptionalCloudData("direct_messages lesen", listCloudDirectMessages, []),
        loadOptionalCloudData("group_messages lesen", listCloudGroupMessages, []),
        loadOptionalCloudData("tasks lesen", listCloudTasks, []),
        loadOptionalCloudData("task_assignments lesen", listCloudTaskAssignments, []),
        loadOptionalCloudData("training_attendance lesen", listCloudTrainingAttendance, []),
      ]);
      const nextData = mergeCloudData(activeSession.user.id, nextProfile, clubs, allProfiles.length > 0 ? allProfiles : [nextProfile], groups, groupMembers, {
        plan: cloudPlan,
        trainingFeedback: cloudFeedback,
        journal: cloudJournal,
        trainingTemplates: cloudTemplates,
        goals: cloudGoals,
        competitions: cloudCompetitions,
        material: cloudMaterials,
        notifications: cloudNotifications,
        smartCoachRecommendations: cloudSmartCoach,
        clubMessages: cloudClubMessages,
        directMessages: cloudDirectMessages,
        groupMessages: cloudGroupMessages,
        tasks: cloudTasks,
        taskAssignments: cloudTaskAssignments,
        trainingAttendance: cloudTrainingAttendance,
      });
      const queueStats = getSyncQueueStats();
      const pendingCount = queueStats.pending;
      if (refreshGeneration !== refreshGenerationRef.current) return;
      setProfile(nextProfile);
      setClub(clubs.find((item) => item.clubId === nextProfile.club_id) ?? null);
      setDataState(nextData);
      setPendingSyncCount(pendingCount);
      setFailedSyncCount(queueStats.failed);
      setLastSyncAt(new Date().toISOString());
      const coreSyncCount = allProfiles.length + clubs.length + requests.length + clubRequests.length + groups.length + groupMembers.length + cloudPlan.length + cloudFeedback.length + cloudJournal.length + cloudTemplates.length + cloudGoals.length + cloudCompetitions.length + cloudMaterials.length + cloudNotifications.length + cloudSmartCoach.length + cloudClubMessages.length + cloudDirectMessages.length + cloudGroupMessages.length + cloudTasks.length + cloudTaskAssignments.length + cloudTrainingAttendance.length;
      setSyncCount(coreSyncCount);
      setCloudMessage(queueStats.failed > 0 ? getQueueFailureMessage() : pendingCount > 0 ? `${pendingCount} Änderungen warten auf Synchronisation.` : migratedCount > 0 ? `${migratedCount} lokale Datensätze wurden in die Cloud migriert.` : "");
      setCloudStatus(resolveCloudConnectionState({
        online: navigator.onLine,
        profileReady: !profileIsFallback,
        pending: pendingCount,
        failed: queueStats.failed,
        readErrors: optionalCloudErrorCount,
      }));
      if (profileIsFallback) {
        setCloudMessage(navigator.onLine ? `${PROFILE_SYNC_RETRY_MESSAGE}${queueStats.failed > 0 ? ` ${getQueueFailureMessage()}` : ""}` : "Du bist offline. Paddlio nutzt gespeicherte Daten.");
        setCloudStatus(navigator.onLine ? "limited" : "offline");
      } else if (optionalCloudErrorCount > 0) {
        setCloudMessage(`${getSyncErrorMessage(optionalCloudErrorCategories)}${queueStats.failed > 0 ? ` ${getQueueFailureMessage()}` : ""}`);
        setCloudStatus(navigator.onLine ? "limited" : "offline");
      } else {
        setCloudMessage(queueStats.failed > 0 ? getQueueFailureMessage() : pendingCount > 0 ? `${pendingCount} Änderungen warten auf Synchronisation.` : migratedCount > 0 ? `${migratedCount} lokale Datensätze wurden in die Cloud migriert.` : "");
      }
      const optionalProfileError = optionalCloudErrorCategories.has("profile_sync_error")
        ? optionalCloudErrors.find((error) => classifySyncError(error.scope, { code: error.code, message: error.message }) === "profile_sync_error")
        : undefined;
      const latestOptionalError = optionalCloudErrors.slice(-1)[0];
      setProfileSyncDiagnostics((current) => ({
        ...current,
        profileWarningReason: profileIsFallback
          ? "own_profile_fetch_failed"
          : optionalProfileError
            ? `optional_profile_error:${optionalProfileError.scope}`
            : "",
        partialSyncReason: profileIsFallback
          ? "own_profile_fallback"
          : queueStats.failed > 0
            ? "failed_queue"
            : pendingCount > 0
              ? "pending_queue"
              : optionalCloudErrors.map((error) => `${error.scope}:${error.code}`).join(", "),
        ...(latestOptionalError ? {
          lastErrorCode: latestOptionalError.code,
          lastErrorScope: latestOptionalError.scope,
          lastErrorMessage: latestOptionalError.message,
          lastErrorStatus: latestOptionalError.status,
        } : {}),
      }));

      window.setTimeout(() => {
        void (async () => {
          const optionalErrorsBefore = optionalCloudErrorCount;
          const [
            cloudPersonalBests,
            cloudResultImports,
            cloudExternalConnections,
            cloudExternalTrainingSessions,
            cloudBetaReadinessChecks,
            cloudBetaFeedback,
            cloudBetaTesters,
            cloudClubMaterial,
            cloudClubBoats,
            cloudClubEvents,
            cloudClubDocuments,
            cloudClubSettings,
            cloudClubPosts,
            cloudFileAttachments,
            cloudAcademyCategories,
            cloudAcademyCourses,
            cloudAcademyLessons,
            cloudAcademyContentBlocks,
            cloudAcademyLearningPaths,
            cloudAcademyLearningPathItems,
            cloudAcademyProgress,
            cloudAcademyAssignments,
            cloudAcademyQuizzes,
            cloudAcademyQuizQuestions,
            cloudAcademyQuizAttempts,
            cloudAcademyFavorites,
            cloudAcademyMedia,
          ] = await Promise.all([
            loadOptionalCloudData("personal_bests lesen", listCloudPersonalBests, []),
            loadOptionalCloudData("result_imports lesen", listCloudResultImports, []),
            loadOptionalCloudData("external_connections lesen", listCloudExternalConnections, []),
            loadOptionalCloudData("external_training_sessions lesen", listCloudExternalTrainingSessions, []),
            loadOptionalCloudData("beta_readiness_checks lesen", listCloudBetaReadinessChecks, []),
            loadOptionalCloudData("beta_feedback lesen", listCloudBetaFeedback, []),
            loadOptionalCloudData("beta_testers lesen", listCloudBetaTesters, []),
            loadOptionalCloudData("club_material lesen", listCloudClubMaterial, []),
            loadOptionalCloudData("boats lesen", listCloudClubBoats, []),
            loadOptionalCloudData("club_events lesen", listCloudClubEvents, []),
            loadOptionalCloudData("club_documents lesen", listCloudClubDocuments, []),
            loadOptionalCloudData("club_settings lesen", listCloudClubSettings, []),
            loadOptionalCloudData("club_posts lesen", listCloudClubPosts, []),
            loadOptionalCloudData("file_attachments lesen", listCloudFileAttachments, []),
            loadOptionalCloudData("academy_categories lesen", listCloudAcademyCategories, []),
            loadOptionalCloudData("academy_courses lesen", listCloudAcademyCourses, []),
            loadOptionalCloudData("academy_lessons lesen", listCloudAcademyLessons, []),
            loadOptionalCloudData("academy_content_blocks lesen", listCloudAcademyContentBlocks, []),
            loadOptionalCloudData("academy_learning_paths lesen", listCloudAcademyLearningPaths, []),
            loadOptionalCloudData("academy_learning_path_items lesen", listCloudAcademyLearningPathItems, []),
            loadOptionalCloudData("academy_progress lesen", listCloudAcademyProgress, []),
            loadOptionalCloudData("academy_assignments lesen", listCloudAcademyAssignments, []),
            loadOptionalCloudData("academy_quizzes lesen", listCloudAcademyQuizzes, []),
            loadOptionalCloudData("academy_quiz_questions lesen", listCloudAcademyQuizQuestions, []),
            loadOptionalCloudData("academy_quiz_attempts lesen", listCloudAcademyQuizAttempts, []),
            loadOptionalCloudData("academy_favorites lesen", listCloudAcademyFavorites, []),
            loadOptionalCloudData("academy_media lesen", listCloudAcademyMedia, []),
          ]);

          if (!supabase) return;
          const latestSession = (await supabase.auth.getSession()).data.session;
          if (latestSession?.user.id !== activeSession.user.id || refreshGeneration !== refreshGenerationRef.current) return;

          const optionalData = mergeCloudData(activeSession.user.id, nextProfile, clubs, allProfiles.length > 0 ? allProfiles : [nextProfile], groups, groupMembers, {
            personalBests: cloudPersonalBests,
            resultImports: cloudResultImports,
            externalConnections: cloudExternalConnections,
            externalTrainingSessions: cloudExternalTrainingSessions,
            betaReadinessChecks: cloudBetaReadinessChecks,
            betaFeedback: cloudBetaFeedback,
            betaTesters: cloudBetaTesters,
            clubMaterial: cloudClubMaterial,
            clubBoats: cloudClubBoats,
            clubEvents: cloudClubEvents,
            clubDocuments: cloudClubDocuments,
            clubSettings: cloudClubSettings,
            clubPosts: cloudClubPosts,
            fileAttachments: cloudFileAttachments,
            academyCategories: cloudAcademyCategories,
            academyCourses: cloudAcademyCourses,
            academyLessons: cloudAcademyLessons,
            academyContentBlocks: cloudAcademyContentBlocks,
            academyLearningPaths: cloudAcademyLearningPaths,
            academyLearningPathItems: cloudAcademyLearningPathItems,
            academyProgress: cloudAcademyProgress,
            academyAssignments: cloudAcademyAssignments,
            academyQuizzes: cloudAcademyQuizzes,
            academyQuizQuestions: cloudAcademyQuizQuestions,
            academyQuizAttempts: cloudAcademyQuizAttempts,
            academyFavorites: cloudAcademyFavorites,
            academyMedia: cloudAcademyMedia,
          });

          setDataState(optionalData);
          setSyncCount(
            coreSyncCount +
              cloudPersonalBests.length +
              cloudResultImports.length +
              cloudExternalConnections.length +
              cloudExternalTrainingSessions.length +
              cloudBetaReadinessChecks.length +
              cloudBetaFeedback.length +
              cloudBetaTesters.length +
              cloudClubMaterial.length +
              cloudClubBoats.length +
              cloudClubEvents.length +
              cloudClubDocuments.length +
              cloudClubSettings.length +
              cloudClubPosts.length +
              cloudFileAttachments.length +
              cloudAcademyCategories.length +
              cloudAcademyCourses.length +
              cloudAcademyLessons.length +
              cloudAcademyContentBlocks.length +
              cloudAcademyLearningPaths.length +
              cloudAcademyLearningPathItems.length +
              cloudAcademyProgress.length +
              cloudAcademyAssignments.length +
              cloudAcademyQuizzes.length +
              cloudAcademyQuizQuestions.length +
              cloudAcademyQuizAttempts.length +
              cloudAcademyFavorites.length +
              cloudAcademyMedia.length,
          );

          if (!profileIsFallback && optionalCloudErrorCount > optionalErrorsBefore) {
            const latestDeferredError = optionalCloudErrors.slice(-1)[0];
            setCloudStatus(navigator.onLine ? "limited" : "offline");
            setCloudMessage(getSyncErrorMessage(optionalCloudErrorCategories));
            setProfileSyncDiagnostics((current) => ({
              ...current,
              profileWarningReason: optionalCloudErrorCategories.has("profile_sync_error")
                ? `deferred_profile_error:${latestDeferredError?.scope ?? "unknown"}`
                : current.profileWarningReason,
              partialSyncReason: optionalCloudErrors.map((error) => `${error.scope}:${error.code}`).join(", "),
              lastErrorCode: latestDeferredError?.code ?? current.lastErrorCode,
              lastErrorScope: latestDeferredError?.scope ?? current.lastErrorScope,
              lastErrorMessage: latestDeferredError?.message ?? current.lastErrorMessage,
              lastErrorStatus: latestDeferredError?.status ?? current.lastErrorStatus,
            }));
          } else if (!profileIsFallback && optionalCloudErrorCount === 0) {
            const latestQueueStats = getSyncQueueStats();
            setPendingSyncCount(latestQueueStats.pending);
            setFailedSyncCount(latestQueueStats.failed);
            setCloudStatus(resolveCloudConnectionState({
              online: navigator.onLine,
              profileReady: true,
              pending: latestQueueStats.pending,
              failed: latestQueueStats.failed,
              readErrors: 0,
            }));
            setCloudMessage(
              latestQueueStats.failed > 0
                ? getQueueFailureMessage()
                : latestQueueStats.pending > 0
                  ? `${latestQueueStats.pending} Änderungen warten auf Synchronisation.`
                  : "",
            );
            setProfileSyncDiagnostics((current) => ({
              ...current,
              profileWarningReason: "",
              partialSyncReason: latestQueueStats.failed > 0
                ? "failed_queue"
                : latestQueueStats.pending > 0
                  ? "pending_queue"
                  : "",
              lastErrorCode: latestQueueStats.failed > 0 ? current.lastErrorCode : "",
              lastErrorScope: latestQueueStats.failed > 0 ? current.lastErrorScope : "",
              lastErrorMessage: latestQueueStats.failed > 0 ? current.lastErrorMessage : "",
              lastErrorStatus: latestQueueStats.failed > 0 ? current.lastErrorStatus : "",
              lastSuccessAt: new Date().toISOString(),
            }));
          }
        })();
      }, 0);
    } catch (error) {
      logCloudError("Login-Synchronisation", error);
      const category = classifySyncError("Login-Synchronisation", error);
      setCloudMessage(getSyncErrorMessage([category]));
      if (activeSession.user) {
        setDataState(loadData(activeSession.user.id));
      }
      setCloudStatus(navigator.onLine && category === "profile_sync_error" ? "error" : navigator.onLine ? "limited" : "offline");
      setProfileSyncDiagnostics((current) => ({
        ...current,
        profileWarningReason: category === "profile_sync_error" ? "aggregate_login_sync_error" : current.profileWarningReason,
        partialSyncReason: `Login-Synchronisation:${getSafeErrorCode(error)}`,
        lastErrorCode: getSafeErrorCode(error),
        lastErrorScope: "Login-Synchronisation",
        lastErrorMessage: getSafeErrorMessage(error),
        lastErrorStatus: getSafeErrorStatus(error),
      }));
    } finally {
      cloudRefreshRunningRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    const startsInEmailConfirmationFlow = hasEmailConfirmationUrlHint();
    if (!supabase) {
      if (startsInEmailConfirmationFlow) {
        void finishEmailConfirmationFlow();
        return undefined;
      }
      void refreshCloudData();
      return undefined;
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "active");
        }
        setPasswordRecovery(true);
        setSession(nextSession);
        setCurrentUser(nextSession?.user ?? null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" && (startsInEmailConfirmationFlow || hasEmailConfirmationUrlHint())) {
        void finishEmailConfirmationFlow();
        return;
      }

      setSession(nextSession);
      setCurrentUser(nextSession?.user ?? null);
      setOfflineQueueUser(nextSession?.user.id ?? null);
      void refreshCloudData();
    });
    if (startsInEmailConfirmationFlow) {
      void finishEmailConfirmationFlow();
    } else if (typeof window !== "undefined" && window.sessionStorage.getItem(EMAIL_CONFIRMATION_STORAGE_KEY) === "done") {
      window.sessionStorage.removeItem(EMAIL_CONFIRMATION_STORAGE_KEY);
      setCloudMessage("E-Mail-Adresse bestätigt. Du kannst dich jetzt anmelden.");
      void refreshCloudData();
    } else {
      void refreshCloudData();
    }
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setCloudStatus("syncing");
      void backgroundSyncEngine.run("online", ["A", "B"]).then((synced) => {
        const stats = getSyncQueueStats();
        setPendingSyncCount(stats.pending);
        setFailedSyncCount(stats.failed);
        setCloudStatus(stats.failed > 0 ? "limited" : stats.pending > 0 ? "pending" : "connected");
        setCloudMessage(stats.failed > 0 ? getQueueFailureMessage() : synced > 0 ? `${synced} wartende Änderungen wurden synchronisiert.` : "Synchronisiert.");
        void refreshCloudData();
      });
    };
    const handleOffline = () => setCloudStatus("offline");
    const handleQueueChange = () => {
      const stats = getSyncQueueStats();
      setPendingSyncCount(stats.pending);
      setFailedSyncCount(stats.failed);
      if (stats.total > 0) {
        backgroundSyncEngine.markLocalChange();
        setCloudStatus(!navigator.onLine ? "offline" : stats.failed > 0 ? "limited" : "pending");
        setCloudMessage(stats.failed > 0 ? getQueueFailureMessage() : `${stats.pending} Änderungen warten auf Synchronisation.`);
      }
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("paddlio-sync-queue-changed", handleQueueChange);
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" || getSyncQueueStats().total === 0) return;
      setCloudStatus("syncing");
      void backgroundSyncEngine.run("foreground", ["A", "B"]).then((synced) => {
        const stats = getSyncQueueStats();
        setPendingSyncCount(stats.pending);
        setFailedSyncCount(stats.failed);
        setCloudStatus(stats.failed > 0 ? "limited" : stats.pending > 0 ? "pending" : "connected");
        setCloudMessage(stats.failed > 0 ? getQueueFailureMessage() : synced > 0 ? `${synced} Änderungen wurden nachgeholt.` : "Synchronisiert.");
      });
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("paddlio-sync-queue-changed", handleQueueChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const scheduleCloudSnapshotSync = (next: PaddleMotionData, activeProfile: CloudProfile) => {
    latestSyncDataRef.current = next;
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);

    const initialStats = getSyncQueueStats();
    setPendingSyncCount(initialStats.pending);
    setFailedSyncCount(initialStats.failed);
    setCloudStatus(initialStats.failed > 0 ? "limited" : initialStats.pending > 0 ? "pending" : "syncing");
    setCloudMessage("Änderungen lokal gespeichert. Cloud-Sync wird vorbereitet.");

    syncTimeoutRef.current = window.setTimeout(() => {
      if (syncRunningRef.current || !latestSyncDataRef.current) return;
      const snapshot = latestSyncDataRef.current;
      latestSyncDataRef.current = null;
      syncRunningRef.current = true;

      void syncDataSnapshotToCloud(snapshot, activeProfile, activeProfile.club_id ?? undefined)
        .then((count) => {
          const nextStats = getSyncQueueStats();
          const nextPending = nextStats.pending;
          setPendingSyncCount(nextPending);
          setFailedSyncCount(nextStats.failed);
          setLastSyncAt(new Date().toISOString());
          setSyncCount(count);
          setCloudStatus(nextStats.failed > 0 ? "limited" : nextPending > 0 ? "pending" : "connected");
          setCloudMessage(nextStats.failed > 0 ? getQueueFailureMessage() : nextPending > 0 ? `${nextPending} Änderungen warten auf Synchronisation.` : "Gespeichert und synchronisiert.");
        })
        .catch((error) => {
          logCloudError("Änderungen speichern", error);
          const category = classifySyncError("Planungsdaten speichern", error);
          const nextStats = getSyncQueueStats();
          const nextPending = nextStats.pending;
          setPendingSyncCount(nextPending);
          setFailedSyncCount(nextStats.failed);
          setCloudStatus(navigator.onLine ? "limited" : "offline");
          setCloudMessage(navigator.onLine ? getSyncErrorMessage([category]) : "Du bist offline. Änderungen werden später synchronisiert.");
        })
        .finally(() => {
          syncRunningRef.current = false;
          if (latestSyncDataRef.current && profile) scheduleCloudSnapshotSync(latestSyncDataRef.current, profile);
        });
    }, 900);
  };

  useEffect(() => () => {
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
  }, []);

  const setData: AuthContextValue["setData"] = (updater) => {
    setDataState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (next && currentUser) {
        saveData(currentUser.id, next);
        if (profile && navigator.onLine) {
          scheduleCloudSnapshotSync(next, profile);
        }
      }
      return next;
    });
  };

  useEffect(() => {
    if (!supabase || !session?.user.id) return undefined;
    const handleRealtimeChange = () => {
      setCloudStatus("syncing");
      void refreshCloudData().then(() => setCloudMessage("Daten wurden zwischen Geräten synchronisiert."));
    };
    const unsubscribers = [
      subscribeToUserTrainings(session.user.id, handleRealtimeChange, (realtime) => {
        setProfileSyncDiagnostics((current) => ({ ...current, realtime }));
      }),
      subscribeToNotifications(session.user.id, handleRealtimeChange),
    ];

    if (profile?.club_id && profile.roles.some((role) => role === "Coach" || role === "TeamAdmin" || role === "Admin")) {
      unsubscribers.push(subscribeToCoachClub(profile.club_id, handleRealtimeChange));
    }

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [session?.user.id, profile?.club_id, profile?.roles.join("|")]);

  const signIn = async (input: LoginInput): Promise<CloudAuthResult> => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: getSupabaseConfigMessage() };
    const { error } = await client.auth.signInWithPassword({ email: input.email.trim().toLowerCase(), password: input.password });
    if (error) return { ok: false, message: "E-Mail oder Passwort ist nicht korrekt." };
    await refreshCloudData();
    return { ok: true };
  };

  const signUp = async (input: RegisterInput): Promise<CloudAuthResult> => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: getSupabaseConfigMessage() };
    if (!input.privacyAccepted) return { ok: false, message: "Bitte akzeptiere den Datenschutz." };
    if (input.password !== input.passwordRepeat) return { ok: false, message: "Die Passwörter stimmen nicht überein." };
    const { data: result, error } = await client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        ...(getAuthEmailRedirectTo() ? { emailRedirectTo: getAuthEmailRedirectTo() } : {}),
        data: {
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          clubId: input.clubId,
          club: input.club,
        },
      },
    });
    if (error) {
      if (isAuthRateLimitError(error)) {
        logCloudError("Registrierung Rate Limit", error);
        return {
          ok: false,
          message: "Supabase blockiert gerade zu viele Registrierungs- oder E-Mail-Anfragen. Bitte warte ein paar Minuten und versuche es erneut. Ohne serverseitigen Admin-Schluessel kann Paddlio im Browser kein Konto an diesem Limit vorbei anlegen.",
        };
      }

      return { ok: false, message: error.message };
    }
    if (result.session?.user) {
      try {
        await ensureCloudProfile(result.session.user);
      } catch (error) {
        console.info("Profil wird durch den Auth-Trigger oder beim nächsten Login automatisch erstellt.", error);
      }
    }
    await refreshCloudData();
    return {
      ok: true,
      message: result.session
        ? "Konto erstellt. Du bist als Athlete angemeldet. Rollen können später im Adminbereich vergeben werden."
        : "Konto erstellt. Supabase hat die Bestätigungsmail angefordert. Bitte prüfe Posteingang und Spam. Falls nichts ankommt, kannst du die Mail hier erneut senden.",
    };
  };

  const signOut = async () => {
    unsubscribeAll();
    const signedOutUserId = currentUser?.id;
    if (supabase) await supabase.auth.signOut();
    clearSession();
    if (signedOutUserId) {
      clearCachedAuthUser(signedOutUserId);
      clearCachedUserData(signedOutUserId);
    }
    setSession(null);
    setCurrentUser(null);
    setProfile(null);
    setDataState(null);
  };

  const resetPassword = async (email: string): Promise<CloudAuthResult> => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: getSupabaseConfigMessage() };
    const redirectTo = getAuthEmailRedirectTo();
    const { error } = await client.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      redirectTo ? { redirectTo } : undefined,
    );
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Wenn die E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet." };
  };

  const cancelPasswordRecovery = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
    }
    setPasswordRecovery(false);
    clearAuthUrlParameters();
    if (supabase) await supabase.auth.signOut();
    setOfflineQueueUser(null);
    clearSession();
    setSession(null);
    setCurrentUser(null);
    setProfile(null);
    setDataState(null);
  };

  const updatePassword = async (password: string): Promise<CloudAuthResult> => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: getSupabaseConfigMessage() };

    const { data: currentSession } = await client.auth.getSession();
    if (!currentSession.session?.user) {
      return { ok: false, message: "Dieser Link ist ungültig oder abgelaufen." };
    }

    const { error } = await client.auth.updateUser({ password });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("weak") || message.includes("password")) {
        return { ok: false, message: "Das Passwort ist zu schwach. Bitte nutze mindestens 8 Zeichen mit Großbuchstabe, Kleinbuchstabe und Zahl." };
      }
      return { ok: false, message: "Das Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an." };
    }

    clearAuthUrlParameters();
    return { ok: true, message: "Dein Passwort wurde erfolgreich geändert." };
  };

  const resendConfirmation = async (email: string): Promise<CloudAuthResult> => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: getSupabaseConfigMessage() };

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return { ok: false, message: "Bitte gib deine E-Mail-Adresse ein." };

    const emailRedirectTo = getAuthEmailRedirectTo();
    const { error } = await client.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });

    if (error) {
      if (isAuthRateLimitError(error)) {
        logCloudError("Bestätigungsmail erneut senden Rate Limit", error);
        return {
          ok: false,
          message: "Supabase blockiert gerade zu viele E-Mail-Anfragen. Bitte warte ein paar Minuten und versuche es erneut.",
        };
      }

      return { ok: false, message: error.message };
    }

    return { ok: true, message: "Bestätigungsmail wurde erneut angefordert. Bitte prüfe auch Spam und Werbung." };
  };

  const value = useMemo<AuthContextValue>(() => ({
    session,
    currentUser,
    profile,
    roles: profile ? getCloudTruthRoles(profile).map(toLocalRole) : [],
    club,
    data,
    setData,
    loading,
    cloudStatus,
    syncCount,
    pendingSyncCount,
    failedSyncCount,
    lastSyncAt,
    cloudMessage,
    profileSyncDiagnostics,
    passwordRecovery,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    cancelPasswordRecovery,
    resendConfirmation,
    refreshCloudData,
  }), [session, currentUser, profile, club, data, loading, cloudStatus, syncCount, pendingSyncCount, failedSyncCount, lastSyncAt, cloudMessage, profileSyncDiagnostics, passwordRecovery]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

