# Paddlio One Feature-Integrationsmatrix

Stand: 2026-08-04  
Branch: `develop`  
Quelle: `docs/design/current-ui-report.md`, vorhandene Views in `src/views/`, Navigation in `src/App.tsx` und `src/components/navigation/AppNavigation.tsx`.

Ziel dieser Matrix: Keine vorhandene Funktion darf beim Paddlio-One-Umbau verschwinden. Jede Funktion bekommt eine neue Position, einen Gerätemodus und einen Rollenbezug.

## Statuswerte

| Status | Bedeutung |
|---|---|
| `integrieren` | Funktion wird vollständig in Paddlio One übernommen |
| `vereinfachen-phone` | Phone zeigt eine reduzierte, sichere Alltagsversion |
| `tablet-desktop-voll` | Voller Funktionsumfang bleibt auf Tablet/Desktop |
| `nur-status-phone` | Phone zeigt Status, Historie oder Lesemodus |
| `prüfen` | Funktion existiert, braucht vor Umbau fachliche/technische Prüfung |

## Matrix

| Bestehende Funktion | Neue Position | Phone | Tablet | Desktop | Rolle | Status |
|---|---|---|---|---|---|---|
| Heute/Dashboard | Heute | voll | 2-Spalten-Dashboard | 3-4-Spalten-Dashboard | alle | integrieren |
| Nächstes Training | Heute + Training | voll | voll | voll | Athlete, Coach | integrieren |
| Tages-KPIs | Heute | kompakt | kompakt | KPI-Zeile | alle | integrieren |
| Wochenplan-Kompakt | Heute + Kalender | Liste | Wochenpanel | Wochenpanel | alle | integrieren |
| Quick Actions | Heute + Sidebar | Hauptaktion unten | rechte/obere Leiste | rechte Leiste | rollenabhängig | integrieren |
| Kalender | Kalender | Tag/3 Tage/Liste | Wochenkalender | Arbeitskalender | alle | integrieren |
| Trainingsplan | Kalender + Plan | Liste | 7-Tage-Plan | Wochen-/Saisonplan | Coach, Admin, Athlete lesend | integrieren |
| Training erstellen | Kalender + Training | Quick Create | Quick Edit + Vollformular | Quick Edit + Vollformular | Coach, Admin | integrieren |
| Training bearbeiten | Training Detail | vereinfacht | voll | voll | Coach, Admin | integrieren |
| Wiederholungen | Kalender + Plan | anzeigen/kleine Serien | bearbeiten | bearbeiten | Coach, Admin | tablet-desktop-voll |
| Woche kopieren | Kalender + Plan | einzelne Woche auswählen | voll | voll | Coach, Admin | integrieren |
| Wochenvorlagen | Kalender + Vorlagen | anwenden | anwenden/bearbeiten | voll | Coach, Admin | integrieren |
| Saisonbausteine | Plan + Jahresplan | nicht sichtbar | anwenden | voll | Coach, Admin | tablet-desktop-voll |
| Jahresplanung | Plan | nicht sichtbar | eingeschränkt | voll | Coach, Admin | tablet-desktop-voll |
| Vorlagenbibliothek | Kalender rechts / Phone Auswahl | Auswahl | rechte Sidebar | rechte Sidebar | Coach, Admin | integrieren |
| Trainingsvorlagen | Vorlagen | auswählen | Drag & Drop | Drag & Drop | Coach, Admin | integrieren |
| Systemvorlagen | Vorlagen | auswählen | lesen/verwenden | verwenden/kopieren | Coach, Admin | integrieren |
| Trainingsübersicht | Training | voll | voll | kompakte Listen/Cards | alle | integrieren |
| Einheiten | Training | voll | voll | voll | alle | integrieren |
| Trainingstagebuch | Training + Journal | voll | voll | voll | Athlete, Coach | integrieren |
| Feedback geben | Training Detail | voll | voll | voll | Athlete | integrieren |
| Trainerfeedback | Feedback + Training Detail | lesen | voll | voll | Coach, Admin | integrieren |
| Soll/Ist | Training Detail + Analyse | kompakt | Vergleich | Vergleich + Analyse | alle je Rolle | integrieren |
| Individuelle Anpassungen | Training Detail | eigene sehen | bearbeiten | bearbeiten | Athlete, Coach, Admin | integrieren |
| Traineraufgaben | Aufgaben + Training Detail | eigene sehen | bearbeiten | bearbeiten | Coach, Admin | integrieren |
| Anwesenheit | Team + Training | schnell erfassen | voll | voll | Coach, Admin | integrieren |
| Analyse | Analyse | Kernwerte | 2-Spalten | Analysezentrum | alle | integrieren |
| Smart Coach | Heute + Analyse | kurze Empfehlung | Kontextpanel | Kontextpanel | alle | integrieren |
| Ziele | Analyse + Mehr | voll | voll | voll | alle | integrieren |
| Rekorde | Analyse + Mehr | lesen | voll | voll | alle | integrieren |
| Wettkampf | Wettkampf | eigene Termine/Ergebnisse | Planung | Verwaltung/Analyse | alle je Rolle | integrieren |
| Ergebnisse | Wettkampf + Analyse | eigene | voll | voll | alle je Rolle | integrieren |
| Videos | Wettkampf | lesen | lesen | verwalten | Coach, Admin | prüfen |
| Polar Verbindung | Polar + Mehr | voll | voll | voll | alle | integrieren |
| Polar Sync | Polar + Heute | voll | voll | voll | alle | integrieren |
| Polar Training zuordnen | Training Detail + Polar | bestätigen | verwalten | verwalten | Athlete, Coach | integrieren |
| Material | Material + Training Detail | Liste/Zuordnung | Master/Detail | Tabelle + Detail | alle je Rolle | integrieren |
| Boote/Paddel | Material | kompakt | voll | voll | alle je Rolle | integrieren |
| Akademie Lernen | Akademie | voll | Kurs + Lektion | Kurs + Inhalt | alle | integrieren |
| Akademie Zuweisung | Akademie + Team | nicht bearbeiten | eingeschränkt | voll | Coach, Admin | tablet-desktop-voll |
| Akademie Redaktion | Akademie | verborgen | eingeschränkt | voll | Admin, Coach je Recht | tablet-desktop-voll |
| Teamübersicht | Team | kompakt | Master/Detail | Tabelle + Detail | alle je Rolle | integrieren |
| Sportler | Team/Sportler | Liste | Master/Detail | Tabelle + Detail | Coach, Admin | integrieren |
| Trainer | Team | Liste | Master/Detail | Tabelle + Detail | alle je Rolle | integrieren |
| Gruppen | Team | sehen | verwalten | verwalten | Coach, Admin | integrieren |
| Nachrichten | Nachrichten + Team | Chat | Split Chat | Split Chat | alle | integrieren |
| Aufgaben | Aufgaben + Heute | eigene/offene | voll | voll | alle je Rolle | integrieren |
| Verein | Verein/Admin | Status | eingeschränkt | voll | ClubAdmin, Admin | tablet-desktop-voll |
| Rollenverwaltung | Admin | Status/Hinweis | eingeschränkt | voll | Admin | tablet-desktop-voll |
| Import/Export | Daten + Admin | Status/Historie | Vorschau | voll | ClubAdmin, Admin | tablet-desktop-voll |
| Einstellungen | Mehr/Einstellungen | voll | Master/Detail | Master/Detail | alle | integrieren |
| Profil | Mehr/Profil | voll | voll | voll | alle | integrieren |
| Systemstatus | Einstellungen/Admin | Status | voll | voll | Admin, ClubAdmin | integrieren |
| Beta/Readiness | Admin/Systemstatus | Hinweis | eingeschränkt | voll | Admin | prüfen |

## Priorität für Umbau

1. AppShell, Navigation und Tokens stabilisieren.
2. Heute/Dashboard neu strukturieren.
3. Kalender, Vorlagen und Training als zusammenhängenden Workflow umbauen.
4. Team, Aufgaben und Nachrichten auf Master/Detail bringen.
5. Analyse, Polar und KI in Kontextkarten integrieren.
6. Akademie, Wettkampf, Material, Import und Admin angleichen.
