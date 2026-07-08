import { formatSeconds, getAveragePenalty, getBestTotalTime } from "../domain/metrics";
import type { Competition } from "../domain/types";

type CompetitionSeasonStatsViewProps = {
  competitions: Competition[];
};

const groupByMonth = (competitions: Competition[]) => {
  const map = new Map<string, Competition[]>();
  competitions.forEach((competition) => {
    const month = competition.date.slice(0, 7);
    map.set(month, [...(map.get(month) ?? []), competition]);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
};

export function CompetitionSeasonStatsView({ competitions }: CompetitionSeasonStatsViewProps) {
  const months = groupByMonth(competitions);
  const placements = competitions.filter((competition) => competition.rank > 0).map((competition) => competition.rank);
  const averagePlacement = placements.length > 0 ? placements.reduce((sum, rank) => sum + rank, 0) / placements.length : 0;
  const best = [...competitions].sort((a, b) => getBestTotalTime(a) - getBestTotalTime(b))[0];

  return (
    <div className="stack">
      <section className="summary-strip">
        <div><span>Wettkaempfe</span><strong>{competitions.length}</strong></div>
        <div><span>Strafschnitt</span><strong>{competitions.length ? formatSeconds(getAveragePenalty(competitions)) : "--"}</strong></div>
        <div><span>Ã˜ Platz</span><strong>{averagePlacement ? averagePlacement.toLocaleString("de-DE", { maximumFractionDigits: 1 }) : "--"}</strong></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Saisonstatistik</p><h3>Entwicklung nach Monaten</h3></div></div>
        <div className="calendar-list">
          {months.length > 0 ? months.map(([month, items]) => (
            <article className="calendar-training-card" key={month}>
              <div className="plan-card-head">
                <div><span>{month}</span><h4>{items.length} Ergebnisse</h4></div>
                <b className="status-pill planned">{formatSeconds(Math.min(...items.map(getBestTotalTime)))}</b>
              </div>
              <div className="smart-detail-grid">
                <span>Strafschnitt {formatSeconds(getAveragePenalty(items))} s</span>
                <span>Bestzeit {items.sort((a, b) => getBestTotalTime(a) - getBestTotalTime(b))[0]?.boatClass ?? "--"}</span>
                <span>Starts {items.map((item) => item.boatClass).join(", ")}</span>
              </div>
            </article>
          )) : <p className="empty-state">Noch keine Saisonstatistik vorhanden.</p>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Bestzeit-Verlauf</p><h3>{best ? `${best.location} ${formatSeconds(getBestTotalTime(best))}` : "Noch keine Bestzeit"}</h3></div></div>
      </section>
    </div>
  );
}
