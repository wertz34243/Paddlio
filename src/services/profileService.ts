import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type { Database, Json, UserRole } from "../lib/database.types";
import type { UserProfile } from "../domain/types";
import { listCloudClubs } from "./clubService";
import { runCloudWrite, type CloudWriteResult } from "./cloudWriteService";

export type CloudProfile = Database["public"]["Tables"]["profiles"]["Row"];
type CloudProfileUpdate = Partial<CloudProfile> & { id: string; profile_data?: Json };
export type ConfirmedCloudProfileWrite = {
  status: CloudWriteResult;
  profile: CloudProfile | null;
};
type VisibleContactProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  club_id: string | null;
  roles: UserRole[] | null;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizeCloudRoles = (roles: UserRole[] = ["Athlete"]): UserRole[] =>
  Array.from(new Set(roles.length > 0 ? roles : ["Athlete"]));

export const buildCloudRoles = (_email: string, _metadata: SupabaseUser["user_metadata"] | null | undefined, fallback: UserRole[] = ["Athlete"]): UserRole[] =>
  normalizeCloudRoles(fallback);

const normalizeCloudProfile = (profile: CloudProfile): CloudProfile => ({
  ...profile,
  email: normalizeEmail(profile.email),
  roles: normalizeCloudRoles(profile.roles.length > 0 ? profile.roles : ["Athlete"]),
});

export const mergeVisibleContactProfiles = (
  profiles: CloudProfile[],
  contacts: VisibleContactProfile[],
  fallback: CloudProfile,
): CloudProfile[] => {
  const merged = new Map(profiles.map((profile) => [profile.id, profile]));
  contacts.forEach((contact) => {
    if (merged.has(contact.id)) return;
    merged.set(contact.id, normalizeCloudProfile({
      ...fallback,
      id: contact.id,
      email: "",
      first_name: contact.first_name,
      last_name: contact.last_name,
      display_name: contact.display_name,
      club_id: contact.club_id,
      roles: normalizeCloudRoles(contact.roles ?? ["Athlete"]),
      profile_data: {},
    }));
  });
  return Array.from(merged.values());
};

export const mergeConfirmedUserProfile = (
  submitted: UserProfile,
  confirmed: CloudProfile | null,
  canonicalClub: string,
): UserProfile => {
  if (!confirmed) return { ...submitted, club: canonicalClub };
  const profileData = confirmed.profile_data && typeof confirmed.profile_data === "object" && !Array.isArray(confirmed.profile_data)
    ? confirmed.profile_data as Partial<UserProfile>
    : {};
  const boatClasses = confirmed.boat_classes.filter((boat): boat is "K1" | "C1" => boat === "K1" || boat === "C1");

  return {
    ...submitted,
    ...profileData,
    firstName: confirmed.first_name ?? submitted.firstName,
    lastName: confirmed.last_name ?? submitted.lastName,
    nickname: confirmed.display_name ?? submitted.nickname,
    club: canonicalClub,
    ageClass: (confirmed.age_category ?? submitted.ageClass) as UserProfile["ageClass"],
    boatClasses: boatClasses.length > 0 ? boatClasses : submitted.boatClasses,
    paddleSide: confirmed.paddle_side === "Links" ? "links" : confirmed.paddle_side === "Rechts" ? "rechts" : submitted.paddleSide,
    profileImageDataUrl: confirmed.avatar_url ?? submitted.profileImageDataUrl,
  };
};

const profileNeedsNormalization = (profile: CloudProfile): boolean => {
  const normalized = normalizeCloudProfile(profile);
  return normalized.email !== profile.email || normalized.roles.join("|") !== profile.roles.join("|");
};

const createProfileAbort = (timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeoutId),
  };
};

