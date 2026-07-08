import { useState } from "react";
import { APP_NAME, APP_SLOGAN, APP_VERSION } from "./brand";
import { LoadingState } from "./components/AppSupport";
import { Icon, type IconName } from "./components/Icon";
import { SegmentNav, type SegmentItem } from "./components/SegmentNav";
import { createId } from "./data/storage";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { getActiveUser } from "./domain/profile";
import { getWeekdayFromDate, isDoneStatus } from "./domain/trainingPlan";
import { updateCloudProfile } from "./services/profileService";
import { createCloudNotification, markAllCloudNotificationsRead, markCloudNotificationRead } from "./services/notificationService";
import { upsertCloudSmartCoachRecommendation } from "./services/smartCoachService";
import { upsertSmartCoachStatus } from "./domain/smartCoach";
import type {
  Competition,
  MaterialItem,
  PageId,
  PaddleMotionData,
  PlanEntry,
  TrainingFeedback,
  SeasonGoal,
  SmartCoachRecommendation,
  TrainingJournalEntry,
  TrainingSession,
  UserProfile,
} from "./domain/types";
import { AnalysisView } from "./views/AnalysisView";
import { AnalyticsCenterView, type AnalyticsMode } from "./views/AnalyticsCenterView";
import { AuthView } from "./views/AuthView";
import { BetaReleaseView } from "./views/BetaReleaseView";
import { BoatComparisonView } from "./views/BoatComparisonView";
import { CompetitionResultsView } from "./views/CompetitionResultsView";
import { CompetitionVideosView } from "./views/CompetitionVideosView";
import { CompetitionsView } from "./views/CompetitionsView";
import { CompetitionBestTimesView } from "./views/CompetitionBestTimesView";
import { CompetitionCoachAdminView } from "./views/CompetitionCoachAdminView";
import { CompetitionSeasonStatsView } from "./views/CompetitionSeasonStatsView";
import { ClubPortalView } from "./views/ClubPortalView";
import { CommunicationView } from "./views/CommunicationView";
import { CoachView } from "./views/CoachView";
import { DashboardView, type DashboardQuickAction } from "./views/DashboardView";
import { EquipmentView } from "./views/EquipmentView";
import { GoalsView } from "./views/GoalsView";
import { PlanView } from "./views/PlanView";
import { NotificationsView } from "./views/NotificationsView";
import { ProfileView } from "./views/ProfileView";
import { RecordsView } from "./views/RecordsView";
import { ResultsReadinessView } from "./views/ResultsReadinessView";
import { SeasonView } from "./views/SeasonView";
import { SettingsView } from "./views/SettingsView";
import { SmartCoachView } from "./views/SmartCoachView";
import { TrainingJournalView } from "./views/TrainingJournalView";
import { TrainingView } from "./views/TrainingView";

type TrainingSegment = "plan" | "sessions" | "journal";
type CompetitionSegment = "races" | "results" | "bests" | "stats" | "advanced" | "imports" | "coach" | "admin" | "videos";
type AnalysisSegment = "overview" | "smartCoach" | "training" | "competition" | "goals" | "load" | "boats" | "season" | "coach" | "admin";
type MoreSegment = "profile" | "club" | "competitions" | "equipment" | "goals" | "records" | "notifications" | "integrations" | "feedback" | "betaGuide" | "limitations" | "beta" | "betaTesters" | "coach" | "settings";

const navItems: Array<{ id: PageId; label: string; icon: IconName }> = [
  { id: "dashboard", label: "Heute", icon: "home" },
  { id: "training", label: "Training", icon: "training" },
  { id: "analysis", label: "Analyse", icon: "chart" },
  { id: "communication", label: "Kommunikation", icon: "message" },
  { id: "more", label: "Mehr", icon: "more" },
];

const navPageByPage: Partial<Record<PageId, PageId>> = {
  plan: "training",
  season: "analysis",
  profile: "more",
  equipment: "more",
  goals: "more",
  records: "more",
};

const trainingSegments: SegmentItem<TrainingSegment>[] = [
  { id: "plan", label: "Plan" },
  { id: "sessions", label: "Einheiten" },
  { id: "journal", label: "Journal" },
];

