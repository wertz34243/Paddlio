# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-04 08:12 CEST
- Stabilitaetsblock: Paddlio 5.0 Profilpersistenz, Ziele und Material
- Status: IMPLEMENTIERT, AUF SUPABASE DEV ANGEWENDET, DEV-CLOUD-ROUNDTRIP UND REGRESSION GRUEN

## Root Cause

- Das Profilformular mischte unkontrollierte HTML-Felder mit separatem React-State fuer Bootsklassen und Paddelseite. Cloud-/Realtime-Aktualisierungen konnten deshalb einen anderen Stand als das noch sichtbare Formular liefern.
- Ein erfolgreicher Profil-PATCH wurde bisher nicht anhand der von Supabase zurueckgegebenen Profilzeile bestaetigt. Auch ein UPDATE mit null betroffenen Zeilen haette wie ein Erfolg wirken koennen.
- Der allgemeine Snapshot-/Legacy-Sync schrieb `profiles` zusaetzlich zum dedizierten Profilpfad. Im echten DEV-Test gingen dadurch innerhalb derselben Sekunde zwei PATCHes ein: zuerst die neue Einstellung, danach ein aelterer kompletter Profilstand. Dieser zweite Write erklaerte das Zurueckspringen nach Reload.
- Das sichtbare Vereinsfeld war Freitext in `profile_data`, waehrend der Cloud-Load den kanonischen Verein korrekt aus `profiles.club_id` aufloest. Dadurch wirkte eine unzulaessige Freitextaenderung wie ein Speicherfehler.
- Der bestehende Profil-Trigger enthielt weiterhin eine fest codierte Admin-E-Mail und konnte Rollen bei einer normalen Profilaktualisierung veraendern.
- Saisonziele und persoenliches Material waren bereits im vorherigen Block auf echte Cloudwrites umgestellt. Der neue reale DEV-Test bestaetigt, dass beide weiterhin nach Reload vorhanden sind.

## Aenderungen

- `ProfileView` und `SettingsView` verwenden kontrollierte Entwuerfe. Eingaben bleiben bei Fehlern erhalten; eintreffende Cloudwerte ersetzen keinen aktiv bearbeiteten Entwurf.
- K1 und C1 bleiben gleichzeitig auswaehlbar. Das Umschalten einer Bootsklasse veraendert keine anderen Profildaten; die C1-Paddelseite wird separat bestaetigt.
- Profilupdates nutzen `UPDATE ... RETURNING` und uebernehmen anschliessend die tatsaechlich bestaetigte Cloudzeile. Null betroffene Zeilen fuehren zu `profile_update_not_confirmed` statt zu einer Erfolgsmeldung.
- Der allgemeine Snapshot- und Legacy-Datensync schreibt keine Profile mehr. `profiles` besitzt damit genau einen fachlichen Schreibpfad.
- Der Verein ist im Self-Service-Profil read-only. Die kanonische `club_id` kann nur ueber die vorhandene berechtigte Admin-/Vereinszuordnung geaendert werden; manipulierte Freitextwerte werden nicht uebernommen.
- Der Profil-Trigger schuetzt bei Self-Service-Updates Rollen, Status, Primaerrolle, `club_id` und `active_club_id`. Die E-Mail-Sonderregel wurde entfernt.

## Migration

- Neu: `supabase/migrations/20261004054924_harden_profile_self_update_500.sql`.
- Ersetzt additiv die vorhandene Triggerfunktion `public.paddlio_normalize_profile_roles_0034()`.
- Keine Tabelle gedroppt, keine Nutzdaten geloescht, RLS nicht deaktiviert und keine Berechtigung erweitert.
- PostgREST-Schema-Reload enthalten.

## Supabase DEV Ergebnis

- Ziel vor jedem Datenbankbefehl geprueft: `nlllqsfdhfiwticrcrnp`.
- Migration erfolgreich direkt auf Supabase DEV ausgefuehrt und Version `20261004054924` als angewendet markiert.
- Verifiziert: RLS auf `public.profiles` bleibt aktiv.
- Verifiziert: Triggerdefinition enthaelt keine fest codierte E-Mail mehr.
- Verifiziert: Self-Service kann Rollen und kanonische Vereinszuordnung nicht veraendern.
- Echter Athlete-DEV-Cloudtest bestaetigte Vorname, Nachname, Spitzname, Geburtsdatum, Verband, Trainingsjahre, Wettkampferfahrung, Langfristziel, Saisonziel, Notizen, K1+C1 und C1-Paddelseite nach Reload. Testwerte wurden zurueckgesetzt.
- Echter DEV-Cloudtest bestaetigte App-Einstellungen nach Reload sowie Ziele und persoenliches Material. Testdaten wurden bereinigt beziehungsweise auf den Ausgangswert zurueckgesetzt.

## Betroffene Dateien

- `src/App.tsx`
- `src/services/migrationService.ts`
- `src/services/persistenceServices.test.ts`
- `src/services/profileService.ts`
- `src/services/profileService.test.ts`
- `src/views/ProfileView.tsx`
- `src/views/SettingsView.tsx`
- `tests/e2e/personal-persistence.spec.ts`
- `supabase/migrations/20261004054924_harden_profile_self_update_500.sql`
- `docs/paddlio-codex-handoff.md`
- `docs/paddlio-codex-next.md`

## Tests

- `npm.cmd ci`: erfolgreich; 109 Pakete geprueft, 0 Schwachstellen.
- `npm.cmd run test`: 27 Dateien, 155/155 Tests bestanden.
- `npm.cmd run build`: erfolgreich; nur bestehender Chunk-Groessenhinweis.
- `npm.cmd run check:beta`: Encoding, RLS, Security, Bundle, A11y und Beta-Blocker bestanden.
- Gezielter echter DEV-Test `personal-persistence.spec.ts`: 3/3 bestanden.
- `npm.cmd run test:e2e`: 46 bestanden, 28 vorgesehene Projekt-/Viewport-Skips, 0 Fehler.
- `npm.cmd run test:e2e:roles`: 9 bestanden, 1 vorgesehener Mobile-Projekt-Skip, 0 Fehler.

## Offene Punkte

- Physischer Safari-/PWA-Nachtest auf iPhone und iPad sowie Sichtpruefung auf einem zweiten realen Geraet bleiben manuell. Der Cloud-Roundtrip wurde automatisiert gegen DEV ausgefuehrt.
- Profilbilder werden weiterhin als validierte Data-URL in der eigenen RLS-geschuetzten Profilzeile gespeichert. Eine spaetere Storage-Optimierung ist sinnvoll, aber nicht Bestandteil dieses gezielten Release-Blockers.
- Vereinswechsel erfolgen weiterhin ueber die bestehende berechtigte Admin-Zuordnung. Ein eigener Nutzer-Anfrageworkflow fuer Vereinswechsel waere eine separate Produktentscheidung.

## Naechste sinnvolle Aufgabe

- Nach DEV-Deploy auf iPhone/iPad/PC alle Profilfelder aendern, App schliessen/oeffnen, Logout/Login und ein zweites Geraet pruefen. Insbesondere K1+C1, C1-Paddelseite, Profilbild und Einstellungen kontrollieren.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` veraendert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.

## Commit und Pushstatus

- Implementierungscommit: `6e289bc` (`Fix profile persistence race`).
- Pushstatus: Dokumentationscommit und Push auf `origin/develop` folgen unmittelbar.
