export type FeedbackQueueNormalization = {
  payload: Record<string, unknown>;
  repaired: boolean;
  legacyPayload: boolean;
  repairDecision: FeedbackRepairDecision;
};

export type FeedbackRepairDecision =
  | "retry_as_athlete"
  | "retry_as_trainer"
  | "cannot_reconstruct"
  | "invalid_foreign_identity";

export type FeedbackIdentityDiagnostic = {
  feedbackType: "athlete" | "trainer" | "missing";
  athleteMatchesCurrentUser: boolean | null;
  authorMatchesCurrentUser: boolean | null;
  coachMatchesCurrentUser: boolean | null;
  legacyPayload: boolean;
  repairDecision: FeedbackRepairDecision;
};

const asId = (value: unknown): string => typeof value === "string" ? value : "";

const matchesUser = (value: unknown, userId: string): boolean | null => {
  const id = asId(value);
  return id ? id === userId : null;
};

export const diagnoseTrainingFeedbackPayload = (
  payload: Record<string, unknown>,
  userId: string,
): FeedbackIdentityDiagnostic => {
  const feedbackType = payload.feedback_type === "athlete" || payload.feedback_type === "trainer"
    ? payload.feedback_type
    : "missing";
  const athleteMatchesCurrentUser = matchesUser(payload.athlete_id, userId);
  const authorMatchesCurrentUser = matchesUser(payload.author_id, userId);
  const coachMatchesCurrentUser = matchesUser(payload.coach_id, userId);
  const legacyPayload = feedbackType === "missing"
    || authorMatchesCurrentUser === null
    || (feedbackType === "trainer" && coachMatchesCurrentUser === null);

  let repairDecision: FeedbackRepairDecision = "cannot_reconstruct";
  if (feedbackType === "athlete") {
    repairDecision = athleteMatchesCurrentUser === false || authorMatchesCurrentUser === false
      ? "invalid_foreign_identity"
      : athleteMatchesCurrentUser === true
        ? "retry_as_athlete"
        : "cannot_reconstruct";
  } else if (feedbackType === "trainer") {
    repairDecision = authorMatchesCurrentUser === false || coachMatchesCurrentUser === false
      ? "invalid_foreign_identity"
      : authorMatchesCurrentUser === true || coachMatchesCurrentUser === true
        ? "retry_as_trainer"
        : "cannot_reconstruct";
  } else if (athleteMatchesCurrentUser === true) {
    repairDecision = "retry_as_athlete";
  } else if (coachMatchesCurrentUser === true || (authorMatchesCurrentUser === true && athleteMatchesCurrentUser === false)) {
    repairDecision = "retry_as_trainer";
  } else if (athleteMatchesCurrentUser === false && (authorMatchesCurrentUser === false || coachMatchesCurrentUser === false)) {
    repairDecision = "invalid_foreign_identity";
  }

  return {
    feedbackType,
    athleteMatchesCurrentUser,
    authorMatchesCurrentUser,
    coachMatchesCurrentUser,
    legacyPayload,
    repairDecision,
  };
};

export const normalizeTrainingFeedbackQueuePayload = (
  input: Record<string, unknown>,
  userId: string,
): FeedbackQueueNormalization => {
  const payload = { ...input };
  const diagnostic = diagnoseTrainingFeedbackPayload(input, userId);
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

  if (!feedbackType) return { payload, repaired: false, legacyPayload: diagnostic.legacyPayload, repairDecision: diagnostic.repairDecision };

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
    legacyPayload: diagnostic.legacyPayload,
    repairDecision: diagnostic.repairDecision,
  };
};
