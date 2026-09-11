import {
  PaddlioOneButton,
  PaddlioOneCard,
  PaddlioOneEmptyState,
  PaddlioOneErrorState,
  PaddlioOneIconButton,
  PaddlioOneListRow,
  PaddlioOneMetricCard,
  PaddlioOnePageHeader,
  PaddlioOnePageShell,
  PaddlioOneSectionHeader,
  PaddlioOneStatusChip,
  PaddlioOneTextField,
} from "../components/paddlio-one/PaddlioOneComponents";
import type { PaddlioOneTheme } from "../lib/paddlioOneTheme";

const tones = ["default", "primary", "success", "warning", "danger", "info", "muted"] as const;
const themes: PaddlioOneTheme[] = ["dark", "light", "highContrast"];

const getInitialTheme = (): PaddlioOneTheme => {
  const requested = new URLSearchParams(window.location.search).get("theme");
  return themes.includes(requested as PaddlioOneTheme) ? (requested as PaddlioOneTheme) : "dark";
};

export function PaddlioOneComponentsPreview() {
  const theme = getInitialTheme();

  return (
    <PaddlioOnePageShell theme={theme}>
      <PaddlioOnePageHeader
        eyebrow="Paddlio One"
        title="Components Preview"
        description="Interne Development-Übersicht für Basiskomponenten, Zustände und responsive Dichte."
        action={<PaddlioOneStatusChip tone="info">Development only</PaddlioOneStatusChip>}
      />

      <PaddlioOneCard>
        <PaddlioOneSectionHeader title="Buttons" description="Primäre, sekundäre, stille und kritische Aktionen." />
        <div className="po-preview-row">
          <PaddlioOneButton variant="primary" icon="training">Individuelles Training</PaddlioOneButton>
          <PaddlioOneButton icon="calendar">Kalender öffnen</PaddlioOneButton>
          <PaddlioOneButton variant="ghost" icon="more">Weitere Optionen</PaddlioOneButton>
          <PaddlioOneButton variant="danger" icon="trophy">Konflikt löschen</PaddlioOneButton>
          <PaddlioOneButton loading>Speichern</PaddlioOneButton>
          <PaddlioOneIconButton label="Zurück" icon="home" />
        </div>
      </PaddlioOneCard>

      <PaddlioOneCard>
        <PaddlioOneSectionHeader title="Status" description="Status ist immer als Text sichtbar und nicht nur Farbe." />
        <div className="po-preview-row">
          {tones.map((tone) => (
            <PaddlioOneStatusChip key={tone} tone={tone}>
              {tone}
            </PaddlioOneStatusChip>
          ))}
        </div>
      </PaddlioOneCard>

      <section className="po-preview-grid">
        <PaddlioOneMetricCard label="Trainings" value="3" detail="Heute geplant" icon="training" tone="primary" />
        <PaddlioOneMetricCard label="Rückmeldungen" value="2" detail="Noch offen" icon="message" tone="warning" />
        <PaddlioOneMetricCard label="Belastung" value="812" detail="Diese Woche" icon="chart" tone="success" />
        <PaddlioOneMetricCard label="Polar" value="6:20" detail="Synchronisiert" icon="bolt" tone="info" />
      </section>

      <PaddlioOneCard>
        <PaddlioOneSectionHeader title="Listen" description="Kompakte Zeilen für Aufgaben, Nachrichten und Trainings." />
        <div className="po-preview-list">
          <PaddlioOneListRow title="Techniktraining Aufwärtstore" meta="Heute · 16:30 · K1" value="geplant" icon="training" tone="info" />
          <PaddlioOneListRow title="Feedback von Lena prüfen" meta="U16 K1 · ungelesen" value="neu" icon="message" tone="warning" />
          <PaddlioOneListRow title="Strecke aufbauen" meta="Traineraufgabe · 15:45" value="offen" icon="calendar" tone="success" />
        </div>
      </PaddlioOneCard>

      <PaddlioOneCard>
        <PaddlioOneSectionHeader title="Formulare" description="Basisfelder mit Labels, Hilfetext und Fokuszustand." />
        <div className="po-form-grid">
          <PaddlioOneTextField label="Titel" placeholder="GA1 Grundlagenfahrt" />
          <PaddlioOneTextField label="Datum" type="date" />
          <PaddlioOneTextField label="Uhrzeit" type="time" />
          <PaddlioOneTextField label="Dauer" helper="In Minuten" inputMode="numeric" placeholder="75" />
        </div>
      </PaddlioOneCard>

      <section className="po-preview-grid two">
        <PaddlioOneEmptyState
          title="Noch keine Aufgaben"
          description="Sobald Aufgaben geplant sind, erscheinen sie hier kompakt und sortiert."
          action={<PaddlioOneButton variant="primary" icon="calendar">Aufgabe erstellen</PaddlioOneButton>}
        />
        <PaddlioOneErrorState
          title="Synchronisierung fehlgeschlagen"
          description="Neue Daten konnten gerade nicht automatisch geladen werden."
          details="Mock: network_unavailable"
        />
      </section>
    </PaddlioOnePageShell>
  );
}
