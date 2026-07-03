import { formatSeconds, getBestTotalTime, getCompetitionAveragePenalty } from "../domain/metrics";
import type { BoatClass, Competition } from "../domain/types";

type CompetitionBestTimesViewProps = {
  competitions: Competition[];
};

const boatClasses: BoatClass[] = ["K1", "C1", "C2", "Mannschaft"];

const bestForBoat = (competitions: Competition[], boatClass: BoatClass): Competition | undefined =>
  competitions.filter((competition) => competition.boatClass === boatClass).sort((a, b) => getBestTotalTime(a) - getBestTotalTime(b))[0];

const bestByCourse = (competitions: Competition[]): Array<{ key: string; competition: Competition }> => {
  const map = new Map<string, Competition>();
  competitions.forEach((competition) => {
    const key = competition.course || competition.location;
    const current = map.get(key);
    if (!current || getBestTotalTime(competition) < getBestTotalTime(current)) {
      map.set(key, competition);
    }
  });
  return [...map.entries()].map(([key, competition]) => ({ key, competition }));
};

export function CompetitionBestTimesView({ competitions }: CompetitionBestTimesViewProps) {
  const bestPenalty = [...competitions].sort((a, b) => getCompetitionAveragePenalty(a) - getCompetitionAveragePenalty(b))[0];
  const sorted = [...competitions].sort((a, b) => a.date.localeCompare(b.date));
  const improvements = sorted.filter((competition, index) => {
    const previous = sorted.slice(0, index).filter((item) => item.boatClass === competition.boatClass);
    if (previous.length === 0) return true;
    return getBestTotalTime(competition) < Math.min(...previous.map(getBestTotalTime));
  });
  const lastImprovement = improvements[improvements.length - 1];

  return (
    <div className="stack">
      <section className="summary-strip">
        {boatClasses.map((boatClass) => {
          const best = bestForBoat(competitions, boatClass);
          return (
            <div key={boatClass}>
              <span>{boatClass} Bestzeit</span>
              <strong>{best ? formatSeconds(getBestTotalTime(best)) : "--"}</strong>
            </div>
          );
        })}
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Persoenliche Rekorde</p><h3>Bestzeiten pro Strecke</h3></div></div>
        <div className="result-list">
          {bestByCourse(competitions).length > 0 ? bestByCourse(competitions).map(({ key, competition }) => (
            <article className="result-row" key={`${key}-${competition.id}`}>
              <div>
                <strong>{key}</strong>
                <span>{competition.boatClass} - {competition.name || competition.location}</span>
                <small>{new Date(competition.date).toLocaleDateString("de-DE")}</small>
              </div>
              <b>{formatSeconds(getBestTotalTime(competition))}</b>
            </article>
          )) : <p className="empty-state">Noch keine Bestzeiten vorhanden.</p>}
        </div>
      </section>

      <section className="section-block">
        <div className="smart-detail-grid">
          <span>Strafarmster Lauf: {bestPenalty ? `${bestPenalty.location} ${formatSeconds(getCompetitionAveragePenalty(bestPenalty))} s` : "--"}</span>
          <span>Letzte Verbesserung: {lastImprovement ? `${lastImprovement.location} ${lastImprovement.boatClass}` : "--"}</span>
          <span>Saisonleistung: {competitions.length} Ergebnisse</span>
        </div>
      </section>
    </div>
  );
}
