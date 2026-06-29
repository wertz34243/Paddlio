import { AppCard } from "../components/AppCard";
import { getAthleteRecords } from "../domain/records";
import type { Competition, TrainingSession } from "../domain/types";

type RecordsViewProps = {
  competitions: Competition[];
  training: TrainingSession[];
};

export function RecordsView({ competitions, training }: RecordsViewProps) {
  const records = getAthleteRecords(competitions, training);

  const items = [
    { label: "K1", value: records.k1Best, tone: "k1" as const },
    { label: "C1", value: records.c1Best, tone: "c1" as const },
    { label: "Beste Strafsekunden", value: records.bestPenalty, tone: "warning" as const },
    { label: "Laengste Trainingsserie", value: `${records.longestStreak} Tage`, tone: "success" as const },
    { label: "Meiste Trainingsminuten", value: `${records.mostWeeklyMinutes} min/Woche`, tone: "primary" as const },
    { label: "Erstes Rennen", value: records.firstRace, tone: "secondary" as const },
    { label: "Letztes Rennen", value: records.lastRace, tone: "secondary" as const },
  ];

  return (
    <div className="stack">
      <section className="section-block intelligence-hero">
        <p className="eyebrow">Persoenliche Rekorde</p>
        <h2>Alles, was Tobias bisher gesetzt hat.</h2>
        <p>Rekorde werden automatisch aus Training und Wettkaempfen berechnet.</p>
      </section>

      <section className="dashboard-card-grid">
        {items.map((item) => (
          <AppCard
            icon={item.label.includes("Serie") ? "training" : item.label.includes("Rennen") ? "trophy" : "target"}
            key={item.label}
            title={item.label}
            value={item.value}
            tone={item.tone}
          />
        ))}
      </section>
    </div>
  );
}
