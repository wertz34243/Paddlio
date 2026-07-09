import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type { Database, UserRole } from "../lib/database.types";

export type CloudProfile = Database["public"]["Tables"]["profiles"]["Row"];

const ADMIN_EMAIL = "t.kanu@outlook.com";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizeCloudRolesForEmail = (email: string, roles: UserRole[] = ["Athlete"]): UserRole[] => {
  const normalized = normalizeEmail(email);
  const safeRoles = roles.length > 0 ? roles : ["Athlete"];
  const nextRoles = normalized === ADMIN_EMAIL
    ? ([...safeRoles, "Athlete", "Coach", "Admin"] as UserRole[])
    : ([...safeRoles, "Athlete"] as UserRole[]);

  return Array.from(new Set(nextRoles));
};

const normalizeCloudProfile = (profile: CloudProfile): CloudProfile => ({
  ...profile,
  email: normalizeEmail(profile.email),
  roles: normalizeCloudRolesForEmail(profile.email, profile.roles.length > 0 ? profile.roles : ["Athlete"]),
});

const profileNeedsNormalization = (profile: CloudProfile): boolean => {
  const normalized = normalizeCloudProfile(profile);
  return normalized.email !== profile.email || normalized.roles.join("|") !== profile.roles.join("|");
};

const createProfileAbort = (timeoutMs = 4500) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeoutId),
  };
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
  const roles = normalizeCloudRolesForEmail(email, ["Athlete"]);
  const isUuid = (value: unknown): value is string =>
    typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const metadataClubId = isUuid(metadata.clubId) ? metadata.clubId : null;

  try {
    const abort = createProfileAbort(5000);
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

  const existing = await getCloudProfile(user.id);
  if (existing) {
    if (!profileNeedsNormalization(existing)) return existing;
    const { data, error } = await (client.from("profiles") as any)
      .update({ email, roles, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeCloudProfile(data) : existing;
  }

  const abort = createProfileAbort();
  const { data, error } = await (client.from("profiles") as any)
    .insert({
      id: user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`.trim() || email,
      club_id: metadataClubId,
      roles,
      status: "active",
      boat_classes: ["K1"],
    })
    .select("*")
    .abortSignal(abort.signal)
    .maybeSingle()
    .finally(() => abort.clear());

  if (error) {
    const code = typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : "";
    if (code === "23505") return getCloudProfile(user.id);
    throw error;
  }
  return data ? normalizeCloudProfile(data) : null;
};

export const updateCloudProfile = async (profile: Partial<CloudProfile> & { id: string }): Promise<CloudProfile | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await (client.from("profiles") as any)
    .update({
      first_name: profile.first_name,
      last_name: profile.last_name,
      display_name: profile.display_name,
      club_id: profile.club_id,
      avatar_url: profile.avatar_url,
      age_category: profile.age_category,
      boat_classes: profile.boat_classes,
      paddle_side: profile.paddle_side,
    })
    .eq("id", profile.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
};

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
    roles: normalizeCloudRolesForEmail("", input.role === "Athlete" ? ["Athlete"] : ["Athlete", input.role]),
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
  if (!isAdmin && !isCoachLike) return [viewer];

  let query = client.from("profiles").select("*").order("display_name", { ascending: true });
  if (!isAdmin) {
    if (!viewer.club_id) return [viewer];
    query = query.eq("club_id", viewer.club_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};
