import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createTrainerRequest, loadTrainerRequests } from "../data/storage";
import { getAge, getDisplayName, getInitials, getSportProfileSummary } from "../domain/profile";
import { validateProfileImage } from "../domain/profileImage";
import type {
  AgeClass,
  AppLanguage,
  BoatClass,
  Gender,
  MeasurementUnit,
  PaddleSide,
  User,
  UserProfile,
} from "../domain/types";
import type { CloudWriteResult } from "../services/cloudWriteService";

type ProfileViewProps = {
  user: User;
  onSave: (profile: UserProfile) => Promise<CloudWriteResult>;
};

const profileBoatClasses: BoatClass[] = ["K1", "C1"];
const ageClasses: AgeClass[] = ["U10", "U12", "U14", "U16", "U18", "U23", "Leistungsklasse", "Masters"];
const genders: Array<{ value: Gender; label: string }> = [
  { value: "keine_angabe", label: "Keine Angabe" },
  { value: "weiblich", label: "Weiblich" },
  { value: "maennlich", label: "Männlich" },
  { value: "divers", label: "Divers" },
];
const paddleSides: Array<{ value: PaddleSide; label: string }> = [
  { value: "links", label: "Links" },
  { value: "rechts", label: "Rechts" },
];
const measurementUnits: Array<{ value: MeasurementUnit; label: string }> = [
  { value: "metrisch", label: "Metrisch" },
  { value: "imperial", label: "Imperial" },
];
const languages: Array<{ value: AppLanguage; label: string }> = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
];

