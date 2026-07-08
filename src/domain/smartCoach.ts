import { getAveragePenalty, getBestTotalTime, getNextPlannedEntry, getPlanEntriesForCurrentWeek } from "./metrics";
import { isDoneStatus, isPlannedStatus } from "./trainingPlan";
import type {
  Competition,
  MaterialItem,
  PaddleMotionData,
  PlanEntry,
  SeasonGoal,
  SmartCoachCategory,
  SmartCoachPriority,
  SmartCoachRecommendation,
  TrainingFeedback,
  User,
} from "./types";
import { getAthletesForCurrentUser, getGoalsForCurrentUser, getTrainingsForCurrentUser, isAdminRole, isCoachLikeRole } from "./accessControl";
import { getGoalProgressList } from "./goalProgress";

type RecommendationDraft = Omit<SmartCoachRecommendation, "createdAt" | "updatedAt" | "status" | "note"> & {
  status?: SmartCoachRecommendation["status"];
};

const todayKey = (): string => new Date().toISOString().slice(0, 10);

const addDays = (date: string, days: number): string => {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
};

const daysBetween = (left: string, right: string): number =>
  Math.round((new Date(`${left}T00:00:00`).getTime() - new Date(`${right}T00:00:00`).getTime()) / 86400000);

const inLastDays = (date: string, days: number, reference = todayKey()): boolean =>
  date <= reference && daysBetween(reference, date) <= days;

const inNextDays = (date: string, days: number, reference = todayKey()): boolean =>
  date >= reference && daysBetween(date, reference) <= days;

const normalize = (value: string): string => value.trim().toLowerCase();

const buildId = (userId: string, rule: string, entityId = "global"): string =>
  `smart-${userId}-${rule}-${entityId}`.replace(/[^a-zA-Z0-9-]/g, "-");

const byPriority = (item: SmartCoachRecommendation): number =>
  item.priority === "high" ? 0 : item.priority === "medium" ? 1 : 2;

const categoryLabel: Record<SmartCoachCategory, string> = {
  training: "Training",
  regeneration: "Regeneration",
  technik: "Technik",
  ausdauer: "Ausdauer",
  kraft: "Kraft",
  wettkampf: "Wettkampf",
  ziele: "Ziele",
  material: "Material",
  warnung: "Warnung",
  motivation: "Motivation",
};

export const getSmartCoachCategoryLabel = (category: SmartCoachCategory): string => categoryLabel[category];

const createDraft = (
  user: User,
  rule: string,
  category: SmartCoachCategory,
  priority: SmartCoachPriority,
  title: string,
  message: string,
  reason: string,
  suggestedAction: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
  createdForUserId = user.userId,
): RecommendationDraft => ({
  id: buildId(createdForUserId, rule, relatedEntityId),
  ownerUserId: user.userId,
  createdForUserId,
  createdBySystem: true,
  clubId: user.profile.club,
  category,
  priority,
  title,
  message,
  reason,
  suggestedAction,
  relatedEntityType,
  relatedEntityId,
});

const getLastDoneTrainingDate = (plan: PlanEntry[]): string | undefined =>
  [...plan].filter((entry) => isDoneStatus(entry.status)).sort((a, b) => b.date.localeCompare(a.date))[0]?.date;

const hasTrainingTypeInPeriod = (plan: PlanEntry[], typeNames: string[], days: number): boolean =>
  plan.some((entry) => inLastDays(entry.date, days) && typeNames.some((name) => normalize(entry.trainingType).includes(normalize(name)) || normalize(entry.area).includes(normalize(name))));

const getHardTrainingCount = (plan: PlanEntry[], days: number): number =>
  plan.filter((entry) => inLastDays(entry.date, days) && (entry.intensity === "hart" || entry.intensity === "maximal")).length;

const getWeakFeedback = (feedback: TrainingFeedback[]): TrainingFeedback | undefined =>
  [...feedback]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .find((item) => item.fatigue >= 8 || (item.sleep ?? 7) <= 4 || item.feeling <= 4 || item.motivation <= 4);

