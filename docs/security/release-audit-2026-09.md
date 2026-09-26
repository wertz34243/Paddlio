# Paddlio Security- und Datenschutz-Audit

Stand: 26.09.2026

Dieses Dokument ist eine technische Bestandsaufnahme und kein rechtsanwaltlich geprüfter Rechtstext.

## Ergebnis

Der Client enthält keine eingecheckten geheimen Schlüssel. Der Supabase-Anon-Key ist als öffentlicher Client-Schlüssel vorgesehen; `service_role`, Polar-Client-Secret und Token-Verschlüsselung bleiben ausschließlich in serverseitigen Vercel-Umgebungsvariablen. Eine frühere clientseitige Rollenhoch stufung anhand bestimmter E-Mail-Adressen beziehungsweise editierbarer Auth-Metadaten wurde entfernt. Rollen aus `public.profiles.roles` und Supabase-RLS sind die Berechtigungsquelle.

Vercel liefert CSP, MIME-Schutz, Referrer-Policy, Permissions-Policy, Frame-Schutz und HSTS aus. Diese Header wurden am realen DEV-HTTPS-Endpunkt kontrolliert. Polar-API-Endpunkte geben bei internen Fehlern nur stabile öffentliche Fehlercodes zurück; technische Details bleiben in Server-Logs.

`npm audit` meldet nach kompatiblen Patch-/Minor-Aktualisierungen 0 bekannte Schwachstellen. Es wurden keine erzwungenen Major-Upgrades ausgeführt.

## Verarbeitete Daten

| Kategorie | Beispiele | Speicherorte/Zweck |
|---|---|---|
| Konto | E-Mail, Auth-ID, Session | Supabase Auth; Anmeldung und Session |
| Profil | Name, Geburtsdatum, Geschlecht, Körpermaße, Profilbild, Verein, Bootsklasse, Ziele, Notizen | `profiles`, lokaler accountbezogener Cache |
| Training | Pläne, Vorlagen, Durchführung, Intensität, Zeiten, Feedback, Journal | fachliche Supabase-Tabellen und Offline-Cache |
| Organisation | Verein, Gruppen, Mitgliedschaften, Rollen, Aufgaben, Anwesenheit | Supabase mit RLS |
| Kommunikation | Direkt-, Gruppen- und Vereinsnachrichten, Benachrichtigungen, Anhänge | Supabase mit rollenbezogenem Zugriff |
| Wettkampf | Meldungen, Ergebnisse, Bestzeiten, Notizen | Supabase und lokaler Cache |
| Material/Akademie | Boote, Paddel, Materialdaten, Lernfortschritt, Favoriten | Supabase und lokaler Cache |
| Externe Trainingsdaten | Polar-Verbindung, verschlüsselte Provider-Tokens, importierte Einheiten | Tokens nur serverseitig verschlüsselt; Trainingsdaten in Supabase |
| Technik | Offline-Queue, Sync-Zeitpunkte, Build-/Fehlerdiagnose | accountbezogener Browser-Speicher und DEV-/Server-Logs |

Im Client wurde kein Marketing-Tracking, Werbe-Cookie oder Analytics-SDK gefunden. Funktionaler `localStorage` speichert accountbezogene Offline-Daten, Sync-Queue, ID-Zuordnungen und UI-Einstellungen. `sessionStorage` hält kurzlebige Recovery-/Confirmation- und Polar-Rückkehrzustände. Supabase verwaltet seine notwendige Auth-Session. Sensible fachliche Daten liegen dadurch unverschlüsselt im Browserspeicher des Geräts; Logout entfernt den aktuellen Profildaten-Cache, während unsynchronisierte accountbezogene Queue-Daten aus Gründen der Datenintegrität isoliert erhalten bleiben.

## Eingaben, Uploads und Ausgaben

- React rendert Nutzereingaben standardmäßig escaped; es wurde keine produktive Verwendung von `dangerouslySetInnerHTML`, `innerHTML` oder `document.write` gefunden.
- Profilbilder sind auf JPEG, PNG oder WebP und 2 MB begrenzt. SVG wird wegen aktivem Inhalt nicht akzeptiert.
- CSV/XLS/XLSX-Import ist auf 25 MB sowie bekannte Dateitypen begrenzt. Tabellenexport schützt Werte mit `=`, `+`, `-` oder `@` gegen Formula Injection.
- Externe Polar-Zugriffe verwenden serverseitige Secrets, Bearer-Validierung, kurzlebigen OAuth-State und verschlüsselte Provider-Tokens.
- Vollständige UUIDs/E-Mails sollen nur in notwendigen Fachansichten erscheinen, nicht in normaler technischer Fehlerausgabe.

## Rollen und RLS

