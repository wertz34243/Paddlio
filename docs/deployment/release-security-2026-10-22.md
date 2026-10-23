# Paddlio 5.0: Sicherheitsnachweis vom 22.10.2026

DEV `nlllqsfdhfiwticrcrnp` bleibt Referenz. Production und main wurden nicht verändert. Dieses Dokument bestätigt die unten genannten Prüfungen, noch keine vollständige Production-Freigabereife.

## Behobene Fehler

20 Legacy-Policies erlaubten alle Operationen allein aufgrund eines vorhandenen auth.uid(). Das ließ sich mit einem fremden Athlete-Konto auf beta_feedback reproduzieren. Drei kontrollierte DEV-Migrationen ersetzen diese Regeln und sichern weitere, durch Negativtests nachgewiesene Umgehungen:

- `20261022045958_release_legacy_rls_scopes.sql`: Eigentümer-, Vereins-, Gruppen- und Empfängerfilter; Admin nur mit aktiver profiles.roles-Zuweisung.
- `20261022111013_release_rls_identity_guards.sql`: restriktive Aktivstatusprüfung auf allen 20 Tabellen, unveränderliche Identitäts-/Zuordnungsfelder, passende Aufgabenempfänger und Trainingsbezüge.
- `20261022111439_release_rls_insert_scopes.sql`: keine fremden Eigentümer unter einer eigenen Vereins-ID; keine fremden Vereins-IDs auf eigenen Datensätzen; Empfängerzugriff auf zugewiesene Empfehlungen.

Alle drei sind auf DEV angewendet. Lokale Dateinamen entsprechen der Remote-History. Nicht erneut auf DEV anwenden. Die eingebetteten Regressionstests arbeiten mit zufälligen, synthetischen IDs und rollen sämtliche Fixtures zurück; eine fehlgeschlagene Assertion verhindert die gesamte Migration.

Rollen werden in den neuen Regeln über aktive profiles.roles geprüft. Eine Vereinsmitgliedschaft begrenzt den Zuständigkeitsbereich und erzeugt keine Rolle. Private Trigger haben einen leeren search_path, sind nicht über anon/authenticated ausführbar und prüfen fremde Referenzen serverseitig. Die privilegierte Triggerprüfung ist erforderlich, damit gültige Empfänger auch dann geprüft werden können, wenn deren Profil nicht direkt für den aufrufenden Client sichtbar ist.

## Zugriffsmodell der 20 Tabellen

Aktiver globaler Admin darf verwalten. Für alle anderen gelten folgende Grenzen:

| Tabelle | Lesen | Schreiben |
| --- | --- | --- |
| beta_feedback | Eigentümer, ClubAdmin des Vereins | Eigentümer |
| beta_readiness_checks | nur Admin | nur Admin |
| beta_testers | Betroffener, ClubAdmin des Vereins | nur Admin |
| boats | Eigentümer, zuständiges Vereinspersonal | dieselben |
| club_material | Eigentümer, zuständiges Vereinspersonal | dieselben |
| club_events | zuständiges Vereinspersonal | dieselben |
| club_documents | Eigentümer/Ersteller, Personal für Vereinsdokumente; ClubAdmin verwaltet | ClubAdmin |
| club_settings | zuständiges Vereinspersonal | ClubAdmin |
| external_connections | Eigentümer | Eigentümer |
| external_training_sessions | Eigentümer, zuständiges Vereinspersonal | Eigentümer |
| file_attachments | Eigentümer | Eigentümer |
| personal_bests | Eigentümer, zuständiges Vereinspersonal | dieselben |
| result_imports | Eigentümer, zuständiges Vereinspersonal | dieselben |
| smart_coach_recommendations | Eigentümer oder bestimmter Empfänger | Eigentümer |
| group_messages | Absender, Gruppenmitglied, zuständiges Vereinspersonal | Absender mit Gruppenzugriff |
| tasks | Ersteller, Vereinsmitglieder | Ersteller mit Personalrolle im Verein |
| task_assignments | Empfänger oder Ersteller der Aufgabe | Aufgabenersteller; Empfänger darf auf bestehende Zuweisung antworten |
| training_attendance | betroffener Athlet, zuständiges Vereinspersonal | dieselben; neuer Eintrag muss zu zugänglichem Training/Athlet passen |
| club_posts | Autor oder tatsächliche Zielgruppe/Empfänger | Autor mit Personalrolle im Verein |
| club_messages | Absender oder tatsächliche Zielgruppe/Empfänger | Absender mit Personalrolle im Verein |

