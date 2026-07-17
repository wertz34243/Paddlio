import crypto from "node:crypto";
import { getServerConfig, POLAR_AUTH_URL, requirePost, requireUser, sendJson } from "../_polar.js";

export default async function handler(req, res) {
  try {
    if (!requirePost(req, res)) return;
    const { supabase, user } = await requireUser(req);
    const config = getServerConfig();
    const state = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from("polar_oauth_states").insert({
      state,
      user_id: user.id,
      expires_at: expiresAt,
    });
    if (error) throw error;

    const url = new URL(POLAR_AUTH_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", config.polarClientId);
    url.searchParams.set("scope", "accesslink.read_all");
    url.searchParams.set("state", state);
    url.searchParams.set("redirect_uri", config.polarRedirectUri);

    sendJson(res, 200, { authorizationUrl: url.toString(), expiresAt });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "polar_start_failed" });
  }
}
