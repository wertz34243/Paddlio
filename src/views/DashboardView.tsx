import { APP_SLOGAN, APP_VERSION } from "../brand";
import {
  PaddlioOneButton,
  PaddlioOneCard,
  PaddlioOneMetricCard,
  PaddlioOnePageHeader,
  PaddlioOneStatusChip,
} from "../components/paddlio-one/PaddlioOneComponents";
import { getTrainingsForCurrentUser } from "../domain/accessControl";
import { getTrainingIntelligence } from "../domain/intelligence";
import { getLastTrainingSession, getNextPlannedEntry, getWeeklyPlanSummary } from "../domain/metrics";
import { getDisplayName, getGreeting, getInitials } from "../domain/profile";
import type { PaddleMotionData, PageId, SmartCoachRecommendation, User } from "../domain/types";
import { dateKeyToLocalDate, todayDateKey } from "../lib/dateOnly";

type DashboardViewProps = {
  data: PaddleMotionData;
  user: User;
  onNavigate: (page: PageId) => void;
  onOpenMoreSegment: (segment: DashboardMoreTarget) => void;
  onOpenSmartCoach: () => void;
  onUpdateRecommendation: (
    recommendation: SmartCoachRecommendation,
    updates: Partial<Pick<SmartCoachRecommendation, "status" | "note">>,
  ) => void;
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
  if (!date) return "Kein Termin";
  return dateKeyToLocalDate(date).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
};

const formatMinutes = (minutes: number): string => (minutes > 0 ? `${Math.round(minutes)} min` : "--");

const weekDayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

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
  const todayKey = todayDateKey();
  const todayEntries = scopedPlan.filter((entry) => entry.date === todayKey);
  const unreadDirect = data.directMessages.filter((item) => item.receiverId === user.userId && !item.isRead && !item.deletedAt).length;
  const openFeedback = scopedPlan.filter((entry) =>
    (entry.status === "done" || entry.status === "erledigt" || entry.status === "completed") &&
    !data.trainingFeedback.some((feedback) => feedback.trainingId === entry.id),
  ).length;
  const openTasks = data.taskAssignments.filter((item) => item.assignedTo === user.userId && item.status !== "done").length;
  const openTaskItems = data.taskAssignments
    .filter((item) => item.assignedTo === user.userId && item.status !== "done")
    .slice(0, 5)
    .map((assignment) => ({
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
  const weeklyMinutesByDay = weekDayLabels.map((_, index) =>
    weeklyPlan.entries
      .filter((entry) => {
        const day = dateKeyToLocalDate(entry.date).getDay();
        return (day === 0 ? 6 : day - 1) === index;
      })
      .reduce((sum, entry) => sum + entry.durationMinutes, 0),
  );
  const maxWeekMinutes = Math.max(60, ...weeklyMinutesByDay);
  const nextTitle = intelligence.todayTraining?.trainingType || nextTraining?.trainingType || nextTraining?.title || "Regeneration";
  const nextMeta = intelligence.todayTraining
    ? `${intelligence.todayTraining.time || "ohne Uhrzeit"} · ${intelligence.todayTraining.area}`
    : nextTraining
      ? `${formatDate(nextTraining.date)} · ${nextTraining.startTime || nextTraining.time || "ohne Uhrzeit"}`
      : "Heute ist kein Training geplant";
  const nextDescription =
    intelligence.todayTraining?.goal ||
    nextTraining?.goal ||
    nextTraining?.focus ||
    "Nutze den Tag bewusst: locker bewegen, erholen oder die nächste Einheit vorbereiten.";

  return (
    <div className="po-workspace-dashboard">
      <PaddlioOnePageHeader
        eyebrow={`${APP_VERSION} · ${todayText()}`}
        title={getGreeting(heroName)}
        description={APP_SLOGAN}
        action={
          <div className="po-user-badge" aria-label={`Aktiver Benutzer ${displayName}`}>
            {user.profile.profileImageDataUrl ? <img src={user.profile.profileImageDataUrl} alt="" /> : <span>{getInitials(user.profile)}</span>}
          </div>
        }
      />

      <section className="po-kpi-strip" aria-label="Tageskennzahlen">
        <PaddlioOneMetricCard label="Heute" value={todayEntries.length} detail="Trainings" icon="calendar" tone="primary" />
        <PaddlioOneMetricCard label="Feedback" value={openFeedback} detail="offen" icon="message" tone={openFeedback > 0 ? "warning" : "success"} />
        <PaddlioOneMetricCard label="Aufgaben" value={openTasks} detail="warten" icon="target" tone={openTasks > 0 ? "info" : "muted"} />
        <PaddlioOneMetricCard label="Nächstes" value={nextTraining?.startTime || nextTraining?.time || "--"} detail={nextTraining ? formatDate(nextTraining.date) : "frei"} icon="timer" />
      </section>

      <section className="po-dashboard-layout" aria-label="Trainingszentrale">
        <div className="po-dashboard-column">
          <PaddlioOneCard className="po-next-training" tone="primary">
            <div className="po-card-heading-row">
              <div>
                <p className="po-eyebrow">Nächstes Training</p>
                <h2>{nextTitle}</h2>
                <p>{nextMeta}</p>
              </div>
              <PaddlioOneStatusChip tone={nextTraining ? "info" : "muted"}>{nextTraining ? "geplant" : "frei"}</PaddlioOneStatusChip>
            </div>
            <p>{nextDescription}</p>
            <div className="po-training-meta-grid">
              <span>{nextTraining?.durationMinutes ? `${nextTraining.durationMinutes} min` : "Dauer offen"}</span>
              <span>{nextTraining?.boatClass || "Boot offen"}</span>
              <span>{nextTraining?.intensity || "locker"}</span>
            </div>
            <div className="po-action-row">
              <PaddlioOneButton variant="primary" icon="training" onClick={() => onNavigate("training")}>
                Training öffnen
              </PaddlioOneButton>
              <PaddlioOneButton variant="secondary" icon="message" onClick={() => onNavigate("communication")}>
                Feedback
              </PaddlioOneButton>
            </div>
          </PaddlioOneCard>

          <PaddlioOneCard className="po-quick-actions">
            <div className="po-card-heading-row">
              <div>
                <p className="po-eyebrow">Schnellaktionen</p>
                <h2>Direkt erledigen</h2>
              </div>
            </div>
            <div className="po-quick-action-grid">
              <PaddlioOneButton variant="secondary" icon="training" onClick={() => onQuickAction("training")}>Training</PaddlioOneButton>
              <PaddlioOneButton variant="secondary" icon="calendar" onClick={() => onNavigate("plan")}>Planen</PaddlioOneButton>
              <PaddlioOneButton variant="secondary" icon="message" onClick={() => onQuickAction("journal")}>Journal</PaddlioOneButton>
              <PaddlioOneButton variant="secondary" icon="boat" onClick={() => onQuickAction("material")}>Material</PaddlioOneButton>
            </div>
          </PaddlioOneCard>
        </div>

        <div className="po-dashboard-main">
          <PaddlioOneCard className="po-week-overview">
            <div className="po-card-heading-row">
              <div>
                <p className="po-eyebrow">Diese Woche</p>
                <h2>Wochenplan</h2>
              </div>
              <PaddlioOneStatusChip tone="primary">{weeklyPlan.completedCount}/{weeklyPlan.totalCount} erledigt</PaddlioOneStatusChip>
            </div>
            <div className="po-week-bars" aria-label="Trainingsminuten pro Wochentag">
              {weekDayLabels.map((label, index) => (
                <div className="po-week-bar" key={label}>
                  <span style={{ height: `${Math.max(8, (weeklyMinutesByDay[index] / maxWeekMinutes) * 100)}%` }} />
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <div className="po-week-list">
              {weeklyPlan.entries.slice(0, 7).map((entry) => (
                <button className="po-week-row" key={entry.id} type="button" onClick={() => onNavigate("plan")}>
                  <strong>{formatDate(entry.date)}</strong>
                  <span>{entry.title || entry.trainingType}</span>
                  <em>{entry.startTime || entry.time || "--"}</em>
                </button>
              ))}
              {weeklyPlan.entries.length === 0 ? <p className="po-muted">Noch keine Einheiten in dieser Woche.</p> : null}
            </div>
          </PaddlioOneCard>

          <PaddlioOneCard className="po-load-panel">
            <div className="po-card-heading-row">
              <div>
                <p className="po-eyebrow">Belastung</p>
                <h2>Aktueller Status</h2>
              </div>
              <PaddlioOneStatusChip tone={intelligence.athleteStatus.tone === "warning" ? "warning" : intelligence.athleteStatus.tone === "success" ? "success" : "info"}>
                {intelligence.athleteStatus.title}
              </PaddlioOneStatusChip>
            </div>
            <p>{intelligence.athleteStatus.detail}</p>
            <div className="po-load-grid">
              <span><strong>{formatMinutes(weeklyPlan.minutes)}</strong><small>durchgeführt</small></span>
              <span><strong>{lastTraining ? formatDate(lastTraining.date) : "--"}</strong><small>letzte Einheit</small></span>
              <span><strong>{polarAvgHr || "--"}</strong><small>Ø HF Polar</small></span>
              <span><strong>{formatMinutes(polarMinutes)}</strong><small>Polar-Zeit</small></span>
            </div>
          </PaddlioOneCard>
        </div>

        <div className="po-dashboard-side">
          <PaddlioOneCard>
            <div className="po-card-heading-row">
              <div>
                <p className="po-eyebrow">Rückmeldungen</p>
                <h2>{openFeedback > 0 ? `${openFeedback} offen` : "Alles aktuell"}</h2>
              </div>
              <PaddlioOneButton variant="ghost" icon="message" onClick={() => onNavigate("communication")}>Öffnen</PaddlioOneButton>
            </div>
          </PaddlioOneCard>

          <PaddlioOneCard className="po-compact-list">
            <div className="po-card-heading-row">
              <div>
                <p className="po-eyebrow">Aufgaben</p>
                <h2>Heute relevant</h2>
              </div>
              <PaddlioOneStatusChip tone={openTasks > 0 ? "warning" : "success"}>{openTasks}</PaddlioOneStatusChip>
            </div>
            {openTaskItems.length > 0 ? openTaskItems.map(({ assignment, task }) => (
              <button className="po-task-row" key={assignment.id} type="button" onClick={() => onNavigate("communication")}>
                <span>{task?.title || "Aufgabe"}</span>
                <em>{task?.dueDate ? formatDate(task.dueDate) : "offen"}</em>
              </button>
            )) : <p className="po-muted">Keine offenen Aufgaben.</p>}
          </PaddlioOneCard>

          <PaddlioOneCard className="po-compact-list">
            <div className="po-card-heading-row">
              <div>
                <p className="po-eyebrow">Nachrichten</p>
                <h2>{unreadDirect > 0 ? `${unreadDirect} ungelesen` : "Keine neuen"}</h2>
              </div>
              <PaddlioOneButton variant="ghost" icon="message" onClick={() => onNavigate("communication")}>Chat</PaddlioOneButton>
            </div>
            {latestMessages.length > 0 ? latestMessages.map((message) => (
              <button className="po-message-row" key={message.id} type="button" onClick={() => onNavigate("communication")}>
                <span>{message.senderId === user.userId ? "Du" : "Nachricht"}</span>
                <em>{message.message}</em>
              </button>
            )) : <p className="po-muted">Keine Nachrichten im Verlauf.</p>}
          </PaddlioOneCard>

          {isCoachLike ? (
            <PaddlioOneCard className="po-placeholder-card">
              <p className="po-eyebrow">Wetter</p>
              <h2>Platzhalter</h2>
              <p>Wetter, Wasserstand und Trainingsort werden später hier kompakt angezeigt.</p>
            </PaddlioOneCard>
          ) : null}

          <PaddlioOneCard className="po-placeholder-card">
            <p className="po-eyebrow">Smart Coach</p>
            <h2>Platzhalter</h2>
            <p>KI-Hinweise bleiben vorbereitet, blockieren aber keine Trainingsabläufe.</p>
          </PaddlioOneCard>
        </div>
      </section>

      <section className="po-dashboard-more-links" aria-label="Weitere Bereiche">
        <PaddlioOneButton variant="ghost" icon="bolt" onClick={() => onOpenMoreSegment("beta")}>Beta-Status</PaddlioOneButton>
        <PaddlioOneButton variant="ghost" icon="message" onClick={() => onOpenMoreSegment("feedback")}>Feedback senden</PaddlioOneButton>
        {isCoachLike ? <PaddlioOneButton variant="ghost" icon="club" onClick={() => onOpenMoreSegment("coach")}>Coach-Hub</PaddlioOneButton> : null}
        <PaddlioOneButton variant="ghost" icon="more" onClick={() => onOpenMoreSegment("notifications")}>Hinweise</PaddlioOneButton>
      </section>
    </div>
  );
}
