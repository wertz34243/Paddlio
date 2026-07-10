import { useState, type FormEvent } from "react";
import { getGoalProgressList } from "../domain/goalProgress";
import type {
  Competition,
  SeasonGoal,
  SeasonGoalCategory,
  SeasonGoalDirection,
  SeasonGoalMetric,
  SeasonGoalPriority,
  SeasonGoalStatus,
  TrainingSession,
  User,
} from "../domain/types";

type GoalsViewProps = {
  user: User;
  goals: SeasonGoal[];
  competitions: Competition[];
  training: TrainingSession[];
  onSave: (goal: Omit<SeasonGoal, "id" | "athleteId" | "ownerUserId" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onDelete: (id: string) => void;
};

const categories: Array<{ value: SeasonGoalCategory; label: string }> = [
  { value: "performance", label: "Leistung" },
  { value: "training", label: "Training" },
  { value: "penalty", label: "Strafsekunden" },
  { value: "technical", label: "Technik" },
  { value: "personal", label: "Persönlich" },
];

const metrics: Array<{ value: SeasonGoalMetric; label: string; unit: string; direction: SeasonGoalDirection }> = [
  { value: "bestK1Total", label: "Beste K1-Gesamtzeit", unit: "s", direction: "under" },
  { value: "bestC1Total", label: "Beste C1-Gesamtzeit", unit: "s", direction: "under" },
  { value: "averagePenalty", label: "Strafschnitt", unit: "s", direction: "under" },
  { value: "trainingCount", label: "Trainingseinheiten", unit: "Einheiten", direction: "over" },
  { value: "trainingMinutes", label: "Trainingsminuten", unit: "min", direction: "over" },
  { value: "manual", label: "Manuell", unit: "", direction: "over" },
];

const statuses: Array<{ value: SeasonGoalStatus; label: string }> = [
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pausiert" },
  { value: "achieved", label: "Erreicht" },
  { value: "archived", label: "Archiviert" },
];

const priorities: Array<{ value: SeasonGoalPriority; label: string }> = [
  { value: "high", label: "Hoch" },
  { value: "medium", label: "Mittel" },
  { value: "low", label: "Niedrig" },
];

const todayKey = (): string => new Date().toISOString().slice(0, 10);

const getDefaultDueDate = (): string => {
  const date = new Date();
  date.setMonth(11, 31);
  return date.toISOString().slice(0, 10);
};

const getMetricDefaults = (metric: SeasonGoalMetric) =>
  metrics.find((item) => item.value === metric) ?? metrics[5];

export function GoalsView({ user, goals, competitions, training, onSave, onDelete }: GoalsViewProps) {
  const [editingGoal, setEditingGoal] = useState<SeasonGoal | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<SeasonGoalMetric>("bestK1Total");
  const [message, setMessage] = useState("");
  const progressList = getGoalProgressList(goals, competitions, training);
  const activeGoals = progressList.filter((item) => item.goal.status !== "archived");
  const archivedGoals = progressList.filter((item) => item.goal.status === "archived");
  const defaults = editingGoal ? getMetricDefaults(editingGoal.metric) : getMetricDefaults(selectedMetric);

  const resetForm = () => {
    setEditingGoal(null);
    setSelectedMetric("bestK1Total");
  };

  const saveGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const metric = String(formData.get("metric") ?? "manual") as SeasonGoalMetric;
    const metricDefaults = getMetricDefaults(metric);
    const title = String(formData.get("title") ?? "").trim();
    const targetValue = Number(formData.get("targetValue") ?? 0);

    if (!title || targetValue <= 0) {
      setMessage("Bitte gib Titel und Zielwert an.");
      return;
    }

    onSave({
      id: editingGoal?.id,
      assignedByUserId: editingGoal?.assignedByUserId ?? user.userId,
      title,
      description: String(formData.get("description") ?? "").trim(),
      category: String(formData.get("category") ?? "personal") as SeasonGoalCategory,
      metric,
      direction: String(formData.get("direction") ?? metricDefaults.direction) as SeasonGoalDirection,
      targetValue,
      unit: String(formData.get("unit") ?? metricDefaults.unit).trim(),
      startDate: String(formData.get("startDate") ?? todayKey()),
      dueDate: String(formData.get("dueDate") ?? ""),
      status: String(formData.get("status") ?? "active") as SeasonGoalStatus,
      priority: String(formData.get("priority") ?? "medium") as SeasonGoalPriority,
      currentValueOverride: formData.get("currentValueOverride") === "" ? "" : Number(formData.get("currentValueOverride") ?? 0),
      coachNote: String(formData.get("coachNote") ?? "").trim(),
      athleteNote: String(formData.get("athleteNote") ?? "").trim(),
    });
    setMessage(editingGoal ? "Ziel aktualisiert" : "Ziel erstellt");
    event.currentTarget.reset();
    resetForm();
  };

  const startEditing = (goal: SeasonGoal) => {
    setEditingGoal(goal);
    setSelectedMetric(goal.metric);
    setMessage("");
  };

  return (
    <div className="stack">
      <section className="section-block intelligence-hero">
        <p className="eyebrow">Ziele 2.3</p>
        <h2>Individuelle Saisonziele</h2>
        <p>Erstelle eigene Ziele, verfolge den Fortschritt automatisch und bereite die Zusammenarbeit mit deinem Trainer vor.</p>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{editingGoal ? "Ziel bearbeiten" : "Neues Ziel"}</p>
            <h3>{editingGoal?.title ?? "Saisonziel erstellen"}</h3>
          </div>
          {editingGoal ? <button type="button" onClick={resetForm}>Abbrechen</button> : null}
        </div>
        <form className="entry-form" key={editingGoal?.id ?? "new-goal"} onSubmit={saveGoal}>
          <div className="form-grid">
            <label>
              Titel
              <input name="title" defaultValue={editingGoal?.title ?? ""} placeholder="z. B. K1 unter 88 Sekunden" required />
            </label>
            <label>
              Kategorie
              <select name="category" defaultValue={editingGoal?.category ?? "performance"}>
                {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </label>
            <label>
              Messwert
              <select
                name="metric"
                value={selectedMetric}
                onChange={(event) => setSelectedMetric(event.target.value as SeasonGoalMetric)}
              >
                {metrics.map((metric) => <option key={metric.value} value={metric.value}>{metric.label}</option>)}
              </select>
            </label>
            <label>
              Zielrichtung
              <select name="direction" defaultValue={editingGoal?.direction ?? defaults.direction}>
                <option value="under">unter Zielwert</option>
                <option value="over">mindestens Zielwert</option>
                <option value="equal">genau Zielwert</option>
              </select>
            </label>
            <label>
              Zielwert
              <input name="targetValue" type="number" min="0" step="0.01" defaultValue={editingGoal?.targetValue ?? ""} required />
            </label>
            <label>
              Einheit
              <input name="unit" defaultValue={editingGoal?.unit ?? defaults.unit} placeholder="s, min, Einheiten" />
            </label>
            <label>
              Start
              <input name="startDate" type="date" defaultValue={editingGoal?.startDate ?? todayKey()} />
            </label>
            <label>
              Zieltermin
              <input name="dueDate" type="date" defaultValue={editingGoal?.dueDate || getDefaultDueDate()} />
            </label>
            <label>
              Status
              <select name="status" defaultValue={editingGoal?.status ?? "active"}>
                {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
            <label>
              Priorität
              <select name="priority" defaultValue={editingGoal?.priority ?? "medium"}>
                {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
              </select>
            </label>
            <label>
              Manueller Ist-Wert
              <input name="currentValueOverride" type="number" step="0.01" defaultValue={editingGoal?.currentValueOverride ?? ""} placeholder="optional" />
            </label>
          </div>
          <label>
            Beschreibung
            <textarea name="description" defaultValue={editingGoal?.description ?? ""} rows={3} />
          </label>
          <label>
            Athletennotiz
            <textarea name="athleteNote" defaultValue={editingGoal?.athleteNote ?? ""} rows={3} />
          </label>
          <label>
            Trainernotiz
            <textarea name="coachNote" defaultValue={editingGoal?.coachNote ?? ""} rows={3} placeholder="Für Coach-Kommentare vorbereitet" />
          </label>
          <button className="save-button" type="submit">{editingGoal ? "Ziel speichern" : "Ziel erstellen"}</button>
          {message ? <p className="auth-message">{message}</p> : null}
        </form>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Aktive Entwicklung</p>
            <h3>{activeGoals.length} aktive Ziele</h3>
          </div>
        </div>
        <div className="season-goal-grid premium-goals">
          {activeGoals.length > 0 ? activeGoals.map(({ goal, currentLabel, targetLabel, progress, statusLabel }) => (
            <article className={`season-goal-card tone-${goal.category === "penalty" ? "penalty" : goal.category === "training" ? "training" : goal.metric === "bestC1Total" ? "c1" : "k1"}`} key={goal.id}>
              <div className="season-goal-topline">
                <strong>{goal.title}</strong>
                <b className={`goal-status ${statusLabel.replace(" ", "-")}`}>{statusLabel}</b>
              </div>
              <p>{goal.description || "Kein Beschreibungstext."}</p>
              <div className="season-goal-values">
                <span>Aktuell <b>{currentLabel}</b></span>
                <span>Ziel: {targetLabel}</span>
              </div>
              <div className="progress-track large">
                <span style={{ width: `${progress}%` }} />
              </div>
              <small>{Math.round(progress)}% Fortschritt - {goal.priority} - bis {goal.dueDate || "offen"}</small>
              {goal.coachNote ? <p className="card-note">Coach: {goal.coachNote}</p> : null}
              {goal.athleteNote ? <p className="card-note">Notiz: {goal.athleteNote}</p> : null}
              <div className="card-actions">
                <button type="button" onClick={() => startEditing(goal)} aria-label={`Ziel ${goal.title} bearbeiten`}>Bearbeiten</button>
                <button type="button" onClick={() => onDelete(goal.id)} aria-label={`Ziel ${goal.title} löschen`}>Löschen</button>
              </div>
            </article>
          )) : <p className="empty-state">Noch keine individuellen Ziele. Erstelle dein erstes Saisonziel oben.</p>}
        </div>
      </section>

      {archivedGoals.length > 0 ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Archiv</p>
              <h3>Abgeschlossene Ziele</h3>
            </div>
          </div>
          <div className="result-list">
            {archivedGoals.map(({ goal, currentLabel, targetLabel }) => (
              <article className="summary-strip" key={goal.id}>
                <span>{goal.title}</span>
                <span>{currentLabel}</span>
                <span>{targetLabel}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