Vereinspersonal bezeichnet Coach, TeamAdmin und ClubAdmin. Identitäts-, Vereins-, Aufgaben-, Trainings- und Empfängerfelder bestehender Datensätze sind für Client-Updates unveränderlich. Eine absichtliche administrative Neuzuordnung braucht den kontrollierten serverseitigen Weg. Widersprüchliche Eigentümer-Aliase werden abgewiesen.

## Durchgeführte Prüfungen

- SQL: 20 Tabellen × drei fremde Rollen × SELECT/UPDATE/DELETE/INSERT = 240 negative Zugriffsprüfungen mit zwei getrennten Vereinen.
- Zusätzlich: aktive Admin-Zugriffe, eigene Datensätze, gleiche Vereinszugehörigkeit ohne Privatdatenrecht, Coach/TeamAdmin/ClubAdmin im eigenen Verein, deaktivierter Admin und deaktivierter Eigentümer, anonyme Zugriffe.
- Zusätzlich: erlaubte Gruppen-/Empfängerzugriffe, Nichtmitglieder, fremde Empfänger, falsche Gruppe/Verein-Kombination, Aufgabenantwort ohne Neuzuordnung, erlaubte Anwesenheit und fremdes Training, Empfehlungen für den vorgesehenen Empfänger.
- Vorher gezielt reproduziert: fremdes Beta-Feedback lesbar, widersprüchliche Eigentümer akzeptiert, fremder Eigentümer unter eigener Vereins-ID akzeptiert. Nach jeweiliger Korrektur bestehen die Tests.
- Echte REST-Aufrufe: eigenes external_connections-Testobjekt erreichbar; fremdes Lesen/Ändern/Löschen/Einfügen sowie Identitätsänderung abgewiesen. Temporäres Objekt anschließend entfernt.
- Katalog danach: 174 Policies, keine der 20 pauschalen Legacy-Freigaben, keine öffentliche Tabelle ohne RLS, keine verbliebenen SQL-Testnutzer. Private Guard-Funktion für anon/authenticated nicht direkt ausführbar.
- Vollständiger Browser-Lauf: zunächst 59 bestanden, 3 fehlgeschlagen, 40 übersprungen. Drei Testursachen korrigiert und gezielt nachgeprüft: 8/8 bestanden. Damit sind alle 62 relevanten Fälle durch bestandene Läufe abgedeckt.
- Nach finaler RLS-Härtung erneut betroffene Rollen-/Sync-/Mobilprüfungen: 15 bestanden, 7 gerätebedingte Übersprünge.
- Die 40 Übersprünge des Gesamtlaufs: 8 CAPTCHA-Fälle bewusst außerhalb 5.0 (5.0.1); 32 Geräte-/Projekt-Duplikate, deren eigentliche Variante ausgeführt wurde. Keine fehlenden Rollen-Zugangsdaten als Skip-Ursache.
- 193 App-Unit-Tests und 9 Privacy-Handler-Tests bestanden; Build/TypeScript, Encoding, statischer RLS-/Security-Check, Bundle-Budget, Accessibility- und Beta-Checks bestanden. Keine Aussage, dass statische Checks allein die RLS-Isolation beweisen.

Browser-Fixes betreffen ausschließlich Teststabilität: aktuelle Woche statt blindem Zurückblättern; Konto-ID statt veränderbarem Anzeigenamen; ausreichendes Zeitbudget nach Reload; viewportbezogene Tablet-Screenshots ohne künstliche Resize-Nebenwirkungen.

## Schema-Nachweis und gezielter Nachtest

