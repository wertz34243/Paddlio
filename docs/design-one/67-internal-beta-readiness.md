# Internal Beta Readiness

## Prüfstand

- Branch: `develop`
- Build: bestanden
- `check:beta`: bestanden
- Unit-Tests: 13 Testdateien, 58 Tests bestanden
- Public/Mobile E2E: 8 Tests bestanden
- Rollen-/Sync-E2E: 8 Tests übersprungen, weil `PADDLIO_E2E_*` Variablen nicht gesetzt waren
- Screenshots: 16 Produkt-Polish-Screenshots unter `docs/ui/paddlio-one/product-polish/`

## Gate-Fragen

| Stufe | Status | Begründung |
|---|---|---|
| Eigene interne Nutzung | Ja | Build, Beta-Check, Unit-Tests und Public/Mobile-E2E sind grün. |
| Wenige vertraute Trainer/Sportler | Ja, eingeschränkt | UI-Kern ist stabiler, aber Rollen-/Sync-E2E muss vor realem Betrieb aktiv mit Credentials laufen. |
| Geschlossene Beta | Noch nicht | Zwei-Geräte-Sync, Feedback und Löschlogik sind in diesem Lauf nicht aktiv automatisiert nachgewiesen. |
| Öffentliche Beta | Nein | Dafür fehlen aktiver Rollen-/Sync-Nachweis, reale Geräteprüfung und weitere Performance-/Bundle-Arbeit. |

## Bekannte Einschränkungen

- Der Hauptchunk bleibt mit rund 626 kB groß; das Projekt-Budget wird eingehalten, Vite warnt aber weiterhin.
- `xlsx` bleibt als großer Lazy-Chunk erhalten.
- Die Screenshots zeigen, dass Desktop/Tablet bereits arbeitsfähiger sind, aber noch nicht das finale professionelle Kalenderniveau erreichen.
- Fullpage-Phone-Screenshots können die fixe Bottom-Navigation über Inhalt zeigen; im Produkt muss das weiter in echter Geräte-QA beobachtet werden.
- Development-Testprofil meldete sich im Screenshotlauf als Sportleransicht, obwohl das Coach-Testkonto verwendet wurde. Rollen-Zuordnung in Development sollte separat geprüft werden.

## Empfehlung

Paddlio ist für eigene interne Nutzung auf `develop` geeignet. Für eine geschlossene Beta müssen die vorhandenen Rollen-/Sync-E2E-Tests mit echten Development-Credentials aktiv grün laufen.
