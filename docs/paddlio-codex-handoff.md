# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-06 17:20 CEST
- Stabilitaetsblock: Paddlio 5.0 Schritt 3A - Security Release Hardening
- Status: TECHNISCH ABGESCHLOSSEN, OEFFENTLICHER RELEASE WEGEN MANUELLER AUTH-/RECHTSAUFGABEN BLOCKIERT

## Root Cause

- 24 `SECURITY DEFINER`-Funktionen waren direkt fuer `anon` ausfuehrbar; Triggerfunktionen waren teilweise auch fuer `authenticated` erreichbar.
- `set_updated_at` und `default_roles_for_email` hatten einen mutablen `search_path`.
- Die verbleibenden authenticated-Advisor-Warnungen gehoeren ueberwiegend zu Policy-Helfern, deren EXECUTE-Recht fuer bestehende RLS-Regeln erforderlich ist. Ein pauschaler Entzug haette legitimen Datenzugriff gebrochen.
- Leaked Password Protection ist im aktuellen Supabase-Free-Plan nicht aktivierbar.
- Das unfertige Dateianhang-Metadatenformular war fuer Nutzer sichtbar; Polar war nicht deutlich genug als noch unvollstaendig real getestete Beta abgegrenzt.
- `source-map-js@1.2.1` hatte ein bekanntes High-Severity-DoS-Finding.
- Ein iPad-Screenshot-E2E klickte waehrend eines React-Realtime-Refreshs auf einen ersetzten Detail-Tab und war dadurch intermittierend.

## Aenderungen

- SECURITY-DEFINER-Rechte differenziert gehaertet: kein direkter `anon`/`public`-Aufruf, Triggerfunktionen auch fuer `authenticated` gesperrt, notwendige RLS-Helfer erhalten.
- Beide gemeldeten Funktionen auf festen leeren `search_path` gesetzt.
- Security-Regressioncheck fuer Migration, Polar-Beta und ausgeblendete Anhang-UI ergaenzt.
- Nicht authentifizierter Datenschutzexport liefert jetzt korrekt 401 statt 503.
- DEV-Verifikationsskript prueft unauthentifizierten Export und bevorzugt die eindeutige E2E-DEV-Konfiguration.
- Dateianhang-Metadatenformular aus der normalen Kommunikation entfernt.
- Polar als Beta gekennzeichnet; Connect bleibt ohne Serverkonfiguration deaktiviert.
- `source-map-js` kompatibel auf 1.2.2 aktualisiert.
- iPad-E2E oeffnet einen durch Realtime-Refresh geschlossenen Inspector zustandsbasiert erneut; keine festen Sleeps.

## Migration / Supabase DEV

- Migration: `supabase/migrations/20261006154000_security_release_hardening.sql`.
- Vor jedem DB-Befehl Zielprojekt als `nlllqsfdhfiwticrcrnp` bestaetigt.
- Migration ausschliesslich auf Supabase DEV angewendet; PostgREST-Schema-Reload ausgefuehrt.
- Security Advisor: 52 auf 22 Warnungen reduziert (30 behoben).
- Funktionskatalog verifiziert: search paths fest, anon-Rechte entfernt, Trigger-authenticated-Rechte entfernt, legitimer Kontakt-RPC fuer authenticated erhalten.
- `account-privacy` ausschliesslich auf DEV erneut deployed.
- Production wurde weder gelesen noch veraendert.

## Datenschutz- und Cloud-Ergebnis

- Nicht authentifiziert: Export HTTP 401.
- Authentifizierter Export: gueltiges JSON, eigener Account, 0 unmaskierte Fremdidentitaeten, keine Provider-Secrets.
- Falsche Loeschphrase und fremde Origin abgelehnt.
- Entbehrliches, eigens erzeugtes DEV-Testkonto erfolgreich geloescht; eigene Testdaten entfernt, fremde Profile/Clubs unveraendert, Login danach abgelehnt.
- DEV Storage: 0 Buckets; reale Objektloeschung daher nicht anwendbar.
- Echte DEV-Header bestaetigt: HTTPS/308-Redirect, CSP, HSTS, nosniff, DENY/frame-ancestors, Referrer- und Permissions-Policy.

## Tests

- `npm audit`: 0 Schwachstellen.
- Unit/Integration: 29 Dateien, 170/170 bestanden.
- Build: bestanden; nur bestehender Chunk-Groessenhinweis.
- Encoding, RLS, Security, Bundle, A11y und Beta: bestanden.
- Rollen-E2E: 9 bestanden, 1 vorgesehener mobiler Multi-Device-Skip.
- iPad-Race-Regression: 6/6 Wiederholungen bestanden.
- Gesamte E2E-Suite: 50 bestanden, 32 vorgesehene projekt-/viewportabhaengige Skips, 0 Fehler.

## Offene Punkte

- Leaked Password Protection: Plan/Alternative entscheiden.
- Mindestpasswortregeln, Secure Password Change, CAPTCHA, MFA und Session-Limits verbindlich festlegen.
- Polar vor Vollfreigabe real mit einem DEV-Providerkonto testen oder Beta deaktiviert lassen.
- Bei erstem Storage-Bucket Upload-Policies und Kontoloeschung erneut pruefen.
- Betreiberangaben, Rechtsgrundlagen, Aufbewahrung und Minderjaehrigen-Konzept rechtlich/fachlich abschliessen.

## Commit / Push

- Implementierungscommit: `80ca811` (`Harden release security controls`).
- Pushstatus: wird mit diesem Handoff-Abschluss auf `origin/develop` aktualisiert.

## Grenzen bestaetigt

- Nur Branch `develop`.
- Nur Supabase DEV `nlllqsfdhfiwticrcrnp`.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
- Keine bestehenden Nutzdaten geloescht.
