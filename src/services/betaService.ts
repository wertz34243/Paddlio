import type { BetaFeedback, BetaTester } from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { enqueueSyncChange } from "./syncService";

const upsert = async (tableName: string, payload: Record<string, unknown>): Promise<void> => {
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName, action: "upsert", payload });
    return;
  }
  const { error } = await (client.from(tableName) as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};

const list = async <T,>(tableName: string, mapper: (row: any) => T): Promise<T[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from(tableName) as any).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapper);
};

export const upsertCloudBetaFeedback = (item: BetaFeedback): Promise<void> =>
  upsert("beta_feedback", {
    id: item.id,
    user_id: item.userId || null,
    club_id: item.clubId || null,
    user_role: item.userRole,
    app_version: item.appVersion,
    category: item.category,
    priority: item.priority,
    title: item.title,
    description: item.description,
    page_path: item.pagePath || null,
    device_info: item.deviceInfo || null,
    browser_info: item.browserInfo || null,
    status: item.status,
    admin_note: item.adminNote || null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    deleted_at: item.deletedAt || null,
  });

export const listCloudBetaFeedback = (): Promise<BetaFeedback[]> =>
  list("beta_feedback", (row) => ({
    id: row.id,
    userId: row.user_id ?? "",
    clubId: row.club_id ?? "",
    userRole: row.user_role ?? "athlete",
    appVersion: row.app_version ?? "4.0.0-beta",
    category: row.category ?? "Sonstiges",
    priority: row.priority ?? "normal",
    title: row.title,
    description: row.description ?? "",
    pagePath: row.page_path ?? "",
    deviceInfo: row.device_info ?? "",
    browserInfo: row.browser_info ?? "",
    status: row.status ?? "open",
    adminNote: row.admin_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? "",
  }));

export const upsertCloudBetaTester = (item: BetaTester): Promise<void> =>
  upsert("beta_testers", {
    id: item.id,
    user_id: item.userId,
    club_id: item.clubId || null,
    tester_role: item.testerRole,
    status: item.status,
    invited_at: item.invitedAt,
    last_seen_at: item.lastSeenAt || null,
    notes: item.notes || null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  });

export const listCloudBetaTesters = (): Promise<BetaTester[]> =>
  list("beta_testers", (row) => ({
    id: row.id,
    userId: row.user_id,
    clubId: row.club_id ?? "",
    testerRole: row.tester_role ?? "athlete",
    status: row.status ?? "active",
    invitedAt: row.invited_at ?? row.created_at,
    lastSeenAt: row.last_seen_at ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
