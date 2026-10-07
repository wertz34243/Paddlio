import { useEffect } from "react";
import { APP_NAME, APP_SLOGAN } from "../brand";
import { getPublicAppUrl, getPublicRoute, publicHref, PUBLIC_PREVIEW_PREFIX } from "./publicSiteRouting";
import "./publicWebsite.css";

type PublicPage = "home" | "features" | "athletes" | "coaches" | "clubs" | "installation" | "help" | "privacy" | "imprint";

const routeMap: Record<string, PublicPage> = {
  "/": "home",
  "/funktionen": "features",
  "/sportler": "athletes",
  "/trainer": "coaches",
  "/vereine": "clubs",
  "/installation": "installation",
  "/hilfe": "help",
  "/datenschutz": "privacy",
  "/impressum": "imprint",
};

const pageTitles: Record<PublicPage, string> = {
  home: "Paddlio – Trainings- und Wettkampfplattform für Kanuslalom",
  features: "Funktionen | Paddlio",
  athletes: "Paddlio für Sportler",
  coaches: "Paddlio für Trainer",
  clubs: "Paddlio für Vereine",
  installation: "Paddlio installieren",
  help: "Hilfe und Kontakt | Paddlio",
  privacy: "Datenschutz | Paddlio",
  imprint: "Impressum | Paddlio",
};

const roleContent = {
  athletes: {
    eyebrow: "Für Sportler",
    title: "Dein Training. Deine Entwicklung.",
    copy: "Plane deine Einheiten, halte das tatsächliche Training fest und erkenne, was dich auf dem Wasser weiterbringt.",
    items: ["Persönlicher Trainingskalender", "Individuelle Einheiten und Vorlagen", "Wochen- und Saisonplanung", "Trainingstagebuch und Ziele", "Wettkämpfe, Ergebnisse und Bestzeiten", "Analyse, Material sowie Import und Export"],
  },
  coaches: {
    eyebrow: "Für Trainer",
    title: "Planung und Feedback im Zusammenhang.",
    copy: "Organisiere Athleten und Gruppen, plane konkrete Einheiten und begleite die Entwicklung mit nachvollziehbarem Feedback.",
    items: ["Sportler- und Gruppenverwaltung", "Planung für Athleten und Gruppen", "Wiederverwendbare Trainingsvorlagen", "Athleten- und Trainerfeedback", "Auswertungen und Kommunikation"],
  },
  clubs: {
    eyebrow: "Für Vereine",
    title: "Gemeinsam organisiert.",
    copy: "Mitglieder, Gruppen und Trainingsalltag bleiben an einem Ort, ohne dass sportliche Daten öffentlich werden.",
    items: ["Mitglieder und Trainer", "Trainingsgruppen", "Vereinsorganisation", "Material und Boote", "Termine und Kommunikation", "Aufgaben und Anwesenheit"],
  },
} as const;

const FeatureList = ({ items }: { items: readonly string[] }) => (
  <ul className="public-check-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>
);

function RolePage({ kind }: { kind: keyof typeof roleContent }) {
  const content = roleContent[kind];
  return (
    <main id="main" className="public-main">
      <section className="public-page-hero">
        <p className="public-eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.copy}</p>
      </section>
      <section className="public-section public-role-detail">
        <FeatureList items={content.items} />
        <div className="public-product-panel" aria-label="Beispiel einer Paddlio-Trainingswoche">
          <div className="public-product-head"><span>Diese Woche</span><strong>4 / 6 erledigt</strong></div>
          <div className="public-week"><b>Mo</b><b>Di</b><b className="active">Mi</b><b>Do</b><b>Fr</b><b>Sa</b><b>So</b></div>
          <article><time>17:30</time><div><strong>K1 Technik</strong><span>Torfolge · 75 Minuten</span></div><em>Geplant</em></article>
          <article><time>18:00</time><div><strong>GA2 Ausdauer</strong><span>Trainingsgruppe U18</span></div><em>Heute</em></article>
        </div>
      </section>
    </main>
  );
}

