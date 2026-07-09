import { formatSeconds } from "../domain/metrics";
import { getSeasonMonths, getSeasonSummary } from "../domain/records";
import type { Competition, PlanEntry, TrainingSession } from "../domain/types";

type SeasonViewProps = {
  competitions: Competition[];
  training: TrainingSession[];
  plan: PlanEntry[];
};

export function SeasonView({ competitions, training, plan }: SeasonViewProps) {
  const months = getSeasonMonths(competitions, training, plan);
  const summary = getSeasonSummary(competitions, training);
  const maxMinutes = Math.max(1, ...months.map((month) => month.minutes));

  return (
    <div className="stack">
      <section className="section-block intelligence-hero">
        <p className="eyebrow">SaisonÜbersicht</p>
        <h2>Dein Jahr in Bewegung.</h2>
        <p>Monate, Umfang, Belastung und Wettkampffortschritt auf einen Blick.</p>
      </section>

      <section className="metric-grid two-columns">
        <article className="metric-card tone-training">
          <span>Trainings</span>
          <strong>{summary.trainings}</strong>
          <small>{summary.minutes} Minuten</small>
        </article>
        <article className="metric-card tone-k1">
          <span>Wettkämpfe</span>
          <strong>{summary.races}</strong>
          <small>Strafschnitt {summary.penaltyAverage}</small>
        </article>
        <article className="metric-card tone-c1">
          <span>Belastung</span>
          <strong>{summary.load}</strong>
          <small>RPE x Minuten</small>
        </article>
        <article className="metric-card tone-penalty">
          <span>Bestzeiten</span>
          <strong>{months.filter((month) => month.bestTime !== undefined).length}</strong>
          <small>Monate mit Rennen</small>
        </article>
      </section>

      <section className="chart-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Monate</p>
            <h3>Training und Wettkampf</h3>
          </div>
        </div>
        <div className="season-month-list">
          {months.length > 0 ? (
            months.map((month) => (
              <article className="season-month-card" key={month.key}>
                <div>
                  <strong>{month.label}</strong>
                  <span>
                    {month.trainingCount} Trainings - {month.competitionCount} Wettkämpfe
                  </span>
                </div>
                <div className="progress-track large">
                  <span style={{ width: `${Math.max(8, (month.minutes / maxMinutes) * 100)}%` }} />
                </div>
                <div className="season-month-stats">
                  <small>{month.minutes} min</small>
                  <small>Load {month.load}</small>
                  <small>Bestzeit {month.bestTime === undefined ? "--" : `${formatSeconds(month.bestTime)} s`}</small>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">Noch keine Saisonwerte vorhanden.</p>
          )}
        </div>
      </section>
    </div>
  );
}
