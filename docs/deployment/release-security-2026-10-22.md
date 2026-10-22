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

Die drei nachfolgenden Sicherheitsdeltas benötigen noch den lokalen Plattformnachweis. Dafür liegt ein gezielter Test unter:
`A:\Codex\2026-10-20\referenced-chatgpt-conversation-this-is-an\outputs\security-delta-check\check-security-delta.ps1`.
Er verwendet ausschließlich den bereits isolierten lokalen Basiscontainer, führt die drei Deltas mit Regressionen in einer Transaktion aus und rollt sie zurück. Kein erneuter Plattform-/Schema-Neuaufbau, keine Remote-Verbindung. Docker bleibt in dieser Agent-Sitzung technisch unzugänglich; Ausführung im normalen Terminal erforderlich.

## Verbleibende Freigabepunkte

- Lokaler Nachweis der drei neuen Sicherheitsdeltas.
- Paket-Audit abgeschlossen: Vite 6.4.5 und Vitest 4.1.12; npm ci erfolgreich, 202 Tests mit Vitest 4.1.12 bestanden, npm audit ohne Vulnerabilities. Commit `70dbdff`. Bestehende lokale CLI-Abhängigkeiten nicht mitcommittet. Referenzen: [Code-Injection-Advisory](https://github.com/advisories/GHSA-qxg6-89mg-rqv8), [Windows-Pfadprüfung](https://github.com/advisories/GHSA-xp26-3454-mjgp).
- Bestehende Advisor-Hinweise: 21 authentifiziert aufrufbare Security-Definer-Hilfsfunktionen; zwei bewusst clientseitig gesperrte Polar-Tabellen; Leaked-Password-Schutz aus. Die neuen privaten Guards verursachen keine zusätzliche öffentliche Definer-Freigabe. [Definer-Prüfung](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [Passwortschutz](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Noch keine vollständige Funktionsfreigabe aller alten Vereinsportal-Schreibpfade: Beim Abgleich fallen abweichende Feldnamen zwischen clubPortalService/betaService und DEV-Tabellen auf. Vor finaler Production-Freigabe gezielt prüfen und angleichen; SQL-Isolationstests ersetzen diese App-Vertragstests nicht.
- Abschließender Production-Read-only-Vergleich, Auth/16+-Hook, Redirects, Mail/Resend, Vercel/Domains und notwendige Referenzdaten müssen in das endgültige Paket eingearbeitet werden.
- Kein DEV-Testnutzer, kein DEV-Testdatensatz und kein Secret wird nach Production kopiert. Turnstile bleibt 5.0.1. Kein Production- oder main-Schreibzugriff ohne getrennte Freigabe.