function HomePage({ href, appUrl }: { href: (route: string) => string; appUrl: string }) {
  return (
    <main id="main" className="public-main">
      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="public-eyebrow">Kanuslalom digital organisieren</p>
          <h1>Paddlio</h1>
          <p className="public-slogan">{APP_SLOGAN}</p>
          <h2>Die digitale Trainings- und Wettkampfplattform für Kanuslalom.</h2>
          <p>Plane dein Training, dokumentiere deine Entwicklung, verwalte Wettkämpfe und organisiere Sportler, Trainer und Vereine an einem Ort.</p>
          <div className="public-actions">
            <a className="public-button primary" href={appUrl}>Paddlio App öffnen</a>
            <a className="public-button secondary" href={href("/funktionen")}>Funktionen entdecken</a>
          </div>
        </div>
        <div className="public-hero-visual" aria-label="Paddlio Wochenkalender">
          <div className="public-visual-brand"><img src="/icons/paddlio-icon-192.png" alt="" /><span>Trainingswoche</span><strong>KW 41</strong></div>
          <div className="public-lane-grid">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, index) => (
              <div className={index === 3 ? "today" : ""} key={day}><b>{day}</b>{index % 2 === 0 ? <span>Technik</span> : null}{index === 3 ? <span>GA2</span> : null}</div>
            ))}
          </div>
          <div className="public-water-line" />
        </div>
      </section>
      <section className="public-section">
        <div className="public-section-heading"><p className="public-eyebrow">Ein System, drei Perspektiven</p><h2>Vom Wochenplan bis zur Vereinsorganisation</h2></div>
        <div className="public-role-grid">
          {(["athletes", "coaches", "clubs"] as const).map((kind) => {
            const content = roleContent[kind];
            const route = kind === "athletes" ? "/sportler" : kind === "coaches" ? "/trainer" : "/vereine";
            return <article key={kind}><span>{content.eyebrow}</span><h3>{content.title}</h3><p>{content.copy}</p><a href={href(route)}>Mehr erfahren</a></article>;
          })}
        </div>
      </section>
      <section className="public-section public-device-band">
        <div><p className="public-eyebrow">Eine PWA für deinen Alltag</p><h2>Auf dem Bootssteg, im Vereinsheim und am Schreibtisch.</h2><p>Paddlio läuft auf iPhone, iPad, Android-Smartphone, Android-Tablet, Windows-PC und Mac im Browser. Eine Installation ist optional.</p></div>
        <a className="public-button secondary" href={href("/installation")}>Installation ansehen</a>
      </section>
    </main>
  );
}

function FeaturesPage({ href }: { href: (route: string) => string }) {
  return (
    <main id="main" className="public-main">
      <section className="public-page-hero"><p className="public-eyebrow">Paddlio 5.0</p><h1>Training, Wettkampf und Team in einem Arbeitsraum.</h1><p>Die Funktionen greifen ineinander, damit Planung, Durchführung und Auswertung dieselbe Datenbasis verwenden.</p></section>
      <section className="public-section public-feature-bands">
        {(["athletes", "coaches", "clubs"] as const).map((kind) => {
          const content = roleContent[kind];
          return <article key={kind}><div><p className="public-eyebrow">{content.eyebrow}</p><h2>{content.title}</h2><p>{content.copy}</p></div><FeatureList items={content.items} /></article>;
        })}
        <article className="public-beta-row"><div><p className="public-eyebrow">Integration</p><h2>Polar – Beta / in Vorbereitung</h2><p>Die technische Integration wird weiter getestet und ist noch nicht als vollständig verfügbare Funktion freigegeben.</p></div></article>
      </section>
      <section className="public-inline-cta"><a className="public-button primary" href={href("/installation")}>Paddlio installieren</a></section>
    </main>
  );
}

function InstallationPage({ appUrl }: { appUrl: string }) {
  const platforms = [
    ["iPhone / iPad", "app.paddlio.de in Safari öffnen.", "Teilen-Menü öffnen.", "„Zum Home-Bildschirm“ auswählen und hinzufügen."],
    ["Android", "app.paddlio.de in Chrome öffnen.", "Browser-Menü oder Installationshinweis öffnen.", "„App installieren“ auswählen."],
    ["Desktop", "app.paddlio.de in einem unterstützten Browser öffnen.", "Die Installationsfunktion des Browsers verwenden, sofern verfügbar.", "Alternativ Paddlio direkt im Browser nutzen."],
  ];
  return <main id="main" className="public-main"><section className="public-page-hero"><p className="public-eyebrow">Installation</p><h1>Paddlio auf deinem Gerät.</h1><p>Paddlio funktioniert direkt im Browser. Als PWA lässt es sich zusätzlich auf dem Startbildschirm oder Desktop ablegen.</p><a className="public-button primary" href={appUrl}>App öffnen</a></section><section className="public-section public-install-grid">{platforms.map(([title, ...steps]) => <article key={title}><h2>{title}</h2><ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol></article>)}</section></main>;
}

