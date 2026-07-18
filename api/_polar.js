import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

export const POLAR_AUTH_URL = "https://flow.polar.com/oauth2/authorization";
export const POLAR_TOKEN_URL = "https://polarremote.com/v2/oauth2/token";
export const POLAR_API_URL = "https://www.polaraccesslink.com";

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable ${key}`);
  return value;
};

export const getServerConfig = () => ({
  supabaseUrl: requiredEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  polarClientId: requiredEnv("POLAR_CLIENT_ID"),
  polarClientSecret: requiredEnv("POLAR_CLIENT_SECRET"),
  polarRedirectUri: requiredEnv("POLAR_REDIRECT_URI"),
  encryptionKey: requiredEnv("POLAR_TOKEN_ENCRYPTION_KEY"),
  appReturnUrl: process.env.POLAR_APP_RETURN_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""),
});

export const getAdminClient = () => {
  const config = getServerConfig();
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const sendJson = (res, status, body) => {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

export const requirePost = (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return false;
  }
  return true;
};

export const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] || "";
};

export const requireUser = async (req) => {
  const token = getBearerToken(req);
  if (!token) throw new Error("missing_auth_token");
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("invalid_auth_token");
  return { supabase, user: data.user };
};

const normalizeEncryptionKey = (value) => {
  const trimmed = value.trim();
  if (/^[a-f0-9]{64}$/i.test(trimmed)) return Buffer.from(trimmed, "hex");
  const base64 = Buffer.from(trimmed, "base64");
  if (base64.length === 32) return base64;
  const utf8 = Buffer.from(trimmed, "utf8");
  if (utf8.length === 32) return utf8;
  return crypto.createHash("sha256").update(trimmed).digest();
};

export const encryptSecret = (plainText) => {
  if (!plainText) return null;
  const key = normalizeEncryptionKey(getServerConfig().encryptionKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    alg: "A256GCM",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  });
};

export const decryptSecret = (payload) => {
  if (!payload) return "";
  const key = normalizeEncryptionKey(getServerConfig().encryptionKey);
  const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(parsed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(parsed.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
};

export const polarBasicAuth = () => {
  const config = getServerConfig();
  return `Basic ${Buffer.from(`${config.polarClientId}:${config.polarClientSecret}`).toString("base64")}`;
};

export const exchangeAuthorizationCode = async (code) => {
  const config = getServerConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.polarRedirectUri,
  });
  const response = await fetch(POLAR_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: polarBasicAuth(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json;charset=UTF-8",
    },
    body,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`polar_token_exchange_failed:${json.error || response.status}`);
  }
  return json;
};

export const refreshPolarToken = async (refreshToken) => {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const response = await fetch(POLAR_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: polarBasicAuth(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json;charset=UTF-8",
    },
    body,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`polar_token_refresh_failed:${json.error || response.status}`);
  }
  return json;
};

export const getValidPolarAccessToken = async (supabase, account) => {
  const expiresAt = account?.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  const expiresSoon = expiresAt > 0 && expiresAt < Date.now() + 60_000;
  if (!expiresSoon) return decryptSecret(account.access_token_encrypted);

  const refreshToken = decryptSecret(account.refresh_token_encrypted);
  if (!refreshToken) {
    await supabase.from("polar_accounts").update({
      status: "expired",
      updated_at: new Date().toISOString(),
    }).eq("id", account.id);
    throw new Error("polar_token_expired");
  }

  const token = await refreshPolarToken(refreshToken);
  const now = new Date().toISOString();
  const expiresAtIso = token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : null;
  await supabase.from("polar_accounts").update({
    access_token_encrypted: encryptSecret(token.access_token),
    refresh_token_encrypted: token.refresh_token ? encryptSecret(token.refresh_token) : account.refresh_token_encrypted,
    token_expires_at: expiresAtIso,
    scope: token.scope || account.scope,
    status: "connected",
    updated_at: now,
  }).eq("id", account.id);

  return token.access_token;
};

export const polarFetch = async (path, accessToken, init = {}) => {
  const response = await fetch(`${POLAR_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });
  if (response.status === 204) return null;
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`polar_request_failed:${response.status}`);
  return json;
};

export const safeReturnUrl = (path = "/?polar=connected") => {
  const config = getServerConfig();
  const base = config.appReturnUrl || "https://paddlio.vercel.app";
  return `${base}${path}`;
};

export const parseIsoDurationSeconds = (value) => {
  if (!value || typeof value !== "string") return 0;
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i.exec(value);
  if (!match) return 0;
  const [, days, hours, minutes, seconds] = match;
  return Math.round((Number(days || 0) * 86400) + (Number(hours || 0) * 3600) + (Number(minutes || 0) * 60) + Number(seconds || 0));
};

export const mapPolarSport = (sport = "", detailed = "") => {
  const value = `${sport} ${detailed}`.toLowerCase();
  if (value.includes("kayak") || value.includes("padd") || value.includes("water")) return "kayak";
  if (value.includes("strength") || value.includes("gym")) return "strength";
  if (value.includes("run")) return "running";
  if (value.includes("cycl")) return "cycling";
  if (value.includes("mobility") || value.includes("stretch")) return "mobility";
  return "other";
};

export const normalizePolarExercise = (exercise, userId, clubId = "") => {
  const now = new Date().toISOString();
  const providerActivityId = String(exercise.id || exercise["exercise-id"] || "");
  const trainingLoadPro = exercise.training_load_pro || {};
  const heartRate = exercise.heart_rate || {};
  const samples = Array.isArray(exercise.samples) ? exercise.samples : [];
  const heartRateSamples = samples
    .filter((sample) => String(sample["sample-type"] ?? sample.sample_type ?? "") === "1")
    .flatMap((sample) => String(sample.data || "").split(",").map((item) => Number(item)).filter((item) => Number.isFinite(item)));

  return {
    id: `polar-${userId}-${providerActivityId}`.replace(/[^a-zA-Z0-9-]/g, "-"),
    user_id: userId,
    athlete_id: userId,
    club_id: clubId || null,
    provider: "polar",
    provider_activity_id: providerActivityId,
    title: exercise.sport || exercise.detailed_sport_info || "Polar Training",
    sport_type: mapPolarSport(exercise.sport, exercise.detailed_sport_info),
    started_at: exercise.start_time ? new Date(exercise.start_time).toISOString() : now,
    duration_seconds: parseIsoDurationSeconds(exercise.duration),
    distance_meters: Math.round(Number(exercise.distance || 0)),
    avg_heart_rate: Number(heartRate.average || 0) || null,
    max_heart_rate: Number(heartRate.maximum || 0) || null,
    calories: Number(exercise.calories || 0) || null,
    training_load: Number(exercise.training_load || trainingLoadPro["cardio-load"] || 0) || null,
    recovery_status: trainingLoadPro["cardio-load-interpretation"] || "",
    raw_data: {
      ...exercise,
      paddlio: {
        heartRateSamples,
        heartRateZones: exercise.heart_rate_zones || [],
        route: exercise.route || [],
        cardioLoad: trainingLoadPro["cardio-load"] ?? null,
        runningIndex: exercise["running-index"] ?? null,
        trainingBenefit: exercise.training_benefit ?? null,
      },
    },
    linked_training_id: null,
    created_at: now,
    updated_at: now,
  };
};
