import { Icon, type IconName } from "../components/Icon";
import type { PageId } from "../domain/types";

type MoreViewProps = {
  onNavigate: (page: PageId) => void;
  onOpenSettings: () => void;
};

type MoreMenuItem = {
  title: string;
  description: string;
  icon: IconName;
  action: () => void;
};

export function MoreView({ onNavigate, onOpenSettings }: MoreViewProps) {
  const items: MoreMenuItem[] = [
    {
      title: "Profil",
      description: "Persoenliche Daten, Sportprofil und Athletenziele.",
      icon: "user",
      action: () => onNavigate("profile"),
    },
    {
      title: "Material",
      description: "Boote, Paddel, Zubehoer und Status verwalten.",
      icon: "wallet",
      action: () => onNavigate("equipment"),
    },
    {
      title: "Ziele",
      description: "Saisonziele und Fortschritt im Blick behalten.",
      icon: "target",
      action: () => onNavigate("goals"),
    },
    {
      title: "Rekorde",
      description: "Persoenliche Bestleistungen und Serien ansehen.",
      icon: "trophy",
      action: () => onNavigate("records"),
    },
    {
      title: "Saison",
      description: "Monate, Belastung und Entwicklung auswerten.",
      icon: "chart",
      action: () => onNavigate("season"),
    },
    {
      title: "Trainingsplan",
      description: "Geplante Einheiten und Wochenstruktur organisieren.",
      icon: "calendar",
      action: () => onNavigate("plan"),
    },
    {
      title: "Einstellungen",
      description: "Profilbild, Sprache, Einheiten und Dark Mode.",
      icon: "bolt",
      action: onOpenSettings,
    },
  ];

  return (
    <section className="more-menu stack">
      <div className="section-block more-hero">
        <p className="eyebrow">Mehr</p>
        <h2>Alle Bereiche</h2>
        <p>Alles, was nicht taeglich in die Hauptnavigation muss, bleibt hier schnell erreichbar.</p>
      </div>

      <div className="more-menu-grid">
        {items.map((item) => (
          <button className="more-menu-card" key={item.title} type="button" onClick={item.action}>
            <span className="more-menu-icon" aria-hidden="true">
              <Icon name={item.icon} />
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
