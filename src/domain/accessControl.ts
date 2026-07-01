import type { CoachAthlete, CoachGroup, PaddleMotionData, PlanEntry, SeasonGoal, TrainingTemplate, User, UserRole } from "./types";

export const isAdminRole = (role: UserRole): boolean => role === "admin";

export const isCoachLikeRole = (role: UserRole): boolean => role === "coach" || role === "teamAdmin";

export const canUseCoachArea = (role: UserRole): boolean => isAdminRole(role) || isCoachLikeRole(role);

export const canManageAdminArea = (role: UserRole): boolean => isAdminRole(role);

const normalizeScope = (value?: string): string => (value ?? "").trim().toLowerCase();

export const isSameScopeValue = (left?: string, right?: string): boolean => {
  const normalizedLeft = normalizeScope(left);
  const normalizedRight = normalizeScope(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
};

const getUserScopeValues = (user: User, extraScopeValues: string[] = []): string[] =>
  [user.profile.club, ...extraScopeValues].filter((value) => normalizeScope(value).length > 0);

const hasMatchingScope = (value: string | undefined, scopeValues: string[]): boolean =>
  scopeValues.some((scopeValue) => isSameScopeValue(value, scopeValue));

export const canAccessCoachAthlete = (user: User, athlete: CoachAthlete, extraScopeValues: string[] = []): boolean => {
  if (isAdminRole(user.role)) return true;
  if (!isCoachLikeRole(user.role)) return false;

  const scopeValues = getUserScopeValues(user, extraScopeValues);
  return hasMatchingScope(athlete.club, scopeValues) || hasMatchingScope(athlete.clubId, scopeValues);
};

export const canAccessCoachGroup = (user: User, group: CoachGroup, extraScopeValues: string[] = []): boolean => {
  if (isAdminRole(user.role)) return true;
  if (!isCoachLikeRole(user.role)) return false;

  const scopeValues = getUserScopeValues(user, extraScopeValues);
  return group.coachId === user.userId || group.coachUserId === user.userId || hasMatchingScope(group.clubId, scopeValues);
};

export const getAthletesForCurrentUser = (data: PaddleMotionData, user: User, extraScopeValues: string[] = []): CoachAthlete[] =>
  data.coachAthletes.filter((athlete) => canAccessCoachAthlete(user, athlete, extraScopeValues));

export const getGroupsForCurrentUser = (data: PaddleMotionData, user: User, extraScopeValues: string[] = []): CoachGroup[] =>
  data.coachGroups.filter((group) => canAccessCoachGroup(user, group, extraScopeValues));

export const canAccessPlanEntry = (data: PaddleMotionData, user: User, entry: PlanEntry, extraScopeValues: string[] = []): boolean => {
  if (isAdminRole(user.role)) return true;

  const isOwnTraining =
    entry.ownerUserId === user.userId ||
    entry.createdByUserId === user.userId ||
    entry.assignedAthleteId === data.athlete.id ||
    entry.assignedAthleteIds.includes(data.athlete.id);

  if (isOwnTraining) return true;
  if (!isCoachLikeRole(user.role)) return false;

  const athleteIds = new Set(getAthletesForCurrentUser(data, user, extraScopeValues).map((athlete) => athlete.id));
  const groupIds = new Set(getGroupsForCurrentUser(data, user, extraScopeValues).flatMap((group) => [group.id, group.groupId]));

  return (
    entry.assignedAthleteIds.some((id) => athleteIds.has(id)) ||
    Boolean(entry.assignedAthleteId && athleteIds.has(entry.assignedAthleteId)) ||
    entry.assignedGroupIds.some((id) => groupIds.has(id)) ||
    Boolean(entry.assignedGroupId && groupIds.has(entry.assignedGroupId))
  );
};

export const getTrainingsForCurrentUser = (data: PaddleMotionData, user: User, extraScopeValues: string[] = []): PlanEntry[] =>
  data.plan.filter((entry) => canAccessPlanEntry(data, user, entry, extraScopeValues));

export const canAccessTrainingTemplate = (user: User, template: TrainingTemplate, extraScopeValues: string[] = []): boolean => {
  if (isAdminRole(user.role)) return true;
  if (template.ownerUserId === user.userId || template.createdByUserId === user.userId) return true;
  if (template.visibility !== "club" || !isCoachLikeRole(user.role)) return false;

  const scopeValues = getUserScopeValues(user, extraScopeValues);
  return hasMatchingScope(template.clubId, scopeValues);
};

export const canEditTrainingTemplate = (user: User, template: TrainingTemplate): boolean =>
  isAdminRole(user.role) || template.ownerUserId === user.userId || template.createdByUserId === user.userId;

export const getTrainingTemplatesForCurrentUser = (data: PaddleMotionData, user: User, extraScopeValues: string[] = []): TrainingTemplate[] =>
  data.trainingTemplates.filter((template) => canAccessTrainingTemplate(user, template, extraScopeValues));

export const getGoalsForCurrentUser = (data: PaddleMotionData, user: User): SeasonGoal[] => {
  if (isAdminRole(user.role)) return data.goals;

  return data.goals.filter((goal) => {
    const belongsToCurrentAthlete = goal.athleteId === data.athlete.id || goal.ownerUserId === user.userId;
    const createdByCurrentCoach = isCoachLikeRole(user.role) && goal.assignedByUserId === user.userId;
    return belongsToCurrentAthlete || createdByCurrentCoach;
  });
};
