import { AppCard } from "../components/AppCard";
import { getSeasonGoalProgress } from "../domain/metrics";
import type { Competition, TrainingSession, User } from "../domain/types";

type GoalsViewProps = {
  user: User;
  competitions: Competition[];
  training: TrainingSession[];
};

export function GoalsView({ user, competitions, training }: GoalsViewProps) {
  const seasonGoals = getSeasonGoalProgress(competitions, training);
  const profileGoals = [
    {
      title: "Langfristiges Ziel",
      value: user.profile.longTermGoal || "Noch kein langfristiges Ziel eingetragen.",
    },
    {
      title: "Saisonziel",
      value: user.profile.seasonGoal || "Noch kein Saisonziel eingetragen.",
    },
    {
      title: "Persoenliche Notizen",
      value: user.profile.personalNotes || "Noch keine persoenlichen Notizen.",
    },
  ];

  return (
    <div className="stack">
      <section className="section-block intelligence-hero">
        <p className="eyebrow">Ziele</p>
        <h2>Woran du gerade arbeitest.</h2>
        <p>Persoenliche Ziele und Saisonfortschritt werden automatisch mit deinen Daten verbunden.</p>
      </section>

      <section className="season-goal-grid premium-goals">
        {seasonGoals.map((goal) => (
          <article className={`season-goal-card tone-${goal.tone}`} key={goal.id}>
            <div className="season-goal-topline">
              <strong>{goal.label}</strong>
              <b className={`goal-status ${goal.status.replace(" ", "-")}`}>{goal.status}</b>
            </div>
            <div className="season-goal-values">
              <span>
                Aktuell <b>{goal.valueLabel}</b>
              </span>
              <span>{goal.targetLabel}</span>
            </div>
            <div className="progress-track large">
              <span style={{ width: `${goal.progress}%` }} />
            </div>
            <small>{Math.round(goal.progress)}% Fortschritt</small>
          </article>
        ))}
      </section>

      <section className="dashboard-card-grid">
        {profileGoals.map((goal) => (
          <AppCard icon="target" key={goal.title} title={goal.title} value={goal.value} tone="accent" />
        ))}
      </section>
    </div>
  );
}
