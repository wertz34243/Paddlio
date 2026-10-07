# Paddlio öffentliche Website und App-Domains

Stand: 06.10.2026

## Zielarchitektur

| Domain | Ziel |
|---|---|
| `paddlio.de` | Öffentliche Website ohne Auth-/Supabase-Initialisierung |
| `www.paddlio.de` | Permanente Weiterleitung auf `https://paddlio.de` |
| `app.paddlio.de` | Paddlio-PWA mit Auth, Supabase, Offline und Nutzerdaten |
| `dev.paddlio.de` | Bestehende DEV-App |

Die Anwendung entscheidet am Einstieg anhand des Hostnamens. Auf `paddlio.de` und `www.paddlio.de` wird nur das öffentliche Bundle geladen. Die private App wird dynamisch erst auf App-/DEV-Hosts importiert. Für DEV ist die Website unter `/public-preview` testbar. Optional kann ein getrenntes Vercel-Preview-Projekt `VITE_PUBLIC_SITE_MODE=true` setzen.

## Vercel

1. Aktuellen `develop`-Stand zunächst nur als Preview beziehungsweise DEV deployen.
2. Für den späteren Production-Stand zwei Projekte oder eindeutig getrennte Domain-Zuordnungen verwenden:
   - Public Web: `paddlio.de`, `www.paddlio.de`, optional `VITE_PUBLIC_SITE_MODE=true`.
   - App: `app.paddlio.de`, `VITE_PUBLIC_APP_URL=https://app.paddlio.de`.
3. `www.paddlio.de` in Vercel permanent auf `https://paddlio.de` umleiten.
4. Security-Header aus `vercel.json` auf beiden Projekten beibehalten.
5. Nach Domainzuordnung echte Responses für CSP, HSTS, nosniff, Frame-, Referrer- und Permissions-Policy prüfen.
6. Öffentliche Website und PWA getrennt prüfen: Die Website darf keine Supabase-Requests, Session-Wiederherstellung oder Service-Worker-Registrierung auslösen.

## DNS bei netcup

1. Die von Vercel für `paddlio.de`, `www` und `app` vorgegebenen A-/CNAME-Einträge setzen.
2. Bestehende MX-, SPF-, DKIM-, DMARC- und Resend-Einträge nicht löschen oder überschreiben.
3. Vor jeder Änderung aktuellen Zone-Export sichern und nur die drei Web-Ziele ergänzen.
4. TLS-Ausstellung und HTTP-zu-HTTPS-Weiterleitung nach Propagation prüfen.

Es werden durch diesen Commit keine DNS- oder Production-Vercel-Änderungen ausgeführt.

## Supabase Auth vor Production

Erst beim späteren Production-Schritt, nicht jetzt:

- Site URL auf `https://app.paddlio.de`.
- Redirect-Allowlist für `https://app.paddlio.de/**`.
- `paddlio.de` benötigt keine Supabase-Redirects.
- E-Mail-Bestätigung und Recovery gegen die App-Domain Ende-zu-Ende testen.
- Passwortminimum 10 und Groß-/Kleinbuchstabe, Zahl sowie Sonderzeichen serverseitig aktivieren.
- `paddlio_before_user_created_500` als Before-User-Created-Hook aktivieren.
- CAPTCHA-Provider und Keys konfigurieren; Signup, Login und Recovery mit `captchaToken` testen.
- Die vollständige Production-Checkliste und den Rollback enthält `paddlio-5-production-readiness.md`.

## SEO

- Öffentliche Routen sind in `public/sitemap.xml` erfasst.
- `robots.txt` verweist auf die öffentliche Sitemap und sperrt bekannte private/technische Routen.
- App-Inhalte dürfen nicht in der öffentlichen Sitemap erscheinen. Für ein getrenntes App-Vercel-Projekt sollte zusätzlich ein app-spezifisches `robots.txt` mit vollständigem `Disallow` ausgeliefert werden.

## Mail-Abhängigkeit

`info@paddlio.de`, `support@paddlio.de` und `datenschutz@paddlio.de` werden als vorgesehene Kontaktwege genannt. Vor Production muss für jede öffentlich angezeigte Adresse der Empfang praktisch bestätigt werden.

## Minderjährige

Die UI verlangt ein Geburtsdatum und blockiert selbstständige Registrierung unter 16. Die Prüfung wird zusätzlich im AuthProvider ausgeführt. Das Datum wird als Registrierungskontext an Supabase Auth übergeben, aber nicht als Rollenquelle verwendet.

Vor öffentlichem Release bleibt eine serverseitig nicht umgehbare Auth-Hook-/Trigger-Prüfung erforderlich. Eine reine Clientprüfung kann direkte Auth-API-Aufrufe nicht verhindern. Unter 16 wird kein eigenständiger Standardprozess freigegeben, solange kein Sorgeberechtigten-Workflow existiert.
