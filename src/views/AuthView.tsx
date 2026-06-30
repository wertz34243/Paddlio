import { useState, type FormEvent } from "react";
import { APP_NAME, APP_SLOGAN } from "../brand";
import type { AuthResult, LoginInput, RegisterInput } from "../data/storage";

type AuthViewProps = {
  onLogin: (input: LoginInput) => AuthResult;
  onAcceptInvitation: (input: RegisterInput) => AuthResult;
};

export function AuthView({ onLogin, onAcceptInvitation }: AuthViewProps) {
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

  const handleAcceptInvitation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = onAcceptInvitation({
      invitationCode: String(formData.get("invitationCode") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    form.reset();
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <p className="app-brand">{APP_NAME}</p>
          <p className="brand-slogan">{APP_SLOGAN}</p>
          <span>Login fuer eingeladene Athleten, Coaches und Admins</span>
        </div>

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

        <div className="invite-auth-panel">
          <div>
            <p className="eyebrow">Einladung</p>
            <h3>Konto aktivieren</h3>
            <p className="card-note">Neue Nutzer koennen Paddlio nur mit einem gueltigen Einladungscode aktivieren.</p>
          </div>
          <form className="auth-form" onSubmit={handleAcceptInvitation}>
            <label>
              Einladungscode
              <input name="invitationCode" autoComplete="off" placeholder="ATHLETE-ABC123" required />
            </label>
            <label>
              Passwort festlegen
              <input name="password" type="password" autoComplete="new-password" minLength={4} required />
            </label>
            <button className="secondary-button" type="submit">
              Einladung annehmen
            </button>
          </form>
        </div>

        {message ? <p className="auth-message">{message}</p> : null}
      </section>
    </main>
  );
}