export function ProfileView({ user, onSave }: ProfileViewProps) {
  const [draft, setDraft] = useState<UserProfile>(() => ({
    ...user.profile,
    boatClasses: user.profile.boatClasses.length > 0 ? user.profile.boatClasses : ["K1"],
  }));
  const [isDirty, setIsDirty] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [trainerRequestMessage, setTrainerRequestMessage] = useState("");
  const [trainerRequestDraft, setTrainerRequestDraft] = useState({
    club: user.profile.club,
    message: "",
    hasLicense: false,
    licenseNumber: "",
    qualification: "",
    phone: "",
    remark: "",
  });
  const [trainerRequestStatus, setTrainerRequestStatus] = useState(() =>
    loadTrainerRequests().find((request) => request.userId === user.userId)?.status ?? "",
  );
  const age = getAge(draft.birthDate);
  const hasC1 = draft.boatClasses.includes("C1");
  const previewProfile: UserProfile = {
    ...draft,
    paddleSide: hasC1 ? draft.paddleSide : "rechts",
  };

  useEffect(() => {
    if (isDirty || isSaving) return;
    setDraft({
      ...user.profile,
      boatClasses: user.profile.boatClasses.length > 0 ? user.profile.boatClasses : ["K1"],
    });
  }, [user.userId, user.updatedAt, isDirty, isSaving]);

  const updateDraft = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    setSavedMessage("");
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateProfileImage(file);
    if (validationError) {
      setFormError(validationError);
      event.target.value = "";
      return;
    }
    setFormError("");

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      updateDraft("profileImageDataUrl", typeof reader.result === "string" ? reader.result : "");
    });
    reader.readAsDataURL(file);
  };

  const toggleBoatClass = (boatClass: BoatClass) => {
    setDraft((current) => {
      const currentClasses = current.boatClasses;
      if (currentClasses.includes(boatClass)) {
        if (currentClasses.length === 1) {
          setFormError("Mindestens eine Bootsklasse muss ausgewählt sein.");
          return current;
        }

        setFormError("");
        setIsDirty(true);
        return { ...current, boatClasses: currentClasses.filter((item) => item !== boatClass) };
      }

      setFormError("");
      setIsDirty(true);
      return { ...current, boatClasses: [...currentClasses, boatClass] };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.boatClasses.length === 0) {
      setFormError("Mindestens eine Bootsklasse muss ausgewählt sein.");
      return;
    }

    if (draft.boatClasses.includes("C1") && draft.paddleSide !== "links" && draft.paddleSide !== "rechts") {
      setFormError("Bitte wähle für C1 eine Paddelseite aus.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    setSavedMessage("");

    try {
      const submittedProfile: UserProfile = {
        ...draft,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        nickname: draft.nickname.trim(),
        club: user.profile.club,
        paddleSide: draft.boatClasses.includes("C1") ? draft.paddleSide : "rechts",
      };
      const result = await onSave(submittedProfile);

      setSavedMessage(result === "synced" ? "Profil gespeichert und synchronisiert" : "Profil lokal gespeichert. Die Synchronisierung folgt automatisch.");
      setDraft(submittedProfile);
      setIsDirty(false);
      window.setTimeout(() => setSavedMessage(""), 2600);
    } catch (error) {
      console.error("Profil konnte nicht gespeichert werden", error);
      const message = error instanceof Error ? error.message : "";
      setFormError(message.includes("profile_data_schema_missing")
        ? "Das Profil konnte nicht vollständig synchronisiert werden. Bitte aktualisiere die Development-Datenbank und versuche es erneut."
        : "Das Profil konnte nicht synchronisiert werden. Bitte prüfe die Verbindung und versuche es erneut.");
    } finally {
      setIsSaving(false);
    }
  };

  const submitTrainerRequest = () => {
    if (!trainerRequestDraft.club.trim()) {
      setTrainerRequestMessage("Bitte gib deinen Verein an.");
      return;
    }

    if (!trainerRequestDraft.message.trim()) {
      setTrainerRequestMessage("Bitte schreibe kurz, warum du Trainer werden möchtest.");
      return;
    }

    const request = createTrainerRequest({
      userId: user.userId,
      ...trainerRequestDraft,
    });
    setTrainerRequestStatus(request.status);
    setTrainerRequestMessage("Vielen Dank. Deine Anfrage wurde an den Admin gesendet. Nach erfolgreicher Prüfung werden Trainerrechte automatisch freigeschaltet.");
  };

  const updateTrainerDraft = (key: keyof typeof trainerRequestDraft, value: string | boolean) => {
    setTrainerRequestDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setTrainerRequestMessage("");
  };

  return (
    <form className="profile-form stack" onSubmit={handleSubmit}>
      <section className="profile-hero-card">
        <div className="profile-avatar large">
          {draft.profileImageDataUrl ? <img src={draft.profileImageDataUrl} alt="" /> : getInitials(draft)}
        </div>
        <div>
          <p className="eyebrow">Athletenprofil</p>
          <h2>{getDisplayName(draft)}</h2>
          <div className="profile-summary-line">
            <span>{user.profile.club || "Kein Verein"}</span>
            <span>{getSportProfileSummary(previewProfile)}</span>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Person</p>
            <h3>Basisdaten</h3>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Vorname
            <input name="firstName" value={draft.firstName} onChange={(event) => updateDraft("firstName", event.target.value)} />
          </label>
          <label>
            Nachname
            <input name="lastName" value={draft.lastName} onChange={(event) => updateDraft("lastName", event.target.value)} />
          </label>
          <label>
            Spitzname
            <input name="nickname" value={draft.nickname} onChange={(event) => updateDraft("nickname", event.target.value)} />
          </label>
          <label>
            Geburtsdatum
            <input name="birthDate" type="date" value={draft.birthDate} onChange={(event) => updateDraft("birthDate", event.target.value)} />
          </label>
          <label>
            Alter
            <input value={age === undefined ? "Noch nicht angegeben" : `${age} Jahre`} readOnly />
          </label>
          <label>
            Geschlecht
            <select name="gender" value={draft.gender} onChange={(event) => updateDraft("gender", event.target.value as Gender)}>
              {genders.map((gender) => (
                <option key={gender.value} value={gender.value}>
                  {gender.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Größe
            <input name="heightCm" type="number" min="0" step="1" value={draft.heightCm || ""} onChange={(event) => updateDraft("heightCm", Number(event.target.value || 0))} placeholder="cm" />
          </label>
          <label>
            Gewicht
            <input name="weightKg" type="number" min="0" step="0.1" value={draft.weightKg || ""} onChange={(event) => updateDraft("weightKg", Number(event.target.value || 0))} placeholder="kg" />
          </label>
          <label>
            Verein
            <input id="profile-club" value={user.profile.club || "Kein Verein zugeordnet"} readOnly aria-describedby="profile-club-help" />
            <small id="profile-club-help">Die Vereinszuordnung wird aus Sicherheitsgründen durch einen berechtigten Vereins- oder Paddlio-Admin geändert.</small>
          </label>
          <label>
            Verband
            <input name="federation" value={draft.federation} onChange={(event) => updateDraft("federation", event.target.value)} />
          </label>
          <label>
            Trainer
            <input name="coach" value={draft.coach} onChange={(event) => updateDraft("coach", event.target.value)} />
          </label>
          <label>
            Lizenznummer
            <input name="licenseNumber" value={draft.licenseNumber} onChange={(event) => updateDraft("licenseNumber", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Sport</p>
            <h3>Kanuslalom</h3>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Altersklasse
            <select name="ageClass" value={draft.ageClass} onChange={(event) => updateDraft("ageClass", event.target.value as AgeClass | "")}>
              <option value="">Bitte wählen</option>
              {ageClasses.map((ageClass) => (
                <option key={ageClass} value={ageClass}>
                  {ageClass}
                </option>
              ))}
            </select>
          </label>
          {hasC1 ? (
            <label>
              Paddelseite
              <select
                name="paddleSide"
                value={draft.paddleSide}
                onChange={(event) => {
                  updateDraft("paddleSide", event.target.value as PaddleSide);
                  setFormError("");
                }}
                required
              >
                <option value="">Bitte wählen</option>
                {paddleSides.map((side) => (
                  <option key={side.value} value={side.value}>
                    {side.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Trainingsjahre
            <input name="trainingYears" type="number" min="0" step="1" value={draft.trainingYears || ""} onChange={(event) => updateDraft("trainingYears", Number(event.target.value || 0))} />
          </label>
        </div>
        <div className="choice-group">
          <span>Bootsklassen</span>
          <div className="boat-class-grid">
            {profileBoatClasses.map((boatClass) => (
              <label
                className={draft.boatClasses.includes(boatClass) ? "boat-class-option active" : "boat-class-option"}
                key={boatClass}
              >
                <input
                  checked={draft.boatClasses.includes(boatClass)}
                  onChange={() => toggleBoatClass(boatClass)}
                  type="checkbox"
                />
                {boatClass}
              </label>
            ))}
          </div>
          {formError ? <small className="form-error">{formError}</small> : null}
        </div>
        <label>
          Wettkampferfahrung
          <textarea name="competitionExperience" value={draft.competitionExperience} onChange={(event) => updateDraft("competitionExperience", event.target.value)} rows={3} />
        </label>
      </section>

      {user.role === "athlete" ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trainerstatus</p>
              <h3>{trainerRequestStatus === "open" ? "Anfrage offen" : trainerRequestStatus === "rejected" ? "Anfrage abgelehnt" : "Du bist aktuell Sportler"}</h3>
            </div>
          </div>
          {trainerRequestStatus === "open" ? (
            <p className="card-note">Deine Traineranfrage liegt beim Admin und wartet auf Prüfung.</p>
          ) : (
            <div className="stack">
              <div className="form-grid">
                <label>
                  Verein
                  <input
                    value={trainerRequestDraft.club}
                    onChange={(event) => updateTrainerDraft("club", event.target.value)}
                  />
                </label>
                <label>
                  Telefon
                  <input
                    value={trainerRequestDraft.phone}
                    onChange={(event) => updateTrainerDraft("phone", event.target.value)}
                  />
                </label>
                <label>
                  Qualifikation
                  <input
                    value={trainerRequestDraft.qualification}
                    onChange={(event) => updateTrainerDraft("qualification", event.target.value)}
                  />
                </label>
                <label>
                  Lizenznummer optional
                  <input
                    value={trainerRequestDraft.licenseNumber}
                    onChange={(event) => updateTrainerDraft("licenseNumber", event.target.value)}
                  />
                </label>
              </div>
              <label className="toggle-row">
                <span>Trainerlizenz vorhanden</span>
                <input
                  checked={trainerRequestDraft.hasLicense}
                  onChange={(event) => updateTrainerDraft("hasLicense", event.target.checked)}
                  type="checkbox"
                />
              </label>
              <label>
                Nachricht
                <textarea
                  rows={3}
                  value={trainerRequestDraft.message}
                  onChange={(event) => updateTrainerDraft("message", event.target.value)}
                  placeholder="Warum möchtest du Trainerrechte in Paddlio?"
                />
              </label>
              <label>
                Bemerkung
                <textarea
                  rows={3}
                  value={trainerRequestDraft.remark}
                  onChange={(event) => updateTrainerDraft("remark", event.target.value)}
                />
              </label>
              <button className="secondary-button" type="button" onClick={submitTrainerRequest}>
                Traineranfrage absenden
              </button>
            </div>
          )}
          {trainerRequestMessage ? <p className="auth-message">{trainerRequestMessage}</p> : null}
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ziele</p>
            <h3>Persönlicher Fokus</h3>
          </div>
        </div>
        <label>
          Langfristiges Ziel
          <textarea name="longTermGoal" value={draft.longTermGoal} onChange={(event) => updateDraft("longTermGoal", event.target.value)} rows={3} />
        </label>
        <label>
          Saisonziel
          <textarea name="seasonGoal" value={draft.seasonGoal} onChange={(event) => updateDraft("seasonGoal", event.target.value)} rows={3} />
        </label>
        <label>
          Persönliche Notizen
          <textarea name="personalNotes" value={draft.personalNotes} onChange={(event) => updateDraft("personalNotes", event.target.value)} rows={4} />
        </label>
      </section>

      <section className="section-block" id="profile-settings">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Einstellungen</p>
            <h3>App</h3>
          </div>
        </div>
        <label>
          Profilbild
          <input accept="image/jpeg,image/png,image/webp" type="file" onChange={handleImageChange} />
        </label>
        <div className="form-grid">
          <label>
            Maßeinheiten
            <select name="measurementUnit" value={draft.measurementUnit} onChange={(event) => updateDraft("measurementUnit", event.target.value as MeasurementUnit)}>
              {measurementUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sprache
            <select name="language" value={draft.language} onChange={(event) => updateDraft("language", event.target.value as AppLanguage)}>
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
          <input name="darkMode" type="checkbox" checked={draft.darkMode} onChange={(event) => updateDraft("darkMode", event.target.checked)} />
        </label>
      </section>

      <div className="sticky-save">
        <button className="save-button" type="submit" disabled={isSaving}>
          {isSaving ? "Profil wird gespeichert..." : "Profil speichern"}
        </button>
        {formError ? (
          <div className="form-status-box error" role="alert">
            <strong>Profil konnte nicht synchronisiert werden</strong>
            <span>{formError}</span>
          </div>
        ) : null}
        {savedMessage ? <span>{savedMessage}</span> : null}
      </div>
    </form>
  );
}

