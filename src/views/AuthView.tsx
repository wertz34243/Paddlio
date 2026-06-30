import { useState, type FormEvent } from "react";
import { APP_NAME, APP_SLOGAN } from "../brand";
import type { AuthResult, LoginInput, RegisterInput } from "../data/storage";

type AuthMode = "login" | "register";

type AuthViewProps = {
  onLogin: (input: LoginInput) => AuthResult;
  onRegister: (input: RegisterInput) => AuthResult;
};

export function AuthView({ onLogin, onRegister }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");
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
      invitationCode: String(formData.get("invitationCode") ?? ""),
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
          <span>Lokale Demo-Auth fuer dein Athletenkonto</span>
        </div>

        <div className="auth-tabs" aria-label="Authentifizierung">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => switchMode("login")}>
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => switchMode("register")}>
            Registrieren
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
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-grid">
              <label>
                Vorname
                <input name="firstName" autoComplete="given-name" required />
              </label>
              <label>
                Nachname
                <input name="lastName" autoComplete="family-name" />
              </label>
            </div>
            <label>
              E-Mail
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Passwort
              <input name="password" type="password" autoComplete="new-password" minLength={4} required />
            </label>
            <label>
              Einladungscode optional
              <input name="invitationCode" autoComplete="off" placeholder="z. B. COACH-ABC123" />
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
