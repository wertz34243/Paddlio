import { formatSeconds, getBestTotalTime, getCompetitionAveragePenalty } from "../domain/metrics";
import type { Competition, User } from "../domain/types";

type CompetitionCoachAdminViewProps = {
  competitions: Competition[];
  user: User;
};

export function CompetitionCoachAdminView({ competitions, user }: CompetitionCoachAdminViewProps) {
  const byAthlete = new Map<string, Competition[]>();
  competitions.forEach((competition) => {
    byAthlete.set(competition.athleteId, [...(byAthlete.get(competition.athleteId) ?? []), competition]);
  });

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{user.role === "admin" ? "Admin-Ansicht" : "Coach-Ansicht"}</p>
          <h3>{user.role === "admin" ? "Alle Wettkampfdaten" : "Vereinssportler auswerten"}</h3>
        </div>
      </div>
      <div className="calendar-list">
        {[...byAthlete.entries()].length > 0 ? [...byAthlete.entries()].map(([athleteId, items]) => {
          const best = [...items].sort((a, b) => getBestTotalTime(a) - getBestTotalTime(b))[0];
          return (
            <article className="calendar-training-card" key={athleteId}>
              <div className="plan-card-head">
                <div><span>Sportler {athleteId}</span><h4>{items.length} Ergebnisse</h4></div>
                <b className="status-pill planned">{best ? formatSeconds(getBestTotalTime(best)) : "--"}</b>
              </div>
              <div className="smart-detail-grid">
                <span>Strafschnitt {formatSeconds(getCompetitionAveragePenalty(best ?? items[0]))} s</span>
                <span>Boote {Array.from(new Set(items.map((item) => item.boatClass))).join(", ")}</span>
                <span>Letzter Start {items.sort((a, b) => b.date.localeCompare(a.date))[0]?.location ?? "--"}</span>
              </div>
            </article>
          );
        }) : <p className="empty-state">Noch keine Wettkampfdaten für diese Ansicht.</p>}
      </div>
    </section>
  );
}