const getNextCompetition = (competitions: Competition[]): Competition | undefined =>
  [...competitions].filter((competition) => inNextDays(competition.date, 30)).sort((a, b) => a.date.localeCompare(b.date))[0];

const buildAthleteRecommendations = (data: PaddleMotionData, user: User): RecommendationDraft[] => {
  const plan = getTrainingsForCurrentUser(data, user);
  const goals = getGoalsForCurrentUser(data, user);
  const competitions = data.competitions;
  const feedback = data.trainingFeedback;
  const material = data.material;
  const externalSessions = data.externalTrainingSessions ?? [];
  const drafts: RecommendationDraft[] = [];
  const today = todayKey();
  const lastDoneDate = getLastDoneTrainingDate(plan);
  const hardCount = getHardTrainingCount(plan, 5);
  const weakFeedback = getWeakFeedback(feedback);
  const averagePenalty = competitions.length > 0 ? getAveragePenalty(competitions) : 0;
  const nextRace = getNextCompetition(competitions);
  const goalProgress = getGoalProgressList(goals, competitions, data.training);

  if (!lastDoneDate || daysBetween(today, lastDoneDate) >= 7) {
    drafts.push(createDraft(
      user,
      "no-training-7-days",
      "training",
      "medium",
      "Zeit fär eine lockere Einheit",
      "Du hast seit mindestens sieben Tagen kein erledigtes Training dokumentiert.",
      lastDoneDate ? `Letzte erledigte Einheit: ${lastDoneDate}.` : "Es gibt noch keine erledigte Trainingseinheit.",
      "Plane eine lockere Technik- oder GA1-Einheit.",
    ));
  }

  if (hardCount >= 3) {
    drafts.push(createDraft(
      user,
      "hard-load-5-days",
      "regeneration",
      "high",
      "Regeneration einplanen",
      "Drei oder mehr harte Einheiten in fünf Tagen sind ein klares Belastungssignal.",
      `${hardCount} harte oder maximale Einheiten liegen im kurzen Zeitraum.`,
      "Plane eine Pause, Mobilitaet oder eine sehr lockere Einheit.",
    ));
  }

  if (weakFeedback) {
    drafts.push(createDraft(
      user,
      "weak-feedback",
      "warnung",
      "high",
      "Heute lieber locker trainieren",
      "Deine letzte Räckmeldung zeigt erhoehte Müdigkeit oder schwache Erholung.",
      `Müdigkeit ${weakFeedback.fatigue}/10, Schlaf ${weakFeedback.sleep ?? 7}/10, Gefühl ${weakFeedback.feeling}/10.`,
      "Reduziere Intensität und dokumentiere nach der Einheit erneut dein Gefühl.",
      "training_feedback",
      weakFeedback.id,
    ));
  }

  if (averagePenalty >= 4) {
    drafts.push(createDraft(
      user,
      "high-penalties",
      "technik",
      "medium",
      "Technikfokus: saubere Linien",
      "Dein Strafsekunden-Schnitt zeigt Potenzial bei Praezision und Torarbeit.",
      `Aktueller Strafschnitt: ${averagePenalty.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Sekunden.`,
      "Plane ein Techniktraining mit klarer Linienwahl und Torberuehrungs-Fokus.",
    ));
  }

  if (!hasTrainingTypeInPeriod(plan, ["GA1", "Grundlagen", "Ausdauer"], 14)) {
    drafts.push(createDraft(
      user,
      "missing-ga1-14-days",
      "ausdauer",
      "medium",
      "Grundlagenausdauer fehlt",
      "In den letzten 14 Tagen ist kein GA1- oder Grundlagenreiz sichtbar.",
      "Eine stabile Grundlage hilft dir, technische Qualität laenger zu halten.",
      "Plane 45 bis 90 Minuten locker im GA1-Bereich.",
    ));
  }

  if (nextRace && inNextDays(nextRace.date, 7)) {
    drafts.push(createDraft(
      user,
      "race-week",
      "wettkampf",
      "high",
      "Wettkampfvorbereitung starten",
      `${nextRace.location} steht in ${daysBetween(nextRace.date, today)} Tagen an.`,
      "Der Wettkampf liegt innerhalb der nächsten sieben Tage.",
      "Plane kurze Wettkampfsimulation, Materialcheck und ruhige Aktivierung.",
      "competition",
      nextRace.id,
    ));
  }

  const latestResults = [...competitions].sort((a, b) => b.date.localeCompare(a.date));
  const latestResult = latestResults[0];
  const previousSameBoat = latestResult
    ? latestResults.find((item) => item.id !== latestResult.id && item.boatClass === latestResult.boatClass && item.date < latestResult.date)
    : undefined;
  if (latestResult && previousSameBoat && getBestTotalTime(latestResult) < getBestTotalTime(previousSameBoat)) {
    drafts.push(createDraft(
      user,
      "result-improved",
      "motivation",
      "low",
      "Deine Ergebniszeit verbessert sich",
      `${latestResult.boatClass} in ${latestResult.location}: Du bist schneller als beim vorherigen vergleichbaren Ergebnis.`,
      `Verbesserung um ${(getBestTotalTime(previousSameBoat) - getBestTotalTime(latestResult)).toLocaleString("de-DE", { maximumFractionDigits: 2 })} Sekunden.`,
      "Halte fest, welche Linienwahl und Vorbereitung gut funktioniert haben.",
      "competition",
      latestResult.id,
    ));
  }

  if (!latestResult || daysBetween(today, latestResult.date) >= 90) {
    drafts.push(createDraft(
      user,
      "no-result-90-days",
      "wettkampf",
      "low",
      "Ergebnis nachtragen",
      "Es ist lange kein Wettkampfergebnis dokumentiert.",
      latestResult ? `Letztes Ergebnis: ${latestResult.date}.` : "Noch kein Ergebnis vorhanden.",
      "Trage den letzten Start ein, damit Bestzeiten und Saisonvergleich sauber bleiben.",
    ));
  }

  const unlinkedExternal = externalSessions.find((session) => !session.linkedTrainingId);
  if (unlinkedExternal) {
    drafts.push(createDraft(
      user,
      "external-session-unlinked",
      "training",
      "medium",
      "Externes Training verknuepfen",
      "Eine Polar- oder externe Trainingseinheit ist noch keinem Paddlio-Training zugeordnet.",
      `${unlinkedExternal.title} von ${new Date(unlinkedExternal.startedAt).toLocaleDateString("de-DE")}.`,
      "Verknuepfe die Einheit mit dem geplanten Training, damit Belastung und Analyse stimmen.",
      "external_training_session",
      unlinkedExternal.id,
    ));
  }

  const currentWeekMinutes = externalSessions
    .filter((session) => inLastDays(session.startedAt.slice(0, 10), 7))
    .reduce((sum, session) => sum + Math.round(session.durationSeconds / 60), 0);
  const previousWeekMinutes = externalSessions
    .filter((session) => {
      const date = session.startedAt.slice(0, 10);
      const age = daysBetween(today, date);
      return age > 7 && age <= 14;
    })
    .reduce((sum, session) => sum + Math.round(session.durationSeconds / 60), 0);
  if (previousWeekMinutes > 0 && currentWeekMinutes > previousWeekMinutes * 1.5) {
    drafts.push(createDraft(
      user,
      "external-load-jump",
      "regeneration",
      "medium",
      "Trainingsbelastung steigt deutlich",
      "Die externe Trainingsdauer dieser Woche liegt deutlich ueber der Vorwoche.",
      `${currentWeekMinutes} min diese Woche gegenueber ${previousWeekMinutes} min in der Vorwoche.`,
      "Plane bewusst Erholung und pruefe die Räckmeldungen nach harten Einheiten.",
    ));
  }

  const riskyGoal = goalProgress.find((item) => item.goal.status === "active" && item.goal.dueDate && inNextDays(item.goal.dueDate, 21) && item.progress < 60);
  if (riskyGoal) {
    drafts.push(createDraft(
      user,
      "goal-at-risk",
      "ziele",
      "high",
      "Saisonziel braucht Aufmerksamkeit",
      `${riskyGoal.goal.title} ist bald faellig und liegt noch unter 60 Prozent Fortschritt.`,
      `Faellig am ${riskyGoal.goal.dueDate}, aktueller Fortschritt ${Math.round(riskyGoal.progress)}%.`,
      "Brich das Ziel in eine konkrete Trainingseinheit fär diese Woche herunter.",
      "season_goal",
      riskyGoal.goal.id,
    ));
  }

  const materialToTest = material.find((item: MaterialItem) => item.status === "pruefen" || normalize(item.note).includes("testen") || normalize(item.name).includes("neu"));
  if (materialToTest) {
    drafts.push(createDraft(
      user,
      "material-test",
      "material",
      "low",
      "Materialtest dokumentieren",
      `${materialToTest.name} sollte bewusst getestet und bewertet werden.`,
      `Status: ${materialToTest.status}.`,
      "Plane eine Einheit mit Materialnotiz und Bewertung nach dem Training.",
      "material",
      materialToTest.id,
    ));
  }

  if (drafts.length === 0) {
    drafts.push(createDraft(
      user,
      "steady-progress",
      "motivation",
      "low",
      "Du bist im Rhythmus",
      "Deine aktuellen Daten zeigen keine akute Baustelle.",
      "Konstanz und saubere Dokumentation sind gerade dein groesster Hebel.",
      "Waehle fär die nächste Einheit einen messbaren Fokus.",
    ));
  }

  return drafts;
};

