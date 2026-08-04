# Paddlio One Migrationsplan für bestehende Views

Stand: 2026-08-04  
Branch: `develop`

Ziel: Bestehende Views schrittweise auf Paddlio One überführen, ohne Funktionen zu verlieren oder parallele Hauptstrukturen zu bauen.

## Migrationsprinzip

1. Dokumentieren.
2. Tokens einführen.
3. Gemeinsame Komponenten stabilisieren.
4. Eine View nach der anderen umstellen.
5. Nach jeder Phase Build, Beta-Check und Tests.
6. Feature-Matrix aktualisieren.

## View-Zuordnung

| Bestehende Datei | Zielrolle in Paddlio One | Migrationsphase | Risiko |
|---|---|---:|---|
| `src/App.tsx` | AppShell, Routing, Device/Role Layout | 1 | hoch, große Datei |
| `src/components/navigation/AppNavigation.tsx` | Sidebar + Bottom Navigation | 1 | mittel |
| `src/styles.css` | Paddlio-One-Tokens und globale Komponentenstile | 1-9 | hoch, sehr groß |
| `src/views/DashboardView.tsx` | Heute/Dashboard | 2 | mittel |
| `src/views/PlanView.tsx` | Kalender, Wochenplanung, Vorlagen, Jahresplan | 3 | hoch, sehr groß |
| `src/views/TrainingCalendarView.tsx` | Kalender-Unteransicht | 3 | mittel |
| `src/views/TrainingView.tsx` | Training Hub | 4 | mittel |
| `src/views/TrainingOverviewView.tsx` | Training Übersicht | 4 | mittel |
| `src/views/TrainingJournalView.tsx` | Journal | 4 | niedrig |
| `src/views/AnalysisView.tsx` | Analyse kompakt | 5 | mittel |
| `src/views/AnalyticsCenterView.tsx` | Analysezentrum | 5 | mittel |
| `src/views/PolarIntegrationView.tsx` | Polar Bereich | 5 | mittel |
| `src/views/SmartCoachView.tsx` | KI/Smart Coach | 5 | niedrig-mittel |
| `src/views/CommunicationView.tsx` | Team/Nachrichten/Aufgaben | 6 | mittel |
| `src/views/CoachView.tsx` | Coach-Arbeitsbereich | 6 | hoch, große Datei |
| `src/views/AcademyView.tsx` | Akademie | 7 | mittel |
| `src/views/CompetitionsView.tsx` | Wettkampf | 7 | mittel |
| `src/views/EquipmentView.tsx` | Material | 7 | niedrig-mittel |
| `src/views/ImportExportView.tsx` | Datenimport/-export | 7 | mittel |
| `src/views/ClubPortalView.tsx` | Verein/Admin | 8 | mittel-hoch |
| `src/views/SettingsView.tsx` | Einstellungen | 8 | niedrig |
| `src/views/ProfileView.tsx` | Profil | 8 | niedrig |
| `src/views/BetaReleaseView.tsx` | Systemstatus/Beta | 8 | niedrig-mittel |

## CSS-Migration

Kurzfristig:

- Paddlio-One-Tokens ergänzen.
- Alte Token-Namen auf neue Werte mappen.
- Komponentengruppen am Ende von `styles.css` geordnet ergänzen.

Mittelfristig:

- Styles in Bereiche trennen:
  - `tokens`
  - `base`
  - `layout`
  - `navigation`
  - `components`
  - `calendar`
  - `training`
  - `analysis`
  - `team`
  - `admin`
  - `responsive`
  - `accessibility`

Keine CSS-Aufteilung in Phase 1, wenn dadurch Build-Risiko entsteht.

## AppShell-Migration

1. Bestehende `App.tsx`-Logik nicht vollständig ersetzen.
2. Layout-Klassen klar nach Device setzen:
   - `app-shell-phone`
   - `app-shell-tablet`
   - `app-shell-desktop`
3. NavigationItems aus bestehender Feature-/Role-Logik erzeugen.
4. Phone Bottom Navigation stabil halten.
5. Tablet Sidebar nur dort aktivieren, wo sie den Content nicht zerlegt.

## Kalender-Migration

1. vorhandene Plan- und Template-Daten weiterverwenden.
2. `TemplatePanel` als neue UI-Schicht über bestehende Templates bauen.
3. Quick Edit zunächst UI-seitig auf vorhandene Create/Edit-Logik leiten.
4. Drag & Drop erst nach stabiler Vorlagenleiste aktivieren.
5. Wiederholungen und Löschlogik nach jeder Änderung testen.

## Keine-Funktionsverlust-Check

Nach jeder Phase:

| Prüfung | Muss erfüllt sein |
|---|---|
| Navigation | alle bisherigen Hauptbereiche erreichbar |
| Phone | fünf Hauptpunkte bleiben stabil |
| Tablet | keine Funktion ohne Alternative versteckt |
| Desktop | Admin/Import/Analyse erreichbar |
| Rollen | keine Adminfunktion für Athlete |
| Training | erstellen, bearbeiten, löschen, wiederholen weiter möglich |
| Sync | keine lokalen Änderungen überschrieben |
| Build | grün |
| Beta-Check | grün |
| Tests | grün |
