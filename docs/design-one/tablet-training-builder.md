# Tablet Training Builder

## Ziel

`Training -> Erstellen` nutzt auf Tablet jetzt einen Planungs-Builder statt der Phone-orientierten Schrittmaske.

## Layout

Tablet Landscape:

- Kopfzeile mit Zurück, Training erstellen, Duplizieren, Als Vorlage speichern, Abbrechen und primärer Aktion `Training planen`
- Builderbereich mit fünf fachlichen Sektionen
- Live-Vorschau rechts

Tablet Portrait:

- Builder bleibt einspaltig bzw. Preview rutscht unter das Formular.

## Sektionen

1. Grunddaten: Titel, Datum, Uhrzeit, Ende, Dauer, Status
2. Zuordnung: Für mich, einzelner Sportler, Trainingsgruppe, Bootsklasse, Trainer
3. Trainingsinhalt: Vorlage laden, Bereich, Trainingsart, Fokus, Beschreibung, Abschnitte
4. Belastung / Steuerung: Intensität, Wiederholung, Bis, Anzahl
5. Notizen: Trainerhinweise, Material, individuelle Anpassung

## Live-Vorschau

Die Vorschau aktualisiert sich aus dem Entwurf und zeigt Datum, Zeit, Dauer, Bereich, Intensität, Zuweisung, Boot und Trainer.

## Datensicherheit

Der Builder verwendet weiterhin `PlanEntry`, `onSave` und die bestehende Sync-/Cloud-Persistenz. Es wurde keine neue Datenstruktur eingeführt.
