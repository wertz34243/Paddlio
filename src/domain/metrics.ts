import { dateKeyFromLocalDate, dateKeyToLocalDate } from "../lib/dateOnly";
import { getTodayKey, isDoneStatus, isPauseEntry, isPlannedStatus, isSkippedStatus, sortPlanEntries } from "./trainingPlan";
import { calculateCompetitionTotalTime, getCompetitionRunTotals } from "./competition";
import type { BoatClass, Competition, PlanEntry, TrainingArea, TrainingIntensity, TrainingSession } from "./types";

export type BoatClassDifference = {
  date: string;
  location: string;
  k1TotalSeconds: number;
  c1TotalSeconds: number;
  differenceSeconds: number;
};

export type BoatClassStats = {
  boatClass: BoatClass;
  bestTotalSeconds?: number;
  averageTotalSeconds?: number;
  averagePenaltySeconds?: number;
  count: number;
};

export type SeasonGoalProgress = {
  id: string;
  label: string;
  valueLabel: string;
  targetLabel: string;
  progress: number;
  completed: boolean;
  status: "offen" | "fast geschafft" | "erreicht";
  tone: "k1" | "c1" | "penalty" | "training";
};

export type DistributionItem<T extends string> = {
  key: T;
  count: number;
  minutes: number;
  percentage: number;
};

export type WeeklyPlanSummary = {
  entries: PlanEntry[];
  completedEntries: PlanEntry[];
  plannedEntries: PlanEntry[];
  skippedEntries: PlanEntry[];
  completedCount: number;
  totalCount: number;
  progress: number;
  minutes: number;
};

export type PlanWeekStats = {
  weekLabel: string;
  minutes: number;
  completedCount: number;
  totalCount: number;
};

export const getRun1Total = (competition: Competition): number =>
  calculateCompetitionTotalTime(competition.run1TimeSeconds, competition.run1PenaltySeconds);

export const getRun2Total = (competition: Competition): number =>
  calculateCompetitionTotalTime(competition.run2TimeSeconds, competition.run2PenaltySeconds);

export const getBestTotalTime = (competition: Competition): number =>
  getCompetitionRunTotals(competition).bestTotal;

export const getBestDriveTime = (competition: Competition): number =>
  Math.min(competition.run1TimeSeconds, competition.run2TimeSeconds);

export const getCompetitionAveragePenalty = (competition: Competition): number =>
  (competition.run1PenaltySeconds + competition.run2PenaltySeconds) / 2;

export const formatSeconds = (seconds: number): string =>
  seconds.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const getBestCompetition = (competitions: Competition[]): Competition | undefined =>
  [...competitions].sort((a, b) => getBestTotalTime(a) - getBestTotalTime(b))[0];

export const getBestCompetitionByBoatClass = (
  competitions: Competition[],
  boatClass: BoatClass,
): Competition | undefined => getBestCompetition(competitions.filter((competition) => competition.boatClass === boatClass));

export const getAveragePenalty = (competitions: Competition[]): number => {
  const penalties = competitions.flatMap((competition) => [
    competition.run1PenaltySeconds,
    competition.run2PenaltySeconds,
  ]);

  if (penalties.length === 0) {
    return 0;
  }

  return penalties.reduce((sum, penalty) => sum + penalty, 0) / penalties.length;
};

export const getAverageTotalTime = (competitions: Competition[]): number | undefined => {
  if (competitions.length === 0) {
    return undefined;
  }

  return competitions.reduce((sum, competition) => sum + getBestTotalTime(competition), 0) / competitions.length;
};

export const getAveragePenaltyByBoatClass = (competitions: Competition[], boatClass: BoatClass): number | undefined => {
  const filteredCompetitions = competitions.filter((competition) => competition.boatClass === boatClass);

  if (filteredCompetitions.length === 0) {
    return undefined;
  }

  return getAveragePenalty(filteredCompetitions);
};

