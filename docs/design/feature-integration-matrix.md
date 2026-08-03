# Paddlio Feature Integration Matrix

Stand: develop. Ziel: keine vorhandene Funktion beim Design-Umbau verlieren.

| Vorhandene Funktion | Neue Position | Phone | Tablet | Desktop | Rolle | Status |
|---|---|---|---|---|---|---|
| Heute-Dashboard | Heute / Übersicht | vollständig, Tagesfokus | Dashboard + Wochenkontext | kompaktes Arbeitsdashboard | alle | integriert, neu zu verdichten |
| Trainingskalender | Kalender | Tag, 3 Tage, Liste | Woche + Detail + Vorlagen | Kalender 70-75 % + Vorlagen + Detail | alle, Bearbeitung nach Rolle | vorhanden, Zielbild fehlt noch teilweise |
| Trainingsplan | Plan / Kalender | Wochenliste, Schnellaktion | 7-Tage-Planung | Gruppen-/Saisonplanung | Coach, TeamAdmin, ClubAdmin, Admin | vorhanden |
| Trainingseinheiten | Training > Einheiten | ansehen, starten, abschließen | Liste + Detail | kompakte Liste/Tabelle + Aktionen | alle | vorhanden, Desktop zu groß |
| Trainingstagebuch | Training > Journal | Feedback/RPE/Notiz | Journal + Feedback | Journal + Soll/Ist | alle | vorhanden |
| Wiederholungen | Plan / Kalender Quick Edit | vereinfacht | vollständig | vollständig | Coach+ | vorhanden, zu sichern |
| Serien löschen | Plan / Kalender | einzelne Einheit, Serie bestätigen | vollständig | vollständig | Coach+ | vorhanden, testen |
| Wochen kopieren | Plan / Kalender | vereinfacht | vollständig | vollständig | Coach+ | vorhanden |
| Trainingsvorlagen | Kalender-Vorlagen | Auswahl + Datum/Zeit | Sidebar + Drag & Drop | Sidebar + Drag & Drop | Coach+ | vorhanden/integriert, UX weiter angleichen |
| Wochenvorlagen | Kalender-Vorlagen | anwenden über einfache Auswahl | Sidebar/Preview | Sidebar/Preview | Coach+ | vorhanden |
| Saison-/Jahresplanung | Plan > Jahr/Saison | nur lesen | Saisonübersicht | volle Jahresplanung | Coach+ | vorbereitet/vorhanden |
| Basisplan + individuelle Anpassungen | Training Detail / Plan | eigene Anpassung sichtbar | Split View | Basis + Overrides | Coach+/Athlete eingeschränkt | vorhanden |
| Traineraufgaben | Aufgaben / Training Detail | eigene Aufgaben | Training + Aufgabenliste | Aufgabenmodul + Training | Coach+ | Grundlage vorhanden, eigenes UI weiter ausbauen |
| Feedback/Rückmeldungen | Heute / Training / Team | schreiben/lesen | offene Feedbacks | kompakte Liste + Detail | Athlete/Coach+ | vorhanden |
| Nachrichten | Team / Nachrichten | Chat | Konversation + Chat | Konversation + Chat | alle berechtigten | vorhanden in Kommunikation |
| Team/Gruppen | Team | Gruppe, Trainer, Nachrichten | Master/Detail | Tabelle + Detail | alle, Verwaltung Coach+ | vorhanden |
| Vereinsportal | Mehr/Verein, Desktop Sidebar | eingeschränkt/Status | Verwaltung eingeschränkt | volle Verwaltung | ClubAdmin/Admin | vorhanden |
| Admin/Coach-Verwaltung | Desktop Sidebar/Admin | Warnungen/Freigaben | eingeschränkt | vollständig | Coach+, Admin | vorhanden in Coach/Club |
| Analyse | Analyse | Kernwerte | 2-Spalten-Charts | KPI + Charts + Filter | alle nach Zugriff | vorhanden |
| Smart Coach | Heute / Analyse | Tageshinweis | Coach-Karten | Empfehlung/Übersicht | alle nach Zugriff | vorhanden |
| Polar | Heute kompakt / Polar Detail | verbinden, sync, letzte Einheit | größere Charts | Sync-Historie + Detail | alle eigene Daten | vorhanden |
| Akademie Lernen | Akademie | vollständig Lernen | Kurs + Lektion | Kurs + Inhalt | alle | vorhanden |
| Akademie Redaktion | Akademie/Admin | verborgen | eingeschränkt | vollständig | ClubAdmin/Admin | vorhanden |
| Wettkampf | Mehr/Wettkampf, Desktop Sidebar | persönliche Starts/Ergebnisse | Planung | Verwaltung/Analyse | alle, Verwaltung Coach+ | vorhanden |
| Material | Mehr/Material, Desktop Sidebar | Liste | Liste + Detail | Tabelle + Detail | alle nach Zugriff | vorhanden |
| Ziele/Rekorde | Mehr / Analyse | kompakt | erweitert | vollständig | alle | vorhanden |
| Import/Export | Mehr > Daten, Desktop Sidebar | Status/Historie | Vorschau/einfach | vollständig Mapping/Export | Coach+/Admin | vorhanden |
| Benachrichtigungen | Heute / Mehr | Liste | Liste | System-/Statusliste | alle | vorhanden |
| Profil | Mehr / Einstellungen | vollständig | vollständig | vollständig | alle | vorhanden |
| Einstellungen/Syncstatus | Mehr / Einstellungen | kompakt | Status | volle Systeminfo | alle/Admin erweitert | vorhanden |
| Beta-Teststatus | Mehr/Admin | verborgen/Status | eingeschränkt | vollständig | Admin | vorhanden |

## Rollen

- Athlete: eigene Trainings, Feedback, Kalender, Akademie, Analyse, Polar, Nachrichten, Material/Ziele/Rekorde im eigenen Umfang.
- Coach: Planung, Gruppen, Anwesenheit, Feedback, Traineraufgaben, Vorlagen, Sportlerübersicht.
- TeamAdmin: Coach-Funktionen plus Team-/Vereinskoordination im erlaubten Umfang.
- ClubAdmin: Vereinsverwaltung, Mitglieder, Gruppen, Import/Export, Freigaben.
- Admin: System-/Beta-/Rollenfunktionen, ohne RLS zu ersetzen.

## Geräteprinzip

- Phone: vollständige Alltagsaktionen, keine komplexe Verwaltung.
- Tablet: Trainer-Arbeitsfläche mit Kalender, Vorlagen, Split Views.
- Desktop: vollständige Planung, Analyse, Verwaltung und Import/Export.
