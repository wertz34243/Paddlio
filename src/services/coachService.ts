import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import type { CloudProfile } from "./profileService";
import { addCloudProfileRole } from "./profileService";

export type CloudTrainerRequest = Database["public"]["Tables"]["trainer_requests"]["Row"];
export type CloudTrainingGroup = Database["public"]["Tables"]["training_groups"]["Row"];
export type CloudGroupMember = Database["public"]["Tables"]["group_members"]["Row"];

export const listCloudTrainerRequests = async (): Promise<CloudTrainerRequest[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from("trainer_requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const createCloudTrainerRequest = async (input: Database["public"]["Tables"]["trainer_requests"]["Insert"]): Promise<CloudTrainerRequest | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await (client.from("trainer_requests") as any).insert(input).select("*").maybeSingle();
  if (error) throw error;
  return data;
};

export const reviewCloudTrainerRequest = async (id: string, status: "approved" | "rejected", reviewerId: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await (client.from("trainer_requests") as any).update({ status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
};

export const approveCloudTrainerRequest = async (request: CloudTrainerRequest, profile: CloudProfile, reviewerId: string): Promise<void> => {
  await addCloudProfileRole(profile, "Coach");
  await reviewCloudTrainerRequest(request.id, "approved", reviewerId);
};

export const listCloudTrainingGroups = async (): Promise<CloudTrainingGroup[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from("training_groups").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const upsertCloudTrainingGroup = async (input: Database["public"]["Tables"]["training_groups"]["Insert"] & { id?: string }): Promise<CloudTrainingGroup | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await (client.from("training_groups") as any)
    .upsert(input, { onConflict: "id" })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const setCloudTrainingGroupStatus = async (id: string, status: "active" | "inactive"): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await (client.from("training_groups") as any).update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
};

export const listCloudGroupMembers = async (): Promise<CloudGroupMember[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from("group_members").select("*");
  if (error) throw error;
  return data ?? [];
};

export const setCloudGroupMembers = async (groupId: string, athleteIds: string[]): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const { error: deleteError } = await client.from("group_members").delete().eq("group_id", groupId);
  if (deleteError) throw deleteError;

  if (athleteIds.length === 0) return;
  const { error } = await (client.from("group_members") as any).insert(
    athleteIds.map((athleteId) => ({ group_id: groupId, athlete_id: athleteId })),
  );
  if (error) throw error;
};

export const setCloudAthleteGroups = async (athleteId: string, groupIds: string[]): Promise<void> => {
  const client = getSupabaseClient();
  if (!client) return;

  const { error: deleteError } = await client.from("group_members").delete().eq("athlete_id", athleteId);
  if (deleteError) throw deleteError;

  if (groupIds.length === 0) return;
  const { error } = await (client.from("group_members") as any).insert(
    groupIds.map((groupId) => ({ group_id: groupId, athlete_id: athleteId })),
  );
  if (error) throw error;
};