const normalizeClubLookup = (value: unknown): string =>
  typeof value === "string"
    ? value
        .toLowerCase()
        .replace(/[^a-z0-9äöüß]+/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

const resolveSignupClubId = async (metadata: SupabaseUser["user_metadata"] | null | undefined): Promise<string | null> => {
  if (!metadata || typeof metadata !== "object") return null;
  const isUuid = (value: unknown): value is string =>
    typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const rawClubId = isUuid(metadata.clubId) ? metadata.clubId : null;
  const rawClubName = normalizeClubLookup(metadata.club);

  try {
    const activeClubs = (await listCloudClubs()).filter((club) => club.status === "active");
    if (rawClubId && activeClubs.some((club) => club.id === rawClubId)) return rawClubId;

    if (rawClubName) {
      const matches = activeClubs.filter(
        (club) => normalizeClubLookup(club.name) === rawClubName || normalizeClubLookup(club.short_name) === rawClubName,
      );
      const uniqueIds = Array.from(new Set(matches.map((club) => club.id)));
      if (uniqueIds.length === 1) return uniqueIds[0];
    }
  } catch (error) {
    console.info("[Paddlio Cloud] Verein konnte beim Profil-Fallback nicht validiert werden.", error);
  }

  return null;
};

export const getCloudProfile = async (userId: string): Promise<CloudProfile | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const abort = createProfileAbort();
  try {
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).abortSignal(abort.signal).maybeSingle();
    if (error) throw error;
    return data ? normalizeCloudProfile(data) : null;
  } finally {
    abort.clear();
  }
};

