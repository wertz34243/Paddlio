export type SyncWriteErrorKind = "retryable" | "non-retryable";

const NON_RETRYABLE_CODES = new Set([
  "23502", "23503", "23505", "23514", "22P02", "42501", "PGRST301", "401", "403",
]);

export const classifySyncWriteError = (error: unknown): SyncWriteErrorKind => {
  const value = error as { code?: string | number; status?: number; message?: string } | null;
  const code = String(value?.code ?? value?.status ?? "").toUpperCase();
  const message = String(value?.message ?? error ?? "").toLowerCase();

  if (NON_RETRYABLE_CODES.has(code) || /row.level security|permission denied|forbidden|foreign key|check constraint|invalid input/.test(message)) {
    return "non-retryable";
  }
  if (/timeout|network|fetch|temporar|connection|offline|gateway|service unavailable|rate limit/.test(message)) {
    return "retryable";
  }
  const status = Number(value?.status ?? value?.code);
  return Number.isFinite(status) && status >= 400 && status < 500 ? "non-retryable" : "retryable";
};