function HelpPage({ href }: { href: (route: string) => string }) {
  return <main id="main" className="public-main"><section className="public-page-hero"><p className="public-eyebrow">Hilfe</p><h1>Fragen rund um Paddlio.</h1><p>Kurze Wege zu Installation, Konto und Datenschutz.</p></section><section className="public-section public-help-list">
    <details open><summary>Was ist Paddlio?</summary><p>Eine Trainings-, Wettkampf- und Organisationsplattform für Kanuslalom.</p></details>
    <details><summary>Wie installiere ich Paddlio?</summary><p>Die Schritte für iPhone, iPad, Android und Desktop stehen auf der <a href={href("/installation")}>Installationsseite</a>.</p></details>
    <details><summary>Wie melde ich einen Fehler?</summary><p>Nach Freigabe des Mailbetriebs über support@paddlio.de. Bitte keine Passwörter oder sensiblen Trainingsdaten mitsenden.</p></details>
    <details><summary>Wie lösche oder exportiere ich meine Daten?</summary><p>In der App unter Einstellungen kannst du deinen JSON-Auskunftsexport anfordern und die Kontolöschung mit einer Bestätigungsphrase starten.</p></details>
    <details><summary>Was mache ich bei Login-Problemen?</summary><p>Nutze zuerst „Passwort vergessen“. Nach Freigabe des Mailbetriebs hilft support@paddlio.de.</p></details>
    <p className="public-contact-note">Kontaktadressen vor Production prüfen: info@paddlio.de · support@paddlio.de · datenschutz@paddlio.de</p>
  </section></main>;
}

function ImprintPage() {
  return <main id="main" className="public-main"><section className="public-page-hero legal"><p className="public-eyebrow">Rechtliches</p><h1>Impressum</h1></section><article className="public-legal">
    <h2>Betreiber</h2><p>Tobias Kuhn<br />Opladener Str. 131<br />42699 Solingen<br />Deutschland</p>
    <h2>Kontakt</h2><p>E-Mail: info@paddlio.de</p><p className="public-legal-note">Hinweis vor Veröffentlichung: Die Erreichbarkeit dieses Postfachs muss vor dem Production-Release bestätigt werden.</p>
    <h2>Projekt</h2><p>Paddlio ist ein privat betriebenes, kostenloses Projekt für Training, Wettkämpfe und Organisation im Kanuslalom. Derzeit werden weder kostenpflichtige Abonnements noch Werbung angeboten.</p>
  </article></main>;
}

function PrivacyPage() {
  return <main id="main" className="public-main"><section className="public-page-hero legal"><p className="public-eyebrow">Release-Entwurf</p><h1>Datenschutzerklärung</h1><p>Technischer Entwurf für Paddlio 5.0. Dieser Text ist noch nicht abschließend rechtlich geprüft.</p></section><article className="public-legal">
    <h2>Verantwortlicher</h2><p>Tobias Kuhn<br />Opladener Str. 131<br />42699 Solingen<br />Deutschland<br />E-Mail: info@paddlio.de</p>
    <h2>Welche Daten verarbeitet werden</h2><p>Paddlio verarbeitet Kontodaten, Profildaten, Trainings- und Wettkampfdaten, Ziele, Vereins- und Gruppendaten, Kommunikation, Materialdaten sowie technisch notwendige Offline-, Cache- und Synchronisierungsdaten.</p>
    <h2>Zwecke</h2><p>Die Daten werden verwendet, um Anmeldung, Trainingsplanung, Dokumentation, Wettkampfverwaltung, Zusammenarbeit und geräteübergreifende Synchronisierung bereitzustellen.</p>
    <h2>Eingesetzte Dienste</h2><p>Technisch eingesetzt werden Supabase für Authentifizierung und Datenhaltung, Vercel für Hosting, Resend für System-E-Mails und netcup für Domain- beziehungsweise Mail-Infrastruktur. Polar wird nur bei aktivierter Beta-Integration verwendet.</p>
    <h2>Lokale Speicherung</h2><p>Die App speichert funktionale Caches, Offline-Änderungen, Synchronisierungsstände und Einstellungen lokal auf dem Gerät. Das ermöglicht Offline-Nutzung und schützt noch nicht übertragene Änderungen vor Verlust.</p>
    <h2>Tracking und Werbung</h2><p>Paddlio enthält nach aktuellem technischen Audit kein Marketing-Tracking oder Analytics-SDK und zeigt keine Werbung.</p>
    <h2>Minderjährige</h2><p>Die selbstständige Registrierung ist für Paddlio 5.0 ab 16 Jahren vorgesehen. Profile, Trainings- und Leistungsdaten sind nicht öffentlich. Unter 16 Jahren ist keine normale eigenständige Registrierung vorgesehen, solange kein belastbarer Sorgeberechtigten-Prozess vorhanden ist.</p>
    <h2>Aufbewahrung</h2><p>Kontodaten werden bis zur Kontolöschung beziehungsweise bis zum Ablauf zwingender gesetzlicher Pflichten gespeichert. Profilangaben bleiben bis zu ihrer Änderung oder Kontolöschung erhalten. Trainings-, Wettkampf-, Ziel-, Material- und sonstige persönliche Daten bleiben gespeichert, bis der Nutzer sie oder sein Konto löscht.</p>
    <p>Nachrichten bleiben gespeichert, solange sie Teil einer bestehenden Unterhaltung sind. Bei einer Kontolöschung wird der Bezug zum gelöschten Absender beziehungsweise Empfänger anonymisiert; Nachrichten und Daten anderer Beteiligter werden nicht mitgelöscht. Vollständig verwaiste Direktnachrichten werden entfernt.</p>
    <h2>Auskunft, Berichtigung und Löschung</h2><p>Nutzer können eigene Profildaten berichtigen, einen JSON-Auskunftsexport anfordern und die Kontolöschung in der App starten. Daneben bestehen im gesetzlichen Rahmen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerruf beziehungsweise Widerspruch und Beschwerde bei einer Datenschutzaufsichtsbehörde.</p>
    <h2>Datenschutzaufsicht</h2><p>Zuständige Aufsichtsbehörde ist die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf. Weitere Informationen und Kontaktmöglichkeiten stehen unter <a href="https://www.ldi.nrw.de" rel="noreferrer">www.ldi.nrw.de</a>.</p>
    <h2>Kontakt</h2><p>Datenschutzanfragen sollen nach bestätigter Einrichtung an datenschutz@paddlio.de gerichtet werden.</p>
    <p className="public-legal-note">Vor Production müssen Mail-Erreichbarkeit, Rechtsgrundlagen, Auftragsverarbeiter und dieser Release-Entwurf abschließend geprüft werden. Die Seite stellt keine Rechtsberatung dar.</p>
  </article></main>;
}

