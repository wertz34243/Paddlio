import {
  getAveragePenalty,
  getNextPlannedEntry,
  getTodayPlanEntries,
  getTrainingSessionsForCurrentWeek,
} from "./metrics";
import { getLongestTrainingStreak } from "./records";
import type { Competition, PlanEntry, TrainingJournalEntry, TrainingSession } from "./types";

export type AthleteStatus = {
  title: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "primary";
};

export type SmartCoachAdvice = {
  title: string;
  recommendation: string;
  reason: string;
};

export type TrainingIntelligence = {
  todayTraining?: PlanEntry;
  nextTraining?: PlanEntry;
  currentStreak: number;
  longestStreak: number;
  trainingQuote: number;
  athleteStatus: AthleteStatus;
  coachAdvice: SmartCoachAdvice;
  motivation: string;
};

const motivations = [
  "Heute zaehlt jede saubere Linie.",
  "Konstanz schlaegt Zufall.",
  "Ein gutes Training beginnt mit dem ersten Paddelschlag.",
  "Der Wettkampf wird im Training vorbereitet.",
  "Ruhige Entscheidungen machen schnelle Laeufe.",
  "Sauber bleiben, Druck aufbauen, weiterfahren.",
];

const dayKey = (date = new Date()): string => date.toISOString().slice(0, 10);

const dayDiff = (a: string, b: string): number => {
  const left = new Date(`${a}T00:00:00`).getTime();
  const right = new Date(`${b}T00:00:00`).getTime();
  return Math.round((left - right) / 86400000);
};

export const getDailyMotivation = (date = new Date()): string => {
  const key = date.toISOString().slice(0, 10).replace(/-/g, "");
  const index = Number(key) % motivations.length;
  return motivations[index];
};

export const getCurrentTrainingStreak = (sessions: TrainingSession[], referenceDate = new Date()): number => {
  const dates = new Set(sessions.map((session) => session.date));
  let cursor = dayKey(referenceDate);
  let streak = 0;

  while (dates.has(cursor)) {
    streak += 1;
    const next = new Date(`${cursor}T00:00:00`);
    next.setDate(next.getDate() - 1);
    cursor = dayKey(next);
  }

  return streak;
};

const getTrainingQuote = (plan: PlanEntry[], referenceDate = new Date()): number => {
  const currentWeek = plan.filter((entry) => {
    const diff = Math.abs(dayDiff(entry.date, dayKey(referenceDate)));
    return diff <= 6;
  });

  if (currentWeek.length === 0) {
    return 0;
  }

  return Math.round((currentWeek.filter((entry) => entry.status === "erledigt").length / currentWeek.length) * 100);
};

const getHardPlanCount = (plan: PlanEntry[]): number =>
  plan.filter((entry) => entry.status === "erledigt" && (entry.intensity === "hart" || entry.intensity === "maximal")).length;

