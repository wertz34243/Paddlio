# Paddlio 5.0: Privacy-Fixes und verbleibende Freigabeschritte

Aktueller Stand: [Sicherheitsnachweis vom 22.10.2026](release-security-2026-10-22.md). Die dort dokumentierten abgeschlossenen Tests, vorhandenen Testkonten, Sicherheitsmigrationen und Paketupdates ersetzen die älteren offenen Punkte dieses historischen Berichts. Production-Freigabereife ist noch nicht erreicht.

DEV `nlllqsfdhfiwticrcrnp` ist die Release-Referenz. Production `twlkhfbrrwjwppxinmpn` und main wurden nicht verändert. Ein Backup des entbehrlichen alten Production-Standes ist kein Release-Blocker. DEV-Nutzerdaten werden nicht übernommen. Turnstile bleibt 5.0.1; für 5.0 Site-Key leer lassen und CAPTCHA deaktiviert halten.

## Umgesetzt

- Keine globale Nachrichtenbereinigung mehr. Nur Nachrichten des gelöschten Kontos ohne verbleibenden Teilnehmer werden entfernt.
- Auth-Kontolöschung und relationale Bereinigung laufen in einer Transaktion. Bei fehlendem Trigger verweigert der Endpunkt die Löschung. Ein absichtlich ausgelöster FK-Fehler belegt den vollständigen Rollback.
- Gemeinsame Nachrichten, fremde Trainingspläne, Academy-Zuweisungen und Wettkampfergebnisse bleiben erhalten. Prüfverweise auf ausgeschiedene Trainer werden gelöst.
- Signup vergibt ausschließlich Athlete und keine ungeprüfte Vereinszugehörigkeit. Benutzer-Metadaten und E-Mail-Sonderfälle vergeben keine privilegierten Rollen. Bestehende Rollen bleiben unverändert.
- Vier neue Migrationen sind auf DEV angewendet; lokale Dateiversionen entsprechen der vom Server vergebenen History. Edge Function account-privacy v10 ist mit JWT-Prüfung auf DEV aktiv.
- `.env.e2e.local` ist lokal vorhanden und von Git ausgeschlossen. `node scripts/prepare-dev-test-env.mjs` legt nur fehlende Dateien an und überschreibt keine Zugangsdaten. Angemeldete Playwright-Tests verweigern eine andere als die exakte DEV-URL.

## DEV-Testzugänge

Es fehlen verifizierte Zugänge für Athlete, Coach, ClubAdmin und Admin. Benötigt werden vier unterschiedliche, bestätigte DEV-E-Mail-Konten unter Kontrolle von Tobias; konkrete Adressen sind noch nicht festgelegt. Keine alten Chat-Passwörter verwenden.

Lokal in `A:\Codex\Paddlio\.env.e2e.local` die Paare `PADDLIO_E2E_ATHLETE_EMAIL/PASSWORD`, `PADDLIO_E2E_COACH_EMAIL/PASSWORD`, `PADDLIO_E2E_CLUBADMIN_EMAIL/PASSWORD` und `PADDLIO_E2E_ADMIN_EMAIL/PASSWORD` ausfüllen. Für Rollen-/Sync-Tests benötigen Athlete und Coach passende gemeinsame Vereins-/Gruppenzuordnungen; Admin/ClubAdmin müssen ihre Rollen serverseitig in profiles.roles erhalten. Keine Service-Role-Schlüssel in dieser Datei nötig. Passwörter weder in Chat noch Git übernehmen.

## Verifikation und Grenzen

- 193 bestehende Unit-Tests und 9 neue Handler-Tests bestanden.
- Zusätzlich saubere Installation aus versioniertem package.json/Lockfile in isolierter Dateikopie: npm ci, Build, 193+9 Tests und check:beta bestanden. Die Paketdateien im Arbeitsprojekt bleiben unverändert. Der Build nutzt den bekannten Basis-SHA als Build-Metadatum, weil die Kopie kein Git-Checkout ist.
- npm audit meldet für das versionierte Vite 6.4.3 eine hohe Schwachstelle (GHSA-587h-7wmj-h5pm sowie zwei moderate Advisories im Windows-Entwicklungsserver). Ein Paketupdate muss mit den bewusst unangetasteten lokalen Paketänderungen abgestimmt werden; keine automatische Lockfile-Änderung vorgenommen.
- TypeScript/Vite-Build und check:beta bestanden; bekannte Chunk-Warnung bei xlsx.
- SQL-Regression auf DEV: Rollback bei Löschfehler, Isolation gegenüber anderen Konten, Erhalt gemeinsamer Daten einschließlich Wettkämpfen und eingeschränkte Funktionsrechte bestanden. Alle SQL-Testfixtures zurückgerollt.
- Signup-Test mit manipulierten Rollen/Vereins-Metadaten bestanden; Fixture zurückgerollt.
- Service-role-Aufruf der Bereitschaftsprüfung bestanden. Alle public-Tabellen haben RLS. Das ist kein Ersatz für die vollständige Rollenmatrix.
- Sicherheitsberater: bestehende Warnungen für absichtlich authentifiziert ausführbare RLS-Hilfsfunktionen sowie deaktivierten Leaked-Password-Schutz; Polar-Geheimnistabellen sind durch RLS ohne Client-Policies gesperrt. Diese Bestandswarnungen nicht als vollständige Sicherheitsfreigabe interpretieren.
- Die vollständige Browser-Suite wurde gestartet; credentialabhängige Tests werden übersprungen. Der Lauf lieferte keinen verlässlichen abschließenden Exit-Nachweis. Kein vollständiges E2E-Go behauptet.
- Im protokollierten Lauf wurden 22 Tests als bestanden und 80 als übersprungen gemeldet. Übersprünge umfassen die fehlenden Rollen-Zugänge sowie ausgeschaltetes CAPTCHA. Letzteres gehört nicht zu 5.0.
- Die echte HTTP-Kontolöschung mit einem ausdrücklich dafür bestimmten Wegwerfkonto sowie ein authentifizierter Export sind noch nachzuweisen. Es wurde kein bestehendes Nutzerkonto gelöscht.
- Storage-Objekte führen zum sicheren Abbruch statt einer Teillöschung. DEV hatte beim Audit keine Storage-Objekte. Ein späterer Upload-Release benötigt einen gesonderten Storage-Löschablauf.

