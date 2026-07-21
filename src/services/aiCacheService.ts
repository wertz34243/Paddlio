export type AICacheEntry<TOutput = unknown> = {
  contextType: string;
  inputHash: string;
  generatedAt: string;
  expiresAt: string;
  provider: string;
  output: TOutput;
};

const AI_CACHE_KEY = "paddlio_ai_cache";

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
};

export const createAIInputHash = (input: unknown): string => {
  const text = stableStringify(input);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
};

const readCache = (): Record<string, AICacheEntry> => {
  try {
    const raw = window.localStorage.getItem(AI_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCache = (cache: Record<string, AICacheEntry>): void => {
  try {
    window.localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // AI cache is optional and must never block the app.
  }
};

const cacheKey = (contextType: string, inputHash: string): string => `${contextType}:${inputHash}`;

export const readAICache = <TOutput>(contextType: string, inputHash: string, now = new Date().toISOString()): AICacheEntry<TOutput> | null => {
  const entry = readCache()[cacheKey(contextType, inputHash)] as AICacheEntry<TOutput> | undefined;
  if (!entry || entry.expiresAt <= now) return null;
  return entry;
};

export const writeAICache = <TOutput>(
  contextType: string,
  inputHash: string,
  output: TOutput,
  options: { provider?: string; ttlMinutes?: number; now?: Date } = {},
): AICacheEntry<TOutput> => {
  const now = options.now ?? new Date();
  const expiresAt = new Date(now.getTime() + (options.ttlMinutes ?? 360) * 60_000);
  const entry: AICacheEntry<TOutput> = {
    contextType,
    inputHash,
    generatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    provider: options.provider ?? "rule-based",
    output,
  };
  writeCache({ ...readCache(), [cacheKey(contextType, inputHash)]: entry });
  return entry;
};

export const getAIInvalidationTargets = (eventType: "training" | "feedback" | "polar" | "competition" | "message"): string[] => {
  if (eventType === "training") return ["daily_summary", "weekly_summary"];
  if (eventType === "feedback") return ["daily_summary", "weekly_summary", "recovery_summary", "coach_alerts"];
  if (eventType === "polar") return ["daily_summary", "weekly_summary", "recovery_summary"];
  if (eventType === "competition") return ["competition_summary", "weekly_summary"];
  return [];
};
