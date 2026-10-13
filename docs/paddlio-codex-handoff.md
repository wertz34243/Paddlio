# Paddlio Codex Handoff

## Stand

- Datum: 2026-10-13
- Arbeitsblock: Landeskadertest auf alle Altersklassen erweitern
- Status: IMPLEMENTIERT UND GETESTET

## Root Cause / Ausgangslage

- Die erste Kadertest-Version enthielt nur die zuvor angeforderten Stufen 13,0, 13,5 und 14,0.
- Das DKV-Testmanual weist Normen für die Altersklassen 11 bis 18, zusätzliche biologische Halbjahresstufen sowie getrennte weibliche und männliche Werte aus.
- Techniknormen existieren ausschließlich für ganze Altersklassen; Zwischenwerte dürfen nicht interpoliert werden.

## Änderungen

- Kalendarisches Alter K auf 11,0 bis 18,0 erweitert; die im Manual vorhandenen Halbjahreswerte sind enthalten.
- Biologisches Alter B auf sämtliche veröffentlichten Werte von 10,0 bis 18,0 erweitert. 17,5 wird nicht angeboten, da das Manual dafür keinen Wert enthält.
- Geschlechtsauswahl ergänzt, damit die getrennten DKV-Normen für weibliche und männliche Sportler korrekt verwendet werden.
- Vollständige Normtabellen für Sit & Reach, Rumpfkraft, Klimmzüge, Liegestütze, relative Kraft, K1-/C1-Sprint und K1-/C1-Ausdauer übernommen.
- Technikmittelwerte und Einzeltechnik-Normen für K1 und C1 der Altersklassen 11 bis 18 übernommen.
- Technikaufgaben werden altersabhängig angezeigt: Grundtechniken bis AK 14, C1 Konter/Übergriff ab AK 13, C1 Verkanten ab AK 14 und C1 Staken ab AK 15.
- Bei Halbjahresstufen werden keine Technikwerte erfunden. Die Seite zeigt die beiden benachbarten offiziellen Mittelwerte und einen Trainerhinweis.
- Kraftstation wechselt gemäß Testprogramm von Klimmzügen/Liegestützen zu Bankziehen/Bankdrücken. Für K 13,5 bleiben beide Varianten mit dem Hinweis auf die Saison-Altersklasse sichtbar.
- Responsive Eingabemaske für das zusätzliche Auswahlfeld angepasst; Hinweise erhielten eine klar erkennbare Darstellung.
- LocalStorage-Schlüssel auf Version 2 angehoben, damit veraltete Aufgabenkennungen den neuen altersabhängigen Fortschritt nicht verfälschen.

## Quellen

- `Anteile Landeskadertest_Altersklasse_S.10.pdf`
- `Testmanual DKV Slalom 2023_Stand 14.02.2024.pdf`, insbesondere Seiten 11, 12, 14 und 15.

## Migrationen / Supabase

- Keine Migration erforderlich.
- Supabase DEV `nlllqsfdhfiwticrcrnp` wurde nicht verändert.
- Production Supabase wurde nicht verwendet oder verändert.

## Tests

- Unit: 33 Dateien, 189/189 Tests bestanden.
- Build: bestanden; ausschließlich bekannte nicht blockierende XLSX-Chunk-Warnung.
- `check:beta`: Encoding, RLS, Security, Bundle, A11y und Beta bestanden.
- Public-/Kadertest-E2E: 10/10 bestanden in Desktop- und Mobile-Projekt.
- E2E deckt weibliche AK/B 18, männliche AK/B 13,5/14, beide Disziplinen, Halbjahreshinweise, Technikaufgaben, Persistenz, Reset und fehlende Supabase-Requests ab.

## Geänderte Dateien

- `src/public/KadertestPage.tsx`
- `src/public/kadertestData.ts`
- `src/public/kadertestData.test.ts`
- `src/public/publicWebsite.css`
- `tests/e2e/public-website.spec.ts`
- `docs/paddlio-codex-handoff.md`

## Offene Punkte

- Keine bekannten funktionalen Blocker für die Kadertest-Seite.
- Die offizielle Zuordnung zur Saison-Altersklasse bleibt eine Trainer-/Verbandsentscheidung; die Seite weist bei uneindeutigen Halbjahresstufen darauf hin.

## Grenzen bestätigt

- Nur Branch `develop` bearbeitet.
- `main`, Production Supabase und DNS unverändert.
- Keine Nutzdaten verändert oder gelöscht.
