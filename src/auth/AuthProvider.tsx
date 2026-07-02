import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, getSupabaseClient } from "../lib/supabase";
import { isSupabaseConfigured } from "../lib/supabaseConfig";
import {
  cacheCloudAuthUsers,
  cacheCloudClubs,
  cacheCloudTrainerRequests,
  loadData,
  saveData,
  type LoginInput,
  type RegisterInput,
} from "../data/storage";
import type {
  AuthUser,
  Club,
  CoachAthlete,
  CoachGroup,
  PaddleMotionData,
  TrainerRequest,
  User,
  UserRole,
} from "../domain/types";
import { ensureCloudProfile, getCloudProfile, listCloudProfiles, type CloudProfile } from "../services/profileService";
import { listCloudClubs, type CloudClub } from "../services/clubService";
import { listCloudTrainerRequests, listCloudTrainingGroups, type CloudTrainerRequest, type CloudTrainingGroup } from "../services/coachService";

export type CloudConnectionState = "connected" | "syncing" | "offline" | "disabled";

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
  cloudMessage: string;
  signIn: (input: LoginInput) => Promise<CloudAuthResult>;
  signUp: (input: RegisterInput) => Promise<CloudAuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<CloudAuthResult>;
  refreshCloudData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const toLocalRole = (role: string): UserRole =>
  role === "Admin" ? "admin" : role === "Coach" ? "coach" : role === "TeamAdmin" ? "teamAdmin" : "athlete";

const getPrimaryRole = (roles: string[]): UserRole => {
  if (roles.includes("Admin")) return "admin";
  if (roles.includes("Coach")) return "coach";
  if (roles.includes("TeamAdmin")) return "teamAdmin";
  return "athlete";
};

