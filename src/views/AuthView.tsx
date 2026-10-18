import { AuthCaptcha } from "../components/AuthCaptcha";
import { CAPTCHA_MESSAGE, captchaRequired } from "../auth/captcha";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { APP_SLOGAN } from "../brand";
import { cacheCloudClubs, loadClubs, type LoginInput, type RegisterInput } from "../data/storage";
import type { CloudAuthResult } from "../auth/AuthProvider";
import { isUserVisibleLoginMessage } from "../auth/authMessages";
import { getActiveRegistrationClubs, resolveRegistrationClubSelection, toRegistrationClub } from "../auth/registrationClubs";
import { listCloudClubs } from "../services/clubService";
import { PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS_TEXT } from "../domain/passwordPolicy";

type AuthMode = "login" | "register";

type AuthViewProps = {
  onLogin: (input: LoginInput, captchaToken?: string) => Promise<CloudAuthResult>;
  onRegister: (input: RegisterInput, captchaToken?: string) => Promise<CloudAuthResult>;
  onResetPassword: (email: string, captchaToken?: string) => Promise<CloudAuthResult>;
  onResendConfirmation: (email: string, captchaToken?: string) => Promise<CloudAuthResult>;
  cloudMessage?: string;
};

export function AuthView({ onLogin, onRegister, onResetPassword, onResendConfirmation, cloudMessage }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [clubs, setClubs] = useState(() => getActiveRegistrationClubs(loadClubs()));
  const [suggestClub, setSuggestClub] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");
  const [resendPending, setResendPending] = useState(false);


  const [captchaToken, setCaptchaToken] = useState("");
  const tokenRef = useRef("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const receiveToken = useCallback((token: string) => { tokenRef.current = token; setCaptchaToken(token); }, []);
  const submitAuth = async (action: (token?: string) => Promise<CloudAuthResult>): Promise<CloudAuthResult> => {
    if (submittingRef.current) return { ok: false, message: "Bitte warte, bis die Anfrage abgeschlossen ist." };
    if (captchaRequired(tokenRef.current)) return { ok: false, message: CAPTCHA_MESSAGE };
    const token = tokenRef.current || undefined;
    submittingRef.current = true;
    setSubmitting(true);
    receiveToken("");
    try { return await action(token); }
    catch { return { ok: false, message: "Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es erneut." }; }
    finally { submittingRef.current = false; setSubmitting(false); setCaptchaAttempt((value) => value + 1); }
  };

  useEffect(() => {
    let isMounted = true;
    void listCloudClubs()
      .then((cloudClubs) => {
        const nextClubs = getActiveRegistrationClubs(cloudClubs.map(toRegistrationClub));
        if (nextClubs.length === 0 || !isMounted) return;
        cacheCloudClubs(nextClubs);
        setClubs(nextClubs);
      })
      .catch((error) => {
        console.info("Vereinsliste konnte nicht aus der Cloud geladen werden. Lokaler Cache wird genutzt.", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await submitAuth((token) => onLogin({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    }, token));

    setMessage(result.ok ? result.message ?? "" : result.message);
    setMessageOk(result.ok);
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const selectedClub = resolveRegistrationClubSelection(
      clubs,
      suggestClub ? "" : String(formData.get("clubId") ?? ""),
      String(formData.get("club") ?? ""),
    );
    const result = await submitAuth((token) => onRegister({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      email,
      password: String(formData.get("password") ?? ""),
      passwordRepeat: String(formData.get("passwordRepeat") ?? ""),
      clubId: suggestClub ? "" : selectedClub.clubId,
      club: selectedClub.club,
      suggestClub,
      privacyAccepted: formData.get("privacyAccepted") === "on",
    }, token));

    setMessage(result.ok ? result.message ?? "" : result.message);
    setMessageOk(result.ok);
    setPendingConfirmationEmail(result.ok ? email.trim().toLowerCase() : "");
  };

  const handleResetPassword = async () => {
    const email = resetEmail.trim();
    if (!email) {
      setMessage("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }

    const result = await submitAuth((token) => onResetPassword(email, token));
    setMessage(result.message ?? "Passwort-Reset wurde angefordert.");
    setMessageOk(result.ok);
    if (result.ok) {
      setResetOpen(false);
      setResetEmail("");
    }
  };

  const handleResendConfirmation = async () => {
    const email = pendingConfirmationEmail.trim();
    if (!email) {
      setMessage("Bitte registriere dich zuerst mit deiner E-Mail-Adresse.");
      setMessageOk(false);
      return;
    }

    setResendPending(true);
    const result = await submitAuth((token) => onResendConfirmation(email, token));
    setResendPending(false);
    setMessage(result.ok ? result.message ?? "" : result.message);
    setMessageOk(result.ok);
  };

  const switchMode = (nextMode: AuthMode) => {
    receiveToken("");
    setCaptchaAttempt((value) => value + 1);
    setMode(nextMode);
    setResetOpen(false);
    setMessage("");
    setMessageOk(false);
    setPendingConfirmationEmail("");
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <img className="auth-brand-logo" src="/brand/paddlio-brand-primary.webp" alt="Paddlio" />
          <p className="brand-slogan">{APP_SLOGAN}</p>
          <span>Kanuslalom Training, Wettkampf und Teamplattform</span>
        </div>

        <div className="auth-tabs" aria-label="Authentifizierung">
          <button className={mode === "login" ? "active" : ""} type="button" disabled={submitting} onClick={() => switchMode("login")}>
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => switchMode("register")}>
            Konto erstellen
          </button>
        </div>

        <AuthCaptcha attempt={captchaAttempt} onToken={receiveToken} />
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
            <button className="save-button" type="submit" disabled={submitting || captchaRequired(captchaToken)}>
              Einloggen
            </button>
            <button className="text-button" type="button" onClick={() => setResetOpen((current) => !current)} aria-expanded={resetOpen}>
              Passwort vergessen
            </button>
            {resetOpen ? (
              <div className="reset-panel">
                <label>
                  E-Mail für Passwort-Reset
                  <input
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="deine@email.de"
                    required
                  />
                </label>
                <div className="inline-actions">
                  <button className="save-button" type="button" onClick={() => void handleResetPassword()} disabled={submitting || captchaRequired(captchaToken)}>
                    Reset-Link senden
                  </button>
                  <button className="ghost-button" type="button" onClick={() => setResetOpen(false)}>
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : null}
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
            <label>
              Geburtsdatum
              <input name="birthDate" type="date" autoComplete="bday" required />
              <small className="card-note">Die selbstständige Registrierung ist ab 16 Jahren möglich.</small>
            </label>
            <div className="choice-group">
              <span>Verein</span>
              <div className="auth-tabs">
                <button className={!suggestClub ? "active" : ""} type="button" onClick={() => setSuggestClub(false)}>
                  Verein auswählen
                </button>
                <button className={suggestClub ? "active" : ""} type="button" onClick={() => setSuggestClub(true)}>
                  Verein vorschlagen
                </button>
              </div>
            </div>
            {suggestClub ? (
              <label>
                Vereinsname
                <input name="club" autoComplete="organization" required placeholder="z. B. Mülheimer Kanu Club" />
              </label>
            ) : (
              <label>
                Verein
                <select name="clubId" required>
                  <option value="">Bitte wählen</option>
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
                <input name="password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required />
              </label>
              <label>
                Passwort wiederholen
                <input name="passwordRepeat" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required />
              </label>
            </div>
            <p className="card-note">{PASSWORD_REQUIREMENTS_TEXT}</p>
            <label className="toggle-row">
              <span>Datenschutzhinweise akzeptieren</span>
              <input name="privacyAccepted" type="checkbox" required />
            </label>
            <details className="auth-legal-info">
              <summary>Datenschutzhinweise und Impressum</summary>
              <p>Paddlio verarbeitet Konto-, Profil-, Vereins- und Trainingsdaten zur Bereitstellung der App. Lokaler Gerätespeicher unterstützt Offline-Nutzung und Synchronisation. Es ist kein Marketing-Tracking im Client eingebaut.</p>
              <p>Betreiber: Tobias Kuhn, Opladener Str. 131, 42699 Solingen, Deutschland. Kontakt: <a href="mailto:info@paddlio.de">info@paddlio.de</a>. Datenschutzanfragen: <a href="mailto:datenschutz@paddlio.de">datenschutz@paddlio.de</a>. Die <a href="/public-preview/datenschutz">Datenschutzerklärung</a> bleibt ein rechtlich zu prüfender Release-Entwurf.</p>
            </details>
            <button className="save-button" type="submit" disabled={submitting || captchaRequired(captchaToken)}>
              Konto erstellen
            </button>
          </form>
        )}

        {isUserVisibleLoginMessage(cloudMessage) && !message ? <p className="auth-message neutral">{cloudMessage}</p> : null}
        {message ? (
          <div className={`auth-message ${messageOk ? "success" : ""}`}>
            <p>{message}</p>
            {mode === "register" && pendingConfirmationEmail ? (
              <button className="ghost-button" type="button" onClick={() => void handleResendConfirmation()} disabled={resendPending || submitting || captchaRequired(captchaToken)}>
                {resendPending ? "Sende..." : "Bestätigungsmail erneut senden"}
              </button>
            ) : null}
          </div>
        ) : null}
        <p className="card-note">Hilfe bei Konto- oder Anmeldeproblemen: <a href="mailto:support@paddlio.de">support@paddlio.de</a></p>
      </section>
    </main>
  );
}
