import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type { Database, UserRole } from "../lib/database.types";

export type CloudProfile = Database["public"]["Tables"]["profiles"]["Row"];

const createProfileAbort = (timeoutMs = 6500) => {
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
    return data;
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
  const email = user.email;
  const isUuid = (value: unknown): value is string =>
    typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const existing = await getCloudProfile(user.id);
  if (existing) return existing;

  const abort = createProfileAbort();
  const { data, error } = await (client.from("profiles") as any)
    .insert({
      id: user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`.trim() || email,
      club_id: isUuid(metadata.clubId) ? metadata.clubId : null,
      roles: ["Athlete"],
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
  return data;
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

  let query = client.from("profiles").select("*").order("display_name", { ascending: true });
  if (!viewer.roles.includes("Admin")) {
    if (!viewer.club_id) return [viewer];
    query = query.eq("club_id", viewer.club_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};
