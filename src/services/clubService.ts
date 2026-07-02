import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../lib/database.types";

export type CloudClub = Database["public"]["Tables"]["clubs"]["Row"];

export const listCloudClubs = async (): Promise<CloudClub[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from("clubs").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
};
