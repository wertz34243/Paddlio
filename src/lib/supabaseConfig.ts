const normalizeEnvValue = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const SUPABASE_PROJECT_ID = "twlkhfbrrwjwppxinmpn";
export const SUPABASE_PROJECT_URL = "https://twlkhfbrrwjwppxinmpn.supabase.co";

const rawSupabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL) ?? SUPABASE_PROJECT_URL;
const rawSupabaseAnonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

const isValidSupabaseUrl = (value: string | undefined): value is string => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
};

export const supabaseUrl = isValidSupabaseUrl(rawSupabaseUrl) ? rawSupabaseUrl : SUPABASE_PROJECT_URL;

export const supabaseAnonKey = rawSupabaseAnonKey;

export const supabaseConfigIssues = [
  rawSupabaseUrl && !supabaseUrl ? "VITE_SUPABASE_URL ist keine gueltige Supabase-URL" : undefined,
  !rawSupabaseAnonKey ? "VITE_SUPABASE_ANON_KEY fehlt" : undefined,
].filter((issue): issue is string => Boolean(issue));

export const isSupabaseConfigured = supabaseConfigIssues.length === 0;

export const getSupabaseConfigMessage = (): string => {
  if (isSupabaseConfigured) return "Supabase ist konfiguriert.";
  return `Supabase ist noch nicht vollstaendig konfiguriert: ${supabaseConfigIssues.join(", ")}. Bitte VITE_SUPABASE_ANON_KEY in Vercel oder .env.local eintragen.`;
};
