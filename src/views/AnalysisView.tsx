import type { ReactNode } from "react";
import {
  formatSeconds,
  getBestTotalTime,
  getBoatClassDifferences,
  getBoatClassStats,
  getCompetitionsSortedByDate,
  getIntensityDistribution,
  getPlanWeekStats,
  getTrainingAreaDistribution,
  getTrainingPauseRatio,
  getWeeklyPlanSummary,
} from "../domain/metrics";
import type { BoatClass, Competition, PlanEntry, TrainingFeedback, TrainingSession } from "../domain/types";
import { formatDateKeyForDisplay } from "../lib/dateOnly";

type AnalysisViewProps = {
  competitions: Competition[];
  training: TrainingSession[];
  plan: PlanEntry[];
  feedback: TrainingFeedback[];
};

const formatMaybeSeconds = (value?: number): string => (value === undefined ? "--" : formatSeconds(value));

const ChartPanel = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <section className="chart-panel">
    <div className="section-heading">
      <div>
        <p className="eyebrow">{subtitle}</p>
        <h3>{title}</h3>
      </div>
    </div>
    {children}
  </section>
);

const boatData = (competitions: Competition[], boatClass: BoatClass) =>
  getCompetitionsSortedByDate(competitions).filter((competition) => competition.boatClass === boatClass);

