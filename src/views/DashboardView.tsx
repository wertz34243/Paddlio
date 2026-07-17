import { APP_SLOGAN, APP_VERSION } from "../brand";
import { AppCard } from "../components/AppCard";
import { getTrainingsForCurrentUser } from "../domain/accessControl";
import { getTrainingIntelligence } from "../domain/intelligence";
import { getLastTrainingSession, getNextPlannedEntry, getWeeklyPlanSummary } from "../domain/metrics";
import { getDisplayName, getGreeting, getInitials } from "../domain/profile";
import type { PaddleMotionData, PageId, SmartCoachRecommendation, User } from "../domain/types";
import { dateKeyToLocalDate } from "../lib/dateOnly";

type DashboardViewProps = {
  data: PaddleMotionData;
  user: User;
  onNavigate: (page: PageId) => void;
  onOpenMoreSegment: (segment: DashboardMoreTarget) => void;
  onOpenSmartCoach: () => void;
  onUpdateRecommendation: (recommendation: SmartCoachRecommendation, updates: Partial<Pick<SmartCoachRecommendation, "status" | "note">>) => void;
  onQuickAction: (action: DashboardQuickAction) => void;
};

export type DashboardQuickAction = "training" | "competition" | "journal" | "material";
export type DashboardMoreTarget = "beta" | "feedback" | "coach" | "notifications";

const todayText = (): string =>
  new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

const formatDate = (date?: string): string => {
  if (!date) {
    return "Noch keine Einheit";
  }

  return dateKeyToLocalDate(date).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
};

export function DashboardView({
  data,
  user,
  onNavigate,
  onOpenMoreSegment,
  onQuickAction,
}: DashboardViewProps) {
  const displayName = getDisplayName(user.profile);
  const isAdmin = user.role === "admin";
  const isCoachLike = user.role === "coach" || user.role === "teamAdmin" || user.role === "clubAdmin" || user.role === "admin";
  const heroName = isAdmin ? "Admin" : displayName.includes("@") ? "Sportler" : displayName;
  const scopedPlan = getTrainingsForCurrentUser(data, user);
  const intelligence = getTrainingIntelligence(data.competitions, data.training, scopedPlan, data.journal);
  const nextTraining = getNextPlannedEntry(scopedPlan);
  const weeklyPlan = getWeeklyPlanSummary(scopedPlan);
  const lastTraining = getLastTrainingSession(data.training);
  const unreadDirect = data.directMessages.filter((item) => item.receiverId === user.userId && !item.isRead && !item.deletedAt).length;
  const openFeedback = scopedPlan.filter((entry) =>
    (entry.status === "done" || entry.status === "erledigt" || entry.status === "completed") &&
    !data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id),
  ).length;
  const openTasks = data.taskAssignments.filter((item) => item.assignedTo === user.userId && item.status !== "done").length;
  const nextTitle = intelligence.todayTraining?.trainingType || nextTraining?.trainingType || nextTraining?.title || "Regeneration";
  const nextMeta = intelligence.todayTraining
    ? `${intelligence.todayTraining.time || "ohne Uhrzeit"} · ${intelligence.todayTraining.area}`
    : nextTraining
      ? `${formatDate(nextTraining.date)} · ${nextTraining.startTime || nextTraining.time || "ohne Uhrzeit"}`
      : "Kein Training geplant";
  const nextDescription = intelligence.todayTraining?.goal || nextTraining?.goal || nextTraining?.focus || "Nutze den Tag bewusst für Erholung oder eine lockere Einheit.";
  const trainerMessageText = unreadDirect > 0
    ? `${unreadDirect} neue Nachricht${unreadDirect === 1 ? "" : "en"}`
    : "Keine neuen Nachrichten";
  const feedbackText = openFeedback > 0
    ? `${openFeedback} Rückmeldung${openFeedback === 1 ? "" : "en"} offen`
    : "Alles aktuell";

  return (
    <div className="stack intelligence-dashboard home-v5">
      <section className="home-v5-hero" aria-labelledby="today-title">
        <div className="home-avatar">
          {user.profile.profileImageDataUrl ? (
            <img src={user.profile.profileImageDataUrl} alt="" />
          ) : (
            getInitials(user.profile)
          )}
        </div>
        <div>
          <p className="eyebrow">{todayText()}</p>
          <h1 id="today-title">Heute</h1>
          <p className="home-welcome-line">{isAdmin ? "Hallo Admin" : getGreeting(heroName)}</p>
          <p className="hero-slogan">{APP_SLOGAN}</p>
          <p className="muted">Version {APP_VERSION}</p>
        </div>
      </section>

      <section className="home-v5-training" aria-labelledby="today-training-title">
        <div>
          <p className="eyebrow">Heute trainieren</p>
          <h2 id="today-training-title">{nextTitle}</h2>
          <p>{nextMeta}</p>
          <span>{nextDescription}</span>
        </div>
        <button
          className="save-button"
          type="button"
          onClick={() => onQuickAction("training")}
          aria-label={isCoachLike ? "Neue Trainingseinheit planen" : "Training für heute starten oder eintragen"}
        >
          {isCoachLike ? "Training planen" : "Training starten"}
        </button>
      </section>

      <section className="home-v5-section" aria-labelledby="weekly-goal-title">
        <div className="section-heading simple">
          <div>
            <p className="eyebrow">Wochenziel</p>
            <h2 id="weekly-goal-title">Dein Fortschritt</h2>
          </div>
          <strong>{weeklyPlan.completedCount}/{Math.max(weeklyPlan.completedCount, scopedPlan.length || 1)}</strong>
        </div>
        <div className="progress-track large">
          <span style={{ width: `${Math.min(100, Math.max(8, intelligence.trainingQuote))}%` }} />
        </div>
        <p className="muted">{weeklyPlan.minutes} Minuten · {intelligence.trainingQuote}% Trainingsquote</p>
      </section>

      <section className="dashboard-card-grid home-v5-metrics" aria-label="Wichtige Informationen">
        <AppCard
          icon="training"
          title="Letzte Einheit"
          subtitle={formatDate(lastTraining?.date)}
          value={lastTraining ? `${lastTraining.durationMinutes} min` : "--"}
          tone="primary"
        >
          <p className="card-note">{lastTraining?.focus || "Noch kein Training dokumentiert."}</p>
        </AppCard>

        <AppCard
          icon="message"
          title="Trainer Nachrichten"
          subtitle="Team"
          value={trainerMessageText}
          tone="accent"
        >
          <button className="ghost-button wide" type="button" onClick={() => onNavigate("communication")} aria-label="Trainer Nachrichten im Team-Bereich öffnen">
            Öffnen
          </button>
        </AppCard>

        <AppCard
          icon="target"
          title="Feedback"
          subtitle={`${openTasks} Aufgaben offen`}
          value={feedbackText}
          tone={openFeedback > 0 || openTasks > 0 ? "warning" : "success"}
        >
          <button
            className="ghost-button wide"
            type="button"
            onClick={() => isAdmin ? onOpenMoreSegment("feedback") : onNavigate("training")}
            aria-label={isAdmin ? "Beta Feedback prüfen" : "Trainingsfeedback öffnen"}
          >
            Prüfen
          </button>
        </AppCard>
      </section>
    </div>
  );
}
