import { useEffect, useState } from "react";
import { APP_NAME, APP_SLOGAN, APP_VERSION } from "./brand";
import { Icon, type IconName } from "./components/Icon";
import { SegmentNav, type SegmentItem } from "./components/SegmentNav";
import {
  clearSession,
  createId,
  loadData,
  loadSession,
  loginLocalUser,
  registerLocalUser,
  saveData,
  type AuthResult,
  type LoginInput,
  type RegisterInput,
} from "./data/storage";
import { getActiveUser } from "./domain/profile";
import { getWeekdayFromDate, isDoneStatus } from "./domain/trainingPlan";
import { isSupabaseConfigured } from "./lib/supabaseConfig";
import type {
  Competition,
  AuthSession,
  MaterialItem,
  PageId,
  PaddleMotionData,
  PlanEntry,
  TrainingFeedback,
  SeasonGoal,
  TrainingJournalEntry,
  TrainingSession,
  UserProfile,
} from "./domain/types";
import { AnalysisView } from "./views/AnalysisView";
import { AuthView } from "./views/AuthView";
import { BoatComparisonView } from "./views/BoatComparisonView";
import { CompetitionResultsView } from "./views/CompetitionResultsView";
import { CompetitionVideosView } from "./views/CompetitionVideosView";
import { CompetitionsView } from "./views/CompetitionsView";
import { CoachView } from "./views/CoachView";
import { DashboardView, type DashboardQuickAction } from "./views/DashboardView";
import { EquipmentView } from "./views/EquipmentView";
import { GoalsView } from "./views/GoalsView";
import { PlanView } from "./views/PlanView";
import { ProfileView } from "./views/ProfileView";
import { RecordsView } from "./views/RecordsView";
import { SeasonView } from "./views/SeasonView";
import { SettingsView } from "./views/SettingsView";
import { TrainingJournalView } from "./views/TrainingJournalView";
import { TrainingView } from "./views/TrainingView";

type TrainingSegment = "plan" | "sessions" | "journal";
type CompetitionSegment = "races" | "results" | "videos";
type AnalysisSegment = "overview" | "boats" | "season";
type MoreSegment = "profile" | "equipment" | "goals" | "records" | "coach" | "settings";

const navItems: Array<{ id: PageId; label: string; icon: IconName }> = [
  { id: "dashboard", label: "Home", icon: "home" },
  { id: "training", label: "Training", icon: "training" },
  { id: "competitions", label: "Wettkampf", icon: "trophy" },
  { id: "analysis", label: "Analyse", icon: "chart" },
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
  { id: "races", label: "Rennen" },
  { id: "results", label: "Ergebnisse" },
  { id: "videos", label: "Videos" },
];

const analysisSegments: SegmentItem<AnalysisSegment>[] = [
  { id: "overview", label: "Uebersicht" },
  { id: "boats", label: "K1/C1" },
  { id: "season", label: "Saison" },
];

const baseMoreSegments: SegmentItem<MoreSegment>[] = [
  { id: "profile", label: "Profil" },
  { id: "equipment", label: "Material" },
  { id: "goals", label: "Ziele" },
  { id: "records", label: "Rekorde" },
  { id: "settings", label: "Einstellungen" },
];

const pageTitles: Record<PageId, string> = {
  dashboard: "Dashboard",
  training: "Training",
  competitions: "Wettkaempfe",
  analysis: "Analyse",
  more: "Mehr",
  goals: "Ziele",
  records: "Rekorde",
  season: "Saison",
  plan: "Trainingsplan",
  equipment: "Material",
  profile: "Profil",
};

const getTimestamp = (): string => new Date().toISOString();

