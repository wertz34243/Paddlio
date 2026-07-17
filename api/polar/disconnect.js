import { requirePost, requireUser, sendJson } from "../_polar.js";

export default async function handler(req, res) {
  try {
    if (!requirePost(req, res)) return;
    const { supabase, user } = await requireUser(req);
    const now = new Date().toISOString();
    await supabase.from("polar_accounts").update({
      status: "disconnected",
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      updated_at: now,
    }).eq("user_id", user.id);
    await supabase.from("device_connections").upsert({
      user_id: user.id,
      provider: "polar",
      status: "disconnected",
      error_message: null,
      updated_at: now,
    }, { onConflict: "user_id,provider" });
    await supabase.from("external_connections").upsert({
      id: `polar-${user.id}`,
      user_id: user.id,
      provider: "polar",
      status: "disconnected",
      error_message: null,
      updated_at: now,
      created_at: now,
    }, { onConflict: "id" });
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "polar_disconnect_failed" });
  }
}
