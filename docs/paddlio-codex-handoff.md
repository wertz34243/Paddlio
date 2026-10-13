# Paddlio Codex Handoff

## Stand

- Datum: 2026-10-13
- Arbeitsblock: Öffentliche Landeskadertest-Vorbereitung
- Status: IMPLEMENTIERT UND FACHLICH GETESTET

## Änderungen

- Neue öffentliche Route `/kadertest`; in DEV unter `/public-preview/kadertest` erreichbar.
- Auswahl für optionalen Namen, kalendarisches Alter K, biologisches Alter B und Disziplin.
- K steuert Sit & Reach, Rumpfkraft und Technik; B steuert Kraftziele, Sprint und Ausdauer.
- Sämtliche vorgegebenen K1-/C1-Normwerte umgesetzt.
- Für K 13,5 werden keine Technikwerte interpoliert; beide offiziellen Vergleichsstufen und Trainerhinweise werden angezeigt.
- Kraftstation für K 13,5 zeigt beide Möglichkeiten mit Saison-Altersklassen-Hinweis.
- Disziplinspezifische Technik- und Materialchecklisten mit großen Touchzielen.
- Fortschritt, Prozentbalken, lokale Checkbox-Persistenz und Reset ohne Anmeldung oder Cloudzugriff.
- Mobile-First-Dark-Layout; Route bewusst nicht in der Hauptnavigation verlinkt.
- Öffentliche Sitemap um `/kadertest` ergänzt.

## Supabase / Migrationen

- Keine Migration.
- Supabase DEV und Production wurden nicht verändert.
- Die Public-E2E-Prüfung bestätigt: kein Supabase-Request und kein privater Service Worker.

## Tests

- Unit: 33 Dateien, 186/186 bestanden; neue Normwerttests enthalten.
- Build: bestanden; bekannte nicht blockierende XLSX-Chunk-Warnung.
- `check:beta`: Encoding, RLS, Security, Bundle, A11y und Beta bestanden.
- Public-E2E gezielt: 10/10 bestanden in Desktop- und Mobile-Projekt.
- Kadertest-E2E: Auswahl K/B/Disziplin, 13,5-Hinweise, Zielwerte, Persistenz nach Reload, Reset, 375-px-Überlauf und Null Supabase-Requests bestanden.
- Gesamte E2E-Suite: 60 bestanden, 32 vorgesehene Skips, 2 bestehende datenabhängige Fehler. Betroffen sind ausschließlich ein Tablet-Kalender-Screenshot ohne sichtbaren DEV-Trainingseintrag und ein Coach-Mobile-Test ohne vorhandene DEV-Vorlage. Beide Fehler wurden isoliert reproduziert; die Kadertest-/Public-Suite ist nicht beteiligt. Tests wurden nicht deaktiviert.

## Geänderte Dateien

- `src/public/KadertestPage.tsx`
- `src/public/kadertestData.ts`
- `src/public/kadertestData.test.ts`
- `src/public/PublicWebsite.tsx`
- `src/public/publicWebsite.css`
- `public/sitemap.xml`
- `tests/e2e/public-website.spec.ts`

## Offene Punkte

- Die zwei genannten App-E2E-Screenshot-Szenarien benötigen wieder eigenständig erzeugte Fixtures statt vorhandener DEV-Trainings-/Vorlagendaten. Das ist ein bestehender Testinfrastrukturpunkt, kein Fehler der neuen öffentlichen Seite.

## Commit / Push

- Implementierungscommit: `af81d3d` (`Add public kadertest preparation page`).
- Pushstatus: Implementierung und Handoff werden auf `origin/develop` verifiziert.

## Grenzen bestätigt

- Nur Branch `develop`.
- `main`, Production Supabase und DNS unverändert.
- Keine Nutzdaten verändert oder gelöscht.