const getDaysSinceLastTraining = (sessions: TrainingSession[], referenceDate = new Date()): number | undefined => {
  const last = [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  return last ? dayDiff(dayKey(referenceDate), last.date) : undefined;
};

export const getAthleteStatus = (
  sessions: TrainingSession[],
  plan: PlanEntry[],
  journal: TrainingJournalEntry[],
  referenceDate = new Date(),
): AthleteStatus => {
  const hardCount = getHardPlanCount(plan.slice(-7));
  const daysSinceTraining = getDaysSinceLastTraining(sessions, referenceDate);
  const streak = getCurrentTrainingStreak(sessions, referenceDate);
  const recentJournal = [...journal].sort((a, b) => b.date.localeCompare(a.date))[0];

  if (hardCount >= 3 || (recentJournal && recentJournal.fatigue >= 8)) {
    return {
      title: "Erholung empfohlen",
      detail: "Die letzten Belastungen waren hoch. Plane bewusst Regeneration ein.",
      tone: "warning",
    };
  }

  if (daysSinceTraining === undefined || daysSinceTraining >= 4) {
    return {
      title: "Zeit fuer eine Einheit",
      detail: "Ein ruhiges Technik- oder GA1-Training wuerde jetzt gut passen.",
      tone: "primary",
    };
  }

  if (streak >= 3) {
    return {
      title: "Du bist auf einem starken Weg.",
      detail: "Deine Serie zeigt Konstanz. Halte die Qualitaet hoch.",
      tone: "success",
    };
  }

  return {
    title: "Stabiler Trainingsrhythmus",
    detail: "Bleib bei klaren Zielen und dokumentiere dein Gefuehl nach der Einheit.",
    tone: "success",
  };
};

export const getSmartCoachAdvice = (
  competitions: Competition[],
  training: TrainingSession[],
  plan: PlanEntry[],
  journal: TrainingJournalEntry[],
): SmartCoachAdvice => {
  const recentTraining = [...training].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const enduranceCount = recentTraining.filter((session) => session.type === "Ausdauer").length;
  const techniqueCount = recentTraining.filter((session) => session.type === "Technik" || session.type === "K1" || session.type === "C1").length;
  const averagePenalty = getAveragePenalty(competitions);
  const daysSinceTraining = getDaysSinceLastTraining(training);
  const recentFatigue = [...journal].sort((a, b) => b.date.localeCompare(a.date))[0]?.fatigue ?? 0;
  const hardPlanCount = getHardPlanCount(plan);

  if (recentFatigue >= 8 || hardPlanCount >= 4) {
    return {
      title: "Paddlio Coach",
      recommendation: "Plane eine echte Pause oder eine lockere Mobilitaetseinheit.",
      reason: "Deine Belastung und Rueckmeldung sprechen fuer Regeneration.",
    };
  }

  if (daysSinceTraining !== undefined && daysSinceTraining >= 5) {
    return {
      title: "Paddlio Coach",
      recommendation: "Starte mit einer lockeren GA1-Einheit.",
      reason: `Deine letzte dokumentierte Einheit liegt ${daysSinceTraining} Tage zurueck.`,
    };
  }

  if (enduranceCount < 1 && recentTraining.length >= 3) {
    return {
      title: "Paddlio Coach",
      recommendation: "Trainiere diese Woche mehr GA1.",
      reason: "In den letzten Einheiten war wenig Ausdauerarbeit dokumentiert.",
    };
  }

  if (averagePenalty >= 2 && competitions.length > 0) {
    return {
      title: "Paddlio Coach",
      recommendation: "Techniktraining waere sinnvoll.",
      reason: "Dein Strafschnitt zeigt Potenzial bei Linienwahl und Torpraezision.",
    };
  }

  if (techniqueCount >= 3) {
    return {
      title: "Paddlio Coach",
      recommendation: "Ergaenze eine ruhige Grundlagen- oder Regenerationseinheit.",
      reason: "Du hast zuletzt viel technisch gearbeitet. Balance haelt dich frisch.",
    };
  }

  return {
    title: "Paddlio Coach",
    recommendation: "Setze heute einen kleinen, messbaren Fokus.",
    reason: "Klare Ziele machen deine Trainingsdaten wertvoller.",
  };
};

export const getTrainingIntelligence = (
  competitions: Competition[],
  training: TrainingSession[],
  plan: PlanEntry[],
  journal: TrainingJournalEntry[],
  referenceDate = new Date(),
): TrainingIntelligence => ({
  todayTraining: getTodayPlanEntries(plan, referenceDate)[0],
  nextTraining: getNextPlannedEntry(plan, referenceDate),
  currentStreak: getCurrentTrainingStreak(training, referenceDate),
  longestStreak: getLongestTrainingStreak(training),
  trainingQuote: getTrainingQuote(plan, referenceDate),
  athleteStatus: getAthleteStatus(training, plan, journal, referenceDate),
  coachAdvice: getSmartCoachAdvice(competitions, training, plan, journal),
  motivation: getDailyMotivation(referenceDate),
});
