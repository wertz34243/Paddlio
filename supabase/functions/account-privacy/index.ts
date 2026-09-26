import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CONFIRMATION = "KONTO ENDGUELTIG LOESCHEN";
const DEFAULT_ALLOWED_ORIGINS = ["https://dev.paddlio.de", "http://localhost:5173", "http://127.0.0.1:5173"];

type ExportSpec = { table: string; filters: string[]; select?: string };

const exportSpecs: ExportSpec[] = [
  { table: "profiles", filters: ["id"] },
  { table: "club_requests", filters: ["requested_by"] },
  { table: "trainer_requests", filters: ["user_id", "reviewed_by"] },
  { table: "club_memberships", filters: ["user_id"] },
  { table: "group_memberships", filters: ["user_id"] },
  { table: "group_members", filters: ["athlete_id"] },
  { table: "training_groups", filters: ["coach_id"] },
  { table: "season_goals", filters: ["athlete_id", "assigned_by"] },
  { table: "training_templates", filters: ["owner_id", "created_by"] },
  { table: "training_plan_items", filters: ["owner_id", "assigned_athlete_id", "coach_id"] },
  { table: "training_feedback", filters: ["athlete_id", "author_id", "coach_id"] },
  { table: "training_journal_entries", filters: ["athlete_id"] },
  { table: "competitions", filters: ["user_id", "created_by"] },
  { table: "competition_results", filters: ["athlete_id", "created_by"] },
  { table: "materials", filters: ["athlete_id"] },
  { table: "notifications", filters: ["user_id"] },
  { table: "smart_coach_recommendations", filters: ["owner_user_id", "created_for_user_id"] },
  { table: "direct_messages", filters: ["sender_id", "receiver_id"] },
  { table: "group_messages", filters: ["sender_id"] },
  { table: "club_messages", filters: ["sender_id", "target_user_id"] },
  { table: "club_posts", filters: ["author_id", "target_user_id"] },
  { table: "tasks", filters: ["user_id", "owner_id", "created_by"] },
  { table: "task_assignments", filters: ["assigned_to", "user_id"] },
  { table: "training_attendance", filters: ["athlete_id", "user_id"] },
  { table: "file_attachments", filters: ["owner_id", "user_id"] },
  { table: "result_imports", filters: ["owner_id", "user_id"] },
  { table: "personal_bests", filters: ["owner_id", "user_id"] },
  { table: "external_connections", filters: ["owner_id", "user_id"] },
  { table: "external_training_sessions", filters: ["owner_id", "user_id"] },
  { table: "beta_readiness_checks", filters: ["user_id"] },
  { table: "beta_feedback", filters: ["user_id"] },
  { table: "beta_testers", filters: ["user_id"] },
  { table: "boats", filters: ["owner_id", "user_id"] },
  { table: "club_material", filters: ["owner_id", "user_id"] },
  { table: "club_events", filters: ["user_id", "created_by"] },
  { table: "club_documents", filters: ["owner_id", "created_by"] },
  { table: "academy_progress", filters: ["user_id"] },
  { table: "academy_courses", filters: ["created_by"] },
  { table: "academy_lessons", filters: ["created_by"] },
  { table: "academy_learning_paths", filters: ["created_by"] },
  { table: "academy_media", filters: ["created_by"] },
  { table: "academy_assignments", filters: ["assigned_to", "assigned_by"] },
  { table: "academy_quiz_attempts", filters: ["user_id"] },
  { table: "academy_favorites", filters: ["user_id"] },
  { table: "import_jobs", filters: ["user_id"] },
  { table: "import_profiles", filters: ["user_id"] },
  { table: "export_jobs", filters: ["user_id"] },
  { table: "device_connections", filters: ["user_id"], select: "id,user_id,provider,provider_user_id,status,last_sync_at,error_message,metadata,created_at,updated_at" },
  { table: "polar_accounts", filters: ["user_id"], select: "id,user_id,polar_user_id,status,last_sync_at,error_message,created_at,updated_at" },
  { table: "polar_sync_jobs", filters: ["user_id"] },
  { table: "polar_training_imports", filters: ["user_id"], select: "id,user_id,provider_activity_id,title,sport_type,started_at,duration_seconds,distance_meters,avg_heart_rate,max_heart_rate,calories,training_load,recovery_status,cardio_load,running_index,training_benefit,heart_rate_samples,heart_rate_zones,gps_route,zone_summary,material_context,linked_training_id,created_at,updated_at" },
  { table: "audit_logs", filters: ["actor_id"] },
];

