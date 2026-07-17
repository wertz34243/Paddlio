import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, getSupabaseClient } from "../lib/supabase";
import { getSupabaseConfigMessage, isSupabaseConfigured } from "../lib/supabaseConfig";
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
  UserRole,
} from "../domain/types";
import { ensureCloudProfile, getCloudProfile, listCloudProfiles, normalizeCloudRolesForEmail, type CloudProfile } from "../services/profileService";
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
import { flushSyncQueue, getPendingSyncCount } from "../services/syncService";
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
import { subscribeToCoachClub, subscribeToNotifications, subscribeToTrainingFeedback, subscribeToUserTrainings, unsubscribeAll } from "../services/realtimeService";

export type CloudConnectionState = "connected" | "syncing" | "offline" | "pending" | "limited" | "disabled" | "error";

export type CloudAuthResult = { ok: true; message?: string } | { ok: false; message: string };

type AuthContextValue = {
  session: Session | null;
  currentUser: SupabaseUser | null;
  profile: CloudProfile | null;
  roles: UserRole[];
  club: Club | null;
  data: PaddleMotionData | null;
  setData: (updater: PaddleMotionData | ((current: PaddleMotionData | null) => PaddleMotionData | null)) => void;
  loading: boolean;
  cloudStatus: CloudConnectionState;
  syncCount: number;
  pendingSyncCount: number;
  lastSyncAt: string;
  cloudMessage: string;
  signIn: (input: LoginInput) => Promise<CloudAuthResult>;
  signUp: (input: RegisterInput) => Promise<CloudAuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<CloudAuthResult>;
  refreshCloudData: () => Promise<void>;
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

let optionalCloudErrorCount = 0;

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

const loadOptionalCloudData = async <T,>(scope: string, loader: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await withTimeout(scope, loader(), 12000);
  } catch (error) {
    optionalCloudErrorCount += 1;
    logCloudError(scope, error);
    return fallback;
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
  normalizeCloudRolesForEmail(profile.email, profile.roles.length > 0 ? profile.roles : ["Athlete"]);

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
    roles: normalizeCloudRolesForEmail(email, ["Athlete"]),
    status: "active",
    avatar_url: null,
    age_category: null,
    boat_classes: ["K1"],
    paddle_side: null,
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
  const cloudBoatClasses = cloudTruthProfile.boat_classes.filter((boat): boat is "K1" | "C1" => boat === "K1" || boat === "C1");
  const cloudPaddleSide = cloudTruthProfile.paddle_side === "Links" ? "links" : "rechts";
  const localUser: User = {
    ...cached.users[0],
    id: userId,
    userId,
    role: getPrimaryRole(cloudTruthProfile.roles),
    profile: {
      ...cached.users[0].profile,
      firstName: cloudTruthProfile.first_name ?? "",
      lastName: cloudTruthProfile.last_name ?? "",
      nickname: cloudTruthProfile.display_name ?? "",
      club: club?.name ?? "",
      ageClass: (cloudTruthProfile.age_category ?? "") as User["profile"]["ageClass"],
      boatClasses: cloudBoatClasses,
      paddleSide: cloudPaddleSide,
      profileImageDataUrl: cloudTruthProfile.avatar_url ?? cached.users[0].profile.profileImageDataUrl,
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
    coachAthletes: profiles.filter((item) => item.roles.includes("Athlete")).map((item) => toCoachAthlete(item, clubs.find((clubItem) => clubItem.clubId === item.club_id)?.name ?? "", members)),
    coachGroups: groups.map((group) => toCoachGroup(group, members)),
    plan: cloudData?.plan && cloudData.plan.length > 0 ? cloudData.plan : cached.plan,
    trainingTemplates: cloudData?.trainingTemplates && cloudData.trainingTemplates.length > 0 ? cloudData.trainingTemplates : cached.trainingTemplates,
    trainingFeedback: cloudData?.trainingFeedback && cloudData.trainingFeedback.length > 0 ? cloudData.trainingFeedback : cached.trainingFeedback,
    journal: cloudData?.journal && cloudData.journal.length > 0 ? cloudData.journal : cached.journal,
    goals: cloudData?.goals && cloudData.goals.length > 0 ? cloudData.goals : cached.goals,
    personalBests: cloudData?.personalBests ?? cached.personalBests ?? [],
    resultImports: cloudData?.resultImports ?? cached.resultImports ?? [],
    externalConnections: cloudData?.externalConnections ?? cached.externalConnections ?? [],
    externalTrainingSessions: cloudData?.externalTrainingSessions ?? cached.externalTrainingSessions ?? [],
    betaReadinessChecks: cloudData?.betaReadinessChecks ?? cached.betaReadinessChecks ?? [],
    betaFeedback: cloudData?.betaFeedback ?? cached.betaFeedback ?? [],
    betaTesters: cloudData?.betaTesters ?? cached.betaTesters ?? [],
    competitions: cloudData?.competitions && cloudData.competitions.length > 0 ? cloudData.competitions : cached.competitions,
    material: cloudData?.material && cloudData.material.length > 0 ? cloudData.material : cached.material,
    notifications: cloudData?.notifications ?? cached.notifications ?? [],
    smartCoachRecommendations: cloudData?.smartCoachRecommendations ?? cached.smartCoachRecommendations ?? [],
    clubMaterial: cloudData?.clubMaterial ?? cached.clubMaterial ?? [],
    clubBoats: cloudData?.clubBoats ?? cached.clubBoats ?? [],
    clubEvents: cloudData?.clubEvents ?? cached.clubEvents ?? [],
    clubDocuments: cloudData?.clubDocuments ?? cached.clubDocuments ?? [],
    clubMessages: cloudData?.clubMessages ?? cached.clubMessages ?? [],
    clubSettings: cloudData?.clubSettings ?? cached.clubSettings ?? [],
    directMessages: cloudData?.directMessages ?? cached.directMessages ?? [],
    groupMessages: cloudData?.groupMessages ?? cached.groupMessages ?? [],
    clubPosts: cloudData?.clubPosts ?? cached.clubPosts ?? [],
    tasks: cloudData?.tasks ?? cached.tasks ?? [],
    taskAssignments: cloudData?.taskAssignments ?? cached.taskAssignments ?? [],
    trainingAttendance: cloudData?.trainingAttendance ?? cached.trainingAttendance ?? [],
    fileAttachments: cloudData?.fileAttachments ?? cached.fileAttachments ?? [],
    academyCategories: cloudData?.academyCategories && cloudData.academyCategories.length > 0 ? cloudData.academyCategories : cached.academyCategories,
    academyCourses: cloudData?.academyCourses && cloudData.academyCourses.length > 0 ? cloudData.academyCourses : cached.academyCourses,
    academyLessons: cloudData?.academyLessons && cloudData.academyLessons.length > 0 ? cloudData.academyLessons : cached.academyLessons,
    academyContentBlocks: cloudData?.academyContentBlocks && cloudData.academyContentBlocks.length > 0 ? cloudData.academyContentBlocks : cached.academyContentBlocks,
    academyLearningPaths: cloudData?.academyLearningPaths && cloudData.academyLearningPaths.length > 0 ? cloudData.academyLearningPaths : cached.academyLearningPaths,
    academyLearningPathItems: cloudData?.academyLearningPathItems && cloudData.academyLearningPathItems.length > 0 ? cloudData.academyLearningPathItems : cached.academyLearningPathItems,
    academyProgress: cloudData?.academyProgress ?? cached.academyProgress ?? [],
    academyAssignments: cloudData?.academyAssignments ?? cached.academyAssignments ?? [],
    academyQuizzes: cloudData?.academyQuizzes && cloudData.academyQuizzes.length > 0 ? cloudData.academyQuizzes : cached.academyQuizzes,
    academyQuizQuestions: cloudData?.academyQuizQuestions && cloudData.academyQuizQuestions.length > 0 ? cloudData.academyQuizQuestions : cached.academyQuizQuestions,
    academyQuizAttempts: cloudData?.academyQuizAttempts ?? cached.academyQuizAttempts ?? [],
    academyFavorites: cloudData?.academyFavorites ?? cached.academyFavorites ?? [],
    academyMedia: cloudData?.academyMedia ?? cached.academyMedia ?? [],
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
  const [cloudStatus, setCloudStatus] = useState<CloudConnectionState>(isSupabaseConfigured ? "syncing" : "disabled");
  const [syncCount, setSyncCount] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [cloudMessage, setCloudMessage] = useState("");
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncRunningRef = useRef(false);
  const latestSyncDataRef = useRef<PaddleMotionData | null>(null);

  const refreshCloudData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setCloudStatus("disabled");
      setCloudMessage(getSupabaseConfigMessage());
      setLoading(false);
      return;
    }

    const activeSession = (await withTimeout("Supabase Session laden", supabase.auth.getSession(), 12000)).data.session;
    if (!activeSession?.user) {
      setSession(null);
      setCurrentUser(null);
      setProfile(null);
      setDataState(null);
      setLoading(false);
      return;
    }

    try {
      optionalCloudErrorCount = 0;
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
      } catch (error) {
        profileIsFallback = true;
        logCloudError("Profil synchronisieren", error);
        nextProfile = createFallbackProfile(activeSession.user);
        setCloudMessage("Cloud eingeschrÃ¤nkt: Rolle wird lokal abgeleitet und beim nÃ¤chsten erfolgreichen Profil-Sync Ã¼berschrieben.");
      }

      if (!nextProfile) {
        profileIsFallback = true;
        nextProfile = createFallbackProfile(activeSession.user);
        setCloudMessage("Cloud eingeschrÃ¤nkt: Rolle wird lokal abgeleitet und beim nÃ¤chsten erfolgreichen Profil-Sync Ã¼berschrieben.");
      }
      const clubs = (await loadOptionalCloudData("clubs lesen", listCloudClubs, [])).map(toClub);
      const allProfiles = await loadOptionalCloudData("profiles listen", () => listCloudProfiles(nextProfile), [nextProfile]);
      const requests = (await loadOptionalCloudData("trainer_requests lesen", listCloudTrainerRequests, [])).map(toTrainerRequest);
      const clubRequests = (await loadOptionalCloudData("club_requests lesen", listCloudClubRequests, [])).map(toClubRequest);
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
        cloudPersonalBests,
        cloudResultImports,
        cloudExternalConnections,
        cloudExternalTrainingSessions,
        cloudBetaReadinessChecks,
        cloudBetaFeedback,
        cloudBetaTesters,
        cloudCompetitions,
        cloudMaterials,
        cloudNotifications,
        cloudSmartCoach,
        cloudClubMaterial,
        cloudClubBoats,
        cloudClubEvents,
        cloudClubDocuments,
        cloudClubMessages,
        cloudClubSettings,
        cloudDirectMessages,
        cloudGroupMessages,
        cloudClubPosts,
        cloudTasks,
        cloudTaskAssignments,
        cloudTrainingAttendance,
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
        loadOptionalCloudData("training_plan_items lesen", () => listCloudTraining(activeSession.user.id), []),
        loadOptionalCloudData("training_feedback lesen", listCloudFeedback, []),
        loadOptionalCloudData("training_journal_entries lesen", listCloudJournalEntries, []),
        loadOptionalCloudData("training_templates lesen", listCloudTrainingTemplates, []),
        loadOptionalCloudData("season_goals lesen", listCloudGoals, []),
        loadOptionalCloudData("personal_bests lesen", listCloudPersonalBests, []),
        loadOptionalCloudData("result_imports lesen", listCloudResultImports, []),
        loadOptionalCloudData("external_connections lesen", listCloudExternalConnections, []),
        loadOptionalCloudData("external_training_sessions lesen", listCloudExternalTrainingSessions, []),
        loadOptionalCloudData("beta_readiness_checks lesen", listCloudBetaReadinessChecks, []),
        loadOptionalCloudData("beta_feedback lesen", listCloudBetaFeedback, []),
        loadOptionalCloudData("beta_testers lesen", listCloudBetaTesters, []),
        loadOptionalCloudData("competitions lesen", listCloudCompetitions, []),
        loadOptionalCloudData("materials lesen", listCloudMaterials, []),
        loadOptionalCloudData("notifications lesen", () => listCloudNotifications(activeSession.user.id), []),
        loadOptionalCloudData("smart_coach_recommendations lesen", listCloudSmartCoachRecommendations, []),
        loadOptionalCloudData("club_material lesen", listCloudClubMaterial, []),
        loadOptionalCloudData("boats lesen", listCloudClubBoats, []),
        loadOptionalCloudData("club_events lesen", listCloudClubEvents, []),
        loadOptionalCloudData("club_documents lesen", listCloudClubDocuments, []),
        loadOptionalCloudData("club_messages lesen", listCloudClubMessages, []),
        loadOptionalCloudData("club_settings lesen", listCloudClubSettings, []),
        loadOptionalCloudData("direct_messages lesen", listCloudDirectMessages, []),
        loadOptionalCloudData("group_messages lesen", listCloudGroupMessages, []),
        loadOptionalCloudData("club_posts lesen", listCloudClubPosts, []),
        loadOptionalCloudData("tasks lesen", listCloudTasks, []),
        loadOptionalCloudData("task_assignments lesen", listCloudTaskAssignments, []),
        loadOptionalCloudData("training_attendance lesen", listCloudTrainingAttendance, []),
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
      const nextData = mergeCloudData(activeSession.user.id, nextProfile, clubs, allProfiles.length > 0 ? allProfiles : [nextProfile], groups, groupMembers, {
        plan: cloudPlan,
        trainingFeedback: cloudFeedback,
        journal: cloudJournal,
        trainingTemplates: cloudTemplates,
        goals: cloudGoals,
        personalBests: cloudPersonalBests,
        resultImports: cloudResultImports,
        externalConnections: cloudExternalConnections,
        externalTrainingSessions: cloudExternalTrainingSessions,
        betaReadinessChecks: cloudBetaReadinessChecks,
        betaFeedback: cloudBetaFeedback,
        betaTesters: cloudBetaTesters,
        competitions: cloudCompetitions,
        material: cloudMaterials,
        notifications: cloudNotifications,
        smartCoachRecommendations: cloudSmartCoach,
        clubMaterial: cloudClubMaterial,
        clubBoats: cloudClubBoats,
        clubEvents: cloudClubEvents,
        clubDocuments: cloudClubDocuments,
        clubMessages: cloudClubMessages,
        clubSettings: cloudClubSettings,
        directMessages: cloudDirectMessages,
        groupMessages: cloudGroupMessages,
        clubPosts: cloudClubPosts,
        tasks: cloudTasks,
        taskAssignments: cloudTaskAssignments,
        trainingAttendance: cloudTrainingAttendance,
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
      const pendingCount = getPendingSyncCount();
      setProfile(nextProfile);
      setClub(clubs.find((item) => item.clubId === nextProfile.club_id) ?? null);
      setDataState(nextData);
      setPendingSyncCount(pendingCount);
      setLastSyncAt(new Date().toISOString());
      setSyncCount(allProfiles.length + clubs.length + requests.length + clubRequests.length + groups.length + groupMembers.length + cloudPlan.length + cloudFeedback.length + cloudJournal.length + cloudTemplates.length + cloudGoals.length + cloudPersonalBests.length + cloudResultImports.length + cloudExternalConnections.length + cloudExternalTrainingSessions.length + cloudBetaReadinessChecks.length + cloudBetaFeedback.length + cloudBetaTesters.length + cloudCompetitions.length + cloudMaterials.length + cloudNotifications.length + cloudSmartCoach.length + cloudClubMaterial.length + cloudClubBoats.length + cloudClubEvents.length + cloudClubDocuments.length + cloudClubMessages.length + cloudClubSettings.length + cloudDirectMessages.length + cloudGroupMessages.length + cloudClubPosts.length + cloudTasks.length + cloudTaskAssignments.length + cloudTrainingAttendance.length + cloudFileAttachments.length + cloudAcademyCategories.length + cloudAcademyCourses.length + cloudAcademyLessons.length + cloudAcademyContentBlocks.length + cloudAcademyLearningPaths.length + cloudAcademyLearningPathItems.length + cloudAcademyProgress.length + cloudAcademyAssignments.length + cloudAcademyQuizzes.length + cloudAcademyQuizQuestions.length + cloudAcademyQuizAttempts.length + cloudAcademyFavorites.length + cloudAcademyMedia.length + pendingCount);
      setCloudMessage(pendingCount > 0 ? `${pendingCount} Ã„nderungen warten auf Synchronisation.` : migratedCount > 0 ? `${migratedCount} lokale DatensÃ¤tze wurden in die Cloud migriert.` : "");
      setCloudStatus(!navigator.onLine ? "offline" : pendingCount > 0 ? "pending" : "connected");
      if (profileIsFallback) {
        setCloudMessage("Cloud eingeschrÃ¤nkt: Profil konnte nicht bestÃ¤tigt werden. Die Rolle ist lokal abgeleitet und wird beim nÃ¤chsten erfolgreichen Profil-Sync Ã¼berschrieben.");
        setCloudStatus(navigator.onLine ? "limited" : "offline");
      } else if (optionalCloudErrorCount > 0) {
        setCloudMessage(`Cloud eingeschrÃ¤nkt: ${optionalCloudErrorCount} optionale Module konnten nicht synchronisiert werden.`);
        setCloudStatus(navigator.onLine ? "limited" : "offline");
      } else {
        setCloudMessage(pendingCount > 0 ? `${pendingCount} Ã„nderungen warten auf Synchronisation.` : migratedCount > 0 ? `${migratedCount} lokale DatensÃ¤tze wurden in die Cloud migriert.` : "");
      }
    } catch (error) {
      logCloudError("Login-Synchronisation", error);
      setCloudMessage(`Cloud-Synchronisation ist fehlgeschlagen. Lokaler Cache wird verwendet. ${describeCloudError(error)}`);
      if (activeSession.user) {
        setDataState(loadData(activeSession.user.id));
      }
      setCloudStatus(navigator.onLine ? "error" : "offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCloudData();
    if (!supabase) return undefined;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setCurrentUser(nextSession?.user ?? null);
      void refreshCloudData();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setCloudStatus("syncing");
      void flushSyncQueue().then((synced) => {
        setPendingSyncCount(getPendingSyncCount());
        setCloudMessage(synced > 0 ? `${synced} wartende Ã„nderungen wurden synchronisiert.` : "Synchronisiert.");
        void refreshCloudData();
      });
    };
    const handleOffline = () => setCloudStatus("offline");
    const handleQueueChange = () => {
      const pending = getPendingSyncCount();
      setPendingSyncCount(pending);
      if (pending > 0) {
        setCloudStatus(navigator.onLine ? "pending" : "offline");
        setCloudMessage(`${pending} Ã„nderungen warten auf Synchronisation.`);
      }
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("paddlio-sync-queue-changed", handleQueueChange);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("paddlio-sync-queue-changed", handleQueueChange);
    };
  }, []);

  const scheduleCloudSnapshotSync = (next: PaddleMotionData, activeProfile: CloudProfile) => {
    latestSyncDataRef.current = next;
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);

    const pending = getPendingSyncCount();
    setPendingSyncCount(pending);
    setCloudStatus(pending > 0 ? "pending" : "syncing");
    setCloudMessage("Ã„nderungen lokal gespeichert. Cloud-Sync wird vorbereitet.");

    syncTimeoutRef.current = window.setTimeout(() => {
      if (syncRunningRef.current || !latestSyncDataRef.current) return;
      const snapshot = latestSyncDataRef.current;
      latestSyncDataRef.current = null;
      syncRunningRef.current = true;

      void syncDataSnapshotToCloud(snapshot, activeProfile, activeProfile.club_id ?? undefined)
        .then((count) => {
          const nextPending = getPendingSyncCount();
          setPendingSyncCount(nextPending);
          setLastSyncAt(new Date().toISOString());
          setSyncCount(count + nextPending);
          setCloudStatus(nextPending > 0 ? "pending" : "connected");
          setCloudMessage(nextPending > 0 ? `${nextPending} Ã„nderungen warten auf Synchronisation.` : "Gespeichert und synchronisiert.");
        })
        .catch((error) => {
          logCloudError("Ã„nderungen speichern", error);
          setCloudStatus(navigator.onLine ? "error" : "offline");
          setCloudMessage(`Ã„nderungen wurden lokal gespeichert und werden spÃ¤ter synchronisiert. ${describeCloudError(error)}`);
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
      void refreshCloudData().then(() => setCloudMessage("Daten wurden zwischen GerÃ¤ten synchronisiert."));
    };
    const unsubscribers = [
      subscribeToUserTrainings(session.user.id, handleRealtimeChange),
      subscribeToTrainingFeedback({ userId: session.user.id }, handleRealtimeChange),
      subscribeToNotifications(session.user.id, handleRealtimeChange),
    ];

    if (profile?.club_id && profile.roles.some((role) => role === "Coach" || role === "TeamAdmin" || role === "Admin")) {
      unsubscribers.push(subscribeToCoachClub(profile.club_id, handleRealtimeChange));
      unsubscribers.push(subscribeToTrainingFeedback({ clubId: profile.club_id }, handleRealtimeChange));
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
    if (input.password !== input.passwordRepeat) return { ok: false, message: "Die PasswÃ¶rter stimmen nicht Ã¼berein." };
    const { data: result, error } = await client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
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
    if (result.user) {
      try {
        await ensureCloudProfile(result.user);
      } catch (error) {
        console.info("Profil wird nach E-Mail-BestÃ¤tigung automatisch erstellt.", error);
      }
    }
    await refreshCloudData();
    return {
      ok: true,
      message: result.session
        ? "Konto erstellt. Du bist als Athlete angemeldet. Rollen kÃ¶nnen spÃ¤ter im Adminbereich vergeben werden."
        : "Konto erstellt. Bitte bestÃ¤tige deine E-Mail, bevor du dich einloggst. Wenn Auto Confirm in Supabase aktiv ist, wirst du direkt angemeldet.",
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
    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Wenn die E-Mail existiert, wurde ein Link zum ZurÃ¼cksetzen gesendet." };
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
    lastSyncAt,
    cloudMessage,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshCloudData,
  }), [session, currentUser, profile, club, data, loading, cloudStatus, syncCount, pendingSyncCount, lastSyncAt, cloudMessage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