const buildCoachRecommendations = (data: PaddleMotionData, user: User): RecommendationDraft[] => {
  if (!isCoachLikeRole(user.role) && !isAdminRole(user.role)) return [];

  const athletes = getAthletesForCurrentUser(data, user);
  const currentWeek = getPlanEntriesForCurrentWeek(data.plan);
  const drafts: RecommendationDraft[] = [];

  athletes.forEach((athlete) => {
    const athletePlan = data.plan.filter((entry) =>
      entry.assignedAthleteId === athlete.id ||
      entry.assignedAthleteIds.includes(athlete.id) ||
      athlete.groupIds.some((groupId) => entry.assignedGroupId === groupId || entry.assignedGroupIds.includes(groupId)),
    );
    const weekPlan = currentWeek.filter((entry) => athletePlan.some((athleteEntry) => athleteEntry.id === entry.id));
    const hardCount = getHardTrainingCount(athletePlan, 5);
    const doneWithoutFeedback = weekPlan.filter((entry) => isDoneStatus(entry.status) && !data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id));
    const goals = data.goals.filter((goal: SeasonGoal) => goal.athleteId === athlete.id || goal.ownerUserId === athlete.id);
    const goalProgress = getGoalProgressList(goals, data.competitions.filter((competition) => competition.athleteId === athlete.id), data.training);
    const riskyGoal = goalProgress.find((item) => item.goal.status === "active" && item.goal.dueDate && inNextDays(item.goal.dueDate, 21) && item.progress < 60);

    if (weekPlan.length === 0) {
      drafts.push(createDraft(
        user,
        "coach-athlete-no-week-plan",
        "training",
        "medium",
        `${athlete.name}: kein Training geplant`,
        "Dieser Sportler hat in der aktuellen Woche noch keine geplante Einheit.",
        "Coach-Ansicht: Wochenplanung enthält keine Einheit fär diesen Sportler.",
        "Plane eine passende Einheit oder pruefe die Gruppenzuweisung.",
        "coach_athlete",
        athlete.id,
        athlete.id,
      ));
    }

    if (hardCount >= 3) {
      drafts.push(createDraft(
        user,
        "coach-athlete-hard-load",
        "regeneration",
        "high",
        `${athlete.name}: hohe Belastung`,
        "Mehrere harte Einheiten in kurzer Zeit können die Qualität senken.",
        `${hardCount} harte oder maximale Einheiten in fünf Tagen.`,
        "Sprich Regeneration oder eine lockere Einheit ab.",
        "coach_athlete",
        athlete.id,
        athlete.id,
      ));
    }

    if (doneWithoutFeedback.length > 0) {
      drafts.push(createDraft(
        user,
        "coach-athlete-open-feedback",
        "training",
        "medium",
        `${athlete.name}: Räckmeldung offen`,
        "Erledigte Trainings ohne Feedback erschweren die Belastungssteuerung.",
        `${doneWithoutFeedback.length} erledigte Einheit(en) ohne Räckmeldung.`,
        "Bitte um kurze Räckmeldung zu Gefühl, Müdigkeit und Motivation.",
        "coach_athlete",
        athlete.id,
        athlete.id,
      ));
    }

    if (riskyGoal) {
      drafts.push(createDraft(
        user,
        "coach-athlete-risky-goal",
        "ziele",
        "high",
        `${athlete.name}: Ziel gefaehrdet`,
        `${riskyGoal.goal.title} braucht Aufmerksamkeit.`,
        `Fortschritt ${Math.round(riskyGoal.progress)}%, faellig am ${riskyGoal.goal.dueDate}.`,
        "Passe den Wochenplan auf dieses Ziel an.",
        "season_goal",
        riskyGoal.goal.id,
        athlete.id,
      ));
    }
  });

  data.coachGroups.forEach((group) => {
    const groupWeekPlan = currentWeek.filter((entry) => entry.assignedGroupId === group.id || entry.assignedGroupIds.includes(group.id));
    if (groupWeekPlan.length === 0 && (isAdminRole(user.role) || group.clubId === user.profile.club || group.coachUserId === user.userId)) {
      drafts.push(createDraft(
        user,
        "coach-group-no-week-plan",
        "training",
        "medium",
        `${group.name}: kein Gruppenplan`,
        "Diese Gruppe hat fär die aktuelle Woche noch keine geplante Einheit.",
        "Gruppen ohne Plan können im Trainingsalltag leicht untergehen.",
        "Plane eine Gruppeneinheit oder kopiere eine passende Vorlage.",
        "training_group",
        group.id,
      ));
    }
  });

  return drafts;
};