const deleteSpecs: ExportSpec[] = [
  { table: "academy_quiz_attempts", filters: ["user_id"] },
  { table: "academy_favorites", filters: ["user_id"] },
  { table: "academy_progress", filters: ["user_id"] },
  { table: "academy_assignments", filters: ["assigned_to", "assigned_by"] },
  { table: "polar_training_imports", filters: ["user_id"] },
  { table: "polar_sync_jobs", filters: ["user_id"] },
  { table: "polar_oauth_states", filters: ["user_id"] },
  { table: "polar_accounts", filters: ["user_id"] },
  { table: "device_connections", filters: ["user_id"] },
  { table: "import_rows", filters: [] },
  { table: "export_jobs", filters: ["user_id"] },
  { table: "import_profiles", filters: ["user_id"] },
  { table: "import_jobs", filters: ["user_id"] },
  { table: "training_feedback", filters: ["athlete_id", "author_id", "coach_id"] },
  { table: "training_journal_entries", filters: ["athlete_id"] },
  { table: "task_assignments", filters: ["assigned_to", "user_id"] },
  { table: "training_attendance", filters: ["athlete_id", "user_id"] },
  { table: "notifications", filters: ["user_id"] },
  { table: "direct_messages", filters: ["sender_id", "receiver_id"] },
  { table: "group_messages", filters: ["sender_id"] },
  { table: "club_messages", filters: ["sender_id", "target_user_id"] },
  { table: "club_posts", filters: ["author_id", "target_user_id"] },
  { table: "file_attachments", filters: ["owner_id", "user_id"] },
  { table: "tasks", filters: ["user_id", "owner_id", "created_by"] },
  { table: "result_imports", filters: ["owner_id", "user_id"] },
  { table: "personal_bests", filters: ["owner_id", "user_id"] },
  { table: "external_connections", filters: ["owner_id", "user_id"] },
  { table: "external_training_sessions", filters: ["owner_id", "user_id"] },
  { table: "beta_readiness_checks", filters: ["user_id"] },
  { table: "beta_feedback", filters: ["user_id"] },
  { table: "beta_testers", filters: ["user_id"] },
  { table: "competition_results", filters: ["athlete_id", "created_by"] },
  { table: "competitions", filters: ["user_id", "created_by"] },
  { table: "materials", filters: ["athlete_id"] },
  { table: "season_goals", filters: ["athlete_id", "assigned_by"] },
  { table: "training_templates", filters: ["owner_id", "created_by"] },
  { table: "training_plan_items", filters: ["owner_id"] },
  { table: "smart_coach_recommendations", filters: ["owner_user_id", "created_for_user_id"] },
  { table: "boats", filters: ["owner_id", "user_id"] },
  { table: "club_material", filters: ["owner_id", "user_id"] },
  { table: "club_events", filters: ["user_id", "created_by"] },
  { table: "club_documents", filters: ["owner_id", "created_by"] },
  { table: "group_members", filters: ["athlete_id"] },
  { table: "group_memberships", filters: ["user_id"] },
  { table: "club_memberships", filters: ["user_id"] },
  { table: "trainer_requests", filters: ["user_id"] },
  { table: "club_requests", filters: ["requested_by"] },
];

