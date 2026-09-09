# Paddlio Kalenderstruktur Konsolidierung

## Ziel

Paddlio verwendet fuer geplante Trainings nur noch die zentrale Kalenderdarstellung in `TrainingCalendarView`. Vorlagen, Wochenvorlagen und Saisonbausteine bleiben als Planungswerkzeuge erhalten, rendern aber keine eigene zweite Trainingskalenderflaeche mehr.

## Entfernte alte Kalenderbereiche

- Die alte PlanView-Wochenansicht mit eigenen Tages-Spalten wurde aus dem Rendering entfernt.
- Die alte PlanView-Monatsansicht mit Tageskaesten wie `1 Einheit` oder `frei` wurde aus dem Rendering entfernt.
- Die alte PlanView-Jahresansicht wurde aus dem Rendering entfernt.
- Der separate Wochenplan-Streifen unter dem zentralen Kalender wurde entfernt, damit die Woche nicht doppelt angezeigt wird.
- Der alte Vorlagenkasten in `PlanView` wurde entfernt; Vorlagen werden entweder in der Vorlagenbibliothek verwaltet oder im Kontextpanel des zentralen Kalenders genutzt.

## Neue Rollenverteilung

- Kalender: `TrainingCalendarView` ist die zentrale Anzeige fuer Tag, 3 Tage, Woche, Monat, Jahr und Liste.
- Vorlagen: `PlanView` verwaltet Trainingsvorlagen, Wochenvorlagen und Saisonbausteine. Beim Verwenden entstehen konkrete `PlanEntry`-Instanzen.
- Wochenplan: Wochenvorlagen bleiben als Struktur erhalten. Beim Einfuegen werden die enthaltenen Einheiten als echte Trainings in den zentralen Kalender geschrieben.
- Season: Saisonbausteine bleiben langfristige Planungsstrukturen. Beim Anwenden erzeugen sie konkrete Trainingsinstanzen, die ausschliesslich im zentralen Kalender sichtbar sind.
- Journal: Rueckblick und Feedback bleiben ein eigener Bereich; geplante Trainings werden nicht als zweiter Kalender dargestellt.

## Datenmodell

Es war keine Migration notwendig. Vorlagen, Wochenvorlagen und Saisonbausteine bleiben getrennte Planungsstrukturen. Konkrete Trainings werden weiterhin als `PlanEntry` gespeichert und dann ueber dieselbe Datenquelle an `TrainingCalendarView` uebergeben.

## Schutz bestehender Funktionen

Erhalten bleiben:

- Trainingsvorlagen erstellen, bearbeiten, duplizieren und verwenden.
- Wochenvorlagen einfuegen.
- Saisonbausteine einfuegen.
- Training planen und bearbeiten.
- Zentrale Filter, Status, Feedback, Traineraufgaben, Woche kopieren und Trainingsblock kopieren im zentralen Kalender.

## Teststatus

- `npm.cmd run build` erfolgreich.
- `npm.cmd run test` erfolgreich.

