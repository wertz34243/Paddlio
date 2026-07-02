import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../lib/database.types";

export type CloudTrainerRequest = Database["public"]["Tables"]["trainer_requests"]["Row"];
export type CloudTrainingGroup = Database["public"]["Tables"]["training_groups"]["Row"];

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

export const listCloudTrainingGroups = async (): Promise<CloudTrainingGroup[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from("training_groups").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
};
