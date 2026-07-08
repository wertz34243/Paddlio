import { useMemo, useState } from "react";
import {
  formatSeconds,
  getAveragePenalty,
  getBestTotalTime,
  getBoatClassDifferences,
  getBoatClassStats,
  getIntensityDistribution,
  getTrainingAreaDistribution,
} from "../domain/metrics";
import { getGoalProgressList } from "../domain/goalProgress";
import { isDoneStatus, isPlannedStatus, isSkippedStatus } from "../domain/trainingPlan";
import type { PaddleMotionData, PlanEntry, User } from "../domain/types";

export type AnalyticsMode = "overview" | "training" | "competition" | "goals" | "load" | "coach" | "admin";

type AnalyticsCenterViewProps = {
  data: PaddleMotionData;
  user: User;
  mode: AnalyticsMode;
  onNavigate?: (target: "training" | "competition" | "goals") => void;
};

type RangeKey = "7" | "30" | "90" | "season" | "year" | "custom";

const startOfYear = (): string => `${new Date().getFullYear()}-01-01`;
const todayKey = (): string => new Date().toISOString().slice(0, 10);

const addDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const inRange = (date: string, start: string, end: string): boolean => date >= start && date <= end;

const monthKey = (date: string): string => date.slice(0, 7);

const getRangeStart = (range: RangeKey, customStart: string): string => {
  if (range === "7") return addDays(-6);
  if (range === "30") return addDays(-29);
  if (range === "90") return addDays(-89);
  if (range === "year" || range === "season") return startOfYear();
  return customStart || addDays(-29);
};

const calcMinutes = (entries: PlanEntry[]): number =>
  entries.filter((entry) => isDoneStatus(entry.status)).reduce((sum, entry) => sum + entry.durationMinutes, 0);

const loadTone = (score: number): { label: string; advice: string } => {
  if (score >= 85) return { label: "sehr hoch", advice: "Regeneration sinnvoll. Viele harte Signale in kurzer Zeit." };
  if (score >= 62) return { label: "hoch", advice: "Viele harte Einheiten diese Woche. Plane bewusst locker." };
  if (score <= 28) return { label: "niedrig", advice: "Grundlagenausdauer fehlt möglicherweise. Eine lockere Einheit passt gut." };
  return { label: "normal", advice: "Techniktraining passt gut. Belastung wirkt kontrolliert." };
};

const miniBar = (value: number, max = 100) => (
  <div className="progress-track"><span style={{ width: `${Math.max(3, Math.min(100, (value / max) * 100))}%` }} /></div>
);

