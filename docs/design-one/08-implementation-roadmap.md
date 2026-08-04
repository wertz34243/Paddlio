# Paddlio One Umsetzungsreihenfolge

Stand: 2026-08-04  
Branch: `develop`

## Leitregel

Jede Phase bleibt auf `develop`. Kein Merge nach `main`. Nach jeder Phase:

```powershell
npm.cmd run build
npm.cmd run check:beta
npm.cmd run test
```

Falls relevant:

```powershell
npm.cmd run test:e2e
```

## Phase 0: Planung und Absicherung

Status dieses Dokumentsatzes.

- Feature-Matrix erstellen
- Rollenmatrix erstellen
- Gerätematrix erstellen
- Informationsarchitektur definieren
- Komponentenplan definieren
- Design-Token-Plan definieren
- Wireframes erstellen
- Risiken dokumentieren
- Migrationsplan erstellen

Abschluss: keine Codeänderung außer Dokumentation.

## Phase 1: Design Tokens, Komponenten, AppShell, Navigation

Ziel:

- Paddlio-One-Tokens zentral in `styles.css` einführen.
- Bestehende Tokens mappen.
- `AppNavigation` geräteabhängig schärfen.
- Gemeinsame UI-Komponenten für Karten, Header, Buttons, Chips und Empty/Error States vorbereiten.

Dateien voraussichtlich:

- `src/styles.css`
- `src/components/navigation/AppNavigation.tsx`
- `src/components/AppCard.tsx`
- neue `src/components/ui/*`
- ggf. `src/App.tsx`

Tests:

- `npm.cmd run build`
- `npm.cmd run check:beta`
- `npm.cmd run test`

## Phase 2: Heute und Dashboard

Ziel:

- Phone: klarer Tagesfokus.
- Tablet: 2-Spalten-Heute.
- Desktop: 3-4-Spalten-Dashboard.
- Quick Actions konsolidieren.

Dateien:

- `src/views/DashboardView.tsx`
- `src/styles.css`
- ggf. neue Dashboard-Komponenten.

## Phase 3: Kalender, Vorlagen, Drag & Drop, Wochenplanung

Ziel:

- Kalender als Herzstück.
- Tablet/Desktop: Vorlagenpanel rechts.
- Quick Edit nach Vorlageneinfügung.
- Wochenplanung und Woche kopieren sichtbar integrieren.

Dateien:

- `src/views/PlanView.tsx`
- `src/views/TrainingCalendarView.tsx`
- `src/features/training/templates/*`
- `src/services/trainingTemplateService.ts`
- `src/styles.css`

## Phase 4: Training, Live-Training, Journal, Feedback, Soll/Ist

Ziel:

- Trainingsworkflow Plan -> Start -> Feedback -> Polar -> Analyse.
- Soll/Ist-Verständlichkeit.
- individuelle Anpassungen und Traineraufgaben in Detailansicht.

Dateien:

- `src/views/TrainingView.tsx`
- `src/views/TrainingOverviewView.tsx`
- `src/views/TrainingJournalView.tsx`
- `src/services/trainingService.ts`
- `src/styles.css`

## Phase 5: Analyse, Polar, KI-Empfehlungen

Ziel:

- Analyse dichter und kontextueller.
- Polar nicht isoliert, sondern mit Training/Analyse verbinden.
- KI-Empfehlungen als kompakte Panels.

Dateien:

- `src/views/AnalysisView.tsx`
- `src/views/AnalyticsCenterView.tsx`
- `src/views/PolarIntegrationView.tsx`
- `src/services/aiContextBuilder.ts`
- `src/services/smartCoachService.ts`

## Phase 6: Team, Nachrichten, Aufgaben, Anwesenheit

Ziel:

- Phone: einfache Listen.
- Tablet/Desktop: Master/Detail.
- Aufgaben als Rows statt großer Karten.

Dateien:

- `src/views/CommunicationView.tsx`
- `src/views/CoachView.tsx`
- `src/services/communicationService.ts`
- `src/services/coachService.ts`

## Phase 7: Akademie, Wettkampf, Material, Import/Export

Ziel:

- optische Angleichung an Paddlio One.
- Desktop: Listen + Details, nicht mobile Kartenwand.
- Import/Export nur auf geeigneten Geräten vollständig.

Dateien:

- `src/views/AcademyView.tsx`
- `src/views/CompetitionsView.tsx`
- `src/views/EquipmentView.tsx`
- `src/views/ImportExportView.tsx`

## Phase 8: Admin, Einstellungen, Systemstatus

Ziel:

- Phone: Status und Hinweise.
- Tablet/Desktop: volle Verwaltung.
- verständliche Fehler- und Empty States.

Dateien:

- `src/views/ClubPortalView.tsx`
- `src/views/SettingsView.tsx`
- `src/views/BetaReleaseView.tsx`
- `src/views/ProfileView.tsx`

## Phase 9: Accessibility, Light Mode, Animationen, Performance, visuelle Regression

Ziel:

- Fokuszustände.
- Screenreader-Namen.
- Reduced Motion.
- 200-%-Zoom.
- Dark/Light prüfen.
- Screenshots aktualisieren.

Tests:

- `npm.cmd run check:a11y`
- `npm.cmd run check:beta`
- Playwright-Screenshots, falls vorhanden.

## Commit-Strategie

Empfohlene Commits:

1. `docs: define paddlio one design implementation plan`
2. `ux: add paddlio one tokens and shared components`
3. `ux: rebuild paddlio one app shell navigation`
4. `ux: redesign today dashboard`
5. `ux: integrate calendar templates and planning workspace`
6. `ux: align training workflow and feedback`
7. `ux: align analysis polar and coach recommendations`
8. `ux: align team messages tasks and attendance`
9. `ux: align academy competition material import admin`
10. `a11y: complete paddlio one responsive accessibility pass`
