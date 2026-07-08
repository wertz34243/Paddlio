import { useMemo, useState } from "react";
import { APP_VERSION } from "../brand";
import { createId } from "../data/storage";
import type { BetaFeedback, BetaFeedbackCategory, BetaFeedbackPriority, BetaFeedbackStatus, BetaTester, PaddleMotionData, User } from "../domain/types";
import { upsertCloudBetaFeedback, upsertCloudBetaTester } from "../services/betaService";

type BetaReleaseMode = "feedback" | "testers" | "guide" | "limitations";

type BetaReleaseViewProps = {
  data: PaddleMotionData;
  user: User;
  mode: BetaReleaseMode;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
};

const categories: BetaFeedbackCategory[] = ["Fehler", "Verbesserung", "Design", "Verstaendnisproblem", "Wunsch", "Sonstiges"];
const priorities: BetaFeedbackPriority[] = ["niedrig", "normal", "hoch", "kritisch"];
const statuses: BetaFeedbackStatus[] = ["open", "in_review", "planned", "fixed", "rejected"];

const now = (): string => new Date().toISOString();
const isAdmin = (user: User): boolean => user.role === "admin";
const isPrivileged = (user: User): boolean => ["coach", "teamAdmin", "clubAdmin", "admin"].includes(user.role);
const createUuid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : createId("beta");

const getDeviceInfo = (): string => {
  if (typeof window === "undefined") return "";
  return `${window.innerWidth}x${window.innerHeight}${navigator.onLine ? " online" : " offline"}`;
};

