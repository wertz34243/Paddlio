import type { TrainingFeedback } from "./types";

export const getTrainingFeedbackType = (feedback: Pick<TrainingFeedback, "feedbackType">): "athlete" | "trainer" =>
  feedback.feedbackType === "trainer" ? "trainer" : "athlete";

export const getTrainingFeedbackKey = (
  feedback: Pick<TrainingFeedback, "trainingId" | "athleteUserId" | "feedbackType">,
): string => `${feedback.trainingId}:${feedback.athleteUserId}:${getTrainingFeedbackType(feedback)}`;

export const deduplicateTrainingFeedback = (items: TrainingFeedback[]): TrainingFeedback[] => {
  const byKey = new Map<string, TrainingFeedback>();

  items.forEach((item) => {
    const key = getTrainingFeedbackKey(item);
    const current = byKey.get(key);
    if (!current || item.completedAt.localeCompare(current.completedAt) >= 0) byKey.set(key, item);
  });

  return [...byKey.values()].sort((left, right) => right.completedAt.localeCompare(left.completedAt));
};
