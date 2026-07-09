import { useState, type ChangeEvent, type FormEvent } from "react";
import { createTrainerRequest, loadTrainerRequests } from "../data/storage";
import { getAge, getDisplayName, getInitials, getSportProfileSummary } from "../domain/profile";
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

type ProfileViewProps = {
  user: User;
  onSave: (profile: UserProfile) => void;
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

const toNumber = (value: FormDataEntryValue | null): number => Number(value ?? 0);

const getString = (formData: FormData, key: keyof UserProfile): string => String(formData.get(key) ?? "").trim();

export function ProfileView({ user, onSave }: ProfileViewProps) {
  const [profileImageDataUrl, setProfileImageDataUrl] = useState(user.profile.profileImageDataUrl);
  const [boatClasses, setBoatClasses] = useState<BoatClass[]>(user.profile.boatClasses.length > 0 ? user.profile.boatClasses : ["K1"]);
  const [paddleSide, setPaddleSide] = useState<PaddleSide | "">(user.profile.boatClasses.includes("C1") ? user.profile.paddleSide : "");
  const [savedMessage, setSavedMessage] = useState("");
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
  const age = getAge(user.profile.birthDate);
  const hasC1 = boatClasses.includes("C1");
  const previewProfile: UserProfile = {
    ...user.profile,
    boatClasses,
    paddleSide: hasC1 && paddleSide ? paddleSide : "rechts",
  };

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

  const toggleBoatClass = (boatClass: BoatClass) => {
    setBoatClasses((current) => {
      if (current.includes(boatClass)) {
        if (current.length === 1) {
          setFormError("Mindestens eine Bootsklasse muss ausgewaehlt sein.");
          return current;
        }

        setFormError("");
        if (boatClass === "C1") {
          setPaddleSide("");
        }
        return current.filter((item) => item !== boatClass);
      }

      setFormError("");
      return [...current, boatClass];
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (boatClasses.length === 0) {
      setFormError("Mindestens eine Bootsklasse muss ausgewaehlt sein.");
      return;
    }

    if (boatClasses.includes("C1") && paddleSide !== "links" && paddleSide !== "rechts") {
      setFormError("Bitte waehle für C1 eine Paddelseite aus.");
      return;
    }

    const savedPaddleSide: PaddleSide = boatClasses.includes("C1") ? (paddleSide as PaddleSide) : "rechts";

    onSave({
      firstName: getString(formData, "firstName"),
      lastName: getString(formData, "lastName"),
      nickname: getString(formData, "nickname"),
      birthDate: getString(formData, "birthDate"),
      gender: String(formData.get("gender")) as Gender,
      heightCm: toNumber(formData.get("heightCm")),
      weightKg: toNumber(formData.get("weightKg")),
      club: getString(formData, "club"),
      federation: getString(formData, "federation"),
      coach: getString(formData, "coach"),
      licenseNumber: getString(formData, "licenseNumber"),
      boatClasses,
      ageClass: String(formData.get("ageClass") ?? "") as AgeClass | "",
      paddleSide: savedPaddleSide,
      trainingYears: toNumber(formData.get("trainingYears")),
      competitionExperience: getString(formData, "competitionExperience"),
      longTermGoal: getString(formData, "longTermGoal"),
      seasonGoal: getString(formData, "seasonGoal"),
      personalNotes: getString(formData, "personalNotes"),
      profileImageDataUrl,
      darkMode: formData.get("darkMode") === "on",
      measurementUnit: String(formData.get("measurementUnit")) as MeasurementUnit,
      language: String(formData.get("language")) as AppLanguage,
    });

    setFormError("");
    setSavedMessage("Profil gespeichert");
    window.setTimeout(() => setSavedMessage(""), 2200);
  };

  const submitTrainerRequest = () => {
    if (!trainerRequestDraft.club.trim()) {
      setTrainerRequestMessage("Bitte gib deinen Verein an.");
      return;
    }

    if (!trainerRequestDraft.message.trim()) {
      setTrainerRequestMessage("Bitte schreibe kurz, warum du Trainer werden moechtest.");
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
          {profileImageDataUrl ? <img src={profileImageDataUrl} alt="" /> : getInitials(user.profile)}
        </div>
        <div>
          <p className="eyebrow">Athletenprofil</p>
          <h2>{getDisplayName(user.profile)}</h2>
          <span>{user.profile.club || "Kein Verein"}</span>
          <span>{getSportProfileSummary(previewProfile)}</span>
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
            <input name="firstName" defaultValue={user.profile.firstName} />
          </label>
          <label>
            Nachname
            <input name="lastName" defaultValue={user.profile.lastName} />
          </label>
          <label>
            Spitzname
            <input name="nickname" defaultValue={user.profile.nickname} />
          </label>
          <label>
            Geburtsdatum
            <input name="birthDate" type="date" defaultValue={user.profile.birthDate} />
          </label>
          <label>
            Alter
            <input value={age === undefined ? "Noch nicht angegeben" : `${age} Jahre`} readOnly />
          </label>
          <label>
            Geschlecht
            <select name="gender" defaultValue={user.profile.gender}>
              {genders.map((gender) => (
                <option key={gender.value} value={gender.value}>
                  {gender.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Größe
            <input name="heightCm" type="number" min="0" step="1" defaultValue={user.profile.heightCm || ""} placeholder="cm" />
          </label>
          <label>
            Gewicht
            <input name="weightKg" type="number" min="0" step="0.1" defaultValue={user.profile.weightKg || ""} placeholder="kg" />
          </label>
          <label>
            Verein
            <input name="club" defaultValue={user.profile.club} />
          </label>
          <label>
            Verband
            <input name="federation" defaultValue={user.profile.federation} />
          </label>
          <label>
            Trainer
            <input name="coach" defaultValue={user.profile.coach} />
          </label>
          <label>
            Lizenznummer
            <input name="licenseNumber" defaultValue={user.profile.licenseNumber} />
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
            <select name="ageClass" defaultValue={user.profile.ageClass}>
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
                value={paddleSide}
                onChange={(event) => {
                  setPaddleSide(event.target.value as PaddleSide | "");
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
            <input name="trainingYears" type="number" min="0" step="1" defaultValue={user.profile.trainingYears || ""} />
          </label>
        </div>
        <div className="choice-group">
          <span>Bootsklassen</span>
          <div className="boat-class-grid">
            {profileBoatClasses.map((boatClass) => (
              <label
                className={boatClasses.includes(boatClass) ? "boat-class-option active" : "boat-class-option"}
                key={boatClass}
              >
                <input
                  checked={boatClasses.includes(boatClass)}
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
          <textarea name="competitionExperience" defaultValue={user.profile.competitionExperience} rows={3} />
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
                  placeholder="Warum moechtest du Trainerrechte in Paddlio?"
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
          <textarea name="longTermGoal" defaultValue={user.profile.longTermGoal} rows={3} />
        </label>
        <label>
          Saisonziel
          <textarea name="seasonGoal" defaultValue={user.profile.seasonGoal} rows={3} />
        </label>
        <label>
          Persönliche Notizen
          <textarea name="personalNotes" defaultValue={user.profile.personalNotes} rows={4} />
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
          Profil speichern
        </button>
        {savedMessage ? <span>{savedMessage}</span> : null}
      </div>
    </form>
  );
}
