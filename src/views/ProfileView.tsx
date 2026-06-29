import { useState, type ChangeEvent, type FormEvent } from "react";
import { getAge, getBoatClassSummary, getDisplayName, getInitials } from "../domain/profile";
import type {
  AppLanguage,
  Gender,
  MeasurementUnit,
  PaddleSide,
  ProfileBoatClass,
  User,
  UserProfile,
} from "../domain/types";

type ProfileViewProps = {
  user: User;
  onSave: (profile: UserProfile) => void;
};

const profileBoatClasses: ProfileBoatClass[] = ["K1", "C1", "C2"];
const genders: Array<{ value: Gender; label: string }> = [
  { value: "keine_angabe", label: "Keine Angabe" },
  { value: "weiblich", label: "Weiblich" },
  { value: "maennlich", label: "Maennlich" },
  { value: "divers", label: "Divers" },
];
const paddleSides: Array<{ value: PaddleSide; label: string }> = [
  { value: "rechts", label: "Rechts" },
  { value: "links", label: "Links" },
  { value: "wechselnd", label: "Wechselnd" },
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
  const [additionalBoatClasses, setAdditionalBoatClasses] = useState<ProfileBoatClass[]>(user.profile.additionalBoatClasses);
  const [savedMessage, setSavedMessage] = useState("");
  const age = getAge(user.profile.birthDate);

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

  const toggleBoatClass = (boatClass: ProfileBoatClass) => {
    setAdditionalBoatClasses((current) =>
      current.includes(boatClass)
        ? current.filter((item) => item !== boatClass)
        : [...current, boatClass],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

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
      mainBoatClass: String(formData.get("mainBoatClass")) as ProfileBoatClass,
      additionalBoatClasses,
      performanceClass: getString(formData, "performanceClass"),
      paddleSide: String(formData.get("paddleSide")) as PaddleSide,
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
          <span>{user.profile.club || "Kein Verein"} - {getBoatClassSummary(user.profile)}</span>
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
            Hauptboot
            <select name="mainBoatClass" defaultValue={user.profile.mainBoatClass}>
              {profileBoatClasses.map((boatClass) => (
                <option key={boatClass} value={boatClass}>
                  {boatClass}
                </option>
              ))}
            </select>
          </label>
          <label>
            Leistungsklasse
            <input name="performanceClass" defaultValue={user.profile.performanceClass} />
          </label>
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
          <label>
            Trainingsjahre
            <input name="trainingYears" type="number" min="0" step="1" defaultValue={user.profile.trainingYears || ""} />
          </label>
        </div>
        <div className="choice-group">
          <span>Weitere Bootsklassen</span>
          <div className="segmented-row">
            {profileBoatClasses.map((boatClass) => (
              <button
                className={additionalBoatClasses.includes(boatClass) ? "segment active" : "segment"}
                key={boatClass}
                type="button"
                onClick={() => toggleBoatClass(boatClass)}
              >
                {boatClass}
              </button>
            ))}
          </div>
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

      <section className="section-block">
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
