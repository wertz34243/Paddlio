import { useState, type ChangeEvent, type FormEvent } from "react";
import { getInitials } from "../domain/profile";
import type { AppLanguage, MeasurementUnit, User, UserProfile } from "../domain/types";
import type { ProfileSyncDiagnostics } from "../auth/AuthProvider";
import { discardOfflineQueueItem, getOfflineQueueDiagnostics } from "../services/offlineQueueService";

type SettingsViewProps = {
  user: User;
  syncStatus?: {
    status: string;
    syncCount: number;
    pendingSyncCount: number;
    failedSyncCount: number;
    lastSyncAt: string;
    message: string;
    isAdmin: boolean;
    profileSyncDiagnostics: ProfileSyncDiagnostics;
  };
  onSave: (settings: Pick<UserProfile, "profileImageDataUrl" | "darkMode" | "measurementUnit" | "language">) => void;
  onLogout: () => void;
};

const measurementUnits: Array<{ value: MeasurementUnit; label: string }> = [
  { value: "metrisch", label: "Metrisch" },
  { value: "imperial", label: "Imperial" },
];

const languages: Array<{ value: AppLanguage; label: string }> = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
];

export function SettingsView({ user, syncStatus, onSave, onLogout }: SettingsViewProps) {
  const [profileImageDataUrl, setProfileImageDataUrl] = useState(user.profile.profileImageDataUrl);
  const [savedMessage, setSavedMessage] = useState("");

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setProfileImageDataUrl(typeof reader.result === "string" ? reader.result : "");
    });
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSave({
      profileImageDataUrl,
      darkMode: formData.get("darkMode") === "on",
      measurementUnit: String(formData.get("measurementUnit")) as MeasurementUnit,
      language: String(formData.get("language")) as AppLanguage,
    });

    setSavedMessage("Einstellungen gespeichert");
    window.setTimeout(() => setSavedMessage(""), 2200);
  };

  return (
    <form className="profile-form stack segment-panel" onSubmit={handleSubmit}>
      <section className="profile-hero-card">
        <div className="profile-avatar large">
          {profileImageDataUrl ? <img src={profileImageDataUrl} alt="" /> : getInitials(user.profile)}
        </div>
        <div>
          <h2>App und Profilbild</h2>
          <span>{user.profile.club || "Kein Verein"}</span>
        </div>
      </section>

      {syncStatus ? <SettingsSyncPanel syncStatus={syncStatus} /> : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">App</p>
            <h3>Einstellungen</h3>
          </div>
        </div>
        <label>
          Profilbild
          <input accept="image/*" type="file" onChange={handleImageChange} />
        </label>
        <div className="form-grid">
          <label>
            Maßeinheiten
            <select name="measurementUnit" defaultValue={user.profile.measurementUnit}>
              {measurementUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sprache
            <select name="language" defaultValue={user.profile.language}>
              {languages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="toggle-row">
          <span>Dark Mode</span>
          <input name="darkMode" type="checkbox" defaultChecked={user.profile.darkMode} />
        </label>
      </section>

      <div className="sticky-save">
        <button className="save-button" type="submit">
          Einstellungen speichern
        </button>
        {savedMessage ? <span>{savedMessage}</span> : null}
      </div>

      <section className="section-block account-actions">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Account</p>
            <h3>Sitzung</h3>
          </div>
        </div>
        <p className="card-note">Melde dich ab, wenn du Paddlio auf einem geteilten Gerät nutzt.</p>
        <button className="danger-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </section>
    </form>
  );
}

function SettingsSyncPanel({ syncStatus }: { syncStatus: NonNullable<SettingsViewProps["syncStatus"]> }) {
  const [diagnosticRevision, setDiagnosticRevision] = useState(0);
  const diagnostics = syncStatus.isAdmin ? getOfflineQueueDiagnostics() : [];
  void diagnosticRevision;
  const formatMatch = (value: boolean | null | undefined) => value === true ? "true" : value === false ? "false" : "null";
  const discardLegacyItem = (queueItemId: string) => {
    if (!window.confirm("Lokalen Legacy-Eintrag verwerfen? Dadurch wird nur dieser lokale Queue-Eintrag entfernt. Training und Cloud-Feedback bleiben unverändert.")) return;
    if (discardOfflineQueueItem(queueItemId)) setDiagnosticRevision((value) => value + 1);
  };
  const syncLabel = syncStatus.lastSyncAt
    ? new Date(syncStatus.lastSyncAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : "";
  const label =
    syncStatus.status === "connected" ? "Vollständig synchronisiert" :
      syncStatus.status === "syncing" ? "Sync läuft..." :
          syncStatus.status === "pending" ? "Synchronisierung ausstehend" :
          syncStatus.status === "limited" ? "Teilweise synchronisiert" :
            syncStatus.status === "offline" ? "Offline" :
              syncStatus.status === "error" ? "Nicht synchronisiert" :
                "Lokal";
  const message =
    syncStatus.status === "connected" ? (syncLabel ? `Letzter Sync um ${syncLabel}.` : "Deine Daten sind synchronisiert.") :
      syncStatus.status === "syncing" ? "Änderungen werden gerade abgeglichen." :
        syncStatus.status === "pending" ? "Änderungen warten auf Synchronisation." :
          syncStatus.status === "limited" ? "Die App ist nutzbar, einige Zusatzbereiche konnten nicht synchronisiert werden." :
            syncStatus.status === "error" ? "Profil, Training oder Kernspeicher konnten nicht sicher synchronisiert werden." :
              syncStatus.status === "offline" ? "Du bist offline. Änderungen werden später synchronisiert." :
                "Lokaler Modus aktiv.";
  const tone = syncStatus.status === "connected" ? "green" : syncStatus.status === "error" ? "red" : "yellow";

  return (
    <section className={`section-block settings-sync-panel ${tone}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Synchronisierung</p>
          <h3>Cloud Status</h3>
        </div>
        <span className="settings-sync-pill">{label}</span>
      </div>
      <p className="card-note">{message}</p>
      <div className="settings-sync-facts">
        <span>{syncStatus.syncCount} Datensätze bestätigt</span>
        <span>{syncStatus.pendingSyncCount} ausstehend</span>
        <span>{syncStatus.failedSyncCount} fehlgeschlagen</span>
        {syncLabel ? <span>Letzter Sync {syncLabel}</span> : null}
      </div>
      {syncStatus.message && syncStatus.status !== "connected" ? (
        <p className="settings-sync-detail">{syncStatus.message}</p>
      ) : null}
      {diagnostics.length > 0 ? (
        <details className="settings-sync-diagnostics">
          <summary>Technische Sync-Diagnose</summary>
          <ul>
            {diagnostics.map((item, index) => (
              <li key={`${item.table}-${item.entityId}-${index}`}>
                <code>{item.table}</code> · {item.operation} · {item.entityId} · {item.errorCode} · {item.errorKind}
                <br />Scope {item.userScope} · {new Date(item.createdAt).toLocaleString("de-DE")}
                {item.table === "training_feedback" ? (
                  <>
                    <br />Typ {item.feedbackType} · Athlete aktuell: {formatMatch(item.athleteMatchesCurrentUser)}
                    <br />Autor aktuell: {formatMatch(item.authorMatchesCurrentUser)} · Coach aktuell: {formatMatch(item.coachMatchesCurrentUser)}
                    <br />Trainingszugriff: {String(item.hasTrainingAccess ?? "unknown")} · Legacy: {String(item.legacyPayload ?? false)}
                    <br />Entscheidung: <code>{item.repairDecision}</code>
                    {item.repairDecision === "cannot_reconstruct" || item.repairDecision === "invalid_foreign_identity" ? (
                      <button className="danger-button" type="button" onClick={() => discardLegacyItem(item.queueItemId)}>
                        Lokalen Legacy-Eintrag verwerfen
                      </button>
                    ) : null}
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {syncStatus.isAdmin ? (
        <details className="settings-sync-diagnostics">
          <summary>Profil-Sync-Diagnose</summary>
          <ul>
            <li>Eigenes Profil: {syncStatus.profileSyncDiagnostics.ownProfileFetch}</li>
            <li>Profilverzeichnis: {syncStatus.profileSyncDiagnostics.profileDirectoryFetch}</li>
            <li>Realtime: {syncStatus.profileSyncDiagnostics.realtime}</li>
            <li>Profilzeile vorhanden: {String(syncStatus.profileSyncDiagnostics.profileRowPresent)}</li>
            <li>Rolle geladen: {String(syncStatus.profileSyncDiagnostics.roleLoaded)}</li>
            <li>Verein geladen: {String(syncStatus.profileSyncDiagnostics.clubLoaded)}</li>
            <li>Aktiver Verein geladen: {String(syncStatus.profileSyncDiagnostics.activeClubLoaded)}</li>
            <li>Profilwarnung: {syncStatus.profileSyncDiagnostics.profileWarningReason || "keine"}</li>
            <li>Teilstatus: {syncStatus.profileSyncDiagnostics.partialSyncReason || "keiner"}</li>
            <li>Letzter Fehler: {syncStatus.profileSyncDiagnostics.lastErrorScope || "keiner"} · {syncStatus.profileSyncDiagnostics.lastErrorCode || "-"}</li>
            <li>HTTP-Status: {syncStatus.profileSyncDiagnostics.lastErrorStatus || "-"}</li>
            <li>Fehlerdetail: {syncStatus.profileSyncDiagnostics.lastErrorMessage || "-"}</li>
            <li>Letzter Profilerfolg: {syncStatus.profileSyncDiagnostics.lastSuccessAt ? new Date(syncStatus.profileSyncDiagnostics.lastSuccessAt).toLocaleString("de-DE") : "-"}</li>
          </ul>
        </details>
      ) : null}
    </section>
  );
}
