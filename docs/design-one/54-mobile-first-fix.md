# Phase 2.8 Mobile-First Fix

## Ziel

Die Smartphone-Oberfläche wurde auf echte mobile Nutzung ausgerichtet: ansehen, starten, schnell ändern und Feedback geben. Tablet und Desktop behalten die Planungs- und Arbeitsflächen.

## Gefundene Probleme

- Der Phone-Header war zu hoch und enthielt zu viele Ebenen.
- DEV-Hinweis, Seitentitel und Tabs nahmen auf kleinen Displays zu viel Raum ein.
- Kalenderfilter waren auf Phone zu breit und zu formularlastig.
- Vorlagen wirkten auf Phone wie große Desktop-Karten.
- Trainingsanlage zeigte zu viele Felder auf einmal.
- Lange Titel und enge Flex-Layouts konnten horizontalen Overflow verursachen.

## Änderungen

- Phone-Header auf eine kompakte Zeile reduziert.
- DEV nur noch als kleines Badge dargestellt.
- Inhalt erhält mehr Abstand zur Bottom Navigation.
- Tabs und Segmentsteuerungen sind horizontal scrollbar statt abgeschnitten.
- Kalenderfilter werden auf Phone in ein Bottom Sheet verschoben.
- Training erstellen wurde zu einem kompakten Schritt-Assistenten.
- Phone-Vorlagen werden kompakter als Zeilen/Kleinkarten dargestellt.
- Globale Overflow-Schutzregeln für Phone ergänzt.

## Nicht geändert

- Keine Datenbankänderungen.
- Keine Auth-Änderungen.
- Keine RLS-Änderungen.
- Keine Sync-Grundarchitektur.
- Keine Production-Änderungen.

