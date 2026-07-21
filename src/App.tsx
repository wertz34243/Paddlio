import { lazy, Suspense, useState, type TouchEvent } from "react";
import { APP_NAME, APP_SLOGAN, APP_VERSION } from "./brand";
import { useEffect } from "react";
import { LoadingState } from "./components/AppSupport";
import { Icon, type IconName } from "./components/Icon";
import { BottomNavigation, DesktopSideNavigation, mainNavItems } from "./components/navigation/AppNavigation";
import { SegmentNav, type SegmentItem } from "./components/SegmentNav";
import { createId } from "./data/storage";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { canUseCoachArea } from "./domain/accessControl";
import { getActiveUser, getDisplayName, getInitials } from "./domain/profile";
import { expandTrainingRepeatDates, getWeekdayFromDate, isDoneStatus } from "./domain/trainingPlan";
import { useAppChromeVisibility } from "./hooks/useAutoHideOnScroll";
import { useResponsiveCapabilities } from "./hooks/useResponsiveCapabilities";
import { getFeatureMode, isFeatureAvailable, pageFeatureMap, type FeatureId, type FeatureMode } from "./lib/deviceCapabilities";
import type { Json } from "./lib/database.types";
import { updateCloudProfile } from "./services/profileService";
import { createCloudNotification, markAllCloudNotificationsRead, markCloudNotificationRead } from "./services/notificationService";
import { upsertCloudJournalEntry } from "./services/journalService";
import { deleteCloudTraining, upsertCloudFeedback, upsertCloudTraining } from "./services/trainingService";
import { upsertCloudSmartCoachRecommendation } from "./services/smartCoachService";
import { upsertSmartCoachStatus } from "./domain/smartCoach";
import { canSeeSystemPrivateData } from "./domain/privacy";
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
import type { AnalyticsMode } from "./views/AnalyticsCenterView";
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
import { DashboardView, type DashboardMoreTarget, type DashboardQuickAction } from "./views/DashboardView";
import { EquipmentView } from "./views/EquipmentView";
import { GoalsView } from "./views/GoalsView";
import { PlanView } from "./views/PlanView";
import { NotificationsView } from "./views/NotificationsView";
import { ProfileView } from "./views/ProfileView";
import { RecordsView } from "./views/RecordsView";
import { SeasonView } from "./views/SeasonView";
import { SettingsView } from "./views/SettingsView";
import { SmartCoachView } from "./views/SmartCoachView";
import { TrainingCalendarView } from "./views/TrainingCalendarView";
import { TrainingJournalView } from "./views/TrainingJournalView";
import { TrainingOverviewView } from "./views/TrainingOverviewView";
import { TrainingView } from "./views/TrainingView";
const AcademyView = lazy(() => import("./views/AcademyView").then((module) => ({ default: module.AcademyView })));
const AnalyticsCenterView = lazy(() => import("./views/AnalyticsCenterView").then((module) => ({ default: module.AnalyticsCenterView })));
const CoachView = lazy(() => import("./views/CoachView").then((module) => ({ default: module.CoachView })));
const ImportExportView = lazy(() => import("./views/ImportExportView").then((module) => ({ default: module.ImportExportView })));
const PolarIntegrationView = lazy(() => import("./views/PolarIntegrationView").then((module) => ({ default: module.PolarIntegrationView })));
const ResultsReadinessView = lazy(() => import("./views/ResultsReadinessView").then((module) => ({ default: module.ResultsReadinessView })));

type TrainingSegment = "overview" | "calendar" | "plan" | "sessions" | "journal";
type CompetitionSegment = "races" | "results" | "bests" | "stats" | "advanced" | "imports" | "coach" | "admin" | "videos";
type AnalysisSegment = "overview" | "smartCoach" | "training" | "competition" | "goals" | "load" | "boats" | "season" | "coach" | "admin";
type MoreSegment = "profile" | "academy" | "club" | "competitions" | "equipment" | "goals" | "records" | "notifications" | "integrations" | "feedback" | "betaGuide" | "limitations" | "beta" | "betaTesters" | "coach" | "settings";
type MoreSegmentMeta = SegmentItem<MoreSegment> & { description: string; icon: IconName };
type MoreGroupKind = "account" | "sport" | "team" | "beta" | "admin" | "system";
type SmartMoreItem = MoreSegmentMeta & { kind: MoreGroupKind; priority?: boolean; badge?: string };
type DeviceLimitedAction = { label: string; onClick: () => void };

const roleLabelMap: Record<string, string> = {
  athlete: "Sportler",
  coach: "Trainer",
  clubadmin: "ClubAdmin",
  admin: "Admin",
};

const navPageByPage: Partial<Record<PageId, PageId>> = {
  plan: "training",
  season: "analysis",
  profile: "more",
  academy: "more",
  equipment: "more",
  goals: "more",
  records: "more",
};

const trainingSegments: SegmentItem<TrainingSegment>[] = [
  { id: "overview", label: "Übersicht" },
  { id: "calendar", label: "Kalender" },
  { id: "plan", label: "Plan" },
  { id: "sessions", label: "Einheiten" },
  { id: "journal", label: "Journal" },
];

const competitionSegments: SegmentItem<CompetitionSegment>[] = [
  { id: "races", label: "Meine Wettkämpfe" },
  { id: "results", label: "Ergebnisse" },
  { id: "bests", label: "Bestzeiten" },
  { id: "stats", label: "Saisonstatistik" },
  { id: "advanced", label: "Ergebnisanalyse" },
  { id: "imports", label: "Import" },
  { id: "videos", label: "Videos" },
];

