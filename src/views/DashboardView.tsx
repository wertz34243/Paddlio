import type { CSSProperties } from "react";
import { APP_SLOGAN } from "../brand";
import { AppCard } from "../components/AppCard";
import { formatSeconds, getBestTotalTime, getLastCompetition } from "../domain/metrics";
import { getDisplayName, getGreeting, getInitials } from "../domain/profile";
import { getAthleteRecords } from "../domain/records";
import { getTrainingIntelligence } from "../domain/intelligence";
import type { Competition, PaddleMotionData, PageId, User } from "../domain/types";

type DashboardViewProps = {
  data: PaddleMotionData;
  user: User;
  onNavigate: (page: PageId) => void;
};

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

export function DashboardView({ data, user, onNavigate }: DashboardViewProps) {
  const displayName = getDisplayName(user.profile);
  const intelligence = getTrainingIntelligence(data.competitions, data.training, data.plan, data.journal);
  const records = getAthleteRecords(data.competitions, data.training);
  const nextCompetition = getNextCompetition(data.competitions);
  const lastCompetition = getLastCompetition(data.competitions);
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
          <h2>{getGreeting(displayName)} 👋</h2>
          <p className="hero-slogan">{APP_SLOGAN}</p>
        </div>
      </section>

      <section className="daily-motivation">
        <p>{intelligence.motivation}</p>
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
            <p className="eyebrow">{intelligence.coachAdvice.title}</p>
            <h3>{intelligence.coachAdvice.recommendation}</h3>
          </div>
        </div>
        <p>{intelligence.coachAdvice.reason}</p>
      </section>

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
