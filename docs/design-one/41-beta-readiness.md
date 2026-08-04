# Paddlio One - Beta Readiness

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Paddlio ist für eine interne Development-Beta geeignet. Für eine externe Beta ist die App näher dran als vorher, aber noch nicht vollständig freigabereif, solange Rollen-/Zwei-Geräte-Flows, Speichern/Reload und Delete-Sync nicht durchgehend aktiv getestet wurden.

Beta-Bewertung: **74 / 100**

## Technischer Status

| Prüfung | Ergebnis |
|---|---|
| Build | bestanden |
| Beta-Check | bestanden |
| Unit-Tests | 13 Dateien, 58 Tests bestanden |
| Public E2E | 4 Tests bestanden |
| Rollen-/Sync-E2E | 8 Tests übersprungen |
| Encoding-Check | bestanden |
| RLS-Check | bestanden |
| Bundle-Budget | bestanden |
| A11y-Beta-Check | bestanden |

## Interne Beta

Einschätzung: **bereit**

Begründung:

- App baut stabil.
- Kernchecks sind grün.
- Development-Umgebung existiert.
- Testprofile existieren.
- Hauptworkflows sind grundsätzlich vorhanden.
- Fehler können auf develop geprüft werden, ohne main zu gefährden.

## Externe Beta

Einschätzung: **eingeschränkt, noch nicht frei empfehlen**

Vor externer Beta müssen mindestens diese Nachweise aktiv vorliegen:

1. Coach erstellt Training, Athlete sieht Training.
2. Athlete schreibt Feedback, Coach sieht Feedback.
3. Coach bearbeitet Training, Athlete sieht Änderung.
4. Coach löscht Training, Athlete sieht Löschung.
5. Beide laden neu, gelöschtes Training bleibt gelöscht.
6. Rollenisolierung Athlete/Coach/ClubAdmin/Admin ist grün.
7. Profiländerungen bleiben nach Reload erhalten.
8. Gruppen erstellen, bearbeiten und löschen funktioniert nachvollziehbar.
9. Serien/Wiederholungen lassen sich erstellen und bei Fehlern kontrolliert löschen.
10. Polar zeigt verständliche Fehler, wenn keine neuen Trainings vorhanden sind.

## Größte Beta-Risiken

| Risiko | Schwere | Kommentar |
|---|---:|---|
| Zwei-Geräte-Sync nicht aktiv in diesem Lauf geprüft | hoch | E2E war übersprungen. |
| Delete-Sync/Serienlöschen | hoch | Nutzer hat hier echte Probleme gemeldet. |
| Mehrere Planungsorte | mittel bis hoch | Kann zu Fehlbedienung führen. |
| Große Dateien und CSS | mittel | Wartungs- und Performance-Risiko. |
| Adminrolle nach Testprofil | mittel | Muss sauber geprüft werden, damit Admin nicht im Athlete-Modus landet. |
| Polar abhängig von externer Konfiguration | mittel | UX muss Ausfälle gut erklären. |
| Import/Export | mittel | Hohe Datenschutz- und Fehlerwirkung. |

## Empfehlung für nächste Freigabe

Vor der nächsten größeren Design-Umsetzung:

- Rollen-/Sync-E2E aktivieren.
- Speichern/Reload-Matrix manuell und automatisiert prüfen.
- Kalender/Plan/Training als ein Workflow abnehmen.
- CSS- und Komponenten-Konsolidierung planen.
- Nicht nach main mergen, bis die Nachweise grün sind.

## Go/No-Go

| Einsatz | Status |
|---|---|
| Lokale Entwicklung | Go |
| Interne Tests mit Testdaten | Go |
| Kleine Trainer-Demo mit Hinweis auf Beta | Go mit Einschränkung |
| Externe Beta mit echten Vereinen | Noch nicht vollständig |
| Production für echte Nutzer | Nur nach Release-Check |

## Fazit

Paddlio ist stark genug, um weiter auf develop getestet zu werden. Für echte externe Nutzung braucht es jetzt weniger neue Funktionen und mehr Nachweis: Speichern, Rollen, Sync, Löschen, Wiederholungen und Geräteverhalten müssen belegbar stabil sein.