export default function PublicWebsite() {
  const pathname = getPublicRoute(window.location.pathname);
  const page = routeMap[pathname] ?? "home";
  const preview = window.location.pathname === PUBLIC_PREVIEW_PREFIX || window.location.pathname.startsWith(`${PUBLIC_PREVIEW_PREFIX}/`);
  const href = (route: string) => publicHref(route, preview);
  const appUrl = getPublicAppUrl(window.location.hostname, import.meta.env.VITE_PUBLIC_APP_URL);

  useEffect(() => {
    document.title = pageTitles[page];
    document.documentElement.lang = "de";
    document.documentElement.dataset.publicSite = "true";
    document.querySelector('link[rel="manifest"]')?.remove();
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = "Paddlio verbindet Trainingsplanung, Wettkampfergebnisse, Analyse und Vereinsorganisation für Kanuslalom.";
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.append(robots);
    }
    robots.content = "index, follow";
    return () => { delete document.documentElement.dataset.publicSite; };
  }, [page]);

  const content = (() => {
    if (page === "home") return <HomePage href={href} appUrl={appUrl} />;
    if (page === "features") return <FeaturesPage href={href} />;
    if (page === "athletes" || page === "coaches" || page === "clubs") return <RolePage kind={page} />;
    if (page === "installation") return <InstallationPage appUrl={appUrl} />;
    if (page === "help") return <HelpPage href={href} />;
    if (page === "privacy") return <PrivacyPage />;
    return <ImprintPage />;
  })();

  return <div className="public-site">
    <a className="public-skip" href="#main">Zum Inhalt springen</a>
    <header className="public-header"><a className="public-brand" href={href("/")}><img src="/icons/paddlio-icon-192.png" alt="" /><span><strong>{APP_NAME}</strong><small>{APP_SLOGAN}</small></span></a><nav aria-label="Öffentliche Navigation"><a href={href("/funktionen")}>Funktionen</a><a href={href("/installation")}>Installation</a><a href={href("/hilfe")}>Hilfe</a></nav><a className="public-app-link" href={appUrl}>App öffnen</a></header>
    {content}
    <footer className="public-footer"><div><strong>Paddlio</strong><span>{APP_SLOGAN}</span></div><nav aria-label="Rechtliches"><a href={href("/datenschutz")}>Datenschutz</a><a href={href("/impressum")}>Impressum</a><a href={href("/hilfe")}>Hilfe</a></nav><small>Privates, kostenloses Kanuslalom-Projekt.</small></footer>
  </div>;
}
