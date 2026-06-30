import { useState, type ChangeEvent, type FormEvent } from "react";
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
  { value: "maennlich", label: "Maennlich" },
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
  const [savedMessage, setSavedMessage] = useState("");
  const [formError, setFormError] = useState("");
  const age = getAge(user.profile.birthDate);
  const hasC1 = boatClasses.includes("C1");

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
        return current.filter((item) => item !== boatClass);
      }

      setFormError("");
      return [...current, boatClass];
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextPaddleSide = String(formData.get("paddleSide") ?? "") as PaddleSide;

    if (boatClasses.length === 0) {
      setFormError("Mindestens eine Bootsklasse muss ausgewaehlt sein.");
      return;
    }

    if (boatClasses.includes("C1") && nextPaddleSide !== "links" && nextPaddleSide !== "rechts") {
      setFormError("Bitte waehle fuer C1 eine Paddelseite aus.");
      return;
    }

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
      paddleSide: boatClasses.includes("C1") ? nextPaddleSide : "rechts",
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
          <span>{getSportProfileSummary(user.profile)}</span>
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
            Groesse
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
              <option value="">Bitte waehlen</option>
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
              <select name="paddleSide" defaultValue={user.profile.paddleSide}>
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
          <div className="segmented-row">
            {profileBoatClasses.map((boatClass) => (
              <button
                className={boatClasses.includes(boatClass) ? "segment active" : "segment"}
                key={boatClass}
                type="button"
                onClick={() => toggleBoatClass(boatClass)}
                aria-pressed={boatClasses.includes(boatClass)}
              >
                {boatClass}
              </button>
            ))}
          </div>
          {formError ? <small className="form-error">{formError}</small> : null}
        </div>
        <label>
          Wettkampferfahrung
          <textarea name="competitionExperience" defaultValue={user.profile.competitionExperience} rows={3} />
        </label>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ziele</p>
            <h3>Persoenlicher Fokus</h3>
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
          Persoenliche Notizen
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
            Masseinheiten
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
