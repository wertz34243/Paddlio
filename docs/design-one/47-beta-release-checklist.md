# Version 0.9 - Beta Release Checklist

Stand: 2026-08-04  
Branch: `develop`

## Freigabestatus

| Stufe | Empfehlung | Begründung |
|---|---|---|
| Interne Nutzung | ja | Build, Checks und Unit-Tests grün. |
| Vereinstest | eingeschränkt | Nur mit klarer Testgruppe und Backup. |
| Geschlossene Beta | noch nicht | Rollen-/Zwei-Geräte-Nachweis fehlt aktiv. |
| Öffentliche Beta | nein | Datenintegrität und Sync müssen härter belegt werden. |

## Technische Pflichtchecks

| Check | Status |
|---|---|
| Build | bestanden |
| Beta-Check | bestanden |
| Unit-Tests | bestanden |
| Public E2E | bestanden |
| Rollen-E2E | übersprungen |
| Zwei-Geräte-E2E | übersprungen |
| Bundle-Budget | bestanden |
| RLS-Check | bestanden |
| Encoding-Check | bestanden |
| A11y-Beta-Check | bestanden |

## Manuelle Pflichtprüfung

Vor geschlossener Beta abhaken:

- [ ] Sportler Phone: Login, Heute, Training, Feedback, Journal, Reload.
- [ ] Trainer Desktop: Training planen, Vorlage nutzen, Quick Edit, Feedback sehen.
- [ ] Trainer Tablet: Kalender, Vorlagen, Drag & Drop, Detaildrawer.
- [ ] Admin Desktop: Rollen, Verein, Systemstatus.
- [ ] ClubAdmin Desktop: Mitglieder, Gruppen, Importstatus.
- [ ] Serie erstellen und komplett löschen.
- [ ] Einzeltermin aus Serie löschen.
- [ ] Woche kopieren und Reload.
- [ ] Gruppen erstellen, bearbeiten, löschen.
- [ ] Profil vollständig speichern und Reload.
- [ ] Polar verbunden: keine Duplikate, verständlicher Status.
- [ ] Offline ändern, online gehen, Sync prüfen.
- [ ] Zwei Geräte parallel.

## Die letzten 20 Punkte bis Beta

1. Rollen-/Sync-E2E mit aktiver Development-Testumgebung grün bekommen.
2. Zwei-Geräte-Flow Coach Desktop + Sportler Phone aktiv testen.
3. Zwei-Geräte-Flow Trainer Tablet + Sportler Phone aktiv testen.
4. Training löschen und Reload auf beiden Geräten beweisen.
5. Serien komplett löschen und Reload beweisen.
6. Einzeltermin aus Serie löschen und Reload beweisen.
7. Profil speichern: alle Felder Reload-sicher machen.
8. Gruppen löschen zuverlässig prüfen.
9. Woche kopieren ohne Duplikate prüfen.
10. Feedback speichern und Trainerantwort prüfen.
11. Journal speichern und Soll/Ist prüfen.
12. Kalender/Plan/Training als einen Workflow abnehmen.
13. Fehlertexte für Registrierung, Speichern und Sync vereinfachen.
14. Drawer/Dialog-Fokus manuell prüfen.
15. Kalender per Tastatur oder Alternativflow bedienbar machen.
16. CSS-Wachstum stoppen und Konsolidierungsplan starten.
17. Haupt-JS weiter beobachten und Lazy Loading schützen.
18. Admin-/ClubAdmin-Sichtbarkeit manuell prüfen.
19. Import/Export nur auf sicheren Rollen und Geräten freigeben.
20. Release-Entscheidung dokumentieren und erst dann nach main mergen.

## Go/No-Go-Regel

Kein Merge nach main, solange einer dieser Punkte offen ist:

- Rollen-E2E nicht aktiv grün.
- Zwei-Geräte-Sync nicht aktiv grün.
- Delete-Sync nicht aktiv grün.
- Profil/Gruppe/Training speichern nicht Reload-sicher.
- Kritische Sicherheitsprüfung rot.

## Finale Empfehlung

Paddlio soll jetzt auf `develop` stabilisiert und mit echten Rollen getestet werden. Erst wenn die letzten 20 Punkte erledigt sind, ist ein Merge nach `main` verantwortbar.

