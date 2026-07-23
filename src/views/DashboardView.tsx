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

const formatEntryTime = (time?: string): string => time || "ohne Uhrzeit";

const formatMinutes = (minutes: number): string =>
  minutes > 0 ? `${Math.round(minutes)} min` : "--";

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
  const currentWeekEntries = weeklyPlan.entries.slice(0, 7);
  const unreadDirect = data.directMessages.filter((item) => item.receiverId === user.userId && !item.isRead && !item.deletedAt).length;
  const openFeedback = scopedPlan.filter((entry) =>
    (entry.status === "done" || entry.status === "erledigt" || entry.status === "completed") &&
    !data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id),
  ).length;
  const openTasks = data.taskAssignments.filter((item) => item.assignedTo === user.userId && item.status !== "done").length;
  const openAssignments = data.taskAssignments
    .filter((item) => item.assignedTo === user.userId && item.status !== "done")
    .slice(0, 5);
  const openTaskItems = openAssignments.map((assignment) => ({
    assignment,
    task: data.tasks.find((item) => item.id === assignment.taskId),
  }));
  const latestMessages = data.directMessages
    .filter((item) => (item.senderId === user.userId || item.receiverId === user.userId) && !item.deletedAt)
    .slice(-4)
    .reverse();
  const polarSessions = data.externalTrainingSessions.filter((item) => item.provider === "polar");
  const polarMinutes = polarSessions.reduce((sum, session) => sum + session.durationSeconds / 60, 0);
  const polarAvgHrValues = polarSessions.map((session) => session.avgHeartRate).filter((value) => value > 0);
  const polarAvgHr = polarAvgHrValues.length > 0
    ? Math.round(polarAvgHrValues.reduce((sum, value) => sum + value, 0) / polarAvgHrValues.length)
    : 0;
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
    <div className="stack intelligence-dashboard home-v5 paddlio-work-dashboard">
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

      <section className="dashboard-work-grid" aria-label="Arbeitsübersicht">
        <article className="section-block dashboard-work-panel dashboard-work-panel-wide">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Wochenplan</p>
              <h2>Diese Woche</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => onNavigate("plan")}>
              Kalender
            </button>
          </div>
          <div className="dashboard-week-list">
            {currentWeekEntries.length > 0 ? currentWeekEntries.map((entry) => (
              <button className="dashboard-week-row" type="button" key={entry.id} onClick={() => onNavigate("plan")}>
                <span>
                  <strong>{formatDate(entry.date)}</strong>
                  <small>{formatEntryTime(entry.startTime || entry.time)} · {formatMinutes(entry.durationMinutes)}</small>
                </span>
                <span>
                  <strong>{entry.title || entry.trainingType}</strong>
                  <small>{entry.focus || entry.goal || "Training"}</small>
                </span>
                <em>{entry.status || "geplant"}</em>
              </button>
            )) : (
              <p className="empty-state compact">Noch keine Einheiten für diese Woche geplant.</p>
            )}
          </div>
        </article>

        <article className="section-block dashboard-work-panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Polar</p>
              <h2>Belastung</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => onNavigate("analysis")}>
              Analyse
            </button>
          </div>
          <div className="dashboard-mini-metrics">
            <div>
              <span>Einheiten</span>
              <strong>{polarSessions.length}</strong>
            </div>
            <div>
              <span>Zeit</span>
              <strong>{formatMinutes(polarMinutes)}</strong>
            </div>
            <div>
              <span>Ø HF</span>
              <strong>{polarAvgHr > 0 ? polarAvgHr : "--"}</strong>
            </div>
            <div>
              <span>Quote</span>
              <strong>{intelligence.trainingQuote}%</strong>
            </div>
          </div>
        </article>

        <article className="section-block dashboard-work-panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Aufgaben</p>
              <h2>Offen</h2>
            </div>
            <strong>{openTasks}</strong>
          </div>
          <div className="dashboard-task-list">
            {openTaskItems.length > 0 ? openTaskItems.map(({ assignment, task }) => (
              <button className="dashboard-task-row" type="button" key={assignment.id} onClick={() => onOpenMoreSegment("coach")}>
                <span>
                  <strong>{task?.title || "Aufgabe"}</strong>
                  <small>{task?.dueDate ? formatDate(task.dueDate) : "ohne Fälligkeit"}</small>
                </span>
                <em>{assignment.status}</em>
              </button>
            )) : (
              <p className="empty-state compact">Keine offenen Aufgaben.</p>
            )}
          </div>
        </article>

        <article className="section-block dashboard-work-panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Nachrichten</p>
              <h2>Team</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => onNavigate("communication")}>
              Öffnen
            </button>
          </div>
          <div className="dashboard-message-list">
            {latestMessages.length > 0 ? latestMessages.map((message) => (
              <button className="dashboard-message-row" type="button" key={message.id} onClick={() => onNavigate("communication")}>
                <span>
                  <strong>{message.senderId === user.userId ? "Gesendet" : "Neu"}</strong>
                  <small>{message.message}</small>
                </span>
                {!message.isRead && message.receiverId === user.userId ? <em>ungelesen</em> : null}
              </button>
            )) : (
              <p className="empty-state compact">Keine neuen Nachrichten.</p>
            )}
          </div>
        </article>

        <article className="section-block dashboard-work-panel dashboard-quick-panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Schnellzugriff</p>
              <h2>Aktionen</h2>
            </div>
          </div>
          <div className="dashboard-quick-actions">
            <button type="button" onClick={() => onQuickAction("training")}>Training hinzufügen</button>
            <button type="button" onClick={() => onNavigate("plan")}>Woche planen</button>
            <button type="button" onClick={() => onNavigate("training")}>Vorlagen nutzen</button>
            <button type="button" onClick={() => onNavigate("communication")}>Rückmeldungen</button>
          </div>
        </article>
      </section>
    </div>
  );
}