const canUseCoachArea = (role: string): boolean => role === "coach" || role === "teamAdmin" || role === "admin";

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [trainingSegment, setTrainingSegment] = useState<TrainingSegment>("plan");
  const [competitionSegment, setCompetitionSegment] = useState<CompetitionSegment>("races");
  const [analysisSegment, setAnalysisSegment] = useState<AnalysisSegment>("overview");
  const [moreSegment, setMoreSegment] = useState<MoreSegment>("profile");
  const [newTrainingSignal, setNewTrainingSignal] = useState(0);
  const [newCompetitionSignal, setNewCompetitionSignal] = useState(0);
  const [journalSignal, setJournalSignal] = useState(0);
  const [data, setData] = useState<PaddleMotionData | null>(() => {
    const currentSession = loadSession();
    return currentSession ? loadData(currentSession.userId) : null;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.info("Paddlio Cloud ist deaktiviert. LocalStorage bleibt aktiv, bis VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY gesetzt sind.");
    }
  }, []);

  useEffect(() => {
    if (session && data) {
      saveData(session.userId, data);
    }
  }, [data, session]);

  const activateSession = (result: AuthResult): AuthResult => {
    if (result.ok) {
      setSession(result.session);
      setData(loadData(result.session.userId));
      setActivePage("dashboard");
      setTrainingSegment("plan");
      setCompetitionSegment("races");
      setAnalysisSegment("overview");
      setMoreSegment("profile");
    }

    return result;
  };

  const handleLogin = (input: LoginInput): AuthResult => activateSession(loginLocalUser(input));

  const handleRegister = (input: RegisterInput): AuthResult => activateSession(registerLocalUser(input));

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setData(null);
    setActivePage("dashboard");
  };

  if (!session || !data) {
    return <AuthView onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const activeUser = getActiveUser(data.users, data.activeUserId);
  const activeNavPage = navPageByPage[activePage] ?? activePage;
  const moreSegments = canUseCoachArea(activeUser.role)
    ? [
        ...baseMoreSegments.slice(0, 4),
        { id: "coach" as const, label: activeUser.role === "admin" ? "Admin" : "Coach" },
        baseMoreSegments[4],
      ]
    : baseMoreSegments;
  const updateData = (updater: (current: PaddleMotionData) => PaddleMotionData) => {
    setData((current) => (current ? updater(current) : current));
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
      const dates: string[] = [];
      const cursor = new Date(startDate);

      while (dates.length === 0 || (repeat !== "none" && cursor <= repeatUntil && dates.length < 90)) {
        dates.push(cursor.toISOString().slice(0, 10));
        if (repeat === "daily") cursor.setDate(cursor.getDate() + 1);
        else if (repeat === "weekly") cursor.setDate(cursor.getDate() + 7);
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

  const updateProfile = (profile: UserProfile) => {
    const timestamp = getTimestamp();

    updateData((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === current.activeUserId
          ? {
              ...user,
              profile,
              updatedAt: timestamp,
            }
          : user,
      ),
      athlete: {
        ...current.athlete,
        name: profile.nickname || `${profile.firstName} ${profile.lastName}`.trim() || current.athlete.name,
        club: profile.club || current.athlete.club,
      },
    }));
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
        items={competitionSegments}
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
      case "overview":
      default:
        return <AnalysisView competitions={data.competitions} training={data.training} plan={data.plan} feedback={data.trainingFeedback} />;
    }
  };

  const renderAnalysisArea = (segment: AnalysisSegment = analysisSegment) => (
    <div className="category-shell">
      <SegmentNav
        label="Analyse Kategorien"
        items={analysisSegments}
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
        items={moreSegments}
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
            onQuickAction={handleDashboardQuickAction}
          />
        );
      case "training":
        return renderTrainingArea();
      case "competitions":
        return renderCompetitionArea();
      case "analysis":
        return renderAnalysisArea();
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
      {!isHome ? (
        <header className="app-header app-header-compact">
          <div className="brand-lockup">
            <p className="app-brand">{APP_NAME}</p>
            <p className="brand-slogan">{APP_SLOGAN}</p>
          </div>
          <div className="page-title-lockup">
            <span>Version {APP_VERSION}</span>
            <h1>{pageTitles[activePage]}</h1>
          </div>
        </header>
      ) : null}

      <main className="page-content">{renderPage()}</main>

      <nav className="bottom-nav" aria-label="Hauptnavigation">
        {navItems.map((item) => (
          <button
            className={activeNavPage === item.id ? "nav-item active" : "nav-item"}
            key={item.id}
            type="button"
            onClick={() => setActivePage(item.id)}
            aria-current={activeNavPage === item.id ? "page" : undefined}
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

export default App;
