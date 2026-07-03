import type { CSSProperties } from "react";
import { APP_SLOGAN } from "../brand";
import { AppCard } from "../components/AppCard";
import {
  formatSeconds,
  getBestTotalTime,
  getLastCompetition,
  getLastTrainingSession,
  getNextPlannedEntry,
  getWeeklyPlanSummary,
} from "../domain/metrics";
import { getGoalProgressList } from "../domain/goalProgress";
import { getGoalsForCurrentUser, getTrainingsForCurrentUser } from "../domain/accessControl";
import { getDisplayName, getGreeting, getInitials } from "../domain/profile";
import { getAthleteRecords } from "../domain/records";
import { getTrainingIntelligence } from "../domain/intelligence";
import type { Competition, PaddleMotionData, PageId, SmartCoachRecommendation, User } from "../domain/types";
import { SmartCoachView } from "./SmartCoachView";

type DashboardViewProps = {
  data: PaddleMotionData;
  user: User;
  onNavigate: (page: PageId) => void;
  onOpenSmartCoach: () => void;
  onUpdateRecommendation: (recommendation: SmartCoachRecommendation, updates: Partial<Pick<SmartCoachRecommendation, "status" | "note">>) => void;
  onQuickAction: (action: DashboardQuickAction) => void;
};

export type DashboardQuickAction = "training" | "competition" | "journal" | "material";

const todayText = (): string =>
  `Heute ist ${new Date().toLocaleDateString("de-DE", { weekday: "long" })}.`;

const getNextCompetition = (competitions: Competition[]): Competition | undefined => {
  const today = new Date().toISOString().slice(0, 10);
  return [...competitions].filter((competition) => competition.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
};

const getDaysUntil = (date?: string): number | undefined => {
  if (!date) {
    return undefined;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000));
};