const competitionSegments: SegmentItem<CompetitionSegment>[] = [
  { id: "races", label: "Meine Wettkaempfe" },
  { id: "results", label: "Ergebnisse" },
  { id: "bests", label: "Bestzeiten" },
  { id: "stats", label: "Saisonstatistik" },
  { id: "advanced", label: "Ergebnisanalyse" },
  { id: "imports", label: "Import" },
  { id: "videos", label: "Videos" },
];

const analysisSegments: SegmentItem<AnalysisSegment>[] = [
  { id: "overview", label: "ï¿½bersicht" },
  { id: "smartCoach", label: "Smart Coach" },
  { id: "training", label: "Training" },
  { id: "competition", label: "Wettkampf" },
  { id: "goals", label: "Ziele" },
  { id: "load", label: "Belastung" },
  { id: "boats", label: "K1/C1" },
];

const baseMoreSegments: SegmentItem<MoreSegment>[] = [
  { id: "profile", label: "Profil" },
  { id: "club", label: "Verein" },
  { id: "competitions", label: "Wettkampf" },
  { id: "equipment", label: "Material" },
  { id: "goals", label: "Ziele" },
  { id: "records", label: "Rekorde" },
  { id: "notifications", label: "Updates" },
  { id: "integrations", label: "Integrationen" },
  { id: "feedback", label: "Feedback" },
  { id: "betaGuide", label: "Beta-Anleitung" },
  { id: "limitations", label: "Beta-Grenzen" },
  { id: "settings", label: "Einstellungen" },
];

const pageTitles: Record<PageId, string> = {
  dashboard: "Heute",
  training: "Training",
  competitions: "Wettkaempfe",
  analysis: "Analyse",
  club: "Verein",
  communication: "Kommunikation",
  more: "Mehr",
  goals: "Ziele",
  records: "Rekorde",
  season: "Saison",
  plan: "Trainingsplan",
  equipment: "Material",
  profile: "Profil",
};

const getTimestamp = (): string => new Date().toISOString();

const canUseCoachArea = (role: string): boolean => role === "coach" || role === "teamAdmin" || role === "clubAdmin" || role === "admin";

