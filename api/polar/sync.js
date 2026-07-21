import { getValidPolarAccessToken, normalizePolarExercise, polarFetch, requirePost, requireUser, sendJson } from "../_polar.js";

const tryRegisterPolarUser = async (accessToken, userId) => {
  try {
    await polarFetch("/v3/users", accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "member-id": userId }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("409") && !message.includes("400")) throw error;
  }
};

const enrichExercise = async (exercise, accessToken) => {
  const id = exercise.id || exercise["exercise-id"];
  if (!id) return exercise;
  const detail = await polarFetch(`/v3/exercises/${encodeURIComponent(id)}`, accessToken).catch(() => exercise);
  const samples = await polarFetch(`/v3/exercises/${encodeURIComponent(id)}/samples`, accessToken).catch(() => null);
  const zones = await polarFetch(`/v3/exercises/${encodeURIComponent(id)}/heart-rate-zones`, accessToken).catch(() => null);
  return {
    ...exercise,
    ...(detail || {}),
    samples: samples?.samples || samples || [],
    heart_rate_zones: zones?.zones || zones || [],
  };
};

const extractExerciseIdFromResource = (resource) => {
  if (!resource) return "";
  if (typeof resource === "string") {
    const clean = resource.split("?")[0].replace(/\/$/, "");
    return clean.slice(clean.lastIndexOf("/") + 1);
  }
  return String(resource.id || resource["exercise-id"] || resource["exercise_id"] || "");
};

const listExercisesFromTransaction = async (polarUserId, accessToken) => {
  const transaction = await polarFetch(`/v3/users/${encodeURIComponent(polarUserId)}/exercise-transactions`, accessToken, {
    method: "POST",
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("polar_request_failed:204") || message.includes("polar_request_failed:404")) return null;
    throw error;
  });

  if (!transaction) return { exercises: [], commit: async () => {} };

  const transactionId = transaction["transaction-id"] || transaction.transaction_id || transaction.id;
  const resourceUri = transaction["resource-uri"] || transaction.resource_uri
    || (transactionId ? `/v3/users/${encodeURIComponent(polarUserId)}/exercise-transactions/${encodeURIComponent(transactionId)}` : "");

  const transactionList = resourceUri ? await polarFetch(resourceUri, accessToken).catch(() => transaction) : transaction;
  const exerciseRefs = Array.isArray(transactionList?.exercises)
    ? transactionList.exercises
    : Array.isArray(transactionList)
      ? transactionList
      : [];

  const exercises = [];
  for (const ref of exerciseRefs.slice(0, 50)) {
    const resource = typeof ref === "string" ? ref : (ref["resource-uri"] || ref.resource_uri || "");
    const id = extractExerciseIdFromResource(ref) || extractExerciseIdFromResource(resource);
    const detail = resource
      ? await polarFetch(resource, accessToken).catch(() => (typeof ref === "object" ? ref : {}))
      : await polarFetch(`/v3/exercises/${encodeURIComponent(id)}`, accessToken).catch(() => (typeof ref === "object" ? ref : {}));
    exercises.push({
      ...(typeof ref === "object" ? ref : {}),
      ...(detail || {}),
      id: detail?.id || detail?.["exercise-id"] || id,
      "exercise-id": detail?.["exercise-id"] || detail?.id || id,
    });
  }

  const commit = async () => {
    if (!transactionId) return;
    await polarFetch(`/v3/users/${encodeURIComponent(polarUserId)}/exercise-transactions/${encodeURIComponent(transactionId)}`, accessToken, {
      method: "PUT",
    }).catch((error) => {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("polar_request_failed:404")) throw error;
    });
  };

  return { exercises, commit };
};

export default async function handler(req, res) {
  let jobId = null;
  try {
    if (!requirePost(req, res)) return;
    const { supabase, user } = await requireUser(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const syncType = body.syncType || "manual";
    const now = new Date().toISOString();

    const { data: account, error: accountError } = await supabase
      .from("polar_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "connected")
      .maybeSingle();
    if (accountError || !account?.access_token_encrypted) {
      return sendJson(res, 400, { error: "polar_not_connected" });
    }

    const { data: profile } = await supabase.from("profiles").select("club_id").eq("id", user.id).maybeSingle();
    const { data: job, error: jobError } = await supabase.from("polar_sync_jobs").insert({
      user_id: user.id,
      polar_account_id: account.id,
      status: "running",
      sync_type: syncType,
      started_at: now,
    }).select("id").single();
    if (jobError) throw jobError;
    jobId = job.id;

    const accessToken = await getValidPolarAccessToken(supabase, account);
    await tryRegisterPolarUser(accessToken, user.id);

    const polarUserId = account.polar_user_id || user.id;
    const transactionResult = await listExercisesFromTransaction(polarUserId, accessToken);
    const exercises = transactionResult.exercises;
    const enriched = [];
    for (const exercise of exercises.slice(0, 25)) {
      enriched.push(await enrichExercise(exercise, accessToken));
    }

    const rows = enriched
      .map((exercise) => normalizePolarExercise(exercise, user.id, profile?.club_id || ""))
      .filter((row) => row.provider_activity_id);

    let imported = 0;
    let updated = 0;
    for (const row of rows) {
      const { data: existing } = await supabase
        .from("polar_training_imports")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider_activity_id", row.provider_activity_id)
        .maybeSingle();

      await supabase.from("polar_training_imports").upsert({
        ...row,
        polar_account_id: account.id,
      }, { onConflict: "user_id,provider_activity_id" });

      await supabase.from("external_training_sessions").upsert(row, { onConflict: "id" });
      if (existing) updated += 1;
      else imported += 1;
    }
    await transactionResult.commit();

    await supabase.from("device_connections").upsert({
      user_id: user.id,
      provider: "polar",
      provider_user_id: account.polar_user_id,
      status: "connected",
      last_sync_at: now,
      error_message: null,
      updated_at: now,
    }, { onConflict: "user_id,provider" });
    await supabase.from("external_connections").upsert({
      id: `polar-${user.id}`,
      user_id: user.id,
      provider: "polar",
      provider_user_id: account.polar_user_id,
      status: "connected",
      last_sync_at: now,
      error_message: null,
      updated_at: now,
      created_at: now,
    }, { onConflict: "id" });
    await supabase.from("polar_sync_jobs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      imported_count: imported,
      updated_count: updated,
      skipped_count: Math.max(0, exercises.length - rows.length),
    }).eq("id", jobId);

    sendJson(res, 200, {
      ok: true,
      imported,
      updated,
      skipped: Math.max(0, exercises.length - rows.length),
      sessions: rows,
      message: rows.length ? "polar_sync_completed" : "polar_no_new_trainings",
    });
  } catch (error) {
    try {
      const { supabase, user } = await requireUser(req);
      const message = error instanceof Error ? error.message : "polar_sync_failed";
      if (jobId) {
        await supabase.from("polar_sync_jobs").update({ status: "failed", completed_at: new Date().toISOString(), error_message: message }).eq("id", jobId);
      }
      await supabase.from("device_connections").upsert({
        user_id: user.id,
        provider: "polar",
        status: "error",
        error_message: message,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider" });
    } catch {
      // Ignore secondary logging errors.
    }
    sendJson(res, 500, { error: error instanceof Error ? error.message : "polar_sync_failed" });
  }
}
