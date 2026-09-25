# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-09-25 16:25 CEST
- Aktueller Stabilitaetsblock: Letzte technische Release-Blocker
- Status: CODE UND AUTOMATISIERTE TESTS ABGESCHLOSSEN, DEV-PRIVACY-DEPLOY OFFEN

## Root Cause

Der intermittierende Desktop-Scroll-E2E ermittelte den groessten Scrollwert aus Dokument und beliebigen verschachtelten Elementen. Gleichzeitig konnte die Vorlagenansicht noch asynchron wachsen. Eingabe und Messung bezogen sich dadurch nicht verlaesslich auf denselben Scroll-Owner. Ein weiterer Vorlagen-Screenshot-Test hielt eine Kachel ueber einen asynchronen Re-Render hinweg fest und verlor das DOM-Element zwischen `scrollIntoView` und Klick.

Datenschutzseitig gab es nur fachliche CSV/XLSX-Exporte. Ein vollstaendiger kontobezogener Auskunftsexport und eine serverseitige Gesamtdatenloeschung fehlten. Eine sichere Loeschung kann nicht im Browser implementiert werden, weil `auth.admin.deleteUser` ausschliesslich serverseitig mit einem geheimen Schluessel ausgefuehrt werden darf.

## Aenderungen

- Desktop-Scrolltest misst nur noch `document.scrollingElement`, wartet zustandsbasiert auf reale Dokumenthoehe und prueft Mausrad, Pfeiltasten, Page Up/Down sowie Home/End am selben Scroll-Owner.
- Vorlagen-E2E nutzt die sichtbare Training-Segmentnavigation und einen atomaren Locator-Klick; geteiltes `scrollIntoView` und kuenstlicher Sleep wurden entfernt.
- Neuer kontobezogener JSON-Auskunftsexport in den Einstellungen.
- Neue zweistufig bestaetigte Kontoloeschung mit exakter Phrase `KONTO ENDGUELTIG LOESCHEN`.
- Neue authentifizierte Supabase Edge Function `account-privacy` fuer Export und Loeschung.
- Exportabfragen sind explizit auf die verifizierte Auth-ID begrenzt; fremde Identitaetsfelder werden maskiert und Polar-Zugangstokens nie exportiert.
- Service-Role bleibt ausschliesslich in der Edge-Function-Laufzeit. Der Client enthaelt weder Admin-API noch Geheimschluessel.
- Loeschpfad entfernt eigene Datensaetze in Abhaengigkeitsreihenfolge, trennt personenbezogene Zuordnungen aus gemeinsam verbleibenden Trainings und loescht abschliessend den Auth-Benutzer.
- DEV-Sicherheitscheck fuer Header, HTTPS, Auth, RLS, Security Advisor, Storage, Redirects, CORS und Edge Function dokumentiert.
- Technische Einfuegepunkte fuer ein spaeter fachlich/rechtlich beschlossenes Minderjaehrigen- und Einwilligungskonzept dokumentiert; keine Altersgrenze erfunden.
- Release-Audit und `paddlio-codex-next.md` aktualisiert; Auftrag steht auf `DONE`.

## Migrationen

- Keine Datenbankmigration erforderlich oder angewendet.
- Neue Edge Function: `supabase/functions/account-privacy/index.ts`.
- Manuelle DEV-Deploy-Anleitung: `supabase/functions/account-privacy/README.md` und `docs/security/manual-dev-security-check.md`.

## Supabase DEV Ergebnis

- Verbindliches Ziel bleibt ausschliesslich `nlllqsfdhfiwticrcrnp`.
- `where.exe supabase` bestaetigt: Supabase CLI ist auf diesem Rechner nicht verfuegbar.
- Deshalb wurde die Edge Function nicht auf DEV deployed und kein echter Export-/Loeschtest behauptet.
- Es gab keine Datenbankbefehle, keine Datenmutation und keinen Zugriff auf Production.
- Vor Freigabe der Privacy-Funktionen muss Tobias die Function mit aktivierter JWT-Pruefung auf DEV deployen, `PADDLIO_ALLOWED_ORIGINS=https://dev.paddlio.de` setzen und die Checkliste mit entbehrlichen DEV-Testkonten ausfuehren.

## Betroffene Tabellen, Policies und Funktionen