export function AnalysisView({ competitions, training, plan, feedback }: AnalysisViewProps) {
  const k1Stats = getBoatClassStats(competitions, "K1");
  const c1Stats = getBoatClassStats(competitions, "C1");
  const differences = getBoatClassDifferences(competitions);
  const sortedCompetitions = getCompetitionsSortedByDate(competitions);
  const weeklyPlan = getWeeklyPlanSummary(plan);
  const pauseRatio = getTrainingPauseRatio(plan);
  const areaDistribution = getTrainingAreaDistribution(plan);
  const intensityDistribution = getIntensityDistribution(plan);
  const weekStats = getPlanWeekStats(plan);
  const doneCount = plan.filter((entry) => entry.status === "done" || entry.status === "erledigt").length;
  const plannedCount = plan.filter((entry) => entry.status === "planned" || entry.status === "geplant").length;
  const skippedCount = plan.filter((entry) => entry.status === "skipped" || entry.status === "ausgelassen").length;
  const feedbackQuote = doneCount === 0 ? 0 : Math.round((feedback.length / doneCount) * 100);
  const k1Series = boatData(competitions, "K1");
  const c1Series = boatData(competitions, "C1");

  return (
    <div className="stack">
      <section className="metric-grid two-columns">
        <article className="metric-card tone-k1">
          <span>K1 Rekord</span>
          <strong>{formatMaybeSeconds(k1Stats.bestTotalSeconds)}</strong>
          <small>Durchschnitt {formatMaybeSeconds(k1Stats.averageTotalSeconds)}</small>
        </article>
        <article className="metric-card tone-c1">
          <span>C1 Rekord</span>
          <strong>{formatMaybeSeconds(c1Stats.bestTotalSeconds)}</strong>
          <small>Durchschnitt {formatMaybeSeconds(c1Stats.averageTotalSeconds)}</small>
        </article>
        <article className="metric-card tone-penalty">
          <span>Strafschnitt K1</span>
          <strong>{formatMaybeSeconds(k1Stats.averagePenaltySeconds)}</strong>
          <small>{k1Stats.count} Starts</small>
        </article>
        <article className="metric-card tone-penalty">
          <span>Strafschnitt C1</span>
          <strong>{formatMaybeSeconds(c1Stats.averagePenaltySeconds)}</strong>
          <small>{c1Stats.count} Starts</small>
        </article>
      </section>

      <ChartPanel title="K1 Entwicklung" subtitle="Trend">
        <div className="spark-chart tone-k1">
          {k1Series.length > 0 ? (
            k1Series.map((competition) => {
              const total = getBestTotalTime(competition);
              const height = Math.max(26, Math.min(100, (125 - total) * 2.2));
              return (
                <div className="spark-column" key={competition.id}>
                  <span style={{ height: `${height}%` }} />
                  <small>{competition.location}</small>
                </div>
              );
            })
          ) : (
            <p className="empty-state">Noch keine K1-Daten.</p>
          )}
        </div>
      </ChartPanel>

      <ChartPanel title="C1 Entwicklung" subtitle="Trend">
        <div className="spark-chart tone-c1">
          {c1Series.length > 0 ? (
            c1Series.map((competition) => {
              const total = getBestTotalTime(competition);
              const height = Math.max(26, Math.min(100, (140 - total) * 1.8));
              return (
                <div className="spark-column" key={competition.id}>
                  <span style={{ height: `${height}%` }} />
                  <small>{competition.location}</small>
                </div>
              );
            })
          ) : (
            <p className="empty-state">Noch keine C1-Daten.</p>
          )}
        </div>
      </ChartPanel>

      <ChartPanel title="Strafsekunden" subtitle="Sauberkeit">
        <div className="bar-list">
          {sortedCompetitions.length > 0 ? (
            sortedCompetitions.map((competition) => {
              const penalty = (competition.run1PenaltySeconds + competition.run2PenaltySeconds) / 2;
              const width = Math.max(4, Math.min(100, penalty * 18));

              return (
                <article className={`bar-row tone-${competition.boatClass.toLowerCase()}`} key={competition.id}>
                  <div>
                    <strong>
                      {competition.location} {competition.boatClass}
                    </strong>
                    <span>{formatSeconds(penalty)} s</span>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${width}%` }} />
                  </div>
                </article>
              );
            })
          ) : (
            <p className="empty-state">Noch keine Strafdaten.</p>
          )}
        </div>
      </ChartPanel>

      <ChartPanel title="Trainingsumfang" subtitle="Wochen">
        <section className="metric-grid two-columns">
          <article className="metric-card tone-training">
            <span>Minuten diese Woche</span>
            <strong>{weeklyPlan.minutes}</strong>
            <small>erledigte Einheiten</small>
          </article>
          <article className="metric-card tone-training">
            <span>Erledigte Einheiten</span>
            <strong>{weeklyPlan.completedCount}</strong>
            <small>von {weeklyPlan.totalCount} geplant</small>
          </article>
          <article className="metric-card tone-penalty">
            <span>Training / Pause</span>
            <strong>
              {pauseRatio.training}:{pauseRatio.pause}
            </strong>
            <small>erledigte Einträge</small>
          </article>
          <article className="metric-card tone-c1">
            <span>Trainingstagebuch</span>
            <strong>{training.length}</strong>
            <small>dokumentierte Einheiten</small>
          </article>
          <article className="metric-card tone-training">
            <span>Statusverteilung</span>
            <strong>{doneCount}/{plannedCount}/{skippedCount}</strong>
            <small>erledigt / geplant / ausgelassen</small>
          </article>
          <article className="metric-card tone-success">
            <span>Rückmeldungsquote</span>
            <strong>{feedbackQuote}%</strong>
            <small>{feedback.length} Rückmeldungen</small>
          </article>
        </section>
      </ChartPanel>

      <ChartPanel title="K1-C1 Vergleich" subtitle="Gleicher Ort">
        <div className="result-list">
          {differences.length > 0 ? (
            differences.map((difference) => (
              <article className="result-row" key={`${difference.date}-${difference.location}`}>
                <div>
                  <strong>{difference.location}</strong>
                  <span>
                    {formatDateKeyForDisplay(difference.date)} - K1 {formatSeconds(difference.k1TotalSeconds)} / C1 {formatSeconds(difference.c1TotalSeconds)}
                  </span>
                </div>
                <b>+{formatSeconds(difference.differenceSeconds)}</b>
              </article>
            ))
          ) : (
            <p className="empty-state">Noch keine K1-C1-Paare am selben Datum und Ort.</p>
          )}
        </div>
      </ChartPanel>

      <ChartPanel title="Trainingsbereiche" subtitle="Verteilung">
        <div className="distribution-list">
          {areaDistribution.length > 0 ? (
            areaDistribution.map((item) => (
              <article className="distribution-row" key={item.key}>
                <div>
                  <strong>{item.key}</strong>
                  <span>
                    {item.count} Einheiten - {item.minutes} min
                  </span>
                </div>
                <b>{item.percentage}%</b>
                <div className="progress-track">
                  <span style={{ width: `${item.percentage}%` }} />
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">Noch keine erledigten Trainings im Plan.</p>
          )}
        </div>
      </ChartPanel>

      <ChartPanel title="Intensität" subtitle="Belastung">
        <div className="distribution-list">
          {intensityDistribution.length > 0 ? (
            intensityDistribution.map((item) => (
              <article className="distribution-row" key={item.key}>
                <div>
                  <strong>{item.key}</strong>
                  <span>
                    {item.count} Einheiten - {item.minutes} min
                  </span>
                </div>
                <b>{item.percentage}%</b>
                <div className="progress-track">
                  <span style={{ width: `${item.percentage}%` }} />
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">Noch keine Intensitätsdaten.</p>
          )}
        </div>
      </ChartPanel>

      <ChartPanel title="Wochenhistorie" subtitle="Performance">
        <div className="result-list">
          {weekStats.length > 0 ? (
            weekStats.map((week) => (
              <article className="result-row" key={week.weekLabel}>
                <div>
                  <strong>Woche ab {formatDateKeyForDisplay(week.weekLabel)}</strong>
                  <span>
                    {week.completedCount} von {week.totalCount} Einheiten erledigt
                  </span>
                </div>
                <b>{week.minutes} min</b>
              </article>
            ))
          ) : (
            <p className="empty-state">Noch keine Trainingsplan-Wochen vorhanden.</p>
          )}
        </div>
      </ChartPanel>
    </div>
  );
}
