import { useState, type ChangeEvent, type FormEvent } from "react";
import { getInitials } from "../domain/profile";
import type { AppLanguage, MeasurementUnit, User, UserProfile } from "../domain/types";

type SettingsViewProps = {
  user: User;
  syncStatus?: {
    status: string;
    syncCount: number;
    pendingSyncCount: number;
    lastSyncAt: string;
    message: string;
    isAdmin: boolean;
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
  const syncLabel = syncStatus.lastSyncAt
    ? new Date(syncStatus.lastSyncAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : "";
  const label =
    syncStatus.status === "connected" ? "Synchronisiert" :
      syncStatus.status === "syncing" ? "Sync läuft..." :
        syncStatus.status === "pending" ? "Sync ausstehend" :
          syncStatus.status === "limited" ? "Cloud eingeschränkt" :
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
  const tone = syncStatus.status === "connected" ? "green" : syncStatus.status === "error" || syncStatus.status === "offline" ? "red" : "yellow";

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
        {syncLabel ? <span>Letzter Sync {syncLabel}</span> : null}
      </div>
      {syncStatus.message && (syncStatus.isAdmin || syncStatus.status === "error") ? (
        <p className="settings-sync-detail">{syncStatus.message}</p>
      ) : null}
    </section>
  );
}
