import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../lib/database.types";

export type CloudClub = Database["public"]["Tables"]["clubs"]["Row"];
export type CloudClubRequest = Database["public"]["Tables"]["club_requests"]["Row"];

export const listCloudClubs = async (): Promise<CloudClub[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from("clubs").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const upsertCloudClub = async (input: Database["public"]["Tables"]["clubs"]["Insert"] & { id?: string }): Promise<CloudClub | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await (client.from("clubs") as any)
    .upsert(input, { onConflict: "id" })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const setCloudClubStatus = async (id: string, status: "active" | "inactive"): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await (client.from("clubs") as any).update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
};

export const listCloudClubRequests = async (): Promise<CloudClubRequest[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from("club_requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const reviewCloudClubRequest = async (
  request: CloudClubRequest,
  status: "approved" | "rejected",
  reviewerId: string,
  clubPatch?: Partial<Database["public"]["Tables"]["clubs"]["Insert"]>,
): Promise<CloudClub | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  let club: CloudClub | null = null;
  if (status === "approved") {
    club = await upsertCloudClub({
      name: clubPatch?.name ?? request.name,
      short_name: clubPatch?.short_name ?? request.short_name ?? "",
      city: clubPatch?.city ?? request.city ?? "",
      contact_name: clubPatch?.contact_name ?? "",
      contact_email: clubPatch?.contact_email ?? "",
      website: clubPatch?.website ?? "",
      logo_url: clubPatch?.logo_url ?? "",
      primary_color: clubPatch?.primary_color ?? "#00B4D8",
      secondary_color: clubPatch?.secondary_color ?? "#0077B6",
      status: clubPatch?.status ?? "active",
    });

    if (club && request.requested_by) {
      const profilesTable = client.from("profiles") as any;
      const { error: profileError } = await profilesTable
        .update({ club_id: club.id, updated_at: new Date().toISOString() })
        .eq("id", request.requested_by);
      if (profileError) throw profileError;
    }
  }

  const clubRequestsTable = client.from("club_requests") as any;
  const { error } = await clubRequestsTable
    .update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", request.id);
  if (error) throw error;

  return club;
};
