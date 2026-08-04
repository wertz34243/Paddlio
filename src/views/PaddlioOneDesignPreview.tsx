import { useMemo, useState } from "react";
import {
  PaddlioOneButton,
  PaddlioOneCard,
  PaddlioOneListRow,
  PaddlioOneMetricCard,
  PaddlioOnePageHeader,
  PaddlioOnePageShell,
  PaddlioOneSectionHeader,
  PaddlioOneStatusChip,
} from "../components/paddlio-one/PaddlioOneComponents";
import type { PaddlioOneTheme } from "../lib/paddlioOneTheme";

type PreviewDevice = "phoneSmall" | "phoneLarge" | "tabletPortrait" | "tabletLandscape" | "desktop1366" | "desktop1920" | "ultrawide";
type PreviewRole = "Athlete" | "Coach" | "ClubAdmin" | "Admin";

const deviceLabels: Record<PreviewDevice, string> = {
  phoneSmall: "Phone klein",
  phoneLarge: "Phone groß",
  tabletPortrait: "Tablet Portrait",
  tabletLandscape: "Tablet Landscape",
  desktop1366: "Desktop 1366",
  desktop1920: "Desktop 1920",
  ultrawide: "Ultrawide",
};

const roles: PreviewRole[] = ["Athlete", "Coach", "ClubAdmin", "Admin"];
const themes: PaddlioOneTheme[] = ["dark", "light", "highContrast"];
const devices = Object.keys(deviceLabels) as PreviewDevice[];

const fromQuery = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  const requested = new URLSearchParams(window.location.search).get(key);
  return allowed.includes(requested as T) ? (requested as T) : fallback;
};

export function PaddlioOneDesignPreview() {
  const [device, setDevice] = useState<PreviewDevice>(() => fromQuery("device", devices, "desktop1366"));
  const [theme, setTheme] = useState<PaddlioOneTheme>(() => fromQuery("theme", themes, "dark"));
  const [role, setRole] = useState<PreviewRole>(() => fromQuery("role", roles, "Coach"));
  const frameClass = useMemo(() => `po-device-frame po-frame-${device}`, [device]);

  return (
    <PaddlioOnePageShell className="po-design-preview">
      <PaddlioOnePageHeader
        eyebrow="Paddlio One"
        title="Design Preview"
        description="Mockups für Phone, Tablet und Desktop. Keine echten Nutzerdaten."
        action={<PaddlioOneStatusChip tone="info">{role} · {deviceLabels[device]}</PaddlioOneStatusChip>}
      />

      <PaddlioOneCard className="po-preview-toolbar">
        <label>
          Gerät
          <select value={device} onChange={(event) => setDevice(event.target.value as PreviewDevice)}>
            {devices.map((item) => <option key={item} value={item}>{deviceLabels[item]}</option>)}
          </select>
        </label>
        <label>
          Theme
          <select value={theme} onChange={(event) => setTheme(event.target.value as PaddlioOneTheme)}>
            {themes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Rolle
          <select value={role} onChange={(event) => setRole(event.target.value as PreviewRole)}>
            {roles.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </PaddlioOneCard>

      <div className={frameClass} data-po-theme={theme}>
        <aside className="po-mock-sidebar" aria-label="Mock-Navigation">
          <strong>Paddlio</strong>
          <nav>
            {["Heute", "Kalender", "Training", "Team", "Analyse", "Polar"].map((item) => (
              <button className={item === "Heute" ? "active" : ""} key={item} type="button">{item}</button>
            ))}
          </nav>
          <small>{role}</small>
        </aside>

        <main className="po-mock-main">
          <PaddlioOneSectionHeader
            eyebrow="Heute"
            title={`Guten Morgen, ${role}`}
            description="Nächste Einheit, offene Rückmeldungen und Belastung auf einen Blick."
            action={<PaddlioOneButton variant="primary" icon="training">Training starten</PaddlioOneButton>}
          />
          <section className="po-preview-grid">
            <PaddlioOneMetricCard label="Trainings" value="3" detail="Heute" tone="primary" />
            <PaddlioOneMetricCard label="Feedback" value="2" detail="Offen" tone="warning" />
            <PaddlioOneMetricCard label="Belastung" value="812" detail="Woche" tone="success" />
          </section>
          <PaddlioOneCard tone="primary">
            <PaddlioOneSectionHeader title="Nächstes Training" description="Techniktraining Aufwärtstore · 16:30 bis 18:00 · K1" />
            <div className="po-preview-row">
              <PaddlioOneStatusChip tone="info">geplant</PaddlioOneStatusChip>
              <PaddlioOneStatusChip tone="success">GA1</PaddlioOneStatusChip>
              <PaddlioOneStatusChip tone="warning">RPE offen</PaddlioOneStatusChip>
            </div>
          </PaddlioOneCard>
          <PaddlioOneCard>
            <PaddlioOneSectionHeader title="Wochenplan" description="Kompakte Vorschau für Kalender und Planung." />
            <div className="po-preview-list">
              <PaddlioOneListRow title="Mo · GA1 Grundlagenfahrt" meta="16:30 · 75 min" value="Soll" tone="success" />
              <PaddlioOneListRow title="Mi · Kraftausdauer Zirkel" meta="17:00 · 60 min" value="Plan" tone="warning" />
              <PaddlioOneListRow title="Sa · Wettkampfsimulation" meta="10:00 · U16 K1" value="hoch" tone="danger" />
            </div>
          </PaddlioOneCard>
        </main>

        <aside className="po-mock-context" aria-label="Mock-Kontext">
          <PaddlioOneSectionHeader title="Vorlagen" description="Ziehen oder schnell einfügen." />
          <PaddlioOneListRow title="GA1" meta="75 min · Grundlage" tone="success" />
          <PaddlioOneListRow title="Technik" meta="60 min · Aufwärtstore" tone="info" />
          <PaddlioOneListRow title="Regeneration" meta="45 min · locker" tone="muted" />
        </aside>
      </div>
    </PaddlioOnePageShell>
  );
}
