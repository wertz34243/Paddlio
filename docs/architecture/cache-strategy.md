# Cache-Strategie

Stand: Paddlio 5.0 Performance- und Sync-Vorbereitung.

## Ziel

Paddlio zeigt wichtige Inhalte zuerst lokal an und synchronisiert danach gezielt mit Supabase. Der Cache ersetzt keine RLS, keine Servervalidierung und keine Synchronisationsregeln. Er ist eine schnelle Arbeitskopie für Start, Offline-Nutzung und langsame Verbindungen.

## Datenklassen

| Klasse | Aktualität | Beispiele | Cache | Sync |
| --- | --- | --- | --- | --- |
| A - sofort | live oder sehr frisch | Profil, Rolle, heutige Trainings, Nachrichten, Feedback, Anwesenheit | kurzer lokaler Cache | beim Start, Reconnect, Realtime |
| B - häufig | Minuten bis Stunden | aktuelle Woche, Kalender, Aufgaben, Polar-Status, offene Rückmeldungen | lokaler Cache mit Metadaten | Background Sync und Pull-to-refresh |
| C - selten | Stunden bis Tage | Akademie-Katalog, Materialstammdaten, Vereinsstruktur, Vorlagen | langlebiger Cache | lazy beim Öffnen |
| D - Archiv | bei Bedarf | alte Saisons, alte Wettkämpfe, Importhistorie, Polar-Archiv | nur zuletzt genutzte Ausschnitte | manuell oder paginiert |

## Gerätestrategie

Phone lädt sofort:

- Profil, Rolle und Verein
- Heute
- aktuelle Woche kompakt
- letzte Nachrichten
- letzter Syncstatus
- letzte Polar-Zusammenfassung

Tablet lädt zusätzlich:

- vollständige aktuelle Woche
- relevante Gruppen
- Anwesenheit
- offene Feedbacks

Desktop bleibt online-first, nutzt aber Cache für Profil, Navigation und zuletzt verwendete Ansichten.

## Storage-Regeln

- LocalStorage bleibt nur für kleine Settings, Flags und Cache-Metadaten geeignet.
- Größere Daten wie Trainingswoche, Nachrichten, Polar-Zusammenfassungen und Analysewerte gehören in eine Repository-Schicht mit späterer IndexedDB-Unterstützung.
- Cache-Einträge brauchen Quelle, Zeitstempel, Scope, Version und optional Cursor.
- Cache-Daten dürfen keine fremden Vereinsdaten enthalten.
