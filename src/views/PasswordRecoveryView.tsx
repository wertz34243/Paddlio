import { useState, type FormEvent } from "react";
import { APP_NAME, APP_SLOGAN } from "../brand";
import type { CloudAuthResult } from "../auth/AuthProvider";

type PasswordRecoveryViewProps = {
  hasSession: boolean;
  onUpdatePassword: (password: string) => Promise<CloudAuthResult>;
  onRequestNewLink: () => Promise<void>;
};

const passwordMeetsRequirements = (password: string): boolean =>
  password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

export function PasswordRecoveryView({ hasSession, onUpdatePassword, onRequestNewLink }: PasswordRecoveryViewProps) {
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(hasSession ? "" : "Dieser Link ist ungültig oder abgelaufen.");
  const [messageOk, setMessageOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!hasSession) {
      setMessage("Dieser Link ist ungültig oder abgelaufen.");
      setMessageOk(false);
      return;
    }

    if (!passwordMeetsRequirements(password)) {
      setMessage("Bitte nutze mindestens 8 Zeichen mit Großbuchstabe, Kleinbuchstabe und Zahl.");
      setMessageOk(false);
      return;
    }

    if (password !== passwordRepeat) {
      setMessage("Die Passwörter stimmen nicht überein.");
      setMessageOk(false);
      return;
    }

    setSubmitting(true);
    const result = await onUpdatePassword(password);
    setSubmitting(false);
    setMessage(result.message ?? "");
    setMessageOk(result.ok);
    if (result.ok) {
      setPassword("");
      setPasswordRepeat("");
      window.setTimeout(() => {
        void onRequestNewLink();
      }, 1600);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card password-recovery-card" aria-labelledby="password-recovery-title">
        <div className="auth-brand">
          <p className="app-brand">{APP_NAME}</p>
          <p className="brand-slogan">{APP_SLOGAN}</p>
          <span>Lege dein neues Passwort sicher fest.</span>
        </div>

        <div className="password-recovery-heading">
          <p className="eyebrow">Passwort-Reset</p>
          <h1 id="password-recovery-title">Neues Passwort festlegen</h1>
          <p>Lege ein neues Passwort für dein Paddlio-Konto fest.</p>
        </div>

        {hasSession ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Neues Passwort
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Passwort wiederholen
              <input
                value={passwordRepeat}
                onChange={(event) => setPasswordRepeat(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="toggle-row password-visibility-toggle">
              <span>Passwort anzeigen</span>
              <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
            </label>
            <p className="card-note">Mindestens 8 Zeichen, ein Großbuchstabe, ein Kleinbuchstabe und eine Zahl.</p>
            <button className="save-button" type="submit" disabled={submitting}>
              {submitting ? "Speichere..." : "Passwort speichern"}
            </button>
          </form>
        ) : (
          <button className="save-button" type="button" onClick={() => void onRequestNewLink()}>
            Neuen Link anfordern
          </button>
        )}

        {message ? (
          <div className={`auth-message ${messageOk ? "success" : ""}`}>
            <p>{message}</p>
            {hasSession && !messageOk && message.includes("Link") ? (
              <button className="ghost-button" type="button" onClick={() => void onRequestNewLink()}>
                Neuen Link anfordern
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