Der erfolgreiche Basislauf `paddlio-schema-28492c488b3d` bleibt gültig: 63 Tabellen, 133 Policies, 120 Funktionsrechteprüfungen, Signup und atomare Löschung/Rollback, keine persistenten Anwendungs-/Auth-Daten. Basisschema SHA256:
`C2133CE051FB2F1A25F9CF5D40D75BA14E02816FA03AEB743A88B54827EB9D30`.

Die drei Sicherheitsdeltas sind lokal nachgewiesen: `paddlio-security-delta-3251311ee70c`, SECURITY DELTA PASSED. Alle eingebetteten Isolations-/Empfängerprüfungen bestanden; Rollback bestätigt 63 Tabellen / 133 Policies / null Auth-Nutzer im unveränderten Basiscontainer. Testskript:
`A:\Codex\2026-10-20\referenced-chatgpt-conversation-this-is-an\outputs\security-delta-check\check-security-delta.ps1`.
Er verwendet ausschließlich den bereits isolierten lokalen Basiscontainer, führt die drei Deltas mit Regressionen in einer Transaktion aus und rollt sie zurück. Kein erneuter Plattform-/Schema-Neuaufbau, keine Remote-Verbindung. Tobias hat den Lauf im normalen Terminal abgeschlossen; RESULT.txt wurde anschließend gelesen.

## Verbleibende Freigabepunkte

