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
import { getActiveUser, getInitials } from "./domain/profile";
import type {
  Competition,
  AuthSession,
  MaterialItem,
  PageId,
  PaddleMotionData,
  PlanEntry,
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
type MoreSegment = "profile" | "equipment" | "goals" | "records" | "settings";

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

const moreSegments: SegmentItem<MoreSegment>[] = [
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
    entry: Omit<PlanEntry, "id" | "athleteId" | "createdAt" | "updatedAt" | "createdByUserId" | "assignedAthleteId"> & {
      id?: string;
    },
  ) => {
    const timestamp = getTimestamp();

    updateData((current) => {
      const existing = entry.id ? current.plan.find((item) => item.id === entry.id) : undefined;
      const nextEntry: PlanEntry = {
        ...entry,
        id: entry.id ?? createId("plan"),
        athleteId: current.athlete.id,
        createdByUserId: current.activeUserId,
        assignedAthleteId: current.athlete.id,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      return {
        ...current,
        plan: existing
          ? current.plan.map((item) => (item.id === nextEntry.id ? nextEntry : item))
          : [...current.plan, nextEntry],
      };
    });
  };

  const deletePlanEntry = (id: string) => {
    updateData((current) => ({
      ...current,
      plan: current.plan.filter((entry) => entry.id !== id),
    }));
  };

  const togglePlanEntryDone = (id: string) => {
    updateData((current) => ({
      ...current,
      plan: current.plan.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: entry.status === "erledigt" ? "geplant" : "erledigt",
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
            entries={data.plan}
            onSave={upsertPlanEntry}
            onDelete={deletePlanEntry}
            onToggleDone={togglePlanEntryDone}
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
        return <AnalysisView competitions={data.competitions} training={data.training} plan={data.plan} />;
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
        return <GoalsView user={activeUser} competitions={data.competitions} training={data.training} />;
      case "records":
        return <RecordsView competitions={data.competitions} training={data.training} />;
      case "settings":
        return <SettingsView user={activeUser} onSave={updateProfileSettings} />;
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <p className="app-brand">{APP_NAME}</p>
          <p className="brand-slogan">{APP_SLOGAN}</p>
          <p className="eyebrow">Version {APP_VERSION}</p>
          <h1>{pageTitles[activePage]}</h1>
        </div>
        <div className="profile-chip">
          <span>
            {activeUser.profile.profileImageDataUrl ? (
              <img src={activeUser.profile.profileImageDataUrl} alt="" />
            ) : (
              getInitials(activeUser.profile)
            )}
          </span>
          <div>
            <strong>{activeUser.profile.nickname || activeUser.profile.firstName || "Athlet"}</strong>
            <small>{activeUser.profile.club || "Kein Verein"}</small>
          </div>
        </div>
        <button className="logout-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

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
