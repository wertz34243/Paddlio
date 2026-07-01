import {
  formatSeconds,
  getAveragePenalty,
  getBoatClassStats,
  getTotalTrainingMinutes,
} from "./metrics";
import type { Competition, SeasonGoal, TrainingSession } from "./types";

export type GoalProgressView = {
  goal: SeasonGoal;
  currentValue: number;
  currentLabel: string;
  targetLabel: string;
  progress: number;
  completed: boolean;
  statusLabel: "offen" | "fast geschafft" | "erreicht" | "pausiert" | "archiviert";
};

const clampProgress = (value: number): number => Math.max(0, Math.min(100, value));

const formatValue = (value: number, unit: string): string => {
  if (unit === "s") {
    return `${formatSeconds(value)} s`;
  }

  return `${Math.round(value * 10) / 10}${unit ? ` ${unit}` : ""}`;
};

const getAutomaticValue = (
  goal: SeasonGoal,
  competitions: Competition[],
  training: TrainingSession[],
): number => {
  if (goal.currentValueOverride !== "") {
    return goal.currentValueOverride;
  }

  switch (goal.metric) {
    case "bestK1Total":
      return getBoatClassStats(competitions, "K1").bestTotalSeconds ?? 0;
    case "bestC1Total":
      return getBoatClassStats(competitions, "C1").bestTotalSeconds ?? 0;
    case "averagePenalty":
      return competitions.length > 0 ? getAveragePenalty(competitions) : 0;
    case "trainingCount":
      return training.length;
    case "trainingMinutes":
      return getTotalTrainingMinutes(training);
    case "manual":
    default:
      return goal.currentValueOverride === "" ? 0 : goal.currentValueOverride;
  }
};

const isCompleted = (goal: SeasonGoal, currentValue: number): boolean => {
  if (goal.status === "achieved") {
    return true;
  }

  if (goal.metric !== "manual" && currentValue === 0 && goal.direction === "under") {
    return false;
  }

  if (goal.direction === "under") {
    return currentValue > 0 && currentValue <= goal.targetValue;
  }

  if (goal.direction === "equal") {
    return currentValue === goal.targetValue;
  }

  return currentValue >= goal.targetValue;
};

const getProgress = (goal: SeasonGoal, currentValue: number): number => {
  if (goal.targetValue <= 0) {
    return 0;
  }

  if (goal.direction === "under") {
    if (currentValue <= 0) {
      return 0;
    }
    return clampProgress((goal.targetValue / currentValue) * 100);
  }

  if (goal.direction === "equal") {
    return currentValue === goal.targetValue ? 100 : clampProgress((currentValue / goal.targetValue) * 100);
  }

  return clampProgress((currentValue / goal.targetValue) * 100);
};

const getStatusLabel = (goal: SeasonGoal, progress: number, completed: boolean): GoalProgressView["statusLabel"] => {
  if (goal.status === "paused") {
    return "pausiert";
  }

  if (goal.status === "archived") {
    return "archiviert";
  }

  if (completed) {
    return "erreicht";
  }

  return progress >= 80 ? "fast geschafft" : "offen";
};

export const getGoalProgress = (
  goal: SeasonGoal,
  competitions: Competition[],
  training: TrainingSession[],
): GoalProgressView => {
  const currentValue = getAutomaticValue(goal, competitions, training);
  const completed = isCompleted(goal, currentValue);
  const progress = getProgress(goal, currentValue);

  return {
    goal,
    currentValue,
    currentLabel: formatValue(currentValue, goal.unit),
    targetLabel: `${goal.direction === "under" ? "unter" : goal.direction === "equal" ? "genau" : "mind."} ${formatValue(goal.targetValue, goal.unit)}`,
    progress,
    completed,
    statusLabel: getStatusLabel(goal, progress, completed),
  };
};

export const getGoalProgressList = (
  goals: SeasonGoal[],
  competitions: Competition[],
  training: TrainingSession[],
): GoalProgressView[] =>
  goals
    .map((goal) => getGoalProgress(goal, competitions, training))
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.goal.priority] - priorityOrder[b.goal.priority] || a.goal.dueDate.localeCompare(b.goal.dueDate);
    });