## Production-Paket und Stop-Grenze

Das begleitende Review-Paket enthält das hashgeprüfte DEV-Schema vom 19.10.2026, die vier neuen Migrationen, die Edge Function, Tests und einen Ablaufplan. Es enthält keine DEV-Tabelleninhalte oder Zugangsdaten. Ein frischer Schemaexport und der isolierte Neuaufbau dieses konkreten Pakets sind noch nicht abgeschlossen: der CLI-Zugang ist im aktuellen Sitzungskontext nicht angemeldet. Kein blindes Replay der historischen Migrationen und keine pauschale History-Reparatur.

Vor Production-Freigabe: vier Testzugänge lokal bereitstellen, vollständige Rollen-/HTTP-Tests abschließen, aktuellen DEV-Schemaexport samt Auth-/Realtime-Ergänzungen erstellen und den sauberen Neuaufbau testen. Danach konkrete Schema-/Auth-/Hosting-Schritte Tobias zur Freigabe vorlegen. Keine Freigabe für Production oder main wird aus diesem Dokument abgeleitet.

Quellen: https://supabase.com/docs/guides/auth/managing-user-data und https://supabase.com/docs/guides/database/functions.

## Verifizierter Fortschritt vom 22.10.2026

Dieser Abschnitt ersetzt widersprechende offene Punkte oben.

- Schema-Neuaufbau bestanden: `paddlio-schema-28492c488b3d`, Ergebnis lokal unter `A:\Codex\Backups\Paddlio-Dev\paddlio-schema-28492c488b3d\RESULT.txt` selbst gelesen. Schema-SHA256 `C2133CE051FB2F1A25F9CF5D40D75BA14E02816FA03AEB743A88B54827EB9D30`. 63 Anwendungstabellen, 133 Policies, keine public-Tabelle ohne RLS, 120 Funktionsrechte-Assertions; Signup, Kontoloeschung und Rollback bestanden, keine persistenten Testdaten. Dieser Nachweis gilt fuer genau diese Basis; nachfolgende Security-Deltas benoetigen gezielte Nachweise.
- Vier DEV-Testkonten vorhanden, Rollen/Navigation Desktop und Mobil bestanden. Zugangsdaten ausschliesslich lokal und Git-ignoriert. Authentifizierter Export, Abweisung fremder Loeschbestaetigung und echte Loeschung eines eigens erzeugten Wegwerfkontos bestanden.
- Rollen-Haertung `20261021145502_release_profile_authorization.sql` auf DEV angewendet und mit SQL-/REST-Eskalationstests verifiziert. Nicht erneut anwenden.
- Vite 6.4.5 vorbereitet: saubere Installation, Build/TypeScript, 202 Unit-Tests und Beta-Checks bestanden; npm audit ohne Vulnerabilities im bisherigen Nachweis. Root-Installation ebenfalls 6.4.5. Selektiv committen, vorhandene fremde Supabase-CLI-Aenderungen in package.json/Lockfile nicht aufnehmen.
- Git remote aktuell bestaetigt: develop `ea2e9eff9c194a3f386826eb3a4ce550f438b7a4`, main `4fd7ea7ff0f803ca33a02a8aba5e285cef66687e`. Keine ungepushten Commits; weitere Release-Aenderungen noch uncommitted.
- Sicherheitsblocker bestaetigt: 20 Legacy-Policies `*_own_or_club_413` erlauben ALL allein bei `auth.uid() IS NOT NULL`. Vollstaendige Trennung von Konten/Vereinen dadurch nicht gegeben. Vor Freigabe korrigieren und negative Rollenpruefungen ausfuehren. Die Zahl aktivierter RLS-Tabellen ist kein Isolationsnachweis.
- Production-Paket weiterhin nicht freigabereif. Production und main unveraendert. Turnstile bleibt 5.0.1.
