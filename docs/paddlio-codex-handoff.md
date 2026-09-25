# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-09-25 14:54 CEST
- Aktueller Stabilitaetsblock: Security-, Datenschutz- und Release-Check
- Status: DONE MIT RELEASE-BLOCKERN

## Root Cause

Der Client leitete Admin- und Entwicklungsrollen teilweise aus hart codierten E-Mail-Adressen und editierbaren Auth-Metadaten ab. RLS blieb zwar die letzte Cloud-Schranke, aber UI und Profilreparatur konnten dadurch erhoehte Rollen annehmen oder zurueckschreiben. Vercel hatte keine expliziten Security-Header, Profilbilder wurden ohne Typ-/Groessenpruefung als Data-URL gespeichert und Polar-API-Endpunkte gaben interne Fehlertexte an den Client weiter.

Datenschutzseitig existierten Profilbearbeitung, Logout und fachliche Exporte, aber keine leicht erreichbare allgemeine Datenschutz-/Impressumsstruktur. Betreiberangaben, vollstaendiger Auskunftsexport und ein serverseitiger Konto-/Datenloeschprozess fehlen weiterhin.

## Aenderungen

- Rollenquelle gehaertet: E-Mail und `user_metadata` koennen keine Rolle mehr vergeben; massgeblich ist `public.profiles.roles`.
- Neue Regressionstests fuer die Rollen-Trust-Boundary.
- Profilbilder auf JPEG/PNG/WebP und maximal 2 MB begrenzt; SVG wird abgewiesen.
- Polar-API-Fehlerausgaben auf stabile oeffentliche Codes reduziert; technische Details bleiben Server-Logs.
- CSP, MIME-Schutz, Referrer-Policy, Permissions-Policy, Frame-Schutz und HSTS in `vercel.json` ergaenzt.
- Datenschutz-/Impressumsstruktur in Registrierung und Einstellungen ergaenzt, ohne Betreiberdaten zu erfinden.
- Technisches Audit unter `docs/security/release-audit-2026-09.md` dokumentiert.
- Kompatible Abhaengigkeitsupdates ohne Force/Major-Zwang; `npm audit` jetzt 0 Findings.
- Neuer `check:security`, in `check:beta` integriert.
- React-Workspace-State fuer Vorlagen, Journal und individuelles Training durch eindeutige Keys getrennt.
- E2E-Screenshot-Tests fuer leere Vorlagenfilter und wechselnde DEV-Testdaten robuster gemacht.

## Migrationen

- Keine Migration erstellt oder angewendet.

## Supabase DEV Ergebnis

- Zielreferenz vor dem Versuch bestaetigt: `nlllqsfdhfiwticrcrnp`.
- Keine Datenbankaenderung ausgefuehrt.
- Ein geplanter read-only `supabase db lint --linked` konnte nicht laufen, weil die Supabase CLI auf diesem Rechner nicht verfuegbar ist.
- Statischer RLS-Check erfolgreich; Live-Security-Advisor und echte Rollenmatrix bleiben manueller DEV-Release-Schritt.

## Betroffene Tabellen, Policies und Funktionen

- Keine Tabellen, Policies, Trigger oder Daten geaendert.
- Client-Rollenauflosung in `profileService` und lokalem Storage gehaertet.
- Serverfunktionen der Polar-Vercel-API geben keine rohen internen Fehler mehr aus.

## Tests

- `npm ci`: erfolgreich, 0 Audit-Findings.
- `npm audit`: 0 bekannte Schwachstellen.
- `npm test`: 122/122 erfolgreich.
- `npm run build`: erfolgreich; bestehende Chunk-Warnung ueber 500 kB bleibt.
- `npm run check:encoding`: erfolgreich.
- `npm run check:rls`: erfolgreich.
- `npm run check:bundle`: erfolgreich.
- `npm run check:a11y`: erfolgreich.
- `npm run check:security`: erfolgreich.
- `npm run check:beta`: erfolgreich.
- `npm run test:e2e:roles`: 9 erfolgreich, 1 vorgesehener Mobile-Mehrgeraete-Skip.
- `npm run test:e2e`: ausgefuehrt, aber nicht vollstaendig gruen. Fachtests und Rollenpfade bestanden; der Mausrad-/Keyboard-Scroll-Test blieb in Wiederholungen intermittierend. Betroffene Template-/Workspace-State-Fehler wurden korrigiert und gezielt erfolgreich nachgetestet.

## Commit und Pushstatus

- Implementierungscommit: `89aa075`.
- Pushstatus: erfolgreich auf `origin/develop`.

## Offene Fehler und Release-Blocker

- Gesetzlich erforderliche Betreiber-/Kontaktdaten und rechtlich gepruefte Texte fehlen.
- Kein vollstaendiger DSGVO-Auskunftsexport ueber alle personenbezogenen Tabellen.
- Kein serverseitiger, nachvollziehbarer Konto-/Gesamtdatenloeschprozess.
- Minderjaehrigen-/Einwilligungs- und Aufbewahrungskonzept ist eine offene Produkt-/Rechtsentscheidung.
- Supabase Security Advisor, Auth-/Redirect-/Storage-Konfiguration und Vercel-Header muessen am echten DEV-Deployment manuell verifiziert werden.
- Der Desktop-Scroll-E2E ist trotz erfolgreicher Einzellaeufe noch nicht wiederholbar stabil und blockiert eine falsche Aussage, die komplette E2E-Suite sei gruen.

## Naechste sinnvolle Aufgabe

Release-Blocker gemeinsam mit dem Betreiber schliessen: Betreiber- und Datenschutzkontakt bereitstellen, Loesch-/Auskunftsprozess fachlich entscheiden und danach serverseitig implementieren. Parallel den Desktop-Scroll-E2E gegen den tatsaechlichen Scroll-Container stabilisieren und die komplette E2E-Suite erneut gruen ausfuehren.

## Blocker

- Betreiberangaben und Datenschutzkontakt muessen von Tobias bereitgestellt werden.
- Kontoloeschung und Minderjaehrigenkonzept benoetigen eine Produkt-/Rechtsentscheidung.
- Supabase CLI fehlt lokal; DEV-Dashboard-Pruefungen muessen mit vorhandenem Browserzugang manuell erfolgen.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` als Ziel geprueft.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
