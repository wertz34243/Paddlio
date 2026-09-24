import type { PlanEntry, TrainingAttendance, UserRole } from "./types";

const parseTime = (value: string): [number, number] => {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  return match ? [Number(match[1]), Number(match[2])] : [23, 59];
};

export const getTrainingEnd = (training: PlanEntry): Date => {
  const start = training.startTime || training.time || "23:59";
  const [startHour, startMinute] = parseTime(start);
  const [hour, minute] = training.endTime
    ? parseTime(training.endTime)
    : [startHour, startMinute + Math.max(0, training.durationMinutes || 0)];
  const result = new Date(`${training.date}T00:00:00`);
  result.setHours(hour, minute, 0, 0);
  return result;
};

export const hasTrainingEnded = (training: PlanEntry, now = new Date()): boolean =>
  getTrainingEnd(training).getTime() < now.getTime();

export const canDeleteTrainingAttendance = (role: UserRole, training: PlanEntry, now = new Date()): boolean =>
  role !== "athlete" && hasTrainingEnded(training, now);

export const getAttendanceTrainings = (
  trainings: PlanEntry[],
  attendance: TrainingAttendance[],
  now = new Date(),
): PlanEntry[] => {
  const trainingIdsWithAnswers = new Set(attendance.map((item) => item.trainingId));
  return trainings.filter((training) => !hasTrainingEnded(training, now) || trainingIdsWithAnswers.has(training.id));
};
