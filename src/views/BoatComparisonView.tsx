import { formatSeconds, getBoatClassDifferences, getBoatClassStats } from "../domain/metrics";
import type { Competition } from "../domain/types";

type BoatComparisonViewProps = {
  competitions: Competition[];
};

const formatMaybeSeconds = (value?: number): string => (value === undefined ? "--" : formatSeconds(value));

export function BoatComparisonView({ competitions }: BoatComparisonViewProps) {
  const k1Stats = getBoatClassStats(competitions, "K1");
  const c1Stats = getBoatClassStats(competitions, "C1");
  const differences = getBoatClassDifferences(competitions);

  return (
    <div className="stack segment-panel">
      <section className="metric-grid two-columns">
        <article className="metric-card tone-k1">
          <span>K1 Bestzeit</span>
          <strong>{formatMaybeSeconds(k1Stats.bestTotalSeconds)}</strong>
          <small>{k1Stats.count} Starts</small>
        </article>
        <article className="metric-card tone-c1">
          <span>C1 Bestzeit</span>
          <strong>{formatMaybeSeconds(c1Stats.bestTotalSeconds)}</strong>
          <small>{c1Stats.count} Starts</small>
        </article>
        <article className="metric-card tone-penalty">
          <span>K1 Strafschnitt</span>
          <strong>{formatMaybeSeconds(k1Stats.averagePenaltySeconds)}</strong>
          <small>Sauberkeit</small>
        </article>
        <article className="metric-card tone-penalty">
          <span>C1 Strafschnitt</span>
          <strong>{formatMaybeSeconds(c1Stats.averagePenaltySeconds)}</strong>
          <small>Sauberkeit</small>
        </article>
      </section>

      <section className="chart-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vergleich</p>
            <h3>K1 / C1 am gleichen Ort</h3>
          </div>
        </div>
        <div className="result-list">
          {differences.length > 0 ? (
            differences.map((difference) => (
              <article className="result-row" key={`${difference.date}-${difference.location}`}>
                <div>
                  <strong>{difference.location}</strong>
                  <span>{new Date(difference.date).toLocaleDateString("de-DE")}</span>
                  <small>
                    K1 {formatSeconds(difference.k1TotalSeconds)} / C1 {formatSeconds(difference.c1TotalSeconds)}
                  </small>
                </div>
                <b>+{formatSeconds(difference.differenceSeconds)}</b>
              </article>
            ))
          ) : (
            <p className="empty-state">Noch keine K1-C1-Paare am selben Datum und Ort.</p>
          )}
        </div>
      </section>
    </div>
  );
}
