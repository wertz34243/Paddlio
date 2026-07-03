import { formatSeconds, getBestTotalTime, getCompetitionAveragePenalty, getRun1Total, getRun2Total } from "../domain/metrics";
import type { Competition } from "../domain/types";

type CompetitionResultsViewProps = {
  competitions: Competition[];
};

export function CompetitionResultsView({ competitions }: CompetitionResultsViewProps) {
  const sorted = [...competitions].sort((a, b) => {
    const timeDelta = getBestTotalTime(a) - getBestTotalTime(b);
    return timeDelta === 0 ? a.date.localeCompare(b.date) : timeDelta;
  });
  const getTrend = (competition: Competition): string => {
    const previous = competitions
      .filter((item) => item.boatClass === competition.boatClass && item.date < competition.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!previous) return "Erster Vergleich";
    const delta = getBestTotalTime(competition) - getBestTotalTime(previous);
    if (delta === 0) return "Stabil";
    return delta < 0 ? `${formatSeconds(Math.abs(delta))} s verbessert` : `${formatSeconds(delta)} s langsamer`;
  };

  return (
    <section className="section-block segment-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Ergebnisse</p>
          <h3>Bestzeiten und Platzierungen</h3>
        </div>
      </div>

      <div className="result-list">
        {sorted.length > 0 ? (
          sorted.map((competition) => (
            <article className="result-row" key={competition.id}>
              <div>
                <strong>
                  {competition.location} {competition.boatClass}
                </strong>
                <span>
                  {new Date(competition.date).toLocaleDateString("de-DE")} - Platz {competition.rank}
                </span>
                <small>
                  L1 {formatSeconds(getRun1Total(competition))} - L2 {formatSeconds(getRun2Total(competition))} - Strafschnitt {getCompetitionAveragePenalty(competition).toLocaleString("de-DE", { maximumFractionDigits: 1 })} s
                </small>
                <small>{getTrend(competition)}</small>
              </div>
              <b>{formatSeconds(getBestTotalTime(competition))}</b>
            </article>
          ))
        ) : (
          <p className="empty-state">Noch keine Ergebnisse gespeichert.</p>
        )}
      </div>
    </section>
  );
}
