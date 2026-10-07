# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-07 06:47 CEST
- Stabilitaetsblock: Paddlio 5.0 Schritt 3D - finale Release-Abnahme
- Entscheidung: **READY FOR PRODUCTION mit verbindlichen manuellen Go-Live-Gates**
- Bedeutung: Keine bekannten technischen Code-/DEV-Blocker. Es wurde weder Production veraendert noch ein Release ausgeloest.

## Root Cause und Haertung

- Passwortregeln waren zwischen Registrierung, Recovery und lokalem Fallback uneinheitlich und serverseitig in DEV noch nicht erzwungen.
- Die 16+-Regel war nur in UI/AuthProvider vorhanden und durch direkten Auth-Zugriff umgehbar.
- Die Kontoloeschung haette gemeinsame Nachrichten anderer Beteiligter mitgeloescht.
- Aufbewahrung, Aufsichtsbehoerde, Production-Konfiguration, Migrationsreihenfolge und Rollback waren noch nicht verbindlich zusammengefuehrt.

## Aenderungen

- Gemeinsame Passwortpolicy: mindestens 10 Zeichen, Gross-/Kleinbuchstabe, Zahl und Sonderzeichen; Registrierung und Recovery verwenden dieselbe Regel.
- Privater Supabase-Before-User-Created-Hook blockiert fehlende, ungueltige und Unter-16-Geburtsdaten vor Anlage des Auth-Kontos.
- Account-Privacy anonymisiert Identitaetsbezug in gemeinsamen Nachrichten und Beitraegen; fremde Kommunikationsverlaeufe bleiben erhalten.
- Datenschutzerklaerung um Aufbewahrung, Anonymisierung und offizielle LDI-NRW-Angaben erweitert.
- Public-E2E deckt alle neun Routen, Phone/Tablet/Desktop und fehlende private Service-Worker-Initialisierung ab.
- Vollstaendige Production-Checkliste, Advisor-Inventur, 52 Migrationen und Rollback in `docs/release/paddlio-5-production-readiness.md`.

## Migration / Supabase DEV

- Migration: `20261006163252_release_auth_age_and_privacy_hardening.sql`.
- Ausschliesslich auf DEV `nlllqsfdhfiwticrcrnp` angewendet.
- Auth-Hook `paddlio_before_user_created_500` in DEV aktiviert.
- DEV Auth: Mindestlaenge 10 und staerkste Zeichenanforderung aktiviert.
- Direkte DEV-Tests: Unter-16-Signup 403; schwache Passwoerter 422; keine negativen Testkonten angelegt.
- `account-privacy` ausschliesslich auf DEV als Version 9 ACTIVE deployed; unauthentifizierter Zugriff 401.
- Security Advisor: 22 Warnungen (21 benoetigte authentifizierte SECURITY-DEFINER-Helfer, 1 im Free-Plan nicht verfuegbare Leaked-Password-Pruefung). Jede Warnung ist einzeln bewertet.
- Keine Nutzdaten geloescht. RLS blieb aktiv.

## Tests

- `npm audit`: 0 Schwachstellen.
- `npm test`: 32 Dateien, 182/182 bestanden.
- `npm run build`: bestanden; bekannte nicht blockierende XLSX-Chunk-Warnung bei 500.06 kB.
- Encoding, RLS, Security, Bundle, A11y und Beta: bestanden.
- E2E: 60 bestanden, 32 vorgesehene projekt-/viewportabhaengige Skips, 0 Fehler.
- Rollen-/Sync-E2E: 9 bestanden, 1 vorgesehener mobiler Multi-Device-Skip, 0 Fehler.
- DEV-Cloud: Auth-Alters-/Passwortregeln, Funktionsrechte und unauthentifizierter Privacy-Zugriff real verifiziert.
- Vercel-Status fuer Abschlusscommit `2387019`: erfolgreich, Deployment abgeschlossen.
- `https://dev.paddlio.de/public-preview`: HTTP 200; CSP, HSTS, nosniff, DENY-Frame-Schutz, Referrer- und Permissions-Policy real im Response vorhanden.

## Verbindliche Go-Live-Gates

- `info@paddlio.de`, `support@paddlio.de`, `datenschutz@paddlio.de` auf Versand und Empfang pruefen.
- Rechtstexte vom Betreiber beziehungsweise qualifizierter Stelle final pruefen; sie sind technische Release-Entwuerfe.
- CAPTCHA-Provider/Keys in Production konfigurieren und Signup, Login sowie Recovery testen.
- Production-Migrationsdifferenz autorisiert ermitteln, Backup/Dry Run durchfuehren und danach RLS/Advisor pruefen.
- Production-Domains, Auth-Redirects, Mailtemplates und Environment-Variablen gemaess Checkliste setzen.
- Polar bleibt Beta; ohne Backend-Konfiguration bleibt Connect deaktiviert.
- Leaked Password Protection ist im aktuellen Supabase-Free-Plan nicht aktivierbar und bleibt als akzeptierte Einschraenkung dokumentiert.

## Commit / Push

- Implementierungscommit: `9fab0a7` (`Harden Paddlio 5 release readiness`).
- Handoff-Commit: `2387019` (`Update final release handoff`).
- Pushstatus: `origin/develop` und lokaler HEAD waren identisch; Vercel-Deployment erfolgreich.

## Grenzen bestaetigt

- Nur Branch `develop`.
- Nur Supabase DEV `nlllqsfdhfiwticrcrnp` veraendert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
- DNS und Production-Hosting unveraendert.

## Naechster Schritt

Nach ausdruecklicher Freigabe die manuelle Production-Checkliste ausfuehren. Kein automatischer Merge, Production-Deploy oder DNS-Schritt.