- Lokaler Nachweis der drei Sicherheitsdeltas abgeschlossen. Beide Release-Commits auf origin/develop bestätigt: `464627d3509ff1ed60bf72612b3de389f6de2c74`; main unverändert.
- Paket-Audit abgeschlossen: Vite 6.4.5 und Vitest 4.1.12; npm ci erfolgreich, 202 Tests mit Vitest 4.1.12 bestanden, npm audit ohne Vulnerabilities. Commit `70dbdff`. Bestehende lokale CLI-Abhängigkeiten nicht mitcommittet. Referenzen: [Code-Injection-Advisory](https://github.com/advisories/GHSA-qxg6-89mg-rqv8), [Windows-Pfadprüfung](https://github.com/advisories/GHSA-xp26-3454-mjgp).
- Bestehende Advisor-Hinweise: 21 authentifiziert aufrufbare Security-Definer-Hilfsfunktionen; zwei bewusst clientseitig gesperrte Polar-Tabellen; Leaked-Password-Schutz aus. Die neuen privaten Guards verursachen keine zusätzliche öffentliche Definer-Freigabe. [Definer-Prüfung](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [Passwortschutz](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Noch keine vollständige Funktionsfreigabe aller alten Vereinsportal-Schreibpfade: Beim Abgleich fallen abweichende Feldnamen zwischen clubPortalService/betaService und DEV-Tabellen auf. Vor finaler Production-Freigabe gezielt prüfen und angleichen; SQL-Isolationstests ersetzen diese App-Vertragstests nicht.
- Abschließender Production-Read-only-Vergleich, Auth/16+-Hook, Redirects, Mail/Resend, Vercel/Domains und notwendige Referenzdaten müssen in das endgültige Paket eingearbeitet werden.
- Kein DEV-Testnutzer, kein DEV-Testdatensatz und kein Secret wird nach Production kopiert. Turnstile bleibt 5.0.1. Kein Production- oder main-Schreibzugriff ohne getrennte Freigabe.

## Fortschreibung 23.10.2026: Portal-Verträge und Rollenhelfer

DEV-Migrationen (bereits angewendet, nicht erneut anwenden):
- 20261023095648_release_portal_contract: fehlende bestehende Formularfelder, eingeschränkte Dokumentrollen und private Vereinsreferenzprüfung.
- 20261023100853_release_authorization_helpers: Rollen ausschließlich aus aktiven profiles.roles; aktive Mitgliedschaften liefern nur Vereinszuständigkeit. Auch ältere Trainings-/Academy-Helfer prüfen den aktiven Kontostatus. Leerer search_path für die geänderten Helfer.

App-Korrekturen: kanonische DEV-Felder für Eigentümer, Nachrichten, Feedback und Dokumente; Vereinseinstellungen als benannter JSON-Datensatz mit stabiler ID und passender Offline-Konfliktregel. Das Portal verwendet die bestätigte Vereins-ID statt eines Namens; fehlende Vereinszuordnung führt zu einer klaren Meldung. Dokument-/Einstellungsänderungen sind im Portal auf ClubAdmin/Admin begrenzt. Der zuvor fehlende Sportler-Empfänger ist auswählbar.

Nachweise:
- Eingebettete SQL-Regressionen beider Migrationen bestanden, Fixtures zurückgerollt. Zusätzliche portal_contract_boundaries.sql prüft fremde Sportler-/Trainer-/Gruppenreferenzen bei Insert und Update.
- Rollenfehler vor Korrektur reproduziert: Mitgliedschaft mit ClubAdmin-Rolle verlieh Rechte trotz Athlete-Profil. Nach Korrektur: keine Rollenableitung aus Mitgliedschaften, erlaubte Coach/ClubAdmin-Zuständigkeit bleibt erhalten, deaktivierte Konten verlieren auch Eigentümerrechte in den geprüften Helfern.
- Echter DEV-API-Vertragstest mit Athlete, Coach, ClubAdmin und Admin: alle acht Portal-/Beta-Datentypen gespeichert und wieder gelesen, selektive Empfänger-/Dokumentrollen geprüft, zweites Speichern der Einstellungen geprüft. Nach abschließender Helfer-Korrektur erneut bestanden. Eigene Fixtures entfernt, vorherige Einstellungen wiederhergestellt. Zugangsdaten ausschließlich aus ignorierten lokalen Env-Dateien.
- Neuer Browserfall: ClubAdmin speichert Material, vollständiger Reload, Datensatz wieder sichtbar; eigener Datensatz anschließend gelöscht. Fall bestanden; hängen gebliebener Testserver-Nachlauf anschließend beendet, daher kein Exit-0-Nachweis des gesamten Runner-Prozesses behauptet.
- 202 Unit-Tests, TypeScript/Build und check:beta bestanden. Paketversionen unverändert; bereits dokumentiertes Audit mit null Vulnerabilities bleibt der letzte Paketnachweis.

Der lokale Plattformnachweis der zwei NEUEN Migrationen steht noch aus. Vorbereitetes Paket: A:\Codex\2026-10-20\referenced-chatgpt-conversation-this-is-an\outputs\portal-contract-check\check-portal-contract.ps1. Lädt die drei bereits bewiesenen Sicherheitsdeltas nur als Abhängigkeiten ohne deren alte Regressionen, prüft die neuen Änderungen und rollt alles auf den leeren Basisstand zurück. Erwartet PORTAL CONTRACT PASSED. Kein Remote-Zugriff.

Advisor-Bewertung: Die 21 authentifiziert erreichbaren Definer-Helfer sind weiterhin sichtbar, weil sie von RLS bzw. der eingeschränkten Kontaktabfrage benötigt werden; pauschales Entziehen würde erlaubte Zugriffe brechen. Die überprüften Rollen-/Aktivstatusfehler wurden behoben, die Warnung selbst ist damit nicht verschwunden. Zwei Polar-Tabellen bleiben absichtlich ohne Client-Policy gesperrt. Leaked-Password-Schutz weiterhin aus; Aktivierung/Planverfügbarkeit offen (laut Supabase ab Pro), keine kostenpflichtige Planänderung vorgenommen. Vor endgültiger Freigabe Auth-/Mail-/Domains-/Seed-Konfiguration und Production-Vergleich abschließen. Production-Paket weiterhin nicht freigabereif.

Nach Abschluss der Helfer-Migration: alle fünf Browser-Rollen-/Zwei-Geräte-Sync-Fälle bestanden. Auch hier blieb nur der Testserver-Nachlauf hängen und wurde beendet. Die drei SQL-Regressionsdateien legacy_rls_scopes, legacy_rls_boundaries und legacy_rls_recipients wurden wegen der geänderten gemeinsamen Helfer gezielt nochmals ausgeführt: alle bestanden. Katalogkontrolle: 175 Policies, keine Public-Tabelle ohne RLS, keine synthetischen SQL-Testnutzer.