- Keine Tabellen, RLS-Policies, Trigger oder Indizes geaendert.
- Die Edge Function liest ausschliesslich explizit kontobezogene Zeilen aus Profil-, Training-, Feedback-, Journal-, Kommunikation-, Team-, Material-, Academy-, Import- und Polar-Tabellen.
- Loeschung verwendet eine serverseitige, explizite Tabellenliste. Gemeinsame Trainings bleiben erhalten; persoenliche Athlete-/Coach-Zuordnungen werden getrennt.
- Private Storage-Objekte sind noch gegen die finale Betreiber-Aufbewahrungsregel zu inventarisieren und im DEV-Loeschtest zu verifizieren.

## Tests

- `npm ci`: erfolgreich; 109 Pakete geprueft, 0 Schwachstellen.
- `npm audit`: 0 bekannte Schwachstellen.
- `npm test`: 23 Dateien, 125/125 Tests erfolgreich.
- `npm run build`: erfolgreich; bekannte nicht blockierende Chunk-Warnung ueber 500 kB bleibt.
- `npm run check:encoding`: erfolgreich.
- `npm run check:rls`: erfolgreich.
- `npm run check:bundle`: erfolgreich.
- `npm run check:a11y`: erfolgreich.
- `npm run check:beta`: erfolgreich, einschliesslich Security-Check.
- Desktop-Scroll gezielt: 5/5 Wiederholungen erfolgreich.
- Desktop-Vorlagenrace gezielt: 3/3 Wiederholungen erfolgreich.
- `npm run test:e2e`: 41 erfolgreich, 23 vorgesehene projekt-/viewportbezogene Skips, 0 Fehler.
- `npm run test:e2e:roles`: 9 erfolgreich, 1 vorgesehener Mobile-Mehrgeraete-Skip, 0 Fehler.
- Neue Unit-Tests pruefen falsche Loeschbestaetigung, Account-ID-Uebergabe und unvollstaendige Exportantworten.
- Echter Edge-Function-, Storage- und Loeschtest auf Supabase DEV ist noch offen.

## Commit und Pushstatus

- Implementierungscommit: `19890db` (`Close technical release blockers`).
- Pushstatus: erfolgreich auf `origin/develop`.
- Dieser Handoff wird in einem separaten Dokumentationscommit nachgezogen.

## Offene technische Blocker

- Edge Function auf DEV deployen und mit Athlete, Coach, Admin sowie einem entbehrlichen Loeschkonto testen.
- Private Storage-Buckets und zugehoerige Objekte im Loeschprozess pruefen; finaler Umgang haengt von der Betreiber-Aufbewahrungsregel ab.
- Ausgelieferte Vercel-Header, Supabase Security Advisor, Redirect-Allowlist, CORS und Storage-Policies manuell anhand der Checkliste bestaetigen.

## Offene organisatorische/rechtliche Punkte

- Betreiber-, Impressums- und Datenschutzkontakt bereitstellen.
- Rechtsgrundlagen, Aufbewahrungsfristen, gemeinsame Kommunikationsdaten und Loeschfolgen rechtlich/fachlich freigeben.
- Minderjaehrigen-/Einwilligungskonzept entscheiden; technische Einfuegepunkte sind dokumentiert, aber bewusst nicht implementiert.

## Naechster sinnvoller Stabilitaetsblock

DEV-Privacy-Deployment und Realtest: Edge Function ausschliesslich auf `nlllqsfdhfiwticrcrnp` deployen, Exportdaten je Rolle pruefen, ein neu angelegtes entbehrliches DEV-Konto Ende-zu-Ende loeschen und danach Auth-, Tabellen- und Storage-Reste kontrollieren. Parallel die manuelle Hosting-/Supabase-Sicherheitscheckliste protokollieren.

## Manueller Nutzertest

Der allgemeine technische Nutzertest von Paddlio kann beginnen: Build, Unit-, Rollen- und vollstaendige E2E-Suite sind gruen. Die neuen Menuepunkte fuer Auskunftsexport und Kontoloeschung duerfen erst nach dem DEV-Deploy der Edge Function als testbereit oder bestanden bewertet werden. Ein offizieller oeffentlicher Release ist wegen der genannten manuellen und rechtlichen Punkte noch nicht freigegeben.

## Sicherheitsbestaetigung

- Ausschliesslich Branch `develop` verwendet.
- Ausschliesslich Supabase DEV `nlllqsfdhfiwticrcrnp` als vorgesehenes Ziel dokumentiert.
- `main` unveraendert.
- Production Supabase `twlkhfbrrwjwppxinmpn` unveraendert.
