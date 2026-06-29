import {
  formatSeconds,
  getAveragePenalty,
  getBestCompetitionByBoatClass,
  getBestTotalTime,
  getCompetitionAveragePenalty,
  getTrainingLoad,
  getTotalTrainingMinutes,
} from "./metrics";
import type { Competition, PlanEntry, TrainingSession } from "./types";

export type AthleteRecords = {
  k1Best: string;
  c1Best: string;
  bestPenalty: string;
  longestStreak: number;
  mostWeeklyMinutes: number;
  firstRace: string;
  lastRace: string;
};

export type SeasonMonth = {
  key: string;
  label: string;
  trainingCount: number;
  competitionCount: number;
  bestTime?: number;
  minutes: number;
  load: number;
};

const dateLabel = (date?: string): string => (date ? new Date(date).toLocaleDateString("de-DE") : "--");

const getWeekKey = (date: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day);
  const weekday = value.getDay() || 7;
  value.setDate(value.getDate() + 1 - weekday);
  return value.toISOString().slice(0, 10);
};

export const getLongestTrainingStreak = (sessions: TrainingSession[]): number => {
  const uniqueDates = [...new Set(sessions.map((session) => session.date))].sort();
  let longest = 0;
  let current = 0;
  let previousTime = 0;

  uniqueDates.forEach((date) => {
    const time = new Date(`${date}T00:00:00`).getTime();
    current = previousTime && time - previousTime === 86400000 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousTime = time;
  });

  return longest;
};

export const getAthleteRecords = (competitions: Competition[], training: TrainingSession[]): AthleteRecords => {
  const k1 = getBestCompetitionByBoatClass(competitions, "K1");
  const c1 = getBestCompetitionByBoatClass(competitions, "C1");
  const bestPenaltyCompetition = [...competitions].sort(
    (a, b) => getCompetitionAveragePenalty(a) - getCompetitionAveragePenalty(b),
  )[0];
  const weeklyMinutes = new Map<string, TrainingSession[]>();

  training.forEach((session) => {
    const key = getWeekKey(session.date);
    weeklyMinutes.set(key, [...(weeklyMinutes.get(key) ?? []), session]);
  });

  const mostWeeklyMinutes = Math.max(0, ...[...weeklyMinutes.values()].map(getTotalTrainingMinutes));
  const sortedCompetitions = [...competitions].sort((a, b) => a.date.localeCompare(b.date));
  const lastCompetition = sortedCompetitions[sortedCompetitions.length - 1];

  return {
    k1Best: k1 ? `${formatSeconds(getBestTotalTime(k1))} s in ${k1.location}` : "--",
    c1Best: c1 ? `${formatSeconds(getBestTotalTime(c1))} s in ${c1.location}` : "--",
    bestPenalty: bestPenaltyCompetition ? `${formatSeconds(getCompetitionAveragePenalty(bestPenaltyCompetition))} s` : "--",
    longestStreak: getLongestTrainingStreak(training),
    mostWeeklyMinutes,
    firstRace: sortedCompetitions[0] ? `${dateLabel(sortedCompetitions[0].date)} - ${sortedCompetitions[0].location}` : "--",
    lastRace: lastCompetition ? `${dateLabel(lastCompetition.date)} - ${lastCompetition.location}` : "--",
  };
};

export const getSeasonMonths = (
  competitions: Competition[],
  training: TrainingSession[],
  plan: PlanEntry[],
): SeasonMonth[] => {
  const months = new Map<string, SeasonMonth>();

  const ensureMonth = (date: string): SeasonMonth => {
    const key = date.slice(0, 7);
    const [year, month] = key.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    const monthData = months.get(key) ?? {
      key,
      label,
      trainingCount: 0,
      competitionCount: 0,
      minutes: 0,
      load: 0,
    };
    months.set(key, monthData);
    return monthData;
  };

  training.forEach((session) => {
    const month = ensureMonth(session.date);
    month.trainingCount += 1;
    month.minutes += session.durationMinutes;
    month.load += session.durationMinutes * session.rpe;
  });

  plan.filter((entry) => entry.status === "erledigt").forEach((entry) => {
    const month = ensureMonth(entry.date);
    month.minutes += entry.durationMinutes;
  });

  competitions.forEach((competition) => {
    const month = ensureMonth(competition.date);
    const best = getBestTotalTime(competition);
    month.competitionCount += 1;
    month.bestTime = month.bestTime === undefined ? best : Math.min(month.bestTime, best);
  });

  return [...months.values()].sort((a, b) => a.key.localeCompare(b.key));
};

export const getSeasonSummary = (competitions: Competition[], training: TrainingSession[]) => ({
  races: competitions.length,
  trainings: training.length,
  minutes: getTotalTrainingMinutes(training),
  load: getTrainingLoad(training),
  penaltyAverage: competitions.length > 0 ? `${formatSeconds(getAveragePenalty(competitions))} s` : "--",
});