export const ensureCloudProfile = async (user: SupabaseUser): Promise<CloudProfile | null> => {
  const client = getSupabaseClient();
  if (!client || !user.email) return null;

  const metadata = user.user_metadata ?? {};
  const firstName = String(metadata.firstName ?? "");
  const lastName = String(metadata.lastName ?? "");
  const email = normalizeEmail(user.email);
  const metadataClubId = await resolveSignupClubId(metadata);

  const existing = await getCloudProfile(user.id);
  if (existing) {
    const needsProfileRepair =
      profileNeedsNormalization(existing) ||
      existing.email !== email;
    if (!needsProfileRepair) return existing;
    const { data, error } = await (client.from("profiles") as any)
      .update({ email, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeCloudProfile(data) : existing;
  }

  try {
    const abort = createProfileAbort(15000);
    let data: unknown = null;
    let error: unknown = null;
    try {
      const result = await (client as any)
        .rpc("paddlio_ensure_profile_415", {
          p_user_id: user.id,
          p_email: email,
          p_first_name: firstName,
          p_last_name: lastName,
          p_display_name: `${firstName} ${lastName}`.trim() || email,
          p_club_id: metadataClubId,
        })
        .abortSignal(abort.signal);
      data = result.data;
      error = result.error;
    } finally {
      abort.clear();
    }

    if (!error && data) {
      const profileRow = Array.isArray(data) ? data[0] : data;
      if (profileRow) return normalizeCloudProfile(profileRow as CloudProfile);
    }

    if (error) {
      console.warn("[Paddlio Cloud] Server-Profilfunktion nicht verfügbar, Client-Fallback wird genutzt.", error);
    }
  } catch (error) {
    console.warn("[Paddlio Cloud] Server-Profilfunktion Timeout/Fallback.", error);
  }

  const abort = createProfileAbort();
  let data: CloudProfile | null = null;
  let error: unknown = null;
  try {
    const result = await (client.from("profiles") as any)
      .insert({
        id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`.trim() || email,
        club_id: metadataClubId,
        roles: ["Athlete"],
        status: "active",
        boat_classes: ["K1"],
      })
      .select("*")
      .abortSignal(abort.signal)
      .maybeSingle();
    data = result.data;
    error = result.error;
  } finally {
    abort.clear();
  }

  if (error) {
    const code = typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : "";
    if (code === "23505") return getCloudProfile(user.id);
    throw error;
  }
  return data ? normalizeCloudProfile(data) : null;
};

export const updateCloudProfileConfirmed = async (profile: CloudProfileUpdate): Promise<ConfirmedCloudProfileWrite> => {
  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      display_name: profile.display_name,
      club_id: profile.club_id,
      avatar_url: profile.avatar_url,
      age_category: profile.age_category,
      boat_classes: profile.boat_classes,
      paddle_side: profile.paddle_side,
      updated_at: new Date().toISOString(),
    };

    if ("profile_data" in profile) {
      payload.profile_data = (profile as CloudProfileUpdate).profile_data ?? {};
    }

    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  };

  const updatePayload = buildPayload();
  const queuePayload = { id: profile.id, ...updatePayload };
  let confirmedProfile: CloudProfile | null = null;
  const status = await runCloudWrite("profiles", "update", queuePayload, async (client) => {
    const { data, error } = await (client.from("profiles") as any)
      .update(updatePayload)
      .eq("id", profile.id)
      .select("*")
      .maybeSingle();
    if (!error && data) confirmedProfile = normalizeCloudProfile(data as CloudProfile);
    return { error };
  });

  if (status === "synced" && !confirmedProfile) {
    throw new Error("profile_update_not_confirmed");
  }
  return { status, profile: confirmedProfile };
};

export const updateCloudProfile = async (profile: CloudProfileUpdate): Promise<CloudWriteResult> =>
  (await updateCloudProfileConfirmed(profile)).status;

export const updateCloudProfileAdminFields = async (
  id: string,
  fields: {
    roles?: CloudProfile["roles"];
    status?: CloudProfile["status"];
    club_id?: string | null;
    age_category?: string | null;
    boat_classes?: string[];
    paddle_side?: string | null;
  },
): Promise<CloudProfile | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await (client.from("profiles") as any)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertCloudClubMembership = async (input: {
  userId: string;
  clubId: string;
  role: "Athlete" | "Coach" | "ClubAdmin" | "Admin";
  status: "active" | "pending" | "inactive";
}): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await (client.from("club_memberships") as any)
    .upsert({
      club_id: input.clubId,
      user_id: input.userId,
      role: input.role,
      status: input.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: "club_id,user_id" });
  if (error) throw error;
};

export const setCloudUserClubAssignment = async (input: {
  userId: string;
  clubId: string;
  role: "Athlete" | "Coach" | "ClubAdmin" | "Admin";
  status: "active" | "pending" | "inactive";
}): Promise<void> => {
  await updateCloudProfileAdminFields(input.userId, {
    club_id: input.status === "inactive" ? null : input.clubId || null,
    roles: normalizeCloudRoles(input.role === "Athlete" ? ["Athlete"] : ["Athlete", input.role]),
    status: input.status === "active" || input.status === "pending" ? "active" : "disabled",
  });

  if (input.clubId) await upsertCloudClubMembership(input);
};

export const addCloudProfileRole = async (profile: CloudProfile, role: "Athlete" | "Coach" | "TeamAdmin" | "ClubAdmin" | "Admin"): Promise<CloudProfile | null> => {
  const roles = Array.from(new Set([...(profile.roles.length > 0 ? profile.roles : ["Athlete" as UserRole]), role]));
  return updateCloudProfileAdminFields(profile.id, { roles });
};

export const setCloudProfilePrimaryRole = async (profile: CloudProfile, role: "Athlete" | "Coach" | "TeamAdmin" | "ClubAdmin" | "Admin"): Promise<CloudProfile | null> => {
  const roles: UserRole[] = role === "Athlete" ? ["Athlete"] : Array.from(new Set(["Athlete" as UserRole, role]));
  return updateCloudProfileAdminFields(profile.id, { roles });
};

export const listCloudProfiles = async (viewer: CloudProfile): Promise<CloudProfile[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const isAdmin = viewer.roles.includes("Admin");
  const isCoachLike = viewer.roles.some((role) => role === "Coach" || role === "TeamAdmin" || role === "ClubAdmin");
  let profiles: CloudProfile[] = [viewer];

  if (isAdmin || (isCoachLike && viewer.club_id)) {
    let query = client.from("profiles").select("*").order("display_name", { ascending: true });
    if (!isAdmin) query = query.eq("club_id", viewer.club_id!);
    const { data, error } = await query;
    if (error) throw error;
    profiles = (data ?? []).map(normalizeCloudProfile);
  }

  const { data: contacts, error: contactError } = await (client as any).rpc("paddlio_visible_contact_profiles_20261002");
  if (contactError) throw contactError;
  return mergeVisibleContactProfiles(profiles, (contacts ?? []) as VisibleContactProfile[], viewer);
};

