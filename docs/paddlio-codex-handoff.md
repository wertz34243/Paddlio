# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-09-26 09:20 CEST
- Stabilitaetsblock: DEV-Deploy und Security-Verifikation
- Status: DEV-PRIVACY-DEPLOY UND TECHNISCHE REGRESSION ABGESCHLOSSEN

## Root Cause

Der vorbereitete Datenschutzpfad war noch nicht real deployed. Beim ersten DEV-Export zeigten reale PostgREST-Fehler, dass mehrere Filterspalten in der Edge Function nicht zum aktuellen DEV-Schema passten (`group_messages.user_id`, `beta_feedback.owner_id`, `boats.owner_user_id` sowie entsprechende Material-/Event-Felder). Zwei Playwright-Tests enthielten ausserdem eigene Zustandsrennen: Der Intro-Test loeschte seinen Persistenzwert bei jedem Reload erneut, und der iPad-Test erwartete ein Overlay-Schliessen auch im festen Side-Panel-Modus.

## Aenderungen

- `account-privacy` an die realen DEV-Spalten angepasst und `club_documents` in Export/Loeschung aufgenommen.
- Datensparsame DEV/Admin-Diagnose fuer fehlgeschlagene Export-/Loeschoperationen ergaenzt; normale Nutzer erhalten weiterhin nur stabile Fehlercodes.
- Reproduzierbare DEV-Pruefer fuer rollenbezogenen Export/CORS und ein entbehrliches Konto-Loeschszenario hinzugefuegt.
- Intro-Persistenz- und iPad-Panel-E2E zustandsbasiert stabilisiert.
- Security-, Hosting-, Storage- und Rollenbefunde dokumentiert.

## Migrationen

- Keine Datenbankmigration erstellt oder angewendet.
- Edge Function `account-privacy` Version 7 ausschliesslich auf Supabase DEV `nlllqsfdhfiwticrcrnp` deployed.
- Function Secret `PADDLIO_ALLOWED_ORIGINS=https://dev.paddlio.de` ausschliesslich auf DEV gesetzt.
- JWT-Verifikation ist aktiv.

## Supabase DEV Ergebnis

- CLI: `2.118.0` via `npm exec`; verknuepftes Projekt eindeutig `nlllqsfdhfiwticrcrnp`, Production nicht verknuepft.
- Export real mit Admin, Coach und Athlete bestanden: gueltiges JSON, eigenes Konto, keine Provider-/Service-Secrets, keine unmaskierten Fremdidentitaeten.
- Nicht authentifizierter Function-Aufruf: HTTP 401.
- Erlaubtes CORS-Preflight fuer `https://dev.paddlio.de`: bestanden; authentifizierte Fremd-Origin: HTTP 403.
- Falsche Loeschphrase: abgelehnt.
- Richtig bestaetigte Loeschung eines neu erzeugten, entbehrlichen DEV-Testkontos: Auth-Konto, Profil und markierte eigene Testzeilen entfernt; Club- und fremde Profilanzahl unveraendert; erneuter Login abgelehnt.
- Storage inventarisiert: 0 Buckets. Aktuell keine Storage-Objekte zu loeschen; bei spaeteren Buckets muss der Loeschpfad erweitert werden.
- DB-Lint: keine Schemafehler.
- Security Advisor: 51 Warnungen (48 direkte EXECUTE-Warnungen fuer `SECURITY DEFINER`-Helper, 2 mutable `search_path`, 1 deaktivierter Schutz vor geleakten Passwoertern). Keine Rechte wurden auf Verdacht gelockert.

## Hosting

`https://dev.paddlio.de` wurde real geprueft: HTTPS 200; HTTP 308 auf HTTPS. CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` und `Permissions-Policy` kommen in der ausgelieferten Response an.

## Tests

- `npm ci`: erfolgreich, 109 Pakete.
- `npm audit`: 0 bekannte Schwachstellen.
- `npm test`: 23 Dateien, 125/125 Tests.
- `npm run build`: erfolgreich.
- `check:encoding`, `check:rls`, `check:bundle`, `check:a11y`, `check:beta`: erfolgreich.
- `npm run test:e2e`: 41 bestanden, 23 vorgesehene projekt-/viewportbezogene Skips, 0 Fehler.
- `npm run test:e2e:roles`: 9 bestanden, 1 vorgesehener Mobile-Mehrgeraete-Skip, 0 Fehler.
- Reale DEV-Exportmatrix: Admin/Coach/Athlete bestanden.
- Reale DEV-Kontoloeschung: bestanden.

## Offene Punkte

- Vor einem offiziellen Release Security-Advisor-Warnungen einzeln haerten: interne `SECURITY DEFINER`-RPCs aus dem exponierten API-Pfad nehmen beziehungsweise EXECUTE minimalisieren; `search_path` fuer `set_updated_at` und `default_roles_for_email` fixieren.
- Supabase Auth-Leaked-Password-Protection im DEV-Dashboard aktivieren und Auth Site URL/Redirect-Allowlist, Rate Limits und MFA-Entscheidung manuell protokollieren.
- Betreiberangaben, Rechtstexte, Aufbewahrungsregeln und Minderjaehrigenkonzept bleiben organisatorisch/rechtlich offen.
- Bei Einfuehrung von Storage-Buckets kontobezogene Objektloeschung implementieren und testen.

## Commit und Pushstatus

- Implementierungscommit: wird nach diesem Handoff erstellt.
- Pushstatus: ausstehend bis Commit-Abschluss.

## Naechste sinnvolle Aufgabe

Security-Advisor-Hardening als eigener, eng begrenzter Block: Funktionsaufrufe aus Policies/Triggern inventarisieren, sichere EXECUTE-Matrix erstellen und erst danach additive Migration fuer `search_path` und nicht oeffentliche interne Helper auf DEV testen.

## Freigabestatus

Der vollstaendige manuelle DEV-Nutzertest kann beginnen. Ein offizieller oeffentlicher Release bleibt wegen Security-Advisor- und organisatorisch/rechtlicher Restpunkte noch gesperrt.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` veraendert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
