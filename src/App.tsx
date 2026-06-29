import { useEffect, useState } from "react";
import { APP_NAME, APP_SLOGAN, APP_VERSION } from "./brand";
import { Icon, type IconName } from "./components/Icon";
import { createId, loadData, saveData } from "./data/storage";
import { getActiveUser, getInitials } from "./domain/profile";
import type {
  Competition,
  MaterialItem,
  PageId,
  PaddleMotionData,
  PlanEntry,
  TrainingJournalEntry,
  TrainingSession,
  UserProfile,
} from "./domain/types";
import { AnalysisView } from "./views/AnalysisView";
import { CompetitionsView } from "./views/CompetitionsView";
import { DashboardView } from "./views/DashboardView";
import { EquipmentView } from "./views/EquipmentView";
import { GoalsView } from "./views/GoalsView";
import { PlanView } from "./views/PlanView";
import { ProfileView } from "./views/ProfileView";
import { RecordsView } from "./views/RecordsView";
import { SeasonView } from "./views/SeasonView";
import { TrainingView } from "./views/TrainingView";

const navItems: Array<{ id: PageId; label: string; icon: IconName }> = [
  { id: "dashboard", label: "Home", icon: "home" },
  { id: "training", label: "Training", icon: "training" },
  { id: "competitions", label: "Wettkampf", icon: "trophy" },
  { id: "analysis", label: "Analyse", icon: "chart" },
  { id: "profile", label: "Profil", icon: "user" },
];

const profileAreaPages = new Set<PageId>(["equipment", "goals", "records", "season", "plan"]);

const pageTitles: Record<PageId, string> = {
  dashboard: "Dashboard",
  training: "Training",
  competitions: "Wettkaempfe",
  analysis: "Analyse",
  goals: "Ziele",
  records: "Rekorde",
  season: "Saison",
  plan: "Trainingsplan",
  equipment: "Material",
  profile: "Profil",
};

const getTimestamp = (): string => new Date().toISOString();

function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [data, setData] = useState<PaddleMotionData>(() => loadData());
  const activeUser = getActiveUser(data.users, data.activeUserId);
  const activeNavPage = profileAreaPages.has(activePage) ? "profile" : activePage;

  useEffect(() => {
    saveData(data);
  }, [data]);

  const upsertCompetition = (competition: Omit<Competition, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const timestamp = getTimestamp();

    setData((current) => {
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
    setData((current) => ({
      ...current,
      competitions: current.competitions.filter((competition) => competition.id !== id),
    }));
  };

  const upsertTraining = (session: Omit<TrainingSession, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const timestamp = getTimestamp();

    setData((current) => {
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
    setData((current) => ({
      ...current,
      training: current.training.filter((session) => session.id !== id),
      journal: current.journal.filter((entry) => entry.trainingId !== id),
    }));
  };

  const upsertJournalEntry = (
    entry: Omit<TrainingJournalEntry, "id" | "athleteId" | "createdAt" | "updatedAt"> & { id?: string },
  ) => {
    const timestamp = getTimestamp();

    setData((current) => {
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

    setData((current) => {
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
    setData((current) => ({
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

    setData((current) => {
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
    setData((current) => ({
      ...current,
      plan: current.plan.filter((entry) => entry.id !== id),
    }));
  };

  const togglePlanEntryDone = (id: string) => {
    setData((current) => ({
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

    setData((current) => ({
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

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardView data={data} user={activeUser} onNavigate={setActivePage} />;
      case "training":
        return (
          <TrainingView
            sessions={data.training}
            journal={data.journal}
            onSave={upsertTraining}
            onDelete={deleteTraining}
            onSaveJournal={upsertJournalEntry}
          />
        );
      case "competitions":
        return (
          <CompetitionsView
            competitions={data.competitions}
            onSave={upsertCompetition}
            onDelete={deleteCompetition}
          />
        );
      case "analysis":
        return <AnalysisView competitions={data.competitions} training={data.training} plan={data.plan} />;
      case "goals":
        return <GoalsView user={activeUser} competitions={data.competitions} training={data.training} />;
      case "records":
        return <RecordsView competitions={data.competitions} training={data.training} />;
      case "season":
        return <SeasonView competitions={data.competitions} training={data.training} plan={data.plan} />;
      case "plan":
        return (
          <PlanView
            entries={data.plan}
            onSave={upsertPlanEntry}
            onDelete={deletePlanEntry}
            onToggleDone={togglePlanEntryDone}
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
      case "profile":
        return <ProfileView user={activeUser} onSave={updateProfile} onNavigate={setActivePage} />;
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
