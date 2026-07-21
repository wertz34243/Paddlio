import type { Competition, ExternalTrainingSession, PaddleMotionData, PlanEntry, TrainingFeedback, User } from "../domain/types";
import { getBestTotalTime } from "../domain/metrics";
import { isDoneStatus } from "../domain/trainingPlan";
import { addDaysToDateKey, todayDateKey } from "../lib/dateOnly";

export type DailyCoachContext = {
  userId: string;
  date: string;
  todayPlan: PlanEntry[];
  recentFeedback: TrainingFeedback[];
  polarSummary: PolarSummary;
  pendingFeedbackCount: number;
};

export type WeeklyCoachContext = {
  userId: string;
  weekStart: string;
  plannedSessions: number;
  completedSessions: number;
  trainingMinutes: number;
  averageFeeling: number | null;
  polarSummary: PolarSummary;
};

export type RecoveryContext = {
  userId: string;
  fatigueAverage: number | null;
  sleepAverage: number | null;
  hardSessionsLast7Days: number;
  polarSummary: PolarSummary;
};

export type CompetitionContext = {
  userId: string;
  latestCompetition?: {
    id: string;
    date: string;
    location: string;
    boatClass: string;
    bestTotalTime: number;
  };
  nextCompetition?: {
    id: string;
    date: string;
    location: string;
    boatClass: string;
  };
};

export type TrainerOverviewContext = {
  userId: string;
  clubId: string;
  openFeedbackCount: number;
  athletesWithTrainingToday: number;
  pendingAttendanceCount: number;
};

export type PolarSummary = {
  sessionCount: number;
  minutes: number;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
};

const average = (values: number[]): number | null =>
  values.length > 0 ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;

const recentDateKeys = (days: number, reference = todayDateKey()): Set<string> => {
  const keys = new Set<string>();
  for (let offset = 0; offset < days; offset += 1) {
    keys.add(addDaysToDateKey(reference, -offset));
  }
  return keys;
};

const summarizePolar = (sessions: ExternalTrainingSession[], dateKeys?: Set<string>): PolarSummary => {
  const filtered = dateKeys
    ? sessions.filter((session) => dateKeys.has(session.startedAt.slice(0, 10)))
    : sessions;
  const heartRates = filtered.map((session) => session.avgHeartRate).filter((value) => value > 0);
  const maxHeartRates = filtered.map((session) => session.maxHeartRate).filter((value) => value > 0);

  return {
    sessionCount: filtered.length,
    minutes: filtered.reduce((sum, session) => sum + Math.round((session.durationSeconds ?? 0) / 60), 0),
    averageHeartRate: average(heartRates),
    maxHeartRate: maxHeartRates.length > 0 ? Math.max(...maxHeartRates) : null,
  };
};

export class PaddlioAIContextBuilder {
  constructor(private readonly data: PaddleMotionData, private readonly user: User) {}

  buildDailyCoachContext(date = todayDateKey()): DailyCoachContext {
    const todayPlan = this.data.plan.filter((entry) => !entry.deletedAt && entry.date === date);
    const recentKeys = recentDateKeys(7, date);
    const recentFeedback = this.data.trainingFeedback.filter((feedback) => recentKeys.has(feedback.completedAt.slice(0, 10)));

    return {
      userId: this.user.userId,
      date,
      todayPlan,
      recentFeedback,
      polarSummary: summarizePolar(this.data.externalTrainingSessions ?? [], recentKeys),
      pendingFeedbackCount: todayPlan.filter((entry) => isDoneStatus(entry.status) && !this.data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id)).length,
    };
  }

  buildWeeklyCoachContext(weekStart: string): WeeklyCoachContext {
    const weekKeys = new Set(Array.from({ length: 7 }, (_, index) => addDaysToDateKey(weekStart, index)));
    const weekPlan = this.data.plan.filter((entry) => !entry.deletedAt && weekKeys.has(entry.date));
    const feedback = this.data.trainingFeedback.filter((item) => weekKeys.has(item.completedAt.slice(0, 10)));

    return {
      userId: this.user.userId,
      weekStart,
      plannedSessions: weekPlan.length,
      completedSessions: weekPlan.filter((entry) => isDoneStatus(entry.status)).length,
      trainingMinutes: weekPlan.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0),
      averageFeeling: average(feedback.map((item) => item.feeling).filter((value) => value > 0)),
      polarSummary: summarizePolar(this.data.externalTrainingSessions ?? [], weekKeys),
    };
  }

  buildRecoveryContext(reference = todayDateKey()): RecoveryContext {
    const recentKeys = recentDateKeys(7, reference);
    const feedback = this.data.trainingFeedback.filter((item) => recentKeys.has(item.completedAt.slice(0, 10)));
    const hardSessions = this.data.plan.filter((entry) =>
      !entry.deletedAt &&
      recentKeys.has(entry.date) &&
      (entry.intensity === "hart" || entry.intensity === "maximal"),
    );

    return {
      userId: this.user.userId,
      fatigueAverage: average(feedback.map((item) => item.fatigue).filter((value) => value > 0)),
      sleepAverage: average(feedback.map((item) => item.sleep ?? 0).filter((value) => value > 0)),
      hardSessionsLast7Days: hardSessions.length,
      polarSummary: summarizePolar(this.data.externalTrainingSessions ?? [], recentKeys),
    };
  }

  buildCompetitionContext(reference = todayDateKey()): CompetitionContext {
    const competitions = this.data.competitions.filter((competition) => !competition.deletedAt);
    const latest = [...competitions].filter((competition) => competition.date <= reference).sort((a, b) => b.date.localeCompare(a.date))[0];
    const next = [...competitions].filter((competition) => competition.date > reference).sort((a, b) => a.date.localeCompare(b.date))[0];

    return {
      userId: this.user.userId,
      latestCompetition: latest ? toLatestCompetition(latest) : undefined,
      nextCompetition: next ? toNextCompetition(next) : undefined,
    };
  }

  buildTrainerOverviewContext(): TrainerOverviewContext {
    const today = todayDateKey();
    return {
      userId: this.user.userId,
      clubId: this.user.profile.club,
      openFeedbackCount: this.data.trainingFeedback.filter((feedback) => !feedback.coachUserId).length,
      athletesWithTrainingToday: new Set(this.data.plan.filter((entry) => !entry.deletedAt && entry.date === today).flatMap((entry) => entry.assignedAthleteIds)).size,
      pendingAttendanceCount: this.data.trainingAttendance.filter((item) => item.status === "pending").length,
    };
  }
}

const toLatestCompetition = (competition: Competition) => ({
  id: competition.id,
  date: competition.date,
  location: competition.location,
  boatClass: competition.boatClass,
  bestTotalTime: getBestTotalTime(competition),
});

const toNextCompetition = (competition: Competition) => ({
  id: competition.id,
  date: competition.date,
  location: competition.location,
  boatClass: competition.boatClass,
});
