import { getSupabaseClient } from "../lib/supabase";
import type { SeasonGoal } from "../domain/types";
import { sanitizeCloudPayload } from "./cloudIds";
import { runCloudWrite, type CloudWriteResult } from "./cloudWriteService";

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
  category: goal.category,
  metric: goal.metric,
  direction: goal.direction,
  priority: goal.priority,
  start_date: goal.startDate || null,
  coach_note: goal.coachNote || null,
  athlete_note: goal.athleteNote || null,
  due_date: goal.dueDate || null,
});

export const fromCloudGoal = (row: any): SeasonGoal => ({
  id: row.id,
  athleteId: row.athlete_id,
  ownerUserId: row.athlete_id,
  assignedByUserId: row.assigned_by ?? row.athlete_id,
  title: row.title,
  description: row.description ?? "",
  category: row.category ?? "personal",
  metric: row.metric ?? "manual",
  direction: row.direction ?? "over",
  targetValue: row.target_value ?? 1,
  unit: row.unit ?? "",
  startDate: row.start_date ?? row.created_at?.slice(0, 10) ?? "",
  dueDate: row.due_date ?? "",
  status: row.status ?? "active",
  priority: row.priority ?? "medium",
  currentValueOverride: row.current_value ?? "",
  coachNote: row.coach_note ?? "",
  athleteNote: row.athlete_note ?? "",
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

export const upsertCloudGoal = async (goal: SeasonGoal): Promise<CloudWriteResult> => {
  const payload = sanitizeCloudPayload(toCloudGoal(goal));
  return runCloudWrite("season_goals", "upsert", payload, (client) =>
    (client.from("season_goals") as any).upsert(payload, { onConflict: "id" }));
};

export const deleteCloudGoal = async (id: string): Promise<CloudWriteResult> => {
  const payload = sanitizeCloudPayload({ id });
  return runCloudWrite("season_goals", "delete", payload, (client) =>
    (client.from("season_goals") as any).delete().eq("id", payload.id));
};
