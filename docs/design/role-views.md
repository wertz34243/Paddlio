# Role Views

Rollenlogik und Geräteansicht bleiben getrennt: Berechtigung entscheidet, ob eine Funktion grundsätzlich verfügbar ist; Gerät entscheidet über Darstellung und Dichte.

| Bereich | Athlete | Coach | TeamAdmin | ClubAdmin | Admin |
|---|---|---|---|---|---|
| Heute | eigene Tagesübersicht | Gruppen/Feedback/Aufgaben | Teamkoordination | Freigaben/Status | System/Beta |
| Kalender | eigene Trainings | Gruppen planen | Team planen | Verein überblicken | vollständig |
| Training | durchführen, Feedback | planen, auswerten | planen, koordinieren | Vereinssicht | vollständig |
| Wochenplanung | lesen/einzelne Aktionen | vollständig | vollständig | vollständig | vollständig |
| Vorlagen | nutzen, wenn freigegeben | erstellen/nutzen | Vereinsvorlagen | Vereinsvorlagen | Systemvorlagen |
| Traineraufgaben | nicht sichtbar, außer eigene Aufgaben | eigene/private Traineraufgaben | Teamaufgaben | Vereinsaufgaben | vollständig |
| Analyse | eigene Werte | zugeordnete Sportler | Team | Verein aggregiert | vollständig |
| Polar | eigenes Konto | eigene Daten, Coach-Sicht nur freigegeben | nach Freigabe | Status/Verwaltung begrenzt | Systemstatus |
| Team | eigene Gruppe | Sportler/Gruppen | Team | Mitglieder/Gruppen | vollständig |
| Nachrichten | eigene Verläufe | zugeordnete Verläufe | Team | erlaubt begrenzt | vollständig nach Regel |
| Akademie Lernen | vollständig | vollständig | vollständig | vollständig | vollständig |
| Akademie Redaktion | nein | begrenzt | begrenzt | ja | ja |
| Import/Export | eigener Export begrenzt | Trainingsdaten | Teamdaten | Vereinsdaten | vollständig |
| Admin | nein | nein | nein | begrenzt | vollständig |

## Direktlinks

Direktlinks müssen vier Fälle unterscheiden:

- nicht angemeldet
- nicht berechtigt
- auf diesem Gerät eingeschränkt
- temporärer Fehler

Ein Phone-Direktlink zu einer Desktop-Verwaltung darf keine sensiblen Daten laden, wenn die Funktion auf Phone nur als Hinweis oder Übersicht vorgesehen ist.
