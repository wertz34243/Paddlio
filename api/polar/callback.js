import { encryptSecret, exchangeAuthorizationCode, getAdminClient, safeReturnUrl } from "../_polar.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.status(405).end("Method not allowed");
      return;
    }

    const { code, state, error } = req.query;
    if (error) {
      res.redirect(302, safeReturnUrl(`/?polar=error&reason=${encodeURIComponent(String(error))}`));
      return;
    }
    if (!code || !state) {
      res.redirect(302, safeReturnUrl("/?polar=error&reason=missing_code_or_state"));
      return;
    }

    const supabase = getAdminClient();
    const { data: oauthState, error: stateError } = await supabase
      .from("polar_oauth_states")
      .select("*")
      .eq("state", String(state))
      .maybeSingle();
    if (stateError || !oauthState || oauthState.used_at || new Date(oauthState.expires_at).getTime() < Date.now()) {
      res.redirect(302, safeReturnUrl("/?polar=error&reason=invalid_state"));
      return;
    }

    const token = await exchangeAuthorizationCode(String(code));
    const polarUserId = String(token.x_user_id || token.user_id || "");
    const now = new Date().toISOString();
    const expiresAt = token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : null;

    await supabase.from("polar_accounts").upsert({
      user_id: oauthState.user_id,
      polar_user_id: polarUserId,
      access_token_encrypted: encryptSecret(token.access_token),
      refresh_token_encrypted: encryptSecret(token.refresh_token || ""),
      token_expires_at: expiresAt,
      scope: token.scope || "accesslink.read_all",
      status: "connected",
      updated_at: now,
    }, { onConflict: "user_id" });

    await supabase.from("device_connections").upsert({
      user_id: oauthState.user_id,
      provider: "polar",
      provider_user_id: polarUserId,
      status: "connected",
      error_message: null,
      updated_at: now,
    }, { onConflict: "user_id,provider" });

    await supabase.from("external_connections").upsert({
      id: `polar-${oauthState.user_id}`,
      user_id: oauthState.user_id,
      provider: "polar",
      provider_user_id: polarUserId,
      status: "connected",
      error_message: null,
      updated_at: now,
      created_at: now,
    }, { onConflict: "id" });

    await supabase.from("polar_oauth_states").update({ used_at: now }).eq("state", String(state));
    res.redirect(302, safeReturnUrl("/?polar=connected"));
  } catch (err) {
    res.redirect(302, safeReturnUrl(`/?polar=error&reason=${encodeURIComponent(err instanceof Error ? err.message : "callback_failed")}`));
  }
}
