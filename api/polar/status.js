import { requireUser, sendJson } from "../_polar.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return sendJson(res, 405, { error: "method_not_allowed" });
    const { supabase, user } = await requireUser(req);

    const [{ data: connection }, { data: imports }, { data: jobs }] = await Promise.all([
      supabase.from("device_connections").select("*").eq("user_id", user.id).eq("provider", "polar").maybeSingle(),
      supabase
        .from("polar_training_imports")
        .select("id, provider_activity_id, title, sport_type, started_at, duration_seconds, distance_meters, avg_heart_rate, max_heart_rate, calories, training_load, recovery_status, raw_data, linked_training_id, updated_at")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(20),
      supabase.from("polar_sync_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    sendJson(res, 200, {
      connected: connection?.status === "connected",
      connection: connection || null,
      imports: imports || [],
      jobs: jobs || [],
      requiredEnvironment: {
        polarClientConfigured: Boolean(process.env.POLAR_CLIENT_ID && process.env.POLAR_CLIENT_SECRET && process.env.POLAR_REDIRECT_URI),
        serverConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.POLAR_TOKEN_ENCRYPTION_KEY),
      },
    });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "polar_status_failed" });
  }
}