export const getBoatClassStats = (competitions: Competition[], boatClass: BoatClass): BoatClassStats => {
  const filteredCompetitions = competitions.filter((competition) => competition.boatClass === boatClass);
  const bestCompetition = getBestCompetition(filteredCompetitions);

  return {
    boatClass,
    bestTotalSeconds: bestCompetition ? getBestTotalTime(bestCompetition) : undefined,
    averageTotalSeconds: getAverageTotalTime(filteredCompetitions),
    averagePenaltySeconds: getAveragePenaltyByBoatClass(competitions, boatClass),
    count: filteredCompetitions.length,
  };
};

export const getTrainingLoad = (sessions: TrainingSession[]): number =>
  sessions.reduce((sum, session) => sum + session.rpe * session.durationMinutes, 0);

export const getTotalTrainingMinutes = (sessions: TrainingSession[]): number =>
  sessions.reduce((sum, session) => sum + session.durationMinutes, 0);

const getLocalDate = dateKeyToLocalDate;

const getWeekStart = (referenceDate: Date): Date => {
  const result = new Date(referenceDate);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + mondayOffset);
  return result;
};

const getWeekEnd = (date: Date): Date => {
  const result = getWeekStart(date);
  result.setDate(result.getDate() + 7);
  return result;
};

export const isDateInCurrentWeek = (date: string, referenceDate = new Date()): boolean => {
  const weekStart = getWeekStart(referenceDate);
  const weekEnd = getWeekEnd(referenceDate);
  const localDate = getLocalDate(date);
  return localDate >= weekStart && localDate < weekEnd;
};

export const getTrainingSessionsForCurrentWeek = (
  sessions: TrainingSession[],
  referenceDate = new Date(),
): TrainingSession[] => {
  const weekStart = getWeekStart(referenceDate);
  const weekEnd = getWeekEnd(referenceDate);

  return sessions.filter((session) => {
    const sessionDate = getLocalDate(session.date);
    return sessionDate >= weekStart && sessionDate < weekEnd;
  });
};

export const getPlanEntriesForCurrentWeek = (entries: PlanEntry[], referenceDate = new Date()): PlanEntry[] =>
  entries.filter((entry) => isDateInCurrentWeek(entry.date, referenceDate));

export const getTodayPlanEntries = (entries: PlanEntry[], referenceDate = new Date()): PlanEntry[] => {
  const today = getTodayKey(referenceDate);
  return sortPlanEntries(entries).filter((entry) => entry.date === today);
};

export const getNextPlannedEntry = (entries: PlanEntry[], referenceDate = new Date()): PlanEntry | undefined => {
  const nowKey = getTodayKey(referenceDate);
  const nowTime = referenceDate.toTimeString().slice(0, 5);

  return sortPlanEntries(entries).find((entry) => {
    if (!isPlannedStatus(entry.status)) {
      return false;
    }

    return entry.date > nowKey || (entry.date === nowKey && (!entry.time || entry.time >= nowTime));
  });
};

export const getWeeklyPlanSummary = (entries: PlanEntry[], referenceDate = new Date()): WeeklyPlanSummary => {
  const weekEntries = getPlanEntriesForCurrentWeek(entries, referenceDate);
  const completedEntries = weekEntries.filter((entry) => isDoneStatus(entry.status));
  const plannedEntries = weekEntries.filter((entry) => isPlannedStatus(entry.status));
  const skippedEntries = weekEntries.filter((entry) => isSkippedStatus(entry.status));
  const totalCount = weekEntries.length;
  const completedCount = completedEntries.length;

  return {
    entries: sortPlanEntries(weekEntries),
    completedEntries,
    plannedEntries,
    skippedEntries,
    completedCount,
    totalCount,
    progress: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
    minutes: completedEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0),
  };
};