export function DashboardView({ data, user, onNavigate, onOpenSmartCoach, onUpdateRecommendation, onQuickAction }: DashboardViewProps) {
  const displayName = getDisplayName(user.profile);
  const scopedPlan = getTrainingsForCurrentUser(data, user);
  const scopedGoals = getGoalsForCurrentUser(data, user);
  const intelligence = getTrainingIntelligence(data.competitions, data.training, scopedPlan, data.journal);
  const records = getAthleteRecords(data.competitions, data.training);
  const nextCompetition = getNextCompetition(data.competitions);
  const lastCompetition = getLastCompetition(data.competitions);
  const lastTraining = getLastTrainingSession(data.training);
  const seasonGoals = getGoalProgressList(scopedGoals, data.competitions, data.training).filter((goal) => goal.goal.status !== "archived");
  const nextTraining = getNextPlannedEntry(scopedPlan);
  const weeklyPlan = getWeeklyPlanSummary(scopedPlan);
  const openFeedback = scopedPlan.filter((entry) =>
    (entry.status === "done" || entry.status === "erledigt") &&
    !data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id),
  ).length;
  const daysUntilRace = getDaysUntil(nextCompetition?.date);
  const raceRing = daysUntilRace === undefined ? 0 : Math.max(8, Math.min(100, 100 - daysUntilRace * 3));

  return (
    <div className="stack intelligence-dashboard">
      <section className="home-profile-card premium-hero intelligence-welcome">
        <div className="home-avatar">
          {user.profile.profileImageDataUrl ? (
            <img src={user.profile.profileImageDataUrl} alt="" />
          ) : (
            getInitials(user.profile)
          )}
        </div>
        <div>
          <p className="eyebrow">{todayText()}</p>
          <h2>{getGreeting(displayName)}</h2>
          <p className="hero-slogan">{APP_SLOGAN}</p>
        </div>
      </section>

      <section className="daily-motivation">
        <span>Motivation des Tages</span>
        <p>{intelligence.motivation}</p>
      </section>

      <section className="today-training-card">
        <div>
          <p className="eyebrow">Heute trainieren</p>
          <h3>{intelligence.todayTraining?.trainingType ?? "Regeneration"}</h3>
          <span>
            {intelligence.todayTraining
              ? `${intelligence.todayTraining.time || "ohne Uhrzeit"} - ${intelligence.todayTraining.goal || intelligence.todayTraining.area}`
              : "Kein Training geplant. Nutze den Tag bewusst fuer Erholung oder eine lockere Einheit."}
          </span>
        </div>
        <button className="save-button" type="button" onClick={() => onQuickAction("training")}>
          Training eintragen
        </button>
      </section>

      <section className="dashboard-card-grid">
        <AppCard
          icon="training"
          title="Heute trainieren"
          subtitle={intelligence.todayTraining ? `${intelligence.todayTraining.time} - ${intelligence.todayTraining.area}` : "Regeneration"}
          value={intelligence.todayTraining?.trainingType ?? "Pause"}
          tone={intelligence.todayTraining ? "primary" : "success"}
        >
          <div className="smart-detail-grid">
            <span>Ziel: {intelligence.todayTraining?.goal || "Geniesse heute deine Regeneration."}</span>
            <span>Intensitaet: {intelligence.todayTraining?.intensity ?? "locker"}</span>
          </div>
        </AppCard>

        <AppCard icon="bolt" title="Trainingsserie" subtitle="Konstanz" value={`${intelligence.currentStreak} Tage`} tone="success">
          <div className="smart-detail-grid">
            <span>Laengste Serie: {intelligence.longestStreak} Tage</span>
            <span>Trainingsquote: {intelligence.trainingQuote}%</span>
          </div>
          <div className="progress-track large">
            <span style={{ width: `${intelligence.trainingQuote}%` }} />
          </div>
        </AppCard>

        <AppCard
          icon="training"
          title="Naechstes Training"
          subtitle={nextTraining ? `${nextTraining.date} - ${nextTraining.startTime || nextTraining.time || "ohne Uhrzeit"}` : "Noch kein Training geplant"}
          value={nextTraining?.title || nextTraining?.trainingType || "Planen"}
          tone="primary"
        >
          <div className="smart-detail-grid">
            <span>{weeklyPlan.completedCount} erledigt diese Woche</span>
            <span>{weeklyPlan.minutes} Trainingsminuten</span>
            {user.role === "coach" || user.role === "teamAdmin" || user.role === "admin" ? <span>{openFeedback} offene Rueckmeldungen</span> : null}
          </div>
        </AppCard>

        <AppCard
          icon="trophy"
          title="Countdown"
          subtitle={nextCompetition ? `${nextCompetition.location} - ${nextCompetition.boatClass}` : "Naechster Wettkampf"}
          value={daysUntilRace === undefined ? "Kein Termin" : `${daysUntilRace} Tage`}
          tone="warning"
        >
          <div className="countdown-ring" style={{ "--ring-value": `${raceRing}%` } as CSSProperties}>
            <span>{daysUntilRace === undefined ? "--" : daysUntilRace}</span>
          </div>
        </AppCard>

        <AppCard
          icon="target"
          title="Athletenstatus"
          subtitle="Automatisch berechnet"
          value={intelligence.athleteStatus.title}
          tone={intelligence.athleteStatus.tone}
        >
          <p className="card-note">{intelligence.athleteStatus.detail}</p>
        </AppCard>
      </section>

      <section className="section-block smart-coach-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Saisonziele</p>
            <h3>Dein Fortschritt</h3>
          </div>
        </div>
        <div className="goal-card-grid">
          {seasonGoals.length > 0 ? seasonGoals.slice(0, 4).map(({ goal, currentLabel, progress, statusLabel }) => (
            <article className={`goal-mini-card tone-${goal.category === "training" ? "training" : goal.category === "penalty" ? "penalty" : goal.metric === "bestC1Total" ? "c1" : "k1"}`} key={goal.id}>
              <div>
                <strong>{goal.title}</strong>
                <span>{currentLabel}</span>
              </div>
              <b>{statusLabel}</b>
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
            </article>
          )) : (
            <article className="goal-mini-card tone-training">
              <div>
                <strong>Noch keine Saisonziele</strong>
                <span>Erstelle dein erstes Ziel im Bereich Ziele.</span>
              </div>
              <button type="button" onClick={() => onNavigate("goals")}>Ziele oeffnen</button>
            </article>
          )}
        </div>
      </section>

      <section className="quick-actions">
        <button type="button" onClick={() => onQuickAction("training")}>
          Training eintragen
        </button>
        <button type="button" onClick={() => onQuickAction("competition")}>
          Wettkampf eintragen
        </button>
        <button type="button" onClick={() => onQuickAction("journal")}>
          Journal ausfuellen
        </button>
        <button type="button" onClick={() => onQuickAction("material")}>
          Material pruefen
        </button>
      </section>

      <SmartCoachView
        data={data}
        user={user}
        compact
        onOpenDetails={onOpenSmartCoach}
        onUpdateRecommendation={onUpdateRecommendation}
      />

      <section className="dashboard-card-grid">
        <AppCard icon="target" title="Persoenliche Rekorde" subtitle="Automatisch erkannt" value={records.k1Best} tone="k1">
          <button className="ghost-button wide" type="button" onClick={() => onNavigate("records")}>
            Alle Rekorde
          </button>
        </AppCard>

        <AppCard
          icon="chart"
          title="Saisonuebersicht"
          subtitle="Monate und Belastung"
          value={`${data.training.length} Trainings`}
          tone="secondary"
        >
          <button className="ghost-button wide" type="button" onClick={() => onNavigate("season")}>
            Saison ansehen
          </button>
        </AppCard>

        <AppCard
          icon="trophy"
          title="Letzter Wettkampf"
          subtitle={lastCompetition ? `${lastCompetition.location} - ${lastCompetition.boatClass}` : "Noch kein Rennen"}
          value={lastCompetition ? `${formatSeconds(getBestTotalTime(lastCompetition))} s` : "--"}
          tone="warning"
        />

        <AppCard
          icon="training"
          title="Letzter Trainingseintrag"
          subtitle={lastTraining ? new Date(lastTraining.date).toLocaleDateString("de-DE") : "Noch kein Training"}
          value={lastTraining ? `${lastTraining.durationMinutes} min` : "--"}
          tone="success"
        >
          <p className="card-note">{lastTraining?.focus || "Dokumentiere deine erste Einheit."}</p>
        </AppCard>

        <AppCard icon="boat" title="Wetter Vorbereitung" subtitle="Demnaechst" value="Bereit" tone="accent">
          <div className="weather-placeholder">
            <span>Temperatur</span>
            <span>Wind</span>
            <span>Regen</span>
            <span>Wasserstand</span>
          </div>
        </AppCard>
      </section>
    </div>
  );
}