function allowedOrigins(): string[] {
  return (Deno.env.get("PADDLIO_ALLOWED_ORIGINS") ?? DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = origin && allowedOrigins().includes(origin) ? origin : allowedOrigins()[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function response(origin: string | null, body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status, headers: { ...corsHeaders(origin), "Cache-Control": "no-store" } });
}

function scopeFilter(filters: string[], userId: string): string {
  return filters.map((field) => `${field}.eq.${userId}`).join(",");
}

const identityFields = new Set(["athlete_id", "assigned_athlete_id", "assigned_to", "assigned_by", "author_id", "coach_id", "created_by", "owner_id", "owner_user_id", "receiver_id", "sender_id", "sender_user_id", "target_user_id", "trainer_user_id", "uploaded_by_user_id", "user_id"]);

function redactOtherIdentities(value: unknown, userId: string): unknown {
  if (Array.isArray(value)) return value.map((item) => redactOtherIdentities(item, userId));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key,
    identityFields.has(key) && typeof item === "string" && item !== userId ? "[andere Person]" : redactOtherIdentities(item, userId),
  ]));
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return response(origin, { error: "method_not_allowed" }, 405);
  if (origin && !allowedOrigins().includes(origin)) return response(origin, { error: "origin_not_allowed" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) return response(origin, { error: "service_unavailable" }, 503);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return response(origin, { error: "not_authenticated" }, 401);
  const user = authData.user;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: callerProfile } = await admin.from("profiles").select("roles,status").eq("id", user.id).maybeSingle();
  const canSeeDevelopmentDiagnostics = supabaseUrl.includes("nlllqsfdhfiwticrcrnp")
    && callerProfile?.status === "active"
    && Array.isArray(callerProfile.roles)
    && callerProfile.roles.includes("Admin");

  let payload: { action?: string; confirmation?: string; confirmAccountId?: string };
  try {
    payload = await req.json();
  } catch {
    return response(origin, { error: "invalid_request" }, 400);
  }

  if (payload.action === "export") {
    const datasets: Record<string, unknown> = {};
    for (const spec of exportSpecs) {
      const { data, error } = await admin.from(spec.table).select(spec.select ?? "*").or(scopeFilter(spec.filters, user.id));
      if (error) {
        console.error("account_privacy_export_failed", { table: spec.table, code: error.code });
        return response(origin, {
          error: "export_failed",
          ...(canSeeDevelopmentDiagnostics ? { diagnostic: { table: spec.table, code: error.code } } : {}),
        }, 500);
      }
      datasets[spec.table] = redactOtherIdentities(data ?? [], user.id);
    }
    return response(origin, {
      export: {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        account: { id: user.id, email: user.email ?? null, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null },
        datasets,
      },
    });
  }

  if (payload.action === "delete") {
    if (payload.confirmation !== CONFIRMATION || payload.confirmAccountId !== user.id) return response(origin, { error: "confirmation_required" }, 400);

    // Remove rows owned by this account. Shared plans are retained, while their personal assignment is detached.
    const detachOperations = [
      admin.from("training_plan_items").update({ assigned_athlete_id: null }).eq("assigned_athlete_id", user.id).neq("owner_id", user.id),
      admin.from("training_plan_items").update({ coach_id: null }).eq("coach_id", user.id).neq("owner_id", user.id),
      admin.from("training_groups").update({ coach_id: null }).eq("coach_id", user.id),
      admin.from("audit_logs").update({ actor_id: null }).eq("actor_id", user.id),
      admin.from("academy_courses").update({ created_by: null }).eq("created_by", user.id),
      admin.from("academy_lessons").update({ created_by: null }).eq("created_by", user.id),
      admin.from("academy_learning_paths").update({ created_by: null }).eq("created_by", user.id),
      admin.from("academy_media").update({ created_by: null }).eq("created_by", user.id),
    ];
    for (const operation of detachOperations) {
      const { error } = await operation;
      if (error) {
        console.error("account_privacy_detach_failed", { code: error.code });
        return response(origin, {
          error: "delete_failed",
          ...(canSeeDevelopmentDiagnostics ? { diagnostic: { table: "shared_identity_detach", code: error.code } } : {}),
        }, 500);
      }
    }

    for (const spec of deleteSpecs) {
      if (spec.table === "import_rows") continue;
      const { error } = await admin.from(spec.table).delete().or(scopeFilter(spec.filters, user.id));
      if (error) {
        console.error("account_privacy_delete_failed", { table: spec.table, code: error.code });
        return response(origin, {
          error: "delete_failed",
          ...(canSeeDevelopmentDiagnostics ? { diagnostic: { table: spec.table, code: error.code } } : {}),
        }, 500);
      }
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error("account_privacy_auth_delete_failed", { code: deleteUserError.code });
      return response(origin, {
        error: "delete_failed",
        ...(canSeeDevelopmentDiagnostics ? { diagnostic: { table: "auth.users", code: deleteUserError.code } } : {}),
      }, 500);
    }
    return response(origin, { deleted: true });
  }

  return response(origin, { error: "invalid_action" }, 400);
});