export function BetaReleaseView({ data, user, mode, onDataChange }: BetaReleaseViewProps) {
  const [category, setCategory] = useState<BetaFeedbackCategory>("Fehler");
  const [priority, setPriority] = useState<BetaFeedbackPriority>("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pagePath, setPagePath] = useState("");
  const [message, setMessage] = useState("");

  const ownFeedback = data.betaFeedback.filter((item) => item.userId === user.userId && !item.deletedAt);
  const visibleFeedback = isAdmin(user) ? data.betaFeedback.filter((item) => !item.deletedAt) : ownFeedback;
  const testers = useMemo(() => {
    const stored = new Map(data.betaTesters.map((tester) => [tester.userId, tester]));
    return data.users.map((appUser) => stored.get(appUser.userId) ?? {
      id: `beta-tester-${appUser.userId}`,
      userId: appUser.userId,
      clubId: "",
      testerRole: appUser.role,
      status: "invited" as const,
      invitedAt: "",
      lastSeenAt: "",
      notes: "",
      createdAt: "",
      updatedAt: "",
    });
  }, [data.betaTesters, data.users]);

  const submitFeedback = () => {
    if (!title.trim() || !description.trim()) {
      setMessage("Bitte gib Titel und Beschreibung an.");
      return;
    }
    const timestamp = now();
    const feedback: BetaFeedback = {
      id: createUuid(),
      userId: user.userId,
      clubId: "",
      userRole: user.role,
      appVersion: APP_VERSION,
      category,
      priority,
      title: title.trim(),
      description: description.trim(),
      pagePath: pagePath.trim(),
      deviceInfo: getDeviceInfo(),
      browserInfo: typeof navigator !== "undefined" ? navigator.userAgent : "",
      status: "open",
      adminNote: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: "",
    };
    onDataChange((current) => ({ ...current, betaFeedback: [feedback, ...current.betaFeedback] }));
    void upsertCloudBetaFeedback(feedback).catch((error) => console.error("[Paddlio Beta] Feedback konnte nicht synchronisiert werden.", error));
    setTitle("");
    setDescription("");
    setPagePath("");
    setMessage("Danke. Dein Feedback wurde gespeichert.");
  };

  const updateFeedbackStatus = (feedback: BetaFeedback, status: BetaFeedbackStatus) => {
    const updated = { ...feedback, status, updatedAt: now() };
    onDataChange((current) => ({ ...current, betaFeedback: current.betaFeedback.map((item) => item.id === feedback.id ? updated : item) }));
    void upsertCloudBetaFeedback(updated).catch((error) => console.error("[Paddlio Beta] Feedbackstatus konnte nicht synchronisiert werden.", error));
  };

  const markTester = (targetUserId: string, status: BetaTester["status"]) => {
    const existing = data.betaTesters.find((tester) => tester.userId === targetUserId);
    const appUser = data.users.find((item) => item.userId === targetUserId);
    const timestamp = now();
    const tester: BetaTester = {
      id: existing?.id ?? createUuid(),
      userId: targetUserId,
      clubId: existing?.clubId ?? "",
      testerRole: existing?.testerRole ?? appUser?.role ?? "athlete",
      status,
      invitedAt: existing?.invitedAt || timestamp,
      lastSeenAt: timestamp,
      notes: existing?.notes ?? "",
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    onDataChange((current) => ({
      ...current,
      betaTesters: current.betaTesters.some((item) => item.id === tester.id)
        ? current.betaTesters.map((item) => item.id === tester.id ? tester : item)
        : [tester, ...current.betaTesters],
    }));
    void upsertCloudBetaTester(tester).catch((error) => console.error("[Paddlio Beta] Testerstatus konnte nicht synchronisiert werden.", error));
  };

  if (mode === "guide") {
    return (
      <section className="section-block segment-panel">
        <div className="section-heading"><div><p className="eyebrow">Beta-Test Anleitung</p><h3>Was getestet werden soll</h3></div></div>
        <div className="beta-guide-grid">
          <article className="beta-card"><h4>Tester</h4><ol><li>Einloggen</li><li>Profil prï¿½fen</li><li>Training ansehen</li><li>Anwesenheit setzen</li><li>Aufgabe erledigen</li><li>Nachricht testen</li><li>Ergebnis anschauen</li><li>Feedback senden</li></ol></article>
          <article className="beta-card"><h4>Trainer</h4><ol><li>Gruppe prï¿½fen</li><li>Training erstellen</li><li>Aufgabe vergeben</li><li>Anwesenheit prï¿½fen</li><li>Nachricht an Gruppe senden</li><li>Ergebnis eintragen</li><li>Feedback ansehen</li></ol></article>
          <article className="beta-card"><h4>Admin</h4><ol><li>Nutzer prï¿½fen</li><li>Rollen prï¿½fen</li><li>Verein prï¿½fen</li><li>Beta-Check starten</li><li>Feedback auswerten</li></ol></article>
        </div>
      </section>
    );
  }

  if (mode === "limitations") {
    return (
      <section className="section-block segment-panel">
        <div className="section-heading"><div><p className="eyebrow">Beta-Grenzen</p><h3>Was bewusst noch nicht fertig ist</h3></div></div>
        <div className="result-list">
          {["Polar Sync ist vorbereitet, aber OAuth folgt spaeter.", "Excel Import kommt in Version 4.2.", "Design Redesign kommt in Version 4.1.", "Technik-Check nach DKV Manual kommt spaeter.", "Paddlio Academy kommt spaeter.", "Native Push-Benachrichtigungen sind noch nicht aktiv.", "Videoanalyse ist vorbereitet, aber nicht Teil dieser Beta."].map((item) => (
            <article className="result-row" key={item}><div><strong>{item}</strong><span>Bitte diesen Punkt in der Beta nicht als Fehler werten.</span></div><b>geplant</b></article>
          ))}
        </div>
      </section>
    );
  }

  if (mode === "testers") {
    if (!isAdmin(user)) return <p className="empty-state">Du hast fï¿½r die Beta-Tester-Verwaltung keine Berechtigung.</p>;
    return (
      <section className="section-block segment-panel">
        <div className="section-heading"><div><p className="eyebrow">Beta-Tester</p><h3>{testers.length} Nutzer im Testpool</h3></div></div>
        <div className="result-list">
          {testers.map((tester) => {
            const appUser = data.users.find((item) => item.userId === tester.userId);
            const count = data.betaFeedback.filter((item) => item.userId === tester.userId).length;
            return (
              <article className="result-row beta-row" key={tester.userId}>
                <div><strong>{appUser?.profile.firstName || "Nutzer"} {appUser?.profile.lastName || ""}</strong><span>{tester.testerRole} - {tester.status}</span><small>{count} Feedbacks Â· letzter Stand {tester.lastSeenAt ? new Date(tester.lastSeenAt).toLocaleString("de-DE") : "noch offen"}</small></div>
                <div className="inline-actions">
                  <button type="button" onClick={() => markTester(tester.userId, "active")}>aktiv</button>
                  <button type="button" onClick={() => markTester(tester.userId, "paused")}>pausieren</button>
                  <button type="button" onClick={() => markTester(tester.userId, "finished")}>fertig</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="section-block segment-panel">
        <div className="section-heading"><div><p className="eyebrow">Feedback geben</p><h3>Paddlio Beta verbessern</h3></div><span className="status-pill planned">{APP_VERSION}</span></div>
        <p className="card-note">Diese Version ist eine Testversion. Funktionen koennen sich noch aendern. Bitte Fehler und Feedback melden.</p>
        <div className="form-grid">
          <label>Kategorie<select value={category} onChange={(event) => setCategory(event.target.value as BetaFeedbackCategory)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Dringlichkeit<select value={priority} onChange={(event) => setPriority(event.target.value as BetaFeedbackPriority)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Titel<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Was ist dir aufgefallen?" /></label>
          <label>Betroffene Seite<input value={pagePath} onChange={(event) => setPagePath(event.target.value)} placeholder="z. B. Training, Chat, Profil" /></label>
          <label className="full-span">Beschreibung<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Beschreibe kurz, was passiert ist oder was besser werden soll." /></label>
        </div>
        {message ? <p className="form-message">{message}</p> : null}
        <button className="save-button" type="button" onClick={submitFeedback}>Feedback senden</button>
      </section>

      <section className="section-block segment-panel">
        <div className="section-heading"><div><p className="eyebrow">{isAdmin(user) ? "Alle Feedbacks" : "Mein Feedback"}</p><h3>{visibleFeedback.length} Meldungen</h3></div></div>
        <div className="result-list">
          {visibleFeedback.length ? visibleFeedback.map((item) => (
            <article className="result-row beta-row" key={item.id}>
              <div><strong>{item.title}</strong><span>{item.category} Â· {item.priority} Â· {item.status}</span><small>{item.description}</small></div>
              {isAdmin(user) ? <select value={item.status} onChange={(event) => updateFeedbackStatus(item, event.target.value as BetaFeedbackStatus)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select> : <b>{item.status}</b>}
            </article>
          )) : <p className="empty-state">Noch kein Feedback vorhanden.</p>}
        </div>
      </section>

      {isPrivileged(user) ? <p className="muted">Hinweis fï¿½r Trainer/Admins: Feedback wird mit Rolle, Version und Gerï¿½teinfo gespeichert, damit Beta-Fehler besser reproduzierbar sind.</p> : null}
    </div>
  );
}
