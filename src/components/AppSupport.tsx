import { type ReactNode, useMemo } from "react";

type SupportUserRole = "athlete" | "coach" | "teamAdmin" | "admin";

type SupportUser = {
  id: string;
  name: string;
  email?: string;
  role: SupportUserRole;
  status: "active" | "inactive";
};

type TrainingDay = {
  date: string;
  title?: string;
  status?: "planned" | "done" | "skipped" | "cancelled";
};

const roleLabels: Record<SupportUserRole, string> = {
  athlete: "Sportler",
  coach: "Trainer",
  teamAdmin: "Team-Admin",
  admin: "Admin",
};

const friendlyTerms: Record<string, string> = {
  Athletenstatus: "Dein Trainingsstand",
  Trainingsquote: "Wie oft du trainiert hast",
  Rueckmeldungen: "Antworten vom Trainer",
  Saisonuebersicht: "Dein Jahr",
  Intensitaet: "Wie anstrengend es ist",
  Regeneration: "Pause und Erholung",
  GA1: "lockeres Ausdauertraining",
  RPE: "Anstrengung von 1 bis 10",
};

export function LoadingState() {
  return (
    <main className="loading-screen" aria-busy="true" aria-live="polite">
      <section className="loading-card">
        <h1>Paddlio</h1>
        <p className="loading-title">Daten werden geladen</p>
        <p className="loading-copy">Bitte kurz warten. Dein Trainingstagebuch wird vorbereitet.</p>
        <div className="loading-bar" aria-hidden="true">
          <span />
        </div>
      </section>
    </main>
  );
}

export function FriendlyHelp({ term }: { term: string }) {
  const text = friendlyTerms[term];

  if (!text) return null;

  return (
    <small className="help-text">
      {term}: {text}
    </small>
  );
}

export function PrivacyValue({ canReveal, fallback, value }: { canReveal: boolean; fallback: string; value?: string }) {
  if (!value) return <span className="muted">Keine Angabe</span>;
  return <span>{canReveal ? value : fallback}</span>;
}

export function AdminUserList({ currentUserRole, users }: { currentUserRole: SupportUserRole; users: SupportUser[] }) {
  const canSeePrivateData = currentUserRole === "admin" || currentUserRole === "teamAdmin";

  return (
    <section className="admin-users" aria-labelledby="admin-users-title">
      <h2 id="admin-users-title">Benutzer</h2>
      <div className="user-list">
        {users.map((user) => (
          <article className="user-row" key={user.id}>
            <div>
              <strong>{user.name || "Ohne Namen"}</strong>
              <p>
                {roleLabels[user.role]} &middot; {user.status === "active" ? "aktiv" : "deaktiviert"}
              </p>
            </div>
            <PrivacyValue canReveal={canSeePrivateData} value={user.email} fallback="E-Mail geschuetzt" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function TrainingWeek({ days }: { days: TrainingDay[] }) {
  const sortedDays = useMemo(() => [...days].sort((a, b) => a.date.localeCompare(b.date)), [days]);

  return (
    <section className="training-week" aria-labelledby="training-week-title">
      <h2 id="training-week-title">Diese Woche</h2>
      {sortedDays.map((day) => {
        const date = parseIsoDate(day.date);

        return (
          <article className="training-day" key={day.date}>
            <time dateTime={day.date}>
              {formatWeekday(date)} &middot; {formatShortDate(date)}
            </time>
            <strong>{day.title || "Noch kein Training geplant"}</strong>
            {day.status ? <span>{statusLabel(day.status)}</span> : null}
          </article>
        );
      })}
    </section>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>
      <div className="app-shell">
        <main id="main">{children}</main>
      </div>
    </>
  );
}

export function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "long" }).format(date);
}

export function formatLongWeekday(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function statusLabel(status: TrainingDay["status"]) {
  switch (status) {
    case "planned":
      return "geplant";
    case "done":
      return "erledigt";
    case "skipped":
      return "ausgelassen";
    case "cancelled":
      return "abgesagt";
    default:
      return "";
  }
}
