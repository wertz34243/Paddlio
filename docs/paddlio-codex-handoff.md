# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-09-25 11:58 CEST
- Aktueller Stabilitaetsblock: Vollstaendige Testbereitschaft, Polar-Datum und Desktop-Scroll-E2E
- Status: DONE
- Auftragsbasis: Handoff-Commit `bd843946265e46b053f2468206ef622e7c3a9250`

## Root Cause

Polar AccessLink liefert `start_time` haeufig als lokale Uhrzeit ohne Zeitzonensuffix und den Offset separat als `start_time_utc_offset`. Der Server ignorierte diesen Offset und liess Vercel die lokale Uhrzeit als UTC interpretieren. Ein ungueltiger Polar-Zeitwert konnte zudem durch `toISOString()` den gesamten Import abbrechen.

Der erste vollstaendige E2E-Lauf zeigte ausserdem eine Test-Race-Condition: Nach nativem `PageUp` wurde der Scrollstand sofort gemessen, bevor Edge den Seitensprung verarbeitet hatte. Der eigentliche Dokument-Scroll war nicht blockiert.

## Aenderungen

- Offsetbewusste und validierende Polar-Startzeitnormalisierung in `api/_polar.js` eingefuehrt.
- Bereits zonierte Zeitstempel werden ohne erneute Offsetanwendung normalisiert.
- Ungueltige oder fehlende Zeitwerte verwenden einen sicheren Fallback und brechen den Sync nicht mehr ab.
- Drei servernahe Regressionstests fuer Offset, explizite Zeitzone und ungueltiges Datum ergaenzt.
- Desktop-Scroll-E2E wartet bei `PageUp` zustandsbasiert auf die native Browserreaktion.
- Keine Produktfeatures, Datenbankobjekte oder Produktionsdaten hinzugefuegt beziehungsweise veraendert.

## Migrationen

- Keine neue Migration erforderlich.

## Supabase DEV Ergebnis

- Lokaler Projekt-Link weiterhin ausschliesslich `nlllqsfdhfiwticrcrnp`.
- Fuer diesen Block waren keine Datenbankbefehle oder Schemaaenderungen erforderlich.
- Vorheriger verifizierter Stand bleibt bestehen: 60 aktive App-Tabellen per PostgREST erreichbar, Wettbewerbsabfrage HTTP 200.

## Betroffene Tabellen, Policies und Funktionen

- Keine Tabellen oder Policies geaendert.
- Neue/angepasste Serverfunktion: `normalizePolarStartedAt()` in `api/_polar.js`.
- Aufrufer: `normalizePolarExercise()`.

## Tests

- Polar-Zieltests: 9 von 9 erfolgreich.
- `npm.cmd run build`: erfolgreich.
- `npm.cmd run check:encoding`: erfolgreich.
- `npm.cmd run check:rls`: erfolgreich.
- `npm.cmd run check:a11y`: erfolgreich.
- `npm.cmd run check:beta`: erfolgreich, inklusive Bundle- und Blocker-Check.
- `npm.cmd run test`: 120 von 120 erfolgreich.
- `npm.cmd run test:e2e:roles`: 9 erfolgreich, 1 vorgesehener Mobile-Mehrgeraete-Skip.
- `npm.cmd run test:e2e`: 41 erfolgreich, 23 vorgesehene projekt-/geraetespezifische Skips, 0 Fehler.
- Desktop-Scrollpfad bestaetigt: Mausrad, ArrowDown, PageDown, End, PageUp und Home.

## Commit und Pushstatus

- Implementierungs- und Ergebniscommit: `f877e1ae6084b311bb1c89ef01f3165e438d6524`.
- Pushstatus: erfolgreich auf `origin/develop`.
- Dieser aktualisierte Handoff wird in einem nachfolgenden Dokumentationscommit versioniert.

## Offene Fehler

- Keine bekannten blockierenden Fehler aus diesem Stabilitaetsblock.
- Echter Polar-Provider-Sync mit einem real verbundenen Polar-Konto bleibt als manueller DEV-Nachweis offen.
- Physische iPhone-/iPad-Tests und echter Touchpad-Test bleiben manuell offen; automatisierte Mobile-, Tablet- und Desktop-Suiten sind gruen.
- Die historische Supabase-DEV-Migrationshistorie ist weiterhin nicht vollstaendig als Remote-Historie erfasst, das aktive Schema wurde jedoch direkt verifiziert.

## Naechste sinnvolle Aufgabe

Rollen- und kontextabhaengige Start-Synchronisation pruefen: optionale Academy-, Beta-, Vereinsportal- und Analyseabfragen nur laden, wenn Rolle oder geoeffnetes Modul sie benoetigt. Danach Realtime-Subscriptions auf Duplikate und sauberes Cleanup bei Accountwechsel pruefen.

## Blocker

Keine Codeblocker. Fuer den echten Polar-Ende-zu-Ende-Nachweis ist ein verbundenes DEV-Polar-Konto erforderlich.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` referenziert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
