import { getSupabaseClient } from "../lib/supabase";
import type { SeasonGoal } from "../domain/types";
import { enqueueSyncChange } from "./syncService";
import { sanitizeCloudPayload } from "./cloudIds";

const toCloudGoal = (goal: SeasonGoal) => ({
  id: goal.id,
  athlete_id: goal.athleteId,
  assigned_by: goal.assignedByUserId || null,
  title: goal.title,
  description: goal.description,
  goal_type: goal.metric === "manual" ? "text" : goal.metric === "trainingCount" || goal.metric === "trainingMinutes" ? "count" : "time",
  target_value: goal.targetValue,
  current_value: goal.currentValueOverride === "" ? null : goal.currentValueOverride,
  unit: goal.unit,
  status: goal.status,
  due_date: goal.dueDate || null,
});

export const fromCloudGoal = (row: any): SeasonGoal => ({
  id: row.id,
  athleteId: row.athlete_id,
  ownerUserId: row.athlete_id,
  assignedByUserId: row.assigned_by ?? row.athlete_id,
  title: row.title,
  description: row.description ?? "",
  category: "personal",
  metric: "manual",
  direction: "over",
  targetValue: row.target_value ?? 1,
  unit: row.unit ?? "",
  startDate: row.created_at?.slice(0, 10) ?? "",
  dueDate: row.due_date ?? "",
  status: row.status ?? "active",
  priority: "medium",
  currentValueOverride: row.current_value ?? "",
  coachNote: "",
  athleteNote: "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listCloudGoals = async (): Promise<SeasonGoal[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from("season_goals").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromCloudGoal);
};

export const upsertCloudGoal = async (goal: SeasonGoal): Promise<void> => {
  const payload = sanitizeCloudPayload(toCloudGoal(goal));
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "season_goals", action: "upsert", payload });
    return;
  }
  const { error } = await (client.from("season_goals") as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};
