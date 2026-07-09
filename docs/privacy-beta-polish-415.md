# Paddlio 4.1.5 Privacy and Beta Polish

Version 4.1.5 bereitet Paddlio auf eine breitere Beta vor, ohne neue Fachfunktionen einzubauen.

## Datenschutz

- Athleten sehen keine fremden E-Mail-Adressen.
- E-Mail-Adressen werden außerhalb echter Adminbereiche maskiert.
- Beta-Tester- und systemweite Diagnosedaten bleiben Admin-only.
- Der Cloud-Profil-Sync lädt für normale Athleten nur das eigene Profil in den lokalen Snapshot.

## CloudStatus

CloudStatus verwendet verständlichere Meldungen:

- `Cloud verbunden`: Kernbereiche synchronisieren.
- `Cloud eingeschränkt`: App nutzbar, optionale Zusatzbereiche haben Sync-Probleme.
- `Offline`: lokale Nutzung mit späterer Synchronisation.
- `Cloud Fehler`: Auth, Profil oder Kernspeicher sind nicht sicher synchronisierbar.

## Accessibility

Wiederholte Aktionen wie `Erledigt`, `Ausblenden`, `Notiz speichern`, `dabei`, `nicht dabei` und `unsicher` erhalten kontextbezogene `aria-labels`.

## Layout

Updates, Beta-Zeilen, Chat-Bubbles und technische Strings verwenden zusätzliche Umbruchregeln, damit mobile Viewports keine horizontale Überbreite bekommen.