const toAuthUser = (profile: CloudProfile, clubName = ""): AuthUser => {
  const roles = profile.roles.map(toLocalRole);
  const displayName = profile.display_name || `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.email;
  return {
    userId: profile.id,
    email: profile.email,
    displayName,
    passwordHash: "",
    role: getPrimaryRole(profile.roles),
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

const toCoachGroup = (group: CloudTrainingGroup): CoachGroup => ({
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
  athleteIds: [],
  createdAt: group.created_at,
  updatedAt: group.updated_at,
});

const toCoachAthlete = (profile: CloudProfile, clubName = ""): CoachAthlete => ({
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
  groupId: "",
  groupIds: [],
  goals: "",
  trainerNotes: "",
  notes: "",
  status: profile.status === "active" ? "aktiv" : "pausiert",
  invitationStatus: "aktiv",
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

const mergeCloudData = (
  userId: string,
  profile: CloudProfile,
  clubs: Club[],
  profiles: CloudProfile[],
  groups: CloudTrainingGroup[],
): PaddleMotionData => {
  const club = clubs.find((item) => item.clubId === profile.club_id);
  const authUsers = profiles.map((item) => toAuthUser(item, clubs.find((clubItem) => clubItem.clubId === item.club_id)?.name ?? ""));
  cacheCloudAuthUsers(authUsers.length > 0 ? authUsers : [toAuthUser(profile, club?.name ?? "")]);
  cacheCloudClubs(clubs);

  const cached = loadData(userId);
  const localUser: User = {
    ...cached.users[0],
    id: userId,
    userId,
    role: getPrimaryRole(profile.roles),
    profile: {
      ...cached.users[0].profile,
      firstName: profile.first_name ?? cached.users[0].profile.firstName,
      lastName: profile.last_name ?? cached.users[0].profile.lastName,
      club: club?.name ?? cached.users[0].profile.club,
      ageClass: (profile.age_category ?? cached.users[0].profile.ageClass) as User["profile"]["ageClass"],
      boatClasses: profile.boat_classes.filter((boat): boat is "K1" | "C1" => boat === "K1" || boat === "C1"),
      paddleSide: profile.paddle_side === "Links" ? "links" : "rechts",
      profileImageDataUrl: profile.avatar_url ?? cached.users[0].profile.profileImageDataUrl,
    },
    updatedAt: profile.updated_at,
  };

  const nextData: PaddleMotionData = {
    ...cached,
    activeUserId: userId,
    users: [localUser],
    athlete: {
      ...cached.athlete,
      id: userId,
      name: localUser.profile.nickname || `${localUser.profile.firstName} ${localUser.profile.lastName}`.trim() || profile.email,
      club: club?.name ?? localUser.profile.club,
    },
    coachAthletes: profiles.filter((item) => item.roles.includes("Athlete")).map((item) => toCoachAthlete(item, clubs.find((clubItem) => clubItem.clubId === item.club_id)?.name ?? "")),
    coachGroups: groups.map(toCoachGroup),
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
  const [cloudMessage, setCloudMessage] = useState("");

  const refreshCloudData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setCloudStatus("disabled");
      setLoading(false);
      return;
    }

    const activeSession = (await supabase.auth.getSession()).data.session;
    if (!activeSession?.user) {
      setSession(null);
      setCurrentUser(null);
      setProfile(null);
      setDataState(null);
      setLoading(false);
      return;
    }

    try {
      setCloudStatus(navigator.onLine ? "syncing" : "offline");
      setSession(activeSession);
      setCurrentUser(activeSession.user);
      const nextProfile = (await ensureCloudProfile(activeSession.user)) ?? (await getCloudProfile(activeSession.user.id));
      if (!nextProfile) throw new Error("Profil konnte nicht geladen werden.");
      const clubs = (await listCloudClubs()).map(toClub);
      const allProfiles = await listCloudProfiles(nextProfile);
      const requests = (await listCloudTrainerRequests()).map(toTrainerRequest);
      const groups = await listCloudTrainingGroups();
      cacheCloudTrainerRequests(requests);
      const nextData = mergeCloudData(activeSession.user.id, nextProfile, clubs, allProfiles.length > 0 ? allProfiles : [nextProfile], groups);
      setProfile(nextProfile);
      setClub(clubs.find((item) => item.clubId === nextProfile.club_id) ?? null);
      setDataState(nextData);
      setSyncCount(allProfiles.length + clubs.length + requests.length + groups.length);
      setCloudMessage("");
      setCloudStatus(navigator.onLine ? "connected" : "offline");
    } catch (error) {
      console.error("Paddlio Cloud Synchronisation fehlgeschlagen", error);
      setCloudMessage("Cloud-Synchronisation ist fehlgeschlagen. Lokaler Cache wird verwendet.");
      if (activeSession.user) {
        setDataState(loadData(activeSession.user.id));
      }
      setCloudStatus(navigator.onLine ? "connected" : "offline");
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
      void refreshCloudData();
    };
    const handleOffline = () => setCloudStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const setData: AuthContextValue["setData"] = (updater) => {
    setDataState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (next && currentUser) {
        saveData(currentUser.id, next);
      }
      return next;
    });
  };

  const signIn = async (input: LoginInput): Promise<CloudAuthResult> => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: "Supabase ist noch nicht konfiguriert." };
    const { error } = await client.auth.signInWithPassword({ email: input.email.trim().toLowerCase(), password: input.password });
    if (error) return { ok: false, message: "E-Mail oder Passwort ist nicht korrekt." };
    await refreshCloudData();
    return { ok: true };
  };

  const signUp = async (input: RegisterInput): Promise<CloudAuthResult> => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: "Supabase ist noch nicht konfiguriert." };
    if (!input.privacyAccepted) return { ok: false, message: "Bitte akzeptiere den Datenschutz." };
    if (input.password !== input.passwordRepeat) return { ok: false, message: "Die Passwoerter stimmen nicht ueberein." };
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
    if (error) return { ok: false, message: error.message };
    if (result.user) {
      try {
        await ensureCloudProfile(result.user);
      } catch (error) {
        console.info("Profil wird nach E-Mail-Bestaetigung automatisch erstellt.", error);
      }
    }
    await refreshCloudData();
    return { ok: true, message: result.session ? undefined : "Bitte bestaetige deine E-Mail, bevor du dich einloggst." };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
    setProfile(null);
    setDataState(null);
  };

  const resetPassword = async (email: string): Promise<CloudAuthResult> => {
    const client = getSupabaseClient();
    if (!client) return { ok: false, message: "Supabase ist noch nicht konfiguriert." };
    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Wenn die E-Mail existiert, wurde ein Link zum Zuruecksetzen gesendet." };
  };

  const value = useMemo<AuthContextValue>(() => ({
    session,
    currentUser,
    profile,
    roles: profile?.roles.map(toLocalRole) ?? [],
    club,
    data,
    setData,
    loading,
    cloudStatus,
    syncCount,
    cloudMessage,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshCloudData,
  }), [session, currentUser, profile, club, data, loading, cloudStatus, syncCount, cloudMessage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
