import { useState, type FormEvent } from "react";
import { APP_NAME, APP_SLOGAN } from "../brand";
import { loadClubs, type AuthResult, type LoginInput, type RegisterInput } from "../data/storage";

type AuthMode = "login" | "register";

type AuthViewProps = {
  onLogin: (input: LoginInput) => AuthResult;
  onRegister: (input: RegisterInput) => AuthResult;
};

export function AuthView({ onLogin, onRegister }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [clubs] = useState(() => loadClubs().filter((club) => club.status === "active"));
  const [suggestClub, setSuggestClub] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = onLogin({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!result.ok) {
      setMessage(result.message);
    }
  };

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = onRegister({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      passwordRepeat: String(formData.get("passwordRepeat") ?? ""),
      clubId: suggestClub ? "" : String(formData.get("clubId") ?? ""),
      club: String(formData.get("club") ?? ""),
      suggestClub,
      privacyAccepted: formData.get("privacyAccepted") === "on",
    });

    if (!result.ok) {
      setMessage(result.message);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage("");
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <p className="app-brand">{APP_NAME}</p>
          <p className="brand-slogan">{APP_SLOGAN}</p>
          <span>Kanuslalom Training, Wettkampf und Teamplattform</span>
        </div>

        <div className="auth-tabs" aria-label="Authentifizierung">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => switchMode("login")}>
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => switchMode("register")}>
            Konto erstellen
          </button>
        </div>

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              E-Mail
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Passwort
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button className="save-button" type="submit">
              Einloggen
            </button>
            <button className="text-button" type="button" onClick={() => setMessage("Passwort vergessen ist fuer die Cloud-Version vorbereitet.")}>
              Passwort vergessen
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-grid">
              <label>
                Vorname
                <input name="firstName" autoComplete="given-name" minLength={2} required />
              </label>
              <label>
                Nachname
                <input name="lastName" autoComplete="family-name" minLength={2} required />
              </label>
            </div>
            <label>
              E-Mail
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <div className="choice-group">
              <span>Verein</span>
              <div className="auth-tabs">
                <button className={!suggestClub ? "active" : ""} type="button" onClick={() => setSuggestClub(false)}>
                  Verein auswaehlen
                </button>
                <button className={suggestClub ? "active" : ""} type="button" onClick={() => setSuggestClub(true)}>
                  Verein vorschlagen
                </button>
              </div>
            </div>
            {suggestClub ? (
              <label>
                Vereinsname
                <input name="club" autoComplete="organization" required placeholder="z. B. Muelheimer Kanu Club" />
              </label>
            ) : (
              <label>
                Verein
                <select name="clubId" required>
                  <option value="">Bitte waehlen</option>
                  {clubs.map((club) => (
                    <option key={club.clubId} value={club.clubId}>
                      {club.name}
                    </option>
                  ))}
                </select>
                {clubs.length === 0 ? <small className="card-note">Noch kein offizieller Verein vorhanden. Bitte Verein vorschlagen.</small> : null}
              </label>
            )}
            <div className="form-grid">
              <label>
                Passwort
                <input name="password" type="password" autoComplete="new-password" minLength={8} required />
              </label>
              <label>
                Passwort wiederholen
                <input name="passwordRepeat" type="password" autoComplete="new-password" minLength={8} required />
              </label>
            </div>
            <p className="card-note">Empfohlen: Grossbuchstabe, Kleinbuchstabe und Zahl.</p>
            <label className="toggle-row">
              <span>Datenschutz akzeptieren</span>
              <input name="privacyAccepted" type="checkbox" required />
            </label>
            <button className="save-button" type="submit">
              Konto erstellen
            </button>
          </form>
        )}

        {message ? <p className="auth-message">{message}</p> : null}
      </section>
    </main>
  );
}
