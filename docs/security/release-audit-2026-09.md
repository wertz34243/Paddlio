# Paddlio Security- und Datenschutz-Audit

Stand: 25.09.2026

Dieses Dokument ist eine technische Bestandsaufnahme und kein rechtsanwaltlich geprüfter Rechtstext.

## Ergebnis

Der Client enthält keine eingecheckten geheimen Schlüssel. Der Supabase-Anon-Key ist als öffentlicher Client-Schlüssel vorgesehen; `service_role`, Polar-Client-Secret und Token-Verschlüsselung bleiben ausschließlich in serverseitigen Vercel-Umgebungsvariablen. Eine frühere clientseitige Rollenhoch stufung anhand bestimmter E-Mail-Adressen beziehungsweise editierbarer Auth-Metadaten wurde entfernt. Rollen aus `public.profiles.roles` und Supabase-RLS sind die Berechtigungsquelle.

Vercel liefert CSP, MIME-Schutz, Referrer-Policy, Permissions-Policy, Frame-Schutz und HSTS aus. Die Header müssen nach dem DEV-Deploy noch am realen HTTPS-Endpunkt kontrolliert werden. Polar-API-Endpunkte geben bei internen Fehlern nur stabile öffentliche Fehlercodes zurück; technische Details bleiben in Server-Logs.

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

Die UI trennt Athlete, Coach, TeamAdmin, ClubAdmin und Admin. Client-Gates dienen nur der Bedienoberfläche; Datenzugriff wird durch Supabase-RLS abgesichert. Der statische RLS-Check ist grün. Ein Live-Supabase-DB-Lint konnte auf diesem Rechner nicht ausgeführt werden, weil die Supabase CLI nicht installiert/verfügbar ist. Vor dem Release sind deshalb im DEV-Projekt zusätzlich Security Advisor und Rollen-Matrix mit echten Konten zu prüfen.

## Datenschutzfunktionen

- Eigene Profildaten können berichtigt werden.
- Logout löscht Session und aktuellen lokalen Profildaten-Cache.
- Fachliche CSV-/XLSX-Exporte bleiben vorhanden. Zusaetzlich ist ein eigener JSON-Auskunftsexport ueber die authentifizierte Edge Function `account-privacy` vorbereitet; Abfragen sind explizit auf die verifizierte Nutzer-ID begrenzt und Provider-Tokens werden nicht exportiert.
- Technische Datenschutz-/Impressumsbereiche sind öffentlich bei Registrierung und intern in Einstellungen vorbereitet.
- Eine serverseitige Konto-/Datenloeschung ist als authentifizierte Edge Function implementiert. Der Service-Role-Key bleibt ausschliesslich im Function Runtime Secret; der Client verlangt eine explizite Bestaetigungsphrase und sendet die aktuelle Account-ID als zusaetzliche Verwechslungssperre.
- Die Function muss vor Freigabe noch auf Supabase DEV deployed und mit einem entbehrlichen DEV-Testkonto Ende-zu-Ende verifiziert werden. Gemeinsame Kommunikationsdaten und Storage-Objekte muessen dabei gegen die vom Betreiber freigegebene Aufbewahrungsregel kontrolliert werden.

## Manuelle Release-Blocker

1. Verantwortlichen, ladungsfähige Anschrift, Kontakt und gegebenenfalls Datenschutzkontakt festlegen und in Impressum/Datenschutzerklärung eintragen.
2. Rechtsgrundlagen, Empfänger/Auftragsverarbeiter, Drittlandtransfer, Aufbewahrungs- und Löschfristen rechtlich prüfen lassen.
3. `account-privacy` ausschliesslich auf Supabase DEV deployen und Export/Loeschung mit Athlete, Coach, Admin sowie einem entbehrlichen Loesch-Testkonto pruefen. Aufbewahrung gemeinsamer Kommunikationsdaten und Storage-Loeschung fachlich freigeben.
4. Für minderjährige Athleten Alterskonzept, Einwilligung/Sorgeberechtigte, Sichtbarkeit und Aufbewahrung fachlich und rechtlich entscheiden.
5. Supabase Auth-E-Mail-Templates, Redirect-Allowlist, Passwortregeln, MFA-Entscheidung, Rate Limits, Storage-Buckets und Security Advisor im DEV-Dashboard anhand `manual-dev-security-check.md` prüfen.
6. Vercel-Header am ausgelieferten DEV-Build anhand `manual-dev-security-check.md` verifizieren; CSP-Verstöße in Browserkonsole prüfen.
7. Polar-Auftragsverarbeitung, Scopes, Widerruf/Disconnect und Löschung importierter Daten dokumentieren.

Der Loesch-/Auskunftscode ist vorbereitet, aber ohne DEV-Deploy, Realtest, Betreiberangaben und rechtlich/fachlich freigegebene Aufbewahrungsregeln ist Paddlio noch nicht fuer einen offiziellen oeffentlichen Release freigegeben. Ein manueller technischer Nutzertest kann nach erfolgreichem DEV-Deploy der Function beginnen.
