import { getSupabaseClient } from "../lib/supabase";
import { classifySyncWriteError } from "./syncErrorPolicy";
import { enqueueSyncChange } from "./syncService";

type CloudWrite = () => Promise<{ error: unknown }>;

export const runCloudWrite = async (
  tableName: string,
  action: "insert" | "update" | "upsert" | "delete",
  payload: Record<string, unknown>,
  write: (client: NonNullable<ReturnType<typeof getSupabaseClient>>) => ReturnType<CloudWrite>,
): Promise<void> => {
  const client = getSupabaseClient();
  if (!client || typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueSyncChange({ tableName, action, payload });
    return;
  }

  try {
    const { error } = await write(client);
    if (error) throw error;
  } catch (error) {
    if (classifySyncWriteError(error) === "retryable") {
      enqueueSyncChange({ tableName, action, payload });
      return;
    }
    throw error;
  }
};
