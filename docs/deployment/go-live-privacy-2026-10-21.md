# Paddlio 5.0: Privacy-Fixes und verbleibende Freigabeschritte

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
