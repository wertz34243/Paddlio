export type FeedbackQueueNormalization = {
  payload: Record<string, unknown>;
  repaired: boolean;
};

const asId = (value: unknown): string => typeof value === "string" ? value : "";

export const normalizeTrainingFeedbackQueuePayload = (
  input: Record<string, unknown>,
  userId: string,
): FeedbackQueueNormalization => {
  const payload = { ...input };
  const athleteId = asId(payload.athlete_id);
  const originalCoachId = asId(payload.coach_id);
  const originalAuthorId = asId(payload.author_id);
  const rawType = payload.feedback_type;
  let feedbackType = rawType === "trainer" || rawType === "athlete" ? rawType : "";

  if (!feedbackType) {
    if (originalCoachId === userId || (originalAuthorId === userId && athleteId !== userId)) {
      feedbackType = "trainer";
    } else if (athleteId === userId) {
      feedbackType = "athlete";
    }
  }

  if (!feedbackType) return { payload, repaired: false };

  payload.feedback_type = feedbackType;
  if (feedbackType === "athlete" && athleteId === userId && (!originalAuthorId || originalAuthorId === userId)) {
    payload.author_id = userId;
  }

  if (feedbackType === "trainer") {
    const identityIsSelf = originalCoachId === userId || originalAuthorId === userId;
    if (identityIsSelf) {
      payload.coach_id = userId;
      payload.author_id = userId;
    }
  }

  return {
    payload,
    repaired: JSON.stringify(payload) !== JSON.stringify(input),
  };
};