const analysisSegments: SegmentItem<AnalysisSegment>[] = [
  { id: "overview", label: "Übersicht" },
  { id: "smartCoach", label: "Smart Coach" },
  { id: "training", label: "Training" },
  { id: "competition", label: "Wettkampf" },
  { id: "goals", label: "Ziele" },
  { id: "load", label: "Belastung" },
  { id: "boats", label: "K1/C1" },
];

const baseMoreSegments: SegmentItem<MoreSegment>[] = [
  { id: "profile", label: "Profil" },
  { id: "academy", label: "Akademie" },
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

const moreSegmentMeta: Record<MoreSegment, { description: string; icon: IconName }> = {
  academy: { description: "Lernen, Technik verstehen und Fortschritt speichern", icon: "bolt" },
  profile: { description: "Persönliche Daten und Kanuslalom-Profil", icon: "user" },
  club: { description: "Verein, Mitglieder und Organisation", icon: "club" },
  competitions: { description: "Wettkämpfe, Ergebnisse und Bestzeiten", icon: "trophy" },
  equipment: { description: "Boote, Paddel und Materialstatus", icon: "wallet" },
  goals: { description: "Saisonziele und Entwicklung", icon: "target" },
  records: { description: "Persönliche Rekorde", icon: "bolt" },
  notifications: { description: "Nachrichten und Cloud-Updates", icon: "message" },
  integrations: { description: "Import, Export und externe Datenquellen", icon: "chart" },
  feedback: { description: "Beta-Feedback an Paddlio senden", icon: "message" },
  betaGuide: { description: "Anleitung für externe Beta-Tests", icon: "calendar" },
  limitations: { description: "Bekannte Grenzen der Beta", icon: "timer" },
  beta: { description: "Beta-Check und Systemstatus", icon: "chart" },
  betaTesters: { description: "Testerstatus und Rückmeldungen", icon: "user" },
  coach: { description: "Coach-Bereich", icon: "club" },
  settings: { description: "Konto, App und Logout", icon: "more" },
};

const pageTitles: Record<PageId, string> = {
  dashboard: "Heute",
  training: "Training",
  competitions: "Wettkämpfe",
  analysis: "Analyse",
  club: "Verein",
  communication: "Team",
  more: "Mehr",
  goals: "Ziele",
  records: "Rekorde",
  season: "Saison",
  plan: "Trainingsplan",
  equipment: "Material",
  profile: "Profil",
  academy: "Akademie",
};

const getTimestamp = (): string => new Date().toISOString();

const trainingFeatureBySegment: Record<TrainingSegment, FeatureId> = {
  overview: "trainingOverview",
  calendar: "trainingCalendar",
  plan: "trainingPlan",
  sessions: "trainingSessions",
  journal: "trainingJournal",
};

const moreFeatureBySegment: Record<MoreSegment, FeatureId> = {
  profile: "settings",
  academy: "academyLearning",
  club: "clubAdministration",
  competitions: "competitions",
  equipment: "equipment",
  goals: "goals",
  records: "records",
  notifications: "notifications",
  integrations: "integrations",
  feedback: "feedback",
  betaGuide: "feedback",
  limitations: "feedback",
  beta: "beta",
  betaTesters: "beta",
  coach: "coachArea",
  settings: "settings",
};

const compactPhoneMoreSegments = new Set<MoreSegment>([
  "academy",
  "integrations",
  "profile",
  "settings",
  "feedback",
  "goals",
  "equipment",
  "notifications",
  "coach",
  "beta",
]);

function DeviceLimitedPanel({
  eyebrow = "Kompakte Ansicht",
  title,
  description,
  mode,
  actions = [],
}: {
  eyebrow?: string;
  title: string;
  description: string;
  mode: FeatureMode;
  actions?: DeviceLimitedAction[];
}) {
  const modeLabel = mode === "readOnly" ? "Nur lesen" : mode === "limited" ? "Eingeschränkt" : "Vereinfacht";

  return (
    <section className="section-block device-mode-panel" aria-live="polite">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p className="card-note">{description}</p>
      </div>
      <span className="status-pill">{modeLabel}</span>
      {actions.length > 0 ? (
        <div className="device-mode-actions">
          {actions.map((action) => (
            <button className="secondary-button" type="button" key={action.label} onClick={action.onClick}>
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AppContent() {
  const { session, data, setData, profile: cloudProfile, loading, cloudStatus, cloudMessage, syncCount, pendingSyncCount, lastSyncAt, signIn, signUp, signOut, resetPassword } = useAuth();
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [trainingSegment, setTrainingSegment] = useState<TrainingSegment>("overview");
  const [trainingSwipeStart, setTrainingSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [competitionSegment, setCompetitionSegment] = useState<CompetitionSegment>("races");
  const [analysisSegment, setAnalysisSegment] = useState<AnalysisSegment>("overview");
  const [moreSegment, setMoreSegment] = useState<MoreSegment>("profile");
  const [moreHubOpen, setMoreHubOpen] = useState(true);
  const { topChromeVisible, bottomNavVisible } = useAppChromeVisibility({ threshold: 8, topOffset: 8, idleMs: 1300 });
  const responsiveCapabilities = useResponsiveCapabilities();
  const currentDeviceClass = responsiveCapabilities.deviceClass;
  const [newTrainingSignal, setNewTrainingSignal] = useState(0);
  const [newCompetitionSignal, setNewCompetitionSignal] = useState(0);
  const [journalSignal, setJournalSignal] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("polar")) return;
    const polarResult = params.get("polar");
    if (polarResult) {
      window.sessionStorage.setItem("paddlio-polar-return", polarResult);
    }

    setActivePage("more");
    setMoreSegment("integrations");
    setMoreHubOpen(false);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

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
  const getCurrentFeatureMode = (feature: FeatureId): FeatureMode => getFeatureMode(feature, activeUser.role, currentDeviceClass);
  const activePlanEntries = data.plan.filter((entry) => !entry.deletedAt);
  const activeData = { ...data, plan: activePlanEntries };
  const activeNavPage = navPageByPage[activePage] ?? activePage;
  const visibleMainNavItems = mainNavItems
    .filter((item) => isFeatureAvailable(pageFeatureMap[item.id] ?? "today", activeUser.role, responsiveCapabilities.deviceClass))
    .slice(0, 5);
  const baseRoleMoreSegments = canUseCoachArea(activeUser.role)
    ? [
        ...baseMoreSegments.filter((segment) => segment.id !== "settings"),
        ...(activeUser.role === "admin" ? [{ id: "beta" as const, label: "Beta-Check" }, { id: "betaTesters" as const, label: "Beta-Tester" }] : []),
        { id: "coach" as const, label: activeUser.role === "admin" ? "Admin" : "Coach" },
        baseMoreSegments.find((segment) => segment.id === "settings")!,
      ]
    : baseMoreSegments;
  const moreSegments = baseRoleMoreSegments.filter((segment) => {
    const feature = moreFeatureBySegment[segment.id];
    if (!isFeatureAvailable(feature, activeUser.role, responsiveCapabilities.deviceClass)) {
      return false;
    }

    return responsiveCapabilities.deviceClass !== "phone" || compactPhoneMoreSegments.has(segment.id);
  });
  const visibleTrainingSegments = trainingSegments.filter((segment) =>
    isFeatureAvailable(trainingFeatureBySegment[segment.id], activeUser.role, responsiveCapabilities.deviceClass),
  );
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
    setMoreHubOpen(false);
    setActivePage("more");
  };

  const openMoreSegment = (segment: DashboardMoreTarget) => {
    setMoreSegment(segment);
    setMoreHubOpen(false);
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
        athleteId: cloudProfile?.id ?? current.activeUserId ?? current.athlete.id,
        clubId: competition.clubId || cloudProfile?.club_id || activeUser.profile.club || "",
        createdBy: competition.createdBy || cloudProfile?.id || current.activeUserId,
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
    const existing = entry.id
      ? data.journal.find((item) => item.id === entry.id)
      : data.journal.find((item) =>
          entry.trainingPlanEntryId
            ? item.trainingPlanEntryId === entry.trainingPlanEntryId
            : item.trainingId === entry.trainingId,
        );
    const nextEntry: TrainingJournalEntry = {
      ...entry,
      id: existing?.id ?? entry.id ?? createId("journal"),
      athleteId: cloudProfile?.id ?? data.athlete.id,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    updateData((current) => {
      const currentExisting = current.journal.find((item) => item.id === nextEntry.id);

      return {
        ...current,
        journal: currentExisting
          ? current.journal.map((item) => (item.id === nextEntry.id ? nextEntry : item))
          : [nextEntry, ...current.journal],
      };
    });

    void upsertCloudJournalEntry(nextEntry).catch((error) => console.error("Trainingstagebuch konnte nicht direkt in Supabase gespeichert werden", error));
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
    const existing = entry.id ? data.plan.find((item) => item.id === entry.id && !item.deletedAt) : undefined;
    const dates = existing
      ? [entry.date]
      : expandTrainingRepeatDates(entry.date, entry.repeat, entry.repeatUntil, entry.repeatMaxCount);

    const createdEntries = dates.map((date, index): PlanEntry => ({
        ...entry,
        id: index === 0 && entry.id ? entry.id : createId("plan"),
        ownerUserId: entry.ownerUserId || activeUser.userId,
        athleteId: data.athlete.id,
        clubId: cloudProfile?.club_id || entry.clubId || activeUser.profile.club,
        date,
        weekday: getWeekdayFromDate(date),
        time: entry.startTime || entry.time,
        startTime: entry.startTime || entry.time,
        createdByUserId: activeUser.userId,
        createdAt: index === 0 ? existing?.createdAt ?? timestamp : timestamp,
        updatedAt: timestamp,
      }));

    updateData((current) => {
      return {
        ...current,
        plan: existing
          ? current.plan.map((item) => (item.id === createdEntries[0].id ? createdEntries[0] : item))
          : [...current.plan, ...createdEntries],
      };
    });

    createdEntries.forEach((createdEntry) => {
      void upsertCloudTraining(createdEntry).catch((error) => console.error("Training konnte nicht direkt in Supabase gespeichert werden", error));
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
          title: entry.id ? "Training wurde geändert" : "Neues Training zugewiesen",
          message: `${entry.title || entry.trainingType} am ${entry.date}${entry.startTime ? ` um ${entry.startTime}` : ""}`,
          type: entry.status === "cancelled" ? "training_cancelled" : entry.id ? "training_updated" : "training_assigned",
          relatedEntityType: "training_plan_items",
          relatedEntityId: createdEntries[0]?.id,
        }).catch((error) => console.error("Training-Benachrichtigung konnte nicht erstellt werden", error));
      }
    });
  };

  const deletePlanEntry = (id: string) => {
    const timestamp = getTimestamp();
    updateData((current) => ({
      ...current,
      plan: current.plan.map((entry) => entry.id === id ? { ...entry, deletedAt: timestamp, updatedAt: timestamp } : entry),
      trainingFeedback: current.trainingFeedback.filter((feedback) => feedback.trainingId !== id),
    }));

    void deleteCloudTraining(id, timestamp).catch((error) =>
      console.error("Training konnte nicht direkt aus Supabase gelöscht werden", error),
    );
  };

  const saveTrainingFeedback = (feedback: Omit<TrainingFeedback, "id" | "completedAt"> & { id?: string }) => {
    const timestamp = getTimestamp();
    const existing = feedback.id
      ? data.trainingFeedback.find((item) => item.id === feedback.id)
      : data.trainingFeedback.find(
          (item) => item.trainingId === feedback.trainingId && item.athleteUserId === feedback.athleteUserId,
        );
    const nextFeedback: TrainingFeedback = {
      ...feedback,
      id: feedback.id ?? createId("feedback"),
      completedAt: existing?.completedAt ?? timestamp,
    };
    const feedbackSummary =
      nextFeedback.comment?.trim() ||
      nextFeedback.reason?.trim() ||
      (nextFeedback.status === "skipped" ? "Training ausgelassen" : "Rückmeldung gespeichert");
    const linkedPlanEntry = data.plan.find((entry) => entry.id === nextFeedback.trainingId && !entry.deletedAt);
    const nextPlanEntry = linkedPlanEntry
      ? { ...linkedPlanEntry, status: nextFeedback.status, feedbackNote: feedbackSummary, updatedAt: timestamp }
      : null;

    updateData((current) => {
      const currentExisting = current.trainingFeedback.find((item) => item.id === nextFeedback.id);

      return {
        ...current,
        trainingFeedback: currentExisting
          ? current.trainingFeedback.map((item) => (item.id === nextFeedback.id ? nextFeedback : item))
          : [nextFeedback, ...current.trainingFeedback],
        plan: current.plan.map((entry) =>
          entry.id === nextFeedback.trainingId
            ? { ...entry, status: nextFeedback.status, feedbackNote: feedbackSummary, updatedAt: timestamp }
            : entry,
        ),
      };
    });

    void upsertCloudFeedback(nextFeedback).catch((error) => console.error("Training-Feedback konnte nicht direkt in Supabase gespeichert werden", error));
    if (nextPlanEntry) {
      void upsertCloudTraining(nextPlanEntry).catch((error) => console.error("Trainingstatus konnte nicht direkt in Supabase gespeichert werden", error));
    }

    if (nextFeedback.coachUserId) {
      void createCloudNotification({
        userId: nextFeedback.coachUserId,
        title: "Neue Rückmeldung eingegangen",
        message: nextFeedback.status === "skipped" ? `Training ausgelassen: ${nextFeedback.reason || "kein Grund angegeben"}` : `Feedback: Gefühl ${nextFeedback.feeling}/10, Motivation ${nextFeedback.motivation}/10`,
        type: "feedback_received",
        relatedEntityType: "training_feedback",
        relatedEntityId: nextFeedback.id,
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

  const updatePlanEntryStatus = (id: string, status: PlanEntry["status"]) => {
    const timestamp = getTimestamp();
    const existing = data.plan.find((entry) => entry.id === id);
    const nextEntry = existing ? { ...existing, status, updatedAt: timestamp } : undefined;

    updateData((current) => ({
      ...current,
      plan: current.plan.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status,
              updatedAt: timestamp,
            }
          : entry,
      ),
    }));

    if (nextEntry) {
      void upsertCloudTraining(nextEntry).catch((error) => console.error("Trainingstatus konnte nicht direkt in Supabase gespeichert werden", error));
    }
  };

  const updateProfile = async (userProfile: UserProfile) => {
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
      await updateCloudProfile({
        id: cloudProfile.id,
        first_name: userProfile.firstName,
        last_name: userProfile.lastName,
        display_name: userProfile.nickname || `${userProfile.firstName} ${userProfile.lastName}`.trim(),
        avatar_url: userProfile.profileImageDataUrl || null,
        age_category: userProfile.ageClass || null,
        boat_classes: userProfile.boatClasses.map((boat) => boat),
        paddle_side: userProfile.boatClasses.includes("C1") ? (userProfile.paddleSide === "links" ? "Links" : "Rechts") : null,
        profile_data: userProfile as unknown as Json,
      });
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
            data={activeData}
            entries={activePlanEntries}
            user={activeUser}
            onSave={upsertPlanEntry}
            onDelete={deletePlanEntry}
            onToggleDone={togglePlanEntryDone}
            onFeedbackSave={saveTrainingFeedback}
            onDataChange={updateData}
            onOpenOverview={() => setTrainingSegment("overview")}
            onOpenSessions={() => {
              setTrainingSegment("sessions");
              setNewTrainingSignal((value) => value + 1);
            }}
            onOpenJournal={() => setTrainingSegment("journal")}
            deviceClass={currentDeviceClass}
          />
        );
      case "journal":
        return (
          <TrainingJournalView
            sessions={data.training}
            plan={activePlanEntries}
            journal={data.journal}
            onOpenOverview={() => setTrainingSegment("overview")}
            onOpenPlan={() => setTrainingSegment("plan")}
            onOpenSessions={() => {
              setTrainingSegment("sessions");
              setNewTrainingSignal((value) => value + 1);
            }}
          />
        );
      case "calendar":
        return (
          <TrainingCalendarView
            entries={activePlanEntries}
            journal={data.journal}
            onOpenPlan={() => setTrainingSegment("plan")}
            onOpenJournal={() => setTrainingSegment("journal")}
            onStatusChange={updatePlanEntryStatus}
            deviceClass={currentDeviceClass}
          />
        );
      case "overview":
        return (
          <TrainingOverviewView
            plan={activePlanEntries}
            sessions={data.training}
            journal={data.journal}
            onPlanStatusChange={updatePlanEntryStatus}
            onSaveJournal={upsertJournalEntry}
            onOpenPlan={() => setTrainingSegment("plan")}
            onOpenSessions={() => {
              setTrainingSegment("sessions");
              setNewTrainingSignal((value) => value + 1);
            }}
            onOpenJournal={() => setTrainingSegment("journal")}
          />
        );
      case "sessions":
      default:
        return (
          <TrainingView
            sessions={data.training}
            journal={data.journal}
            onSave={upsertTraining}
            onDelete={deleteTraining}
            onSaveJournal={upsertJournalEntry}
            onOpenOverview={() => setTrainingSegment("overview")}
            onOpenPlan={() => setTrainingSegment("plan")}
            onOpenJournal={() => setTrainingSegment("journal")}
            openNewSignal={newTrainingSignal}
            openJournalSignal={journalSignal}
          />
        );
    }
  };

  const moveTrainingSegment = (direction: 1 | -1) => {
    const order = visibleTrainingSegments.map((segment) => segment.id);
    const currentIndex = order.indexOf(trainingSegment);
    const nextIndex = Math.min(order.length - 1, Math.max(0, currentIndex + direction));
    if (nextIndex !== currentIndex) {
      setTrainingSegment(order[nextIndex]);
      setActivePage("training");
    }
  };

  const handleTrainingTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, select, a")) return;
    const touch = event.touches[0];
    setTrainingSwipeStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTrainingTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!trainingSwipeStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - trainingSwipeStart.x;
    const dy = touch.clientY - trainingSwipeStart.y;
    setTrainingSwipeStart(null);
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    moveTrainingSegment(dx < 0 ? 1 : -1);
  };

  const renderTrainingArea = (segment: TrainingSegment = trainingSegment) => {
    const featureMode = getCurrentFeatureMode(trainingFeatureBySegment[segment]);
    const showCompactTrainingNotice = currentDeviceClass === "phone" && (featureMode === "simplified" || featureMode === "limited");

    return (
      <div className={`category-shell more-category-shell device-${currentDeviceClass}`}>
        <div className="training-segment-switcher" onTouchStart={handleTrainingTouchStart} onTouchEnd={handleTrainingTouchEnd}>
          <SegmentNav
            label="Training Kategorien"
            items={visibleTrainingSegments}
            activeId={segment}
            onChange={(nextSegment) => {
              setTrainingSegment(nextSegment);
              setActivePage("training");
            }}
          />
        </div>
        {showCompactTrainingNotice ? (
          <DeviceLimitedPanel
            title={segment === "calendar" ? "Kalender kompakt" : "Trainingsplanung kompakt"}
            description={
              segment === "calendar"
                ? "Auf dem Smartphone sind Tag, Liste und schnelle Statuswechsel im Fokus. Wochenmatrix und Detailarbeit sind auf Tablet und Desktop übersichtlicher."
                : "Auf dem Smartphone bleiben schnelle Planung, Status und Feedback erreichbar. Umfangreiche Wochenplanung nutzt du besser auf Tablet oder Computer."
            }
            mode={featureMode}
          />
        ) : null}
        <div className="segment-content">{renderTrainingContent(segment)}</div>
      </div>
    );
  };

  const renderCompetitionContent = (segment: CompetitionSegment) => {
    switch (segment) {
      case "results":
        return <CompetitionResultsView competitions={data.competitions} />;
      case "bests":
        return <CompetitionBestTimesView competitions={data.competitions} />;
      case "stats":
        return <CompetitionSeasonStatsView competitions={data.competitions} />;
      case "advanced":
        return <ResultsReadinessView data={activeData} user={activeUser} mode="results" onDataChange={updateData} />;
      case "imports":
        return <ResultsReadinessView data={activeData} user={activeUser} mode="imports" onDataChange={updateData} />;
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
        return <SeasonView competitions={data.competitions} training={data.training} plan={activePlanEntries} />;
      case "coach":
        return <AnalyticsCenterView data={activeData} user={activeUser} mode="coach" />;
      case "admin":
        return <AnalyticsCenterView data={activeData} user={activeUser} mode="admin" />;
      case "smartCoach":
        return <SmartCoachView data={activeData} user={activeUser} onUpdateRecommendation={updateSmartCoachRecommendation} />;
      case "training":
      case "competition":
      case "goals":
        return <AnalyticsCenterView data={activeData} user={activeUser} mode={segment as AnalyticsMode} />;
      case "load":
        return (
          <div className="stack">
            <AnalyticsCenterView data={activeData} user={activeUser} mode="load" />
            <ResultsReadinessView data={activeData} user={activeUser} mode="load" onDataChange={updateData} />
          </div>
        );
      case "overview":
      default:
        return (
          <div className="stack">
            <AnalyticsCenterView
              data={activeData}
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
                  setMoreHubOpen(false);
                  setActivePage("more");
                }
              }}
            />
            <AnalysisView competitions={data.competitions} training={data.training} plan={activePlanEntries} feedback={data.trainingFeedback} />
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
          ...(canUseCoachArea(activeUser.role) ? [{ id: activeUser.role === "admin" ? "admin" as const : "coach" as const, label: activeUser.role === "admin" ? "Admin Übersicht" : "Coach Analyse" }] : []),
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
      case "academy":
        return (
          <AcademyView
            data={activeData}
            user={activeUser}
            onDataChange={updateData}
            onOpenTrainingPlan={() => {
              setTrainingSegment("plan");
              setActivePage("training");
            }}
          />
        );
      case "equipment":
        return (
          <EquipmentView
            material={data.material}
            onSave={upsertMaterial}
            onDelete={deleteMaterial}
          />
        );
      case "club":
        if (currentDeviceClass === "phone" && getCurrentFeatureMode("clubAdministration") !== "full") {
          return (
            <DeviceLimitedPanel
              title="Verein kompakt"
              description="Auf dem Smartphone siehst du die wichtigsten Vereins- und Team-Einstiege. Vollständige Mitglieder-, Rollen- und Verwaltungsarbeit bleibt Tablet und Desktop vorbehalten."
              mode={getCurrentFeatureMode("clubAdministration")}
              actions={[
                { label: "Team öffnen", onClick: () => setActivePage("communication") },
                {
                  label: "Profil öffnen",
                  onClick: () => {
                    setMoreSegment("profile");
                    setMoreHubOpen(false);
                    setActivePage("more");
                  },
                },
              ]}
            />
          );
        }
        return <ClubPortalView data={activeData} user={activeUser} onDataChange={updateData} />;
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
        return <NotificationsView notifications={data.notifications} canRevealPrivateData={canSeeSystemPrivateData(activeUser.role)} onMarkRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} />;
      case "integrations":
        if (currentDeviceClass === "phone" && getCurrentFeatureMode("integrations") !== "full") {
          return (
            <div className="stack">
              <PolarIntegrationView
                data={activeData}
                user={activeUser}
                sessionAccessToken={session?.access_token}
                onDataChange={updateData}
              />
              <DeviceLimitedPanel
                title="Excel-Import auf größerem Bildschirm"
                description="Polar funktioniert auf dem Smartphone. Große Excel-Importe, Spaltenmapping und Massenexporte bleiben auf Tablet oder Computer übersichtlicher und sicherer."
                mode={getCurrentFeatureMode("integrations")}
                actions={[
                  {
                    label: "Sync-Status öffnen",
                    onClick: () => {
                      setMoreSegment("settings");
                      setMoreHubOpen(false);
                      setActivePage("more");
                    },
                  },
                ]}
              />
            </div>
          );
        }
        return <ImportExportView data={activeData} user={activeUser} sessionAccessToken={session?.access_token} onDataChange={updateData} />;
      case "feedback":
        return <BetaReleaseView data={activeData} user={activeUser} mode="feedback" onDataChange={updateData} />;
      case "betaGuide":
        return <BetaReleaseView data={activeData} user={activeUser} mode="guide" onDataChange={updateData} />;
      case "limitations":
        return <BetaReleaseView data={activeData} user={activeUser} mode="limitations" onDataChange={updateData} />;
      case "beta":
        return (
          <div className="stack">
            <ResultsReadinessView data={activeData} user={activeUser} mode="beta" onDataChange={updateData} />
            <BetaReleaseView data={activeData} user={activeUser} mode="feedback" onDataChange={updateData} />
          </div>
        );
      case "betaTesters":
        return <BetaReleaseView data={activeData} user={activeUser} mode="testers" onDataChange={updateData} />;
      case "coach":
        if (currentDeviceClass === "phone" && getCurrentFeatureMode("coachArea") === "simplified") {
          return (
            <div className="stack">
              <DeviceLimitedPanel
                title={activeUser.role === "admin" ? "Admin kompakt" : "Coach kompakt"}
                description={
                  activeUser.role === "admin"
                    ? "Auf dem Smartphone sind Status, Team und schnelle Prüfungen verfügbar. Vollständige Adminarbeit bleibt Tablet und Desktop vorbehalten."
                    : "Auf dem Smartphone sind schnelle Traineraktionen verfügbar. Gruppenverwaltung, Rollen und größere Planungsarbeit nutzt du besser auf Tablet oder Computer."
                }
                mode={getCurrentFeatureMode("coachArea")}
                actions={[
                  {
                    label: "Training planen",
                    onClick: () => {
                      setTrainingSegment("plan");
                      setActivePage("training");
                    },
                  },
                  { label: "Team öffnen", onClick: () => setActivePage("communication") },
                  {
                    label: "Analyse öffnen",
                    onClick: () => {
                      setAnalysisSegment("overview");
                      setActivePage("analysis");
                    },
                  },
                ]}
              />
              <section className="section-block device-quick-summary">
                <p className="eyebrow">Schnellstatus</p>
                <div className="metric-grid">
                  <article className="metric-card">
                    <strong>{activeData.coachAthletes.length}</strong>
                    <span>Sportler</span>
                  </article>
                  <article className="metric-card">
                    <strong>{activeData.coachGroups.length}</strong>
                    <span>Gruppen</span>
                  </article>
                  <article className="metric-card">
                    <strong>{activeData.trainingFeedback.length}</strong>
                    <span>Rückmeldungen</span>
                  </article>
                </div>
              </section>
            </div>
          );
        }
        return <CoachView data={activeData} user={activeUser} onDataChange={updateData} />;
      case "settings":
        return (
          <SettingsView
            user={activeUser}
            syncStatus={{
              status: cloudStatus,
              syncCount,
              pendingSyncCount,
              lastSyncAt,
              message: cloudMessage,
              isAdmin: activeUser.role === "admin",
            }}
            onSave={updateProfileSettings}
            onLogout={handleLogout}
          />
        );
      case "profile":
      default:
        return <ProfileView user={activeUser} onSave={updateProfile} />;
    }
  };

  const moreItems: MoreSegmentMeta[] = moreSegments.map((item) => ({
    ...item,
    label: item.id === "notifications" && unreadNotificationCount > 0 ? `Updates (${unreadNotificationCount})` : item.label,
    ...moreSegmentMeta[item.id],
  }));

  const moreGroupBySegment: Record<MoreSegment, MoreGroupKind> = {
    profile: "account",
    academy: "sport",
    settings: "account",
    equipment: "sport",
    goals: "sport",
    records: "sport",
    competitions: "sport",
    club: "team",
    coach: activeUser.role === "admin" ? "admin" : "team",
    notifications: "beta",
    feedback: "beta",
    betaGuide: "beta",
    limitations: "beta",
    integrations: "system",
    beta: "admin",
    betaTesters: "admin",
  };
  const morePrioritySegments = new Set<MoreSegment>(activeUser.role === "admin"
    ? ["academy", "integrations", "settings", "coach"]
    : canUseCoachArea(activeUser.role)
      ? ["academy", "integrations", "settings", "coach"]
      : ["academy", "integrations", "settings", "profile"]);
  const moreGroupLabels: Record<MoreGroupKind, string> = {
    account: "Einstellungen & Hilfe",
    sport: "Training & Lernen",
    team: "Verein & Team",
    beta: "Beta & Hilfe",
    admin: "Admin",
    system: "Daten & Integrationen",
  };
  const moreGroupSubtitles: Record<MoreGroupKind, string> = {
    account: "Profil, App und Sitzung",
    sport: "Akademie, Ziele und Wettkampf",
    team: canUseCoachArea(activeUser.role) ? "Organisation" : "Kontakt zum Team",
    beta: "Hilfe und Rückmeldung",
    admin: "Kontrolle und Freigabe",
    system: "Import, Export und externe Quellen",
  };
  const smartMoreItems: SmartMoreItem[] = moreItems.map((item) => ({
    ...item,
    kind: moreGroupBySegment[item.id],
    priority: morePrioritySegments.has(item.id),
    badge: item.id === "notifications" && unreadNotificationCount > 0 ? String(unreadNotificationCount) : undefined,
  }));
  const smartMoreGroups = smartMoreItems.reduce<Record<MoreGroupKind, SmartMoreItem[]>>(
    (groups, item) => {
      groups[item.kind].push(item);
      return groups;
    },
    { account: [], sport: [], team: [], beta: [], admin: [], system: [] },
  );
  const smartPriorityItems = smartMoreItems.filter((item) => item.priority).slice(0, 4);
  const moreRoleTitle = activeUser.role === "admin" ? "Admin Hub" : canUseCoachArea(activeUser.role) ? "Coach Hub" : "Mehr";
  const moreRoleSubtitle = activeUser.role === "admin"
    ? "Nutzer, Rollen, Beta-Status und App-Bereiche sauber getrennt."
    : canUseCoachArea(activeUser.role)
      ? "Team, Planung, Rückmeldungen und eigene Einstellungen an einem Ort."
      : "Alles Wichtige für dein Training ohne Coach- oder Admin-Ballast.";
  const moreHelper = activeUser.role === "admin"
    ? "Admins sehen alles, aber zuerst die wichtigsten Kontrollpunkte."
    : canUseCoachArea(activeUser.role)
      ? "Trainer bekommen Teamfunktionen, aber keine Admin-Verwaltung."
      : "Sportler sehen hier nur Bereiche, die sie wirklich brauchen.";
  const openMoreItem = (item: SmartMoreItem) => {
    setMoreSegment(item.id);
    setMoreHubOpen(false);
    setActivePage("more");
  };

  const openMainNavPage = (page: PageId) => {
    if (page === "more") {
      setMoreHubOpen(true);
    }
    setActivePage(page);
  };

  const renderMoreArea = (segment: MoreSegment = moreSegment, forceDetail = false) => {
    const showHub = moreHubOpen && !forceDetail;

    return (
    <div className="category-shell more-category-shell">
      {!showHub ? (
        <>
          <button
            className="secondary-button more-back-button"
            type="button"
            onClick={() => setMoreHubOpen(true)}
            aria-label="Zurück zur Mehr-Übersicht"
          >
            Zurück zu Mehr
          </button>
          <SegmentNav
            label="Mehr Kategorien"
            items={moreItems}
            activeId={segment}
            onChange={(nextSegment) => {
              setMoreSegment(nextSegment);
              setMoreHubOpen(false);
              setActivePage("more");
            }}
          />
        </>
      ) : null}
      {showHub ? (
        <section className="smart-more-panel" aria-label="Mehr Hub">
        <header className="smart-more-hero">
          <div>
            <p className="eyebrow">Paddlio · Version {APP_VERSION}</p>
            <h2>{moreRoleTitle}</h2>
            <p>{moreRoleSubtitle}</p>
          </div>
          <div className="smart-profile-pill">
            <span>{getInitials(activeUser.profile)}</span>
            <div>
              <strong>{roleLabelMap[activeUser.role.toLowerCase()] ?? "Sportler"}</strong>
              <small>{getDisplayName(activeUser.profile)}</small>
            </div>
          </div>
        </header>
        <p className="smart-more-helper">{moreHelper}</p>
        {smartPriorityItems.length > 0 ? (
          <section className="smart-quick-grid" aria-labelledby="smart-quick-title">
            <div className="section-heading simple">
              <div>
                <p className="eyebrow">Schnellzugriff</p>
                <h2 id="smart-quick-title">Was du wahrscheinlich brauchst</h2>
              </div>
            </div>
            <div className="smart-grid">
              {smartPriorityItems.map((item) => (
                <button
                  className={`smart-tile is-featured kind-${item.kind}${segment === item.id ? " active" : ""}`}
                  type="button"
                  key={item.id}
                  aria-current={segment === item.id ? "page" : undefined}
                  aria-label={`${item.label} öffnen`}
                  onClick={() => openMoreItem(item)}
                >
                  <span className="more-menu-icon smart-icon" aria-hidden="true"><Icon name={item.icon} /></span>
                  <span className="smart-tile-copy">
                    <strong>{item.label}{item.badge ? <em>{item.badge}</em> : null}</strong>
                    <small>{item.description}</small>
                  </span>
                  <span className="smart-arrow" aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        <section className="smart-groups" aria-label="Alle Mehr Bereiche">
          {(Object.keys(smartMoreGroups) as MoreGroupKind[]).map((kind) => {
            const items = smartMoreGroups[kind];
            if (items.length === 0) {
              return null;
            }

            return (
              <section className="smart-group" key={kind}>
                <div className="section-heading simple">
                  <div>
                    <p className="eyebrow">{moreGroupLabels[kind]}</p>
                    <h2>{moreGroupSubtitles[kind]}</h2>
                  </div>
                </div>
                <div className="smart-list">
                  {kind === "team" ? (
                    <button
                      className={activeNavPage === "communication" ? "smart-tile active kind-team" : "smart-tile kind-team"}
                      type="button"
                      aria-label="Team-Bereich öffnen"
                      onClick={() => setActivePage("communication")}
                    >
                      <span className="more-menu-icon smart-icon" aria-hidden="true"><Icon name="message" /></span>
                      <span className="smart-tile-copy">
                        <strong>Team</strong>
                        <small>Nachrichten, Aufgaben, Anwesenheit und Gruppen</small>
                      </span>
                      <span className="smart-arrow" aria-hidden="true">›</span>
                    </button>
                  ) : null}
                  {items.map((item) => (
                    <button
                      className={`smart-tile kind-${item.kind}${segment === item.id ? " active" : ""}`}
                      key={item.id}
                      type="button"
                      aria-current={segment === item.id ? "page" : undefined}
                      aria-label={`${item.label} öffnen`}
                      onClick={() => openMoreItem(item)}
                    >
                      <span className="more-menu-icon smart-icon" aria-hidden="true"><Icon name={item.icon} /></span>
                      <span className="smart-tile-copy">
                        <strong>{item.label}{item.badge ? <em>{item.badge}</em> : null}</strong>
                        <small>{item.description}</small>
                      </span>
                      <span className="smart-arrow" aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </section>
        </section>
      ) : null}
      {!showHub ? <div className="segment-content">{renderMoreContent(segment)}</div> : null}
    </div>
    );
  };

  const openDirectPage = (page: PageId) => {
    switch (page) {
      case "plan":
        return renderTrainingArea("plan");
      case "season":
        return renderAnalysisArea("season");
      case "equipment":
        return renderMoreArea("equipment", true);
      case "goals":
        return renderMoreArea("goals", true);
      case "records":
        return renderMoreArea("records", true);
      case "profile":
        return renderMoreArea("profile", true);
      case "academy":
        return renderMoreArea("academy", true);
      default:
        return null;
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardView
            data={activeData}
            user={activeUser}
            onNavigate={openMainNavPage}
            onOpenMoreSegment={openMoreSegment}
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
        return <ClubPortalView data={activeData} user={activeUser} onDataChange={updateData} />;
      case "communication":
        return <CommunicationView data={activeData} user={activeUser} onDataChange={updateData} />;
      case "more":
        return renderMoreArea();
      case "goals":
      case "records":
      case "season":
      case "plan":
      case "equipment":
      case "profile":
      case "academy":
        return openDirectPage(activePage);
      default:
        return null;
    }
  };

  const isHome = activePage === "dashboard";

  return (
    <div className={`${isHome ? "app-shell app-shell-home" : "app-shell"} app-shell-${currentDeviceClass} ${topChromeVisible ? "scroll-chrome-visible" : "scroll-chrome-hidden"}`}>
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>
      <DesktopSideNavigation appName={APP_NAME} activePage={activeNavPage} user={activeUser} items={visibleMainNavItems} onNavigate={openMainNavPage} />
      {!isHome ? (
        <header className={`app-header app-header-compact ${topChromeVisible ? "" : "is-hidden"}`} data-testid="app-header">
          <div className="brand-lockup">
            <p className="app-brand">{APP_NAME}</p>
            <p className="brand-slogan">{APP_SLOGAN}</p>
          </div>
          <div className="page-title-lockup">
            <span>Version {APP_VERSION} · Paddlio Beta</span>
            <h1>{pageTitles[activePage]}</h1>
          </div>
        </header>
      ) : null}

      <main className="page-content" id="main"><Suspense fallback={<LoadingState />}>{renderPage()}</Suspense></main>

      <BottomNavigation activePage={activeNavPage} visible={bottomNavVisible} items={visibleMainNavItems} onNavigate={openMainNavPage} />
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

export default App;