export const buildSmartCoachRecommendations = (data: PaddleMotionData, user: User): SmartCoachRecommendation[] => {
  const now = new Date().toISOString();
  const drafts = [...buildAthleteRecommendations(data, user), ...buildCoachRecommendations(data, user)];
  const storedById = new Map((data.smartCoachRecommendations ?? []).map((item) => [item.id, item]));

  return drafts
    .map((draft) => {
      const stored = storedById.get(draft.id);
      return {
        ...draft,
        status: stored?.status ?? draft.status ?? "open",
        note: stored?.note ?? "",
        createdAt: stored?.createdAt ?? now,
        updatedAt: stored?.updatedAt ?? now,
      };
    })
    .filter((item) => item.status !== "dismissed")
    .sort((a, b) => byPriority(a) - byPriority(b) || b.updatedAt.localeCompare(a.updatedAt));
};

export const getOpenSmartCoachRecommendations = (data: PaddleMotionData, user: User): SmartCoachRecommendation[] =>
  buildSmartCoachRecommendations(data, user).filter((item) => item.status === "open");

export const upsertSmartCoachStatus = (
  items: SmartCoachRecommendation[],
  recommendation: SmartCoachRecommendation,
  updates: Partial<Pick<SmartCoachRecommendation, "status" | "note">>,
): SmartCoachRecommendation[] => {
  const next: SmartCoachRecommendation = {
    ...recommendation,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  const exists = items.some((item) => item.id === recommendation.id);
  return exists ? items.map((item) => (item.id === recommendation.id ? next : item)) : [next, ...items];
};
