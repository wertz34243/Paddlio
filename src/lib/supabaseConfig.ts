const normalizeEnvValue = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const rawSupabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
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

export const supabaseUrl = isValidSupabaseUrl(rawSupabaseUrl) ? rawSupabaseUrl : undefined;

export const supabaseAnonKey = rawSupabaseAnonKey;

export const supabaseConfigIssues = [
  !rawSupabaseUrl ? "VITE_SUPABASE_URL fehlt" : undefined,
  rawSupabaseUrl && !supabaseUrl ? "VITE_SUPABASE_URL ist keine gueltige Supabase-URL" : undefined,
  !rawSupabaseAnonKey ? "VITE_SUPABASE_ANON_KEY fehlt" : undefined,
].filter((issue): issue is string => Boolean(issue));

export const isSupabaseConfigured = supabaseConfigIssues.length === 0;

export const getSupabaseConfigMessage = (): string => {
  if (isSupabaseConfigured) return "Supabase ist konfiguriert.";
  return `Supabase ist noch nicht konfiguriert: ${supabaseConfigIssues.join(", ")}. Bitte die Vercel Environment Variables setzen und neu deployen.`;
};
