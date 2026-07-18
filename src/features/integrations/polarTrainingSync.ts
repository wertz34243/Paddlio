import type { ExternalTrainingSession, PlanEntry, TrainingSession } from "../../domain/types";
import { dateKeyFromLocalDate, normalizeDateKey } from "../../lib/dateOnly";

export type PolarTrainingMatch = {
  planEntry: PlanEntry;
  score: number;
  reasons: string[];
};

export const dateKeyFromPolarTimestamp = (startedAt: string, fallback = dateKeyFromLocalDate(new Date())): string => {
  const timestamp = Date.parse(startedAt);
  return Number.isNaN(timestamp) ? fallback : dateKeyFromLocalDate(new Date(timestamp));
};

export const polarSportToTrainingType = (sport: ExternalTrainingSession["sportType"]): TrainingSession["type"] => {
  if (sport === "strength") return "Kraft";
  if (sport === "mobility") return "Pause";
  if (sport === "kayak" || sport === "canoe" || sport === "paddling") return "Ausdauer";
  return "Technik";
};

export const buildTrainingSessionFromPolar = (
  session: ExternalTrainingSession,
  userId: string,
  timestamp = new Date().toISOString(),
): TrainingSession => ({
  id: `training-${session.id}`,
  athleteId: userId,
  date: dateKeyFromPolarTimestamp(session.startedAt),
  type: polarSportToTrainingType(session.sportType),
  durationMinutes: Math.max(1, Math.round(session.durationSeconds / 60)),
  rpe: session.trainingLoad > 70 ? 8 : session.avgHeartRate > 155 ? 7 : 5,
  focus: `Polar ${session.title}`,
  note: `${Math.round(session.distanceMeters / 100) / 10} km · HF ${session.avgHeartRate || "-"} Ø / ${session.maxHeartRate || "-"} max`,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const mergeExternalSessionsByProviderActivity = (
  current: ExternalTrainingSession[],
  incoming: ExternalTrainingSession[],
): ExternalTrainingSession[] => {
  const byKey = new Map<string, ExternalTrainingSession>();
  current.forEach((session) => byKey.set(`${session.provider}:${session.providerActivityId || session.id}`, session));
  incoming.forEach((session) => byKey.set(`${session.provider}:${session.providerActivityId || session.id}`, {
    ...byKey.get(`${session.provider}:${session.providerActivityId || session.id}`),
    ...session,
  }));
  return [...byKey.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
};

export const mergeTrainingSessionsById = (current: TrainingSession[], incoming: TrainingSession[]): TrainingSession[] => {
  const byId = new Map(current.map((session) => [session.id, session]));
  incoming.forEach((session) => byId.set(session.id, { ...byId.get(session.id), ...session }));
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
};

export const suggestPolarTrainingMatches = (
  polarSession: ExternalTrainingSession,
  planEntries: PlanEntry[],
): PolarTrainingMatch[] => {
  const polarDate = dateKeyFromPolarTimestamp(polarSession.startedAt);
  const polarMinutes = Math.max(1, Math.round(polarSession.durationSeconds / 60));

  return planEntries
    .filter((entry) => !entry.deletedAt)
    .filter((entry) => normalizeDateKey(entry.date) === polarDate)
    .filter((entry) => entry.athleteId === polarSession.athleteId || entry.assignedAthleteIds.includes(polarSession.athleteId))
    .map((entry) => {
      const reasons: string[] = ["gleicher Tag", "gleicher Sportler"];
      let score = 60;
      const durationDelta = Math.abs((entry.durationMinutes || 0) - polarMinutes);
      if (durationDelta <= 10) {
        score += 20;
        reasons.push("ähnliche Dauer");
      } else if (durationDelta <= 25) {
        score += 10;
        reasons.push("Dauer grob passend");
      }
      if (entry.trainingType.toLowerCase().includes("ga") && polarSession.sportType !== "strength") {
        score += 10;
        reasons.push("Trainingsart passend");
      }
      return { planEntry: entry, score, reasons };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
};
