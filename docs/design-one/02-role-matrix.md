# Paddlio One Rollenmatrix

Stand: 2026-08-04  
Branch: `develop`

Diese Matrix beschreibt Bedienkomplexität und sichtbare Hauptbereiche. Sie ersetzt keine RLS- oder Backend-Berechtigung. Rollenprüfung bleibt serverseitig maßgeblich.

## Rollenprinzip

| Rolle | Kernaufgabe | UI-Komplexität | Primäre Navigation |
|---|---|---|---|
| Athlete | Training finden, durchführen, Feedback geben, Fortschritt verstehen | niedrig bis mittel | Heute, Kalender, Training, Team, Mehr |
| Coach | Gruppen und Sportler planen, Feedback auswerten, Aufgaben verteilen | mittel bis hoch | Heute, Kalender, Training, Plan, Team, Analyse, Polar |
| ClubAdmin | Verein, Mitglieder, Gruppen, Import/Export, Freigaben verwalten | hoch auf Desktop, reduziert auf Phone | Verein/Admin, Team, Import, Einstellungen |
| Admin | System, Rollen, Sicherheit, Status, Beta-Prüfungen | hoch auf Desktop | Admin, Systemstatus, Daten, Berichte |

## Sichtbarkeitsmatrix

| Bereich | Athlete | Coach | ClubAdmin | Admin | Hinweis |
|---|---|---|---|---|---|
| Heute | voll | voll | voll | voll | Inhalte rollenbezogen priorisieren |
| Kalender | eigene Termine | Gruppen/Sportler | Vereinskalender | voll | Phone reduziert |
| Training | eigene Trainings | planen/bearbeiten | organisatorisch | voll | Feedback getrennt nach Rolle |
| Plan/Wochenplanung | lesen/vereinfacht | voll | voll für Verein | voll | Phone keine komplexe Jahresplanung |
| Vorlagen | verwenden, falls erlaubt | erstellen/verwenden | Vereinsvorlagen | Systemvorlagen | Systemvorlagen nicht direkt ändern |
| Live-Training | voll | Traineransicht | Status | Status | große Buttons am Wasser |
| Feedback | eigenes | zugeordnete Sportler | begrenzt | nur fachlich nötig | private Texte schützen |
| Analyse | eigene Werte | zugeordnete Sportler/Gruppen | organisatorische Kennzahlen | System/Qualität | Gesundheitsdaten minimieren |
| Polar | eigenes Konto | zugeordnete Daten falls freigegeben | Status | technische Übersicht | Tokens nie im Frontend |
| Team | eigene Gruppe/Trainer | Sportler/Gruppen | Mitglieder/Gruppen | voll | fremde Vereine isolieren |
| Nachrichten | eigene Konversationen | zugeordnete Kontakte | organisatorisch | begrenzt | keine fremden privaten Chats |
| Aufgaben | eigene | eigene + Traineraufgaben | organisatorisch | Systemaufgaben | private Traineraufgaben nicht für Athlete |
| Akademie Lernen | voll | voll | voll | voll | Lernen immer erreichbar |
| Akademie Verwaltung | nein | eingeschränkt | eingeschränkt | voll | Tablet/Desktop bevorzugt |
| Wettkampf | eigene Meldungen/Ergebnisse | Planung/Ergebnisse | Verwaltung | voll | Phone personalisiert |
| Material | eigene Zuordnung | Gruppenmaterial | Vereinsmaterial | voll | Desktop Liste + Detail |
| Import/Export | eigene Exporte | Trainingsdaten | Verein/Team | voll | Phone Status/Historie |
| Admin/Rollen | nein | nein | eingeschränkt | voll | keine Phone-Rollenmatrix |
| Einstellungen/Profil | voll | voll | voll | voll | überall erreichbar |

## Anfänger- und Fortgeschrittenenmodus

| Modus | Sichtbare Kernbereiche | Erweiterung |
|---|---|---|
| Anfänger | Heute, Kalender, Training, Mehr | Analyse/Polar/Vorlagen nach Opt-in |
| Fortgeschritten | Heute, Kalender, Training, Team, Analyse, Polar, Ziele, Wettkampf | vollständiger Rollenumfang |

Regel: Der Modus reduziert Bedienoberfläche, nicht Berechtigungen. Direkte Links müssen weiterhin korrekt zwischen `nicht berechtigt`, `geräteseitig eingeschränkt` und `noch nicht verfügbar` unterscheiden.