Die UI trennt Athlete, Coach, TeamAdmin, ClubAdmin und Admin. Client-Gates dienen nur der Bedienoberfläche; Datenzugriff wird durch Supabase-RLS abgesichert. Der statische RLS-Check, der reale DEV-DB-Lint und die Rollen-E2E-Matrix sind gruen. Die verbleibenden Security-Advisor-Warnungen sind unten dokumentiert und muessen vor dem offiziellen Release gezielt gehaertet werden.

## Datenschutzfunktionen

- Eigene Profildaten können berichtigt werden.
- Logout löscht Session und aktuellen lokalen Profildaten-Cache.
- Fachliche CSV-/XLSX-Exporte bleiben vorhanden. Zusaetzlich ist ein eigener JSON-Auskunftsexport ueber die authentifizierte Edge Function `account-privacy` vorbereitet; Abfragen sind explizit auf die verifizierte Nutzer-ID begrenzt und Provider-Tokens werden nicht exportiert.
- Technische Datenschutz-/Impressumsbereiche sind öffentlich bei Registrierung und intern in Einstellungen vorbereitet.
- Eine serverseitige Konto-/Datenloeschung ist als authentifizierte Edge Function implementiert. Der Service-Role-Key bleibt ausschliesslich im Function Runtime Secret; der Client verlangt eine explizite Bestaetigungsphrase und sendet die aktuelle Account-ID als zusaetzliche Verwechslungssperre.
- Die Function ist auf Supabase DEV deployed und mit einem entbehrlichen DEV-Testkonto Ende-zu-Ende verifiziert. Gemeinsame Kommunikationsdaten folgen weiterhin der noch freizugebenden Betreiber-Aufbewahrungsregel. DEV hat aktuell keine Storage-Buckets.

## Manuelle Release-Blocker

1. Verantwortlichen, ladungsfähige Anschrift, Kontakt und gegebenenfalls Datenschutzkontakt festlegen und in Impressum/Datenschutzerklärung eintragen.
2. Rechtsgrundlagen, Empfänger/Auftragsverarbeiter, Drittlandtransfer, Aufbewahrungs- und Löschfristen rechtlich prüfen lassen.
3. Aufbewahrung gemeinsamer Kommunikationsdaten und die kuenftige Storage-Loeschung fachlich freigeben; der aktuelle DEV-Stand hat keine Storage-Buckets.
4. Für minderjährige Athleten Alterskonzept, Einwilligung/Sorgeberechtigte, Sichtbarkeit und Aufbewahrung fachlich und rechtlich entscheiden.
5. Supabase Auth-E-Mail-Templates, Redirect-Allowlist, Passwortregeln, MFA-Entscheidung, Rate Limits, Storage-Buckets und Security Advisor im DEV-Dashboard anhand `manual-dev-security-check.md` prüfen.
6. CSP-Verstoesse in den relevanten Browserablaeufen kontrollieren; die ausgelieferten Header selbst sind real verifiziert.
7. Polar-Auftragsverarbeitung, Scopes, Widerruf/Disconnect und Löschung importierter Daten dokumentieren.

## DEV-Verifikation vom 26.09.2026

- `account-privacy` Version 7 wurde mit aktiver JWT-Pruefung ausschliesslich auf Supabase DEV `nlllqsfdhfiwticrcrnp` deployed.
- Export wurde real als Admin, Coach und Athlete getestet. Die Antworten waren gueltiges JSON, kontobezogen, ohne Provider-/Service-Secrets und ohne unmaskierte fremde Identitaeten.
- Ein nicht authentifizierter Aufruf wurde mit HTTP 401 abgelehnt. `dev.paddlio.de` bestand den CORS-Preflight; eine authentifizierte fremde Origin wurde mit HTTP 403 abgelehnt.
- Die Loeschung wurde mit einem eigens erzeugten entbehrlichen DEV-Testkonto Ende-zu-Ende bestaetigt. Falsche Phrase wurde abgelehnt; Auth-Konto, Profil und markierte eigene Testdaten wurden entfernt, fremde Profile und Clubs blieben unveraendert, erneuter Login schlug fehl.
- DEV-Storage enthaelt aktuell 0 Buckets. Es gab deshalb keine Storage-Objekte zu loeschen; bei spaeter eingefuehrten Buckets ist die Function zu erweitern.
- Ausgelieferte DEV-Header wurden real bestaetigt: HTTPS/HTTP-Redirect, CSP, HSTS, MIME-, Frame-, Referrer- und Permissions-Schutz.
- Supabase DB-Lint meldet keine Schemafehler. Der Security Advisor meldet noch 51 Warnungen: 48 zu direkt aufrufbaren `SECURITY DEFINER`-Hilfsfunktionen, 2 zu mutablem `search_path` und 1 zur deaktivierten Leaked-Password-Protection.

Der vollstaendige manuelle DEV-Nutzertest kann beginnen. Fuer einen offiziellen oeffentlichen Release bleiben die Security-Advisor-Haertung, Auth-Dashboard-Pruefung, Betreiberangaben und rechtlich/fachlich freigegebenen Aufbewahrungsregeln offen.
