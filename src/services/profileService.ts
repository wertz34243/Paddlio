import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../lib/database.types";

export type CloudProfile = Database["public"]["Tables"]["profiles"]["Row"];

const adminEmail = "t.kanu@outlook.com";

export const getCloudProfile = async (userId: string): Promise<CloudProfile | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
};

export const ensureCloudProfile = async (user: SupabaseUser): Promise<CloudProfile | null> => {
  const client = getSupabaseClient();
  if (!client || !user.email) return null;

  const existing = await getCloudProfile(user.id);
  if (existing) return existing;

  const metadata = user.user_metadata ?? {};
  const firstName = String(metadata.firstName ?? "");
  const lastName = String(metadata.lastName ?? "");
  const email = user.email;
  const isUuid = (value: unknown): value is string =>
    typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const { data, error } = await (client.from("profiles") as any)
    .upsert({
      id: user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`.trim() || email,
      club_id: isUuid(metadata.clubId) ? metadata.clubId : null,
      roles: email.toLowerCase() === adminEmail ? ["Athlete", "Coach", "Admin"] : ["Athlete"],
      status: "active",
      boat_classes: ["K1"],
    }, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (error) throw error;
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
