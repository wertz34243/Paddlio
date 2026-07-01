import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./supabaseConfig";

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (!isSupabaseConfigured) {
    console.info(
      "Paddlio Cloud ist deaktiviert: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY sind nicht gesetzt. Die App nutzt weiter LocalStorage.",
    );
    return null;
  }

  return supabase;
};