export const getNextFocus = (entries: PlanEntry[], referenceDate = new Date()): string => {
  const todayFocus = getTodayPlanEntries(entries, referenceDate).find((entry) => isPlannedStatus(entry.status) && entry.goal.trim());
  const nextEntry = todayFocus ?? getNextPlannedEntry(entries, referenceDate);
  return nextEntry?.goal || nextEntry?.trainingType || "Noch kein Fokus geplant";
};

export const getWeeklyPlanMinutes = (entries: PlanEntry[], referenceDate = new Date()): number =>
  getPlanEntriesForCurrentWeek(entries, referenceDate)
    .filter((entry) => entry.status === "erledigt")
    .reduce((sum, entry) => sum + entry.durationMinutes, 0);

export const getPlanWeekStats = (entries: PlanEntry[]): PlanWeekStats[] => {
  const grouped = new Map<string, PlanEntry[]>();

  entries.forEach((entry) => {
    const weekStart = getWeekStart(getLocalDate(entry.date));
    const weekKey = dateKeyFromLocalDate(weekStart);
    grouped.set(weekKey, [...(grouped.get(weekKey) ?? []), entry]);
  });

  return [...grouped.entries()]
    .map(([weekLabel, weekEntries]) => {
      const completed = weekEntries.filter((entry) => isDoneStatus(entry.status));

      return {
        weekLabel,
        minutes: completed.reduce((sum, entry) => sum + entry.durationMinutes, 0),
        completedCount: completed.length,
        totalCount: weekEntries.length,
      };
    })
    .sort((a, b) => b.weekLabel.localeCompare(a.weekLabel));
};

export const getTrainingPauseRatio = (entries: PlanEntry[]): { training: number; pause: number } => {
  const completedEntries = entries.filter((entry) => isDoneStatus(entry.status));
  const pause = completedEntries.filter(isPauseEntry).length;

  return {
    training: completedEntries.length - pause,
    pause,
  };
};

const getDistribution = <T extends string>(
  entries: PlanEntry[],
  getKey: (entry: PlanEntry) => T,
): DistributionItem<T>[] => {
  const completedEntries = entries.filter((entry) => isDoneStatus(entry.status));
  const totalMinutes = completedEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const grouped = new Map<T, { count: number; minutes: number }>();

  completedEntries.forEach((entry) => {
    const key = getKey(entry);
    const current = grouped.get(key) ?? { count: 0, minutes: 0 };
    grouped.set(key, {
      count: current.count + 1,
      minutes: current.minutes + entry.durationMinutes,
    });
  });

  return [...grouped.entries()]
    .map(([key, value]) => ({
      key,
      count: value.count,
      minutes: value.minutes,
      percentage: totalMinutes === 0 ? 0 : Math.round((value.minutes / totalMinutes) * 100),
    }))
    .sort((a, b) => b.minutes - a.minutes || a.key.localeCompare(b.key));
};

export const getTrainingAreaDistribution = (entries: PlanEntry[]): DistributionItem<TrainingArea>[] =>
  getDistribution(entries, (entry) => entry.area);

export const getIntensityDistribution = (entries: PlanEntry[]): DistributionItem<TrainingIntensity>[] =>
  getDistribution(entries, (entry) => entry.intensity);

export const getLastCompetition = (competitions: Competition[]): Competition | undefined =>
  [...competitions].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))[0];

export const getLastTrainingSession = (sessions: TrainingSession[]): TrainingSession | undefined =>
  [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))[0];