export function AnalyticsCenterView({ data, user, mode, onNavigate }: AnalyticsCenterViewProps) {
  const [range, setRange] = useState<RangeKey>("30");
  const [customStart, setCustomStart] = useState(addDays(-29));
  const [customEnd, setCustomEnd] = useState(todayKey());
  const end = range === "custom" ? customEnd : todayKey();
  const start = getRangeStart(range, customStart);

  const analytics = useMemo(() => {
    const plan = data.plan.filter((entry) => inRange(entry.date, start, end));
    const competitions = data.competitions.filter((competition) => inRange(competition.date, start, end));
    const training = data.training.filter((session) => inRange(session.date, start, end));
    const feedback = data.trainingFeedback.filter((item) => {
      const entry = data.plan.find((planEntry) => planEntry.id === item.trainingId);
      return entry ? inRange(entry.date, start, end) : true;
    });
    const goals = data.goals.filter((goal) => goal.status !== "archived");
    const done = plan.filter((entry) => isDoneStatus(entry.status));
    const planned = plan.filter((entry) => isPlannedStatus(entry.status));
    const skipped = plan.filter((entry) => isSkippedStatus(entry.status));
    const hard = done.filter((entry) => entry.intensity === "hart" || entry.intensity === "maximal");
    const regeneration = done.filter((entry) => entry.area === "Regeneration");
    const avgFatigue = feedback.length ? feedback.reduce((sum, item) => sum + item.fatigue, 0) / feedback.length : 0;
    const avgFeeling = feedback.length ? feedback.reduce((sum, item) => sum + item.feeling, 0) / feedback.length : 7;
    const avgMotivation = feedback.length ? feedback.reduce((sum, item) => sum + item.motivation, 0) / feedback.length : 7;
    const avgSleep = feedback.length ? feedback.reduce((sum, item) => sum + (item.sleep ?? 7), 0) / feedback.length : 7;
    const loadScore = Math.min(100, hard.length * 14 + Math.max(0, avgFatigue - 5) * 8 + Math.max(0, 7 - avgSleep) * 7 + Math.max(0, 7 - avgFeeling) * 5 - regeneration.length * 8);
    const goalProgress = getGoalProgressList(goals, competitions, training);
    const completedGoals = goalProgress.filter((goal) => goal.statusLabel === "erreicht").length;
    const goalQuote = goalProgress.length ? Math.round((completedGoals / goalProgress.length) * 100) : 0;
    const month = todayKey().slice(0, 7);
    const thisMonthMinutes = calcMinutes(data.plan.filter((entry) => monthKey(entry.date) === month));
    const thisWeekMinutes = calcMinutes(plan);
    const k1 = getBoatClassStats(competitions, "K1");
    const c1 = getBoatClassStats(competitions, "C1");
    return {
      plan,
      competitions,
      training,
      feedback,
      goals,
      done,
      planned,
      skipped,
      hard,
      regeneration,
      areaDistribution: getTrainingAreaDistribution(plan),
      intensityDistribution: getIntensityDistribution(plan),
      feedbackQuote: done.length ? Math.round((feedback.length / done.length) * 100) : 0,
      completionQuote: plan.length ? Math.round((done.length / plan.length) * 100) : 0,
      skipQuote: plan.length ? Math.round((skipped.length / plan.length) * 100) : 0,
      openFeedback: done.filter((entry) => !feedback.some((item) => item.trainingId === entry.id)).length,
      k1,
      c1,
      penaltyAverage: competitions.length ? getAveragePenalty(competitions) : 0,
      goalProgress,
      goalQuote,
      loadScore,
      load: loadTone(loadScore + Math.max(0, 7 - avgMotivation) * 4),
      thisMonthMinutes,
      thisWeekMinutes,
      differences: getBoatClassDifferences(competitions),
    };
  }, [customEnd, customStart, data, end, range, start]);

  const rangeControls = (
    <section className="section-block analytics-filter">
      <div className="calendar-view-tabs">
        {(["7", "30", "90", "season", "year", "custom"] as RangeKey[]).map((item) => (
          <button className={range === item ? "active" : ""} key={item} type="button" onClick={() => setRange(item)}>
            {item === "season" ? "Saison" : item === "year" ? "Jahr" : item === "custom" ? "Eigen" : `${item} Tage`}
          </button>
        ))}
      </div>
      {range === "custom" ? (
        <div className="form-grid compact-form">
          <label>Start<input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
          <label>Ende<input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
        </div>
      ) : null}
    </section>
  );

  const overview = (
    <>
      <section className="metric-grid two-columns">
        <article className="metric-card tone-training"><span>Trainingsminuten</span><strong>{analytics.thisWeekMinutes}</strong><small>im Zeitraum</small></article>
        <article className="metric-card tone-training"><span>Monat</span><strong>{analytics.thisMonthMinutes}</strong><small>Trainingsminuten</small></article>
        <article className="metric-card tone-success"><span>Status</span><strong>{analytics.done.length}/{analytics.planned.length}/{analytics.skipped.length}</strong><small>erledigt / geplant / ausgelassen</small></article>
        <article className="metric-card tone-penalty"><span>Offene Räckmeldungen</span><strong>{analytics.openFeedback}</strong><small>{analytics.feedbackQuote}% Feedbackquote</small></article>
        <article className="metric-card tone-k1"><span>Beste K1-Zeit</span><strong>{analytics.k1.bestTotalSeconds ? formatSeconds(analytics.k1.bestTotalSeconds) : "--"}</strong><small>{analytics.k1.count} Starts</small></article>
        <article className="metric-card tone-c1"><span>Beste C1-Zeit</span><strong>{analytics.c1.bestTotalSeconds ? formatSeconds(analytics.c1.bestTotalSeconds) : "--"}</strong><small>{analytics.c1.count} Starts</small></article>
        <article className="metric-card tone-penalty"><span>Strafschnitt</span><strong>{analytics.competitions.length ? formatSeconds(analytics.penaltyAverage) : "--"}</strong><small>alle Starts</small></article>
        <article className="metric-card tone-success"><span>Ziel-Fortschritt</span><strong>{analytics.goalQuote}%</strong><small>erreichte Ziele</small></article>
      </section>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Belastungstrend</p><h3>{analytics.load.label}</h3></div></div><p className="card-note">{analytics.load.advice}</p>{miniBar(analytics.loadScore)}</section>
    </>
  );

  const trainingView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Trainingsanalyse</p><h3>{analytics.plan.length} Einheiten im Zeitraum</h3></div></div>
      <div className="smart-detail-grid"><span>Erledigungsquote {analytics.completionQuote}%</span><span>Ausfallquote {analytics.skipQuote}%</span><span>Feedbackquote {analytics.feedbackQuote}%</span></div>
      <div className="distribution-list">
        {analytics.areaDistribution.length ? analytics.areaDistribution.map((item) => <article className="distribution-row" key={item.key}><div><strong>{item.key}</strong><span>{item.count} Einheiten - {item.minutes} min</span></div><b>{item.percentage}%</b>{miniBar(item.percentage)}</article>) : <p className="empty-state">Noch keine Trainingsdaten vorhanden.</p>}
      </div>
      <div className="distribution-list">
        {analytics.intensityDistribution.map((item) => <article className="distribution-row" key={item.key}><div><strong>{item.key}</strong><span>{item.count} Einheiten - {item.minutes} min</span></div><b>{item.percentage}%</b>{miniBar(item.percentage)}</article>)}
      </div>
    </section>
  );

  const competitionView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Wettkampfanalyse</p><h3>{analytics.competitions.length} Ergebnisse</h3></div></div>
      <div className="result-list">
        {analytics.competitions.length ? analytics.competitions.sort((a, b) => a.date.localeCompare(b.date)).map((competition) => <article className="result-row" key={competition.id}><div><strong>{competition.location} {competition.boatClass}</strong><span>{competition.rank ? `Platz ${competition.rank}` : "ohne Platz"} - Abstand {formatSeconds(competition.gapToWinnerSeconds)}</span><small>Bestzeit {formatSeconds(getBestTotalTime(competition))}</small></div><b>{competition.run1PenaltySeconds + competition.run2PenaltySeconds} s</b></article>) : <p className="empty-state">Noch keine Wettkampfergebnisse eingetragen.</p>}
      </div>
      <div className="result-list">{analytics.differences.map((item) => <article className="result-row" key={`${item.date}-${item.location}`}><div><strong>{item.location}</strong><span>K1 {formatSeconds(item.k1TotalSeconds)} / C1 {formatSeconds(item.c1TotalSeconds)}</span></div><b>+{formatSeconds(item.differenceSeconds)}</b></article>)}</div>
    </section>
  );

  const goalsView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Zielanalyse</p><h3>{analytics.goalProgress.length} aktive Ziele</h3></div></div>
      <div className="smart-detail-grid"><span>Erreicht {analytics.goalProgress.filter((item) => item.statusLabel === "erreicht").length}</span><span>Fast geschafft {analytics.goalProgress.filter((item) => item.statusLabel === "fast geschafft").length}</span><span>Pausiert {analytics.goalProgress.filter((item) => item.statusLabel === "pausiert").length}</span></div>
      <div className="distribution-list">
        {analytics.goalProgress.length ? analytics.goalProgress.map((item) => <article className="distribution-row" key={item.goal.id}><div><strong>{item.goal.title}</strong><span>{item.currentLabel} von {item.targetLabel} - {item.statusLabel}</span></div><b>{Math.round(item.progress)}%</b>{miniBar(item.progress)}</article>) : <p className="empty-state">Noch keine Ziele erstellt.</p>}
      </div>
    </section>
  );

  const loadView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Belastungsanalyse</p><h3>{analytics.load.label}</h3></div></div>
      <p className="card-note">{analytics.load.advice}</p>
      {miniBar(analytics.loadScore)}
      <div className="smart-detail-grid"><span>Harte Einheiten {analytics.hard.length}</span><span>Regeneration {analytics.regeneration.length}</span><span>Feedbacks {analytics.feedback.length}</span></div>
      <p className="muted">Regelbasiert, keine medizinische Bewertung.</p>
    </section>
  );

  const coachView = (
    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Coach Analyse</p><h3>Meine Sportler</h3></div></div>
      <div className="calendar-list">
        {data.coachAthletes.length ? data.coachAthletes.map((athlete) => {
          const athletePlan = data.plan.filter((entry) => entry.assignedAthleteIds.includes(athlete.id) || entry.assignedAthleteId === athlete.id);
          const athleteCompetitions = data.competitions.filter((competition) => competition.athleteId === athlete.id);
          const athleteGoals = data.goals.filter((goal) => goal.athleteId === athlete.id);
          return <article className="calendar-training-card" key={athlete.id}><div className="plan-card-head"><div><span>{athlete.ageClass || "Alle"} - {athlete.boatClasses.join(" + ")}</span><h4>{athlete.name}</h4></div><b className="status-pill planned">{calcMinutes(athletePlan)} min</b></div><div className="smart-detail-grid"><span>{athletePlan.filter((entry) => isDoneStatus(entry.status)).length} erledigt</span><span>{athleteCompetitions.length} Wettkämpfe</span><span>{athleteGoals.length} Ziele</span></div></article>;
        }) : <p className="empty-state">Noch keine Sportler fär die Coach Analyse.</p>}
      </div>
    </section>
  );

  const adminView = (
    <section className="metric-grid two-columns">
      <article className="metric-card tone-training"><span>Nutzer</span><strong>{data.users.length}</strong><small>lokal geladene Profile</small></article>
      <article className="metric-card tone-c1"><span>Vereine/Sportler</span><strong>{new Set(data.coachAthletes.map((item) => item.clubId)).size}</strong><small>{data.coachAthletes.length} Sportler</small></article>
      <article className="metric-card tone-k1"><span>Trainings</span><strong>{data.plan.length}</strong><small>Plan Items</small></article>
      <article className="metric-card tone-penalty"><span>Wettkämpfe</span><strong>{data.competitions.length}</strong><small>Ergebnisse</small></article>
      <article className="metric-card tone-success"><span>Gruppen</span><strong>{data.coachGroups.length}</strong><small>Training Groups</small></article>
      <article className="metric-card tone-penalty"><span>Offene Räckmeldungen</span><strong>{analytics.openFeedback}</strong><small>plattformweit geladen</small></article>
    </section>
  );

  const current = mode === "overview" ? overview : mode === "training" ? trainingView : mode === "competition" ? competitionView : mode === "goals" ? goalsView : mode === "load" ? loadView : mode === "coach" ? coachView : adminView;

  return (
    <div className="stack">
      {rangeControls}
      {current}
      {mode !== "overview" ? null : (
        <section className="quick-actions">
          <button type="button" onClick={() => onNavigate?.("training")}>Training planen</button>
          <button type="button" onClick={() => onNavigate?.("competition")}>Ergebnis eintragen</button>
          <button type="button" onClick={() => onNavigate?.("goals")}>Ziel erstellen</button>
        </section>
      )}
    </div>
  );
}