function AppContent() {
  const { session, data, setData, profile: cloudProfile, loading, cloudStatus, cloudMessage, syncCount, pendingSyncCount, lastSyncAt, signIn, signUp, signOut, resetPassword } = useAuth();
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [trainingSegment, setTrainingSegment] = useState<TrainingSegment>("plan");
  const [competitionSegment, setCompetitionSegment] = useState<CompetitionSegment>("races");
  const [analysisSegment, setAnalysisSegment] = useState<AnalysisSegment>("overview");
  const [moreSegment, setMoreSegment] = useState<MoreSegment>("profile");
  const [newTrainingSignal, setNewTrainingSignal] = useState(0);
  const [newCompetitionSignal, setNewCompetitionSignal] = useState(0);
  const [journalSignal, setJournalSignal] = useState(0);
  const handleLogout = async () => {
    await signOut();
    setActivePage("dashboard");
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!session || !data) {
    return <AuthView onLogin={signIn} onRegister={signUp} onResetPassword={resetPassword} cloudMessage={cloudMessage || "Bitte melde dich mit deinem Paddlio Cloud-Konto an."} />;
  }

  const activeUser = getActiveUser(data.users, data.activeUserId);
  const activeNavPage = navPageByPage[activePage] ?? activePage;
  const moreSegments = canUseCoachArea(activeUser.role)
    ? [
        ...baseMoreSegments.filter((segment) => segment.id !== "settings"),
        ...(activeUser.role === "admin" ? [{ id: "beta" as const, label: "Beta-Check" }, { id: "betaTesters" as const, label: "Beta-Tester" }] : []),
        { id: "coach" as const, label: activeUser.role === "admin" ? "Admin" : "Coach" },
        baseMoreSegments.find((segment) => segment.id === "settings")!,
      ]
    : baseMoreSegments;
  const unreadNotificationCount = data.notifications.filter((notification) => !notification.read).length;
  const updateData = (updater: (current: PaddleMotionData) => PaddleMotionData) => {
    setData((current) => (current ? updater(current) : current));
  };

  const markNotificationRead = (id: string) => {
    updateData((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    }));
    void markCloudNotificationRead(id).catch((error) => console.error("Benachrichtigung konnte nicht gespeichert werden", error));
  };

  const markAllNotificationsRead = () => {
    updateData((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({ ...notification, read: true })),
    }));
    void markAllCloudNotificationsRead(activeUser.userId).catch((error) => console.error("Benachrichtigungen konnten nicht gespeichert werden", error));
  };

  const updateSmartCoachRecommendation = (recommendation: SmartCoachRecommendation, updates: Partial<Pick<SmartCoachRecommendation, "status" | "note">>) => {
    const nextRecommendation = {
      ...recommendation,
      ...updates,
      updatedAt: getTimestamp(),
    };
    updateData((current) => ({
      ...current,
      smartCoachRecommendations: upsertSmartCoachStatus(current.smartCoachRecommendations ?? [], recommendation, updates),
    }));
    void upsertCloudSmartCoachRecommendation(nextRecommendation).catch((error) => console.error("Smart-Coach-Hinweis konnte nicht gespeichert werden", error));
  };

  const handleDashboardQuickAction = (action: DashboardQuickAction) => {
    if (action === "training") {
      setTrainingSegment("sessions");
      setActivePage("training");
      setNewTrainingSignal((value) => value + 1);
      return;
    }

    if (action === "competition") {
      setCompetitionSegment("races");
      setActivePage("competitions");
      setNewCompetitionSignal((value) => value + 1);
      return;
    }

    if (action === "journal") {
      setTrainingSegment("sessions");
      setActivePage("training");
      setJournalSignal((value) => value + 1);
      return;
    }

    setMoreSegment("equipment");
    setActivePage("more");
  };

  const upsertCompetition = (competition: Omit<Competition, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const timestamp = getTimestamp();

    updateData((current) => {
      const existing = competition.id
        ? current.competitions.find((item) => item.id === competition.id)
        : undefined;
      const nextCompetition: Competition = {
        ...competition,
        id: competition.id ?? createId("competition"),
        athleteId: current.athlete.id,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      return {
        ...current,
        competitions: existing
          ? current.competitions.map((item) => (item.id === nextCompetition.id ? nextCompetition : item))
          : [nextCompetition, ...current.competitions],
      };
    });
  };

  const deleteCompetition = (id: string) => {
    updateData((current) => ({
      ...current,
      competitions: current.competitions.filter((competition) => competition.id !== id),
    }));
  };

  const upsertTraining = (session: Omit<TrainingSession, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const timestamp = getTimestamp();

    updateData((current) => {
      const existing = session.id ? current.training.find((item) => item.id === session.id) : undefined;
      const nextSession: TrainingSession = {
        ...session,
        id: session.id ?? createId("training"),
        athleteId: current.athlete.id,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      return {
        ...current,
        training: existing
          ? current.training.map((item) => (item.id === nextSession.id ? nextSession : item))
          : [nextSession, ...current.training],
      };
    });
  };

  const deleteTraining = (id: string) => {
    updateData((current) => ({
      ...current,
      training: current.training.filter((session) => session.id !== id),
      journal: current.journal.filter((entry) => entry.trainingId !== id),
    }));
  };

  const upsertJournalEntry = (
    entry: Omit<TrainingJournalEntry, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string },
  ) => {
    const timestamp = getTimestamp();

    updateData((current) => {
      const existing = entry.id
        ? current.journal.find((item) => item.id === entry.id)
        : current.journal.find((item) => item.trainingId === entry.trainingId);
      const nextEntry: TrainingJournalEntry = {
        ...entry,
        id: existing?.id ?? entry.id ?? createId("journal"),
        athleteId: current.athlete.id,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      return {
        ...current,
        journal: existing
          ? current.journal.map((item) => (item.id === nextEntry.id ? nextEntry : item))
          : [nextEntry, ...current.journal],
      };
    });
  };

  const upsertMaterial = (item: Omit<MaterialItem, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const timestamp = getTimestamp();

    updateData((current) => {
      const existing = item.id ? current.material.find((material) => material.id === item.id) : undefined;
      const nextItem: MaterialItem = {
        ...item,
        id: item.id ?? createId("material"),
        athleteId: current.athlete.id,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      return {
        ...current,
        material: existing
          ? current.material.map((material) => (material.id === nextItem.id ? nextItem : material))
          : [nextItem, ...current.material],
      };
    });
  };

  const deleteMaterial = (id: string) => {
    updateData((current) => ({
      ...current,
      material: current.material.filter((item) => item.id !== id),
    }));
  };

  const upsertPlanEntry = (
    entry: Omit<PlanEntry, "id" | "athleteId" | "createdAt" | "updatedAt" | "createdByUserId"> & {
      id?: string;
    },
  ) => {
    const timestamp = getTimestamp();

    updateData((current) => {
      const existing = entry.id ? current.plan.find((item) => item.id === entry.id) : undefined;
      const repeat = entry.repeat ?? "none";
      const startDate = new Date(`${entry.date}T00:00:00`);
      const repeatUntil = entry.repeatUntil ? new Date(`${entry.repeatUntil}T00:00:00`) : startDate;
      const repeatLimit = entry.repeatMaxCount && entry.repeatMaxCount > 0 ? Math.min(entry.repeatMaxCount, 90) : 90;
      const dates: string[] = [];
      const cursor = new Date(startDate);

      while (dates.length === 0 || (repeat !== "none" && cursor <= repeatUntil && dates.length < repeatLimit)) {
        dates.push(cursor.toISOString().slice(0, 10));
        if (repeat === "daily") cursor.setDate(cursor.getDate() + 1);
        else if (repeat === "weekly") cursor.setDate(cursor.getDate() + 7);
        else if (repeat === "biweekly") cursor.setDate(cursor.getDate() + 14);
        else if (repeat === "monthly") cursor.setMonth(cursor.getMonth() + 1);
        else break;
      }

      const createdEntries = dates.map((date, index): PlanEntry => ({
        ...entry,
        id: index === 0 && entry.id ? entry.id : createId("plan"),
        ownerUserId: entry.ownerUserId || current.activeUserId,
        athleteId: current.athlete.id,
        clubId: entry.clubId || activeUser.profile.club,
        date,
        weekday: getWeekdayFromDate(date),
        time: entry.startTime || entry.time,
        startTime: entry.startTime || entry.time,
        createdByUserId: current.activeUserId,
        createdAt: index === 0 ? existing?.createdAt ?? timestamp : timestamp,
        updatedAt: timestamp,
      }));

      return {
        ...current,
        plan: existing
          ? current.plan.map((item) => (item.id === createdEntries[0].id ? createdEntries[0] : item))
          : [...current.plan, ...createdEntries],
      };
    });

    const targetUserIds = new Set(entry.assignedAthleteIds);
    if (entry.assignedType === "group") {
      const assignedGroupIds = new Set(entry.assignedGroupIds);
      data.coachAthletes
        .filter((athlete) => athlete.groupIds.some((groupId) => assignedGroupIds.has(groupId)) || assignedGroupIds.has(athlete.groupId))
        .forEach((athlete) => targetUserIds.add(athlete.id));
    }

    targetUserIds.forEach((userId) => {
      if (userId && userId !== activeUser.userId) {
        void createCloudNotification({
          userId,
          title: entry.id ? "Training wurde geaendert" : "Neues Training zugewiesen",
          message: `${entry.title || entry.trainingType} am ${entry.date}${entry.startTime ? ` um ${entry.startTime}` : ""}`,
          type: entry.status === "cancelled" ? "training_cancelled" : entry.id ? "training_updated" : "training_assigned",
          relatedEntityType: "training_plan_items",
          relatedEntityId: entry.id,
        }).catch((error) => console.error("Training-Benachrichtigung konnte nicht erstellt werden", error));
      }
    });
  };

  const deletePlanEntry = (id: string) => {
    updateData((current) => ({
      ...current,
      plan: current.plan.filter((entry) => entry.id !== id),
    }));
  };

  const saveTrainingFeedback = (feedback: Omit<TrainingFeedback, "id" | "completedAt"> & { id?: string }) => {
    updateData((current) => {
      const timestamp = getTimestamp();
      const existing = feedback.id ? current.trainingFeedback.find((item) => item.id === feedback.id) : undefined;
      const nextFeedback: TrainingFeedback = {
        ...feedback,
        id: feedback.id ?? createId("feedback"),
        completedAt: existing?.completedAt ?? timestamp,
      };

      return {
        ...current,
        trainingFeedback: existing
          ? current.trainingFeedback.map((item) => (item.id === nextFeedback.id ? nextFeedback : item))
          : [nextFeedback, ...current.trainingFeedback],
        plan: current.plan.map((entry) =>
          entry.id === feedback.trainingId
            ? { ...entry, status: feedback.status, feedbackNote: feedback.comment ?? feedback.reason ?? "", updatedAt: timestamp }
            : entry,
        ),
      };
    });

    if (feedback.coachUserId) {
      void createCloudNotification({
        userId: feedback.coachUserId,
        title: "Neue Rï¿½ckmeldung eingegangen",
        message: feedback.status === "skipped" ? `Training ausgelassen: ${feedback.reason || "kein Grund angegeben"}` : `Feedback: Gefuehl ${feedback.feeling}/10, Motivation ${feedback.motivation}/10`,
        type: "feedback_received",
        relatedEntityType: "training_feedback",
        relatedEntityId: feedback.id,
      }).catch((error) => console.error("Feedback-Benachrichtigung konnte nicht erstellt werden", error));
    }
  };

  const upsertGoal = (
    goal: Omit<SeasonGoal, "id" | "athleteId" | "ownerUserId" | "createdAt" | "updatedAt"> & { id?: string },
  ) => {
    const timestamp = getTimestamp();

    updateData((current) => {
      const existing = goal.id ? current.goals.find((item) => item.id === goal.id) : undefined;
      const nextGoal: SeasonGoal = {
        ...goal,
        id: goal.id ?? createId("goal"),
        athleteId: current.athlete.id,
        ownerUserId: current.activeUserId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      return {
        ...current,
        goals: existing
          ? current.goals.map((item) => (item.id === nextGoal.id ? nextGoal : item))
          : [nextGoal, ...current.goals],
      };
    });
  };

  const deleteGoal = (id: string) => {
    updateData((current) => ({
      ...current,
      goals: current.goals.filter((goal) => goal.id !== id),
    }));
  };

  const togglePlanEntryDone = (id: string) => {
    updateData((current) => ({
      ...current,
      plan: current.plan.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: isDoneStatus(entry.status) ? "planned" : "done",
              updatedAt: getTimestamp(),
            }
          : entry,
      ),
    }));
  };

  const updateProfile = (userProfile: UserProfile) => {
    const timestamp = getTimestamp();

    updateData((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === current.activeUserId
          ? {
              ...user,
              profile: userProfile,
              updatedAt: timestamp,
            }
          : user,
      ),
      athlete: {
        ...current.athlete,
        name: userProfile.nickname || `${userProfile.firstName} ${userProfile.lastName}`.trim() || current.athlete.name,
        club: userProfile.club || current.athlete.club,
      },
    }));

    if (cloudProfile) {
      void updateCloudProfile({
        id: cloudProfile.id,
        first_name: userProfile.firstName,
        last_name: userProfile.lastName,
        display_name: userProfile.nickname || `${userProfile.firstName} ${userProfile.lastName}`.trim(),
        avatar_url: userProfile.profileImageDataUrl || null,
        age_category: userProfile.ageClass || null,
        boat_classes: userProfile.boatClasses.map((boat) => boat),
        paddle_side: userProfile.boatClasses.includes("C1") ? (userProfile.paddleSide === "links" ? "Links" : "Rechts") : null,
      }).catch((error) => console.error("Profil konnte nicht in die Cloud synchronisiert werden", error));
    }
  };

  const updateProfileSettings = (
    settings: Pick<UserProfile, "profileImageDataUrl" | "darkMode" | "measurementUnit" | "language">,
  ) => {
    updateProfile({
      ...activeUser.profile,
      ...settings,
    });
  };

  const renderTrainingContent = (segment: TrainingSegment) => {
    switch (segment) {
      case "plan":
        return (
          <PlanView
            data={data}
            entries={data.plan}
            user={activeUser}
            onSave={upsertPlanEntry}
            onDelete={deletePlanEntry}
            onToggleDone={togglePlanEntryDone}
            onFeedbackSave={saveTrainingFeedback}
            onDataChange={updateData}
          />
        );
      case "journal":
        return <TrainingJournalView sessions={data.training} journal={data.journal} />;
      case "sessions":
      default:
        return (
          <TrainingView
            sessions={data.training}
            journal={data.journal}
            onSave={upsertTraining}
            onDelete={deleteTraining}
            onSaveJournal={upsertJournalEntry}
            openNewSignal={newTrainingSignal}
            openJournalSignal={journalSignal}
          />
        );
    }
  };

  const renderTrainingArea = (segment: TrainingSegment = trainingSegment) => (
    <div className="category-shell">
      <SegmentNav
        label="Training Kategorien"
        items={trainingSegments}
        activeId={segment}
        onChange={(nextSegment) => {
          setTrainingSegment(nextSegment);
          setActivePage("training");
        }}
      />
      <div className="segment-content">{renderTrainingContent(segment)}</div>
    </div>
  );

  const renderCompetitionContent = (segment: CompetitionSegment) => {
    switch (segment) {
      case "results":
        return <CompetitionResultsView competitions={data.competitions} />;
      case "bests":
        return <CompetitionBestTimesView competitions={data.competitions} />;
      case "stats":
        return <CompetitionSeasonStatsView competitions={data.competitions} />;
      case "advanced":
        return <ResultsReadinessView data={data} user={activeUser} mode="results" onDataChange={updateData} />;
      case "imports":
        return <ResultsReadinessView data={data} user={activeUser} mode="imports" onDataChange={updateData} />;
      case "coach":
      case "admin":
        return <CompetitionCoachAdminView competitions={data.competitions} user={activeUser} />;
      case "videos":
        return <CompetitionVideosView />;
      case "races":
      default:
        return (
          <CompetitionsView
            competitions={data.competitions}
            onSave={upsertCompetition}
            onDelete={deleteCompetition}
            openNewSignal={newCompetitionSignal}
          />
        );
    }
  };

  const renderCompetitionArea = () => (
    <div className="category-shell">
      <SegmentNav
        label="Wettkampf Kategorien"
        items={[
          ...competitionSegments,
          ...(canUseCoachArea(activeUser.role) ? [{ id: activeUser.role === "admin" ? "admin" as const : "coach" as const, label: activeUser.role === "admin" ? "Admin-Ansicht" : "Coach-Ansicht" }] : []),
        ]}
        activeId={competitionSegment}
        onChange={setCompetitionSegment}
      />
      <div className="segment-content">{renderCompetitionContent(competitionSegment)}</div>
    </div>
  );

  const renderAnalysisContent = (segment: AnalysisSegment) => {
    switch (segment) {
      case "boats":
        return <BoatComparisonView competitions={data.competitions} />;
      case "season":
        return <SeasonView competitions={data.competitions} training={data.training} plan={data.plan} />;
      case "coach":
        return <AnalyticsCenterView data={data} user={activeUser} mode="coach" />;
      case "admin":
        return <AnalyticsCenterView data={data} user={activeUser} mode="admin" />;
      case "smartCoach":
        return <SmartCoachView data={data} user={activeUser} onUpdateRecommendation={updateSmartCoachRecommendation} />;
      case "training":
      case "competition":
      case "goals":
        return <AnalyticsCenterView data={data} user={activeUser} mode={segment as AnalyticsMode} />;
      case "load":
        return (
          <div className="stack">
            <AnalyticsCenterView data={data} user={activeUser} mode="load" />
            <ResultsReadinessView data={data} user={activeUser} mode="load" onDataChange={updateData} />
          </div>
        );
      case "overview":
      default:
        return (
          <div className="stack">
            <AnalyticsCenterView
              data={data}
              user={activeUser}
              mode="overview"
              onNavigate={(target) => {
                if (target === "training") {
                  setTrainingSegment("plan");
                  setActivePage("training");
                } else if (target === "competition") {
                  setCompetitionSegment("races");
                  setActivePage("competitions");
                } else {
                  setMoreSegment("goals");
                  setActivePage("more");
                }
              }}
            />
            <AnalysisView competitions={data.competitions} training={data.training} plan={data.plan} feedback={data.trainingFeedback} />
          </div>
        );
    }
  };

  const renderAnalysisArea = (segment: AnalysisSegment = analysisSegment) => (
    <div className="category-shell">
      <SegmentNav
        label="Analyse Kategorien"
        items={[
          ...analysisSegments,
          ...(canUseCoachArea(activeUser.role) ? [{ id: activeUser.role === "admin" ? "admin" as const : "coach" as const, label: activeUser.role === "admin" ? "Admin ï¿½bersicht" : "Coach Analyse" }] : []),
        ]}
        activeId={segment}
        onChange={(nextSegment) => {
          setAnalysisSegment(nextSegment);
          setActivePage("analysis");
        }}
      />
      <div className="segment-content">{renderAnalysisContent(segment)}</div>
    </div>
  );

  const renderMoreContent = (segment: MoreSegment) => {
    switch (segment) {
      case "equipment":
        return (
          <EquipmentView
            material={data.material}
            onSave={upsertMaterial}
            onDelete={deleteMaterial}
          />
        );
      case "club":
        return <ClubPortalView data={data} user={activeUser} onDataChange={updateData} />;
      case "competitions":
        return renderCompetitionArea();
      case "goals":
        return (
          <GoalsView
            user={activeUser}
            goals={data.goals}
            competitions={data.competitions}
            training={data.training}
            onSave={upsertGoal}
            onDelete={deleteGoal}
          />
        );
      case "records":
        return <RecordsView competitions={data.competitions} training={data.training} />;
      case "notifications":
        return <NotificationsView notifications={data.notifications} onMarkRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} />;
      case "integrations":
        return <ResultsReadinessView data={data} user={activeUser} mode="integrations" onDataChange={updateData} />;
      case "feedback":
        return <BetaReleaseView data={data} user={activeUser} mode="feedback" onDataChange={updateData} />;
      case "betaGuide":
        return <BetaReleaseView data={data} user={activeUser} mode="guide" onDataChange={updateData} />;
      case "limitations":
        return <BetaReleaseView data={data} user={activeUser} mode="limitations" onDataChange={updateData} />;
      case "beta":
        return (
          <div className="stack">
            <ResultsReadinessView data={data} user={activeUser} mode="beta" onDataChange={updateData} />
            <BetaReleaseView data={data} user={activeUser} mode="feedback" onDataChange={updateData} />
          </div>
        );
      case "betaTesters":
        return <BetaReleaseView data={data} user={activeUser} mode="testers" onDataChange={updateData} />;
      case "coach":
        return <CoachView data={data} user={activeUser} onDataChange={updateData} />;
      case "settings":
        return <SettingsView user={activeUser} onSave={updateProfileSettings} onLogout={handleLogout} />;
      case "profile":
      default:
        return <ProfileView user={activeUser} onSave={updateProfile} />;
    }
  };

  const renderMoreArea = (segment: MoreSegment = moreSegment) => (
    <div className="category-shell">
      <SegmentNav
        label="Mehr Kategorien"
        items={moreSegments.map((segment) => segment.id === "notifications" && unreadNotificationCount > 0 ? { ...segment, label: `Updates (${unreadNotificationCount})` } : segment)}
        activeId={segment}
        onChange={(nextSegment) => {
          setMoreSegment(nextSegment);
          setActivePage("more");
        }}
      />
      <div className="segment-content">{renderMoreContent(segment)}</div>
    </div>
  );

  const openDirectPage = (page: PageId) => {
    switch (page) {
      case "plan":
        return renderTrainingArea("plan");
      case "season":
        return renderAnalysisArea("season");
      case "equipment":
        return renderMoreArea("equipment");
      case "goals":
        return renderMoreArea("goals");
      case "records":
        return renderMoreArea("records");
      case "profile":
        return renderMoreArea("profile");
      default:
        return null;
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardView
            data={data}
            user={activeUser}
            onNavigate={setActivePage}
            onOpenSmartCoach={() => {
              setAnalysisSegment("smartCoach");
              setActivePage("analysis");
            }}
            onUpdateRecommendation={updateSmartCoachRecommendation}
            onQuickAction={handleDashboardQuickAction}
          />
        );
      case "training":
        return renderTrainingArea();
      case "competitions":
        return renderCompetitionArea();
      case "analysis":
        return renderAnalysisArea();
      case "club":
        return <ClubPortalView data={data} user={activeUser} onDataChange={updateData} />;
      case "communication":
        return <CommunicationView data={data} user={activeUser} onDataChange={updateData} />;
      case "more":
        return renderMoreArea();
      case "goals":
      case "records":
      case "season":
      case "plan":
      case "equipment":
      case "profile":
        return openDirectPage(activePage);
      default:
        return null;
    }
  };

  const isHome = activePage === "dashboard";

  return (
    <div className={isHome ? "app-shell app-shell-home" : "app-shell"}>
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>
      {!isHome ? (
        <header className="app-header app-header-compact">
          <div className="brand-lockup">
            <p className="app-brand">{APP_NAME}</p>
            <p className="brand-slogan">{APP_SLOGAN}</p>
          </div>
          <div className="page-title-lockup">
            <span>Version {APP_VERSION} Â· Paddlio Beta</span>
            <h1>{pageTitles[activePage]}</h1>
          </div>
        </header>
      ) : null}

      <main className="page-content" id="main">{renderPage()}</main>
      <CloudStatusBadgeStable status={cloudStatus} syncCount={syncCount} pendingSyncCount={pendingSyncCount} lastSyncAt={lastSyncAt} isAdmin={activeUser.role === "admin"} message={cloudMessage} />

      <nav className="bottom-nav" aria-label="Hauptnavigation">
        {navItems.map((item) => (
          <button
            className={activeNavPage === item.id ? "nav-item active" : "nav-item"}
            key={item.id}
            type="button"
            onClick={() => setActivePage(item.id)}
            aria-current={activeNavPage === item.id ? "page" : undefined}
            aria-label={`Hauptnavigation: ${item.label}`}
          >
            <span className="nav-icon" aria-hidden="true">
              <Icon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function CloudStatusBadge({ status, syncCount, pendingSyncCount, lastSyncAt, isAdmin, message }: { status: string; syncCount: number; pendingSyncCount: number; lastSyncAt: string; isAdmin: boolean; message: string }) {
  const label =
    status === "connected" ? "Synchronisiert" :
      status === "syncing" ? "Synchronisiert..." :
        status === "pending" ? "Wartende ï¿½nderungen" :
          status === "offline" ? "Offline" :
            status === "error" ? "Cloud Fehler" :
              "Cloud deaktiviert";
  const dot = status === "connected" ? "green" : status === "syncing" || status === "pending" ? "yellow" : "red";
  const syncLabel = lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div className={`cloud-status ${dot}`}>
      <span>{label}</span>
      {pendingSyncCount > 0 ? <small>{pendingSyncCount} ï¿½nderungen warten auf Synchronisation</small> : null}
      {isAdmin ? <small>{syncCount} Datensï¿½tze{syncLabel ? ` - letzter Sync ${syncLabel}` : ""}</small> : null}
      {message ? <small>{message}</small> : null}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function CloudStatusBadgeStable({ status, syncCount, pendingSyncCount, lastSyncAt, isAdmin, message }: { status: string; syncCount: number; pendingSyncCount: number; lastSyncAt: string; isAdmin: boolean; message: string }) {
  const label =
    status === "connected" ? "Synchronisiert" :
      status === "syncing" ? "Synchronisiert..." :
        status === "pending" ? "Wartende Änderungen" :
          status === "limited" ? "Cloud eingeschränkt" :
            status === "offline" ? "Offline" :
              status === "error" ? "Cloud Fehler" :
                "Cloud deaktiviert";
  const dot = status === "connected" ? "green" : status === "syncing" || status === "pending" || status === "limited" ? "yellow" : "red";
  const syncLabel = lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div className={`cloud-status ${dot}`}>
      <span>{label}</span>
      {pendingSyncCount > 0 ? <small>{pendingSyncCount} Änderungen warten auf Synchronisation</small> : null}
      {isAdmin ? <small>{syncCount} Datensätze{syncLabel ? ` - letzter Sync ${syncLabel}` : ""}</small> : null}
      {message ? <small>{message}</small> : null}
    </div>
  );
}

export default App;