export const getBoatClassDifferences = (competitions: Competition[]): BoatClassDifference[] => {
  const grouped = new Map<string, Partial<Record<BoatClass, Competition>>>();

  competitions.forEach((competition) => {
    const key = `${competition.date}__${competition.location.toLowerCase()}`;
    const group = grouped.get(key) ?? {};
    const current = group[competition.boatClass];

    if (!current || getBestTotalTime(competition) < getBestTotalTime(current)) {
      group[competition.boatClass] = competition;
    }

    grouped.set(key, group);
  });

  return [...grouped.values()].flatMap((group) => {
    if (!group.K1 || !group.C1) {
      return [];
    }

    const k1TotalSeconds = getBestTotalTime(group.K1);
    const c1TotalSeconds = getBestTotalTime(group.C1);

    return [
      {
        date: group.K1.date,
        location: group.K1.location,
        k1TotalSeconds,
        c1TotalSeconds,
        differenceSeconds: c1TotalSeconds - k1TotalSeconds,
      },
    ];
  });
};

export const getCompetitionsSortedByDate = (competitions: Competition[]): Competition[] =>
  [...competitions].sort((a, b) => a.date.localeCompare(b.date) || a.location.localeCompare(b.location));

const clampProgress = (value: number): number => Math.max(0, Math.min(100, value));

const getGoalStatus = (progress: number, completed: boolean): SeasonGoalProgress["status"] => {
  if (completed) {
    return "erreicht";
  }

  if (progress >= 80) {
    return "fast geschafft";
  }

  return "offen";
};

export const getSeasonGoalProgress = (
  competitions: Competition[],
  training: TrainingSession[],
): SeasonGoalProgress[] => {
  const k1Best = getBoatClassStats(competitions, "K1").bestTotalSeconds;
  const c1Best = getBoatClassStats(competitions, "C1").bestTotalSeconds;
  const penaltyAverage = getAveragePenalty(competitions);
  const trainingCount = training.length;
  const k1Progress = k1Best === undefined ? 0 : clampProgress((90 / Math.max(k1Best, 1)) * 100);
  const c1Progress = c1Best === undefined ? 0 : clampProgress((105 / Math.max(c1Best, 1)) * 100);
  const penaltyProgress = competitions.length === 0 ? 0 : clampProgress((2 / Math.max(penaltyAverage, 0.1)) * 100);
  const trainingProgress = clampProgress((trainingCount / 20) * 100);
  const k1Completed = k1Best !== undefined && k1Best < 90;
  const c1Completed = c1Best !== undefined && c1Best < 105;
  const penaltyCompleted = competitions.length > 0 && penaltyAverage < 2;
  const trainingCompleted = trainingCount >= 20;

  return [
    {
      id: "k1-under-90",
      label: "K1 unter 90 Sekunden",
      valueLabel: k1Best === undefined ? "Noch kein K1" : `${formatSeconds(k1Best)} s`,
      targetLabel: "Ziel: < 90,00 s",
      progress: k1Progress,
      completed: k1Completed,
      status: getGoalStatus(k1Progress, k1Completed),
      tone: "k1",
    },
    {
      id: "c1-under-105",
      label: "C1 unter 105 Sekunden",
      valueLabel: c1Best === undefined ? "Noch kein C1" : `${formatSeconds(c1Best)} s`,
      targetLabel: "Ziel: < 105,00 s",
      progress: c1Progress,
      completed: c1Completed,
      status: getGoalStatus(c1Progress, c1Completed),
      tone: "c1",
    },
    {
      id: "penalties-under-2",
      label: "Strafschnitt unter 2 Sekunden",
      valueLabel: competitions.length === 0 ? "Noch keine Daten" : `${formatSeconds(penaltyAverage)} s`,
      targetLabel: "Ziel: < 2,00 s",
      progress: penaltyProgress,
      completed: penaltyCompleted,
      status: getGoalStatus(penaltyProgress, penaltyCompleted),
      tone: "penalty",
    },
    {
      id: "training-20",
      label: "20 Trainingseinheiten dokumentieren",
      valueLabel: `${trainingCount}/20 Einheiten`,
      targetLabel: "Ziel: 20 Einheiten",
      progress: trainingProgress,
      completed: trainingCompleted,
      status: getGoalStatus(trainingProgress, trainingCompleted),
      tone: "training",
    },
  ];
};
