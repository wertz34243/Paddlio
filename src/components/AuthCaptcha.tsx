import { useEffect, useRef, useState } from "react";
import { authCaptchaConfig, CAPTCHA_UNAVAILABLE } from "../auth/captcha";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }
let scriptPromise: Promise<Turnstile> | undefined;
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => fail(), 15000);
    const fail = () => { window.clearTimeout(timeout); script.remove(); reject(new Error("captcha_unavailable")); };
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile); else fail();
    };
    script.onerror = fail;
    document.head.append(script);
  }).catch((error: unknown) => { scriptPromise = undefined; throw error; });
  return scriptPromise;
}

export function AuthCaptcha({ attempt, onToken }: { attempt: number; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [retry, setRetry] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!authCaptchaConfig.enabled) return;
    let disposed = false;
    let widget: string | undefined;
    let api: Turnstile | undefined;
    onToken("");
    setMessage("");
    if (!authCaptchaConfig.siteKey) { setMessage(CAPTCHA_UNAVAILABLE); return; }
    void loadTurnstile().then((loaded) => {
      if (disposed || !container.current) return;
      api = loaded;
      widget = api.render(container.current, {
        sitekey: authCaptchaConfig.siteKey, language: "de", size: "flexible", theme: "auto",
        callback: (token: string) => { if (!disposed) { onToken(token); setMessage(""); } },
        "expired-callback": () => { if (!disposed) { onToken(""); setMessage("Die Sicherheitsprüfung ist abgelaufen. Bitte erneut prüfen."); } },
        "error-callback": () => { if (!disposed) { onToken(""); setMessage(CAPTCHA_UNAVAILABLE); } },
        "timeout-callback": () => { if (!disposed) { onToken(""); setMessage(CAPTCHA_UNAVAILABLE); } },
      });
    }).catch(() => { if (!disposed) { onToken(""); setMessage(CAPTCHA_UNAVAILABLE); } });
    return () => { disposed = true; if (widget !== undefined) api?.remove(widget); };
  }, [attempt, retry, onToken]);
  if (!authCaptchaConfig.enabled) return null;
  return <section aria-label="Sicherheitsprüfung" style={{ width: "100%", minWidth: 0, marginBlock: "1rem" }}>
    <div ref={container} />
    {message && <p role="alert">{message}</p>}
    <button type="button" className="text-button" onClick={() => { onToken(""); setRetry((value) => value + 1); }}>Sicherheitsprüfung erneut laden</button>
  </section>;
}
