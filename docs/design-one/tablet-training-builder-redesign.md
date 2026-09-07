# Tablet Training Builder Redesign

## Ausgangsproblem

Der bisherige Tablet-Erstellen-Bereich war eine lange Formularstrecke. Trainer mussten viel scrollen, die Live-Vorschau war nicht dauerhaft im Blick, und Trainingsinhalte wirkten wie Formularfelder statt wie planbare Trainingsbausteine.

## Neue Trainingsplanungsarchitektur

Der Tablet Builder ist jetzt als dreiteiliger Trainer-Workspace aufgebaut: links die Bausteinbibliothek, in der Mitte die Training-Timeline und rechts Inspector beziehungsweise Live-Vorschau. Kalenderlogik, Speicherung, Rollen, Sync und RLS bleiben unverändert; der Builder erzeugt weiterhin normale Trainingseinträge.

## Bausteinbibliothek

Die linke Spalte zeigt vorhandene Trainingsvorlagen als kompakte Bausteine mit Kategorie, Titel, Dauer, Intensität und Fokuskurztext. Suche und Kategorie-Filter arbeiten gemeinsam, damit Trainer nicht durch lange Listen gehen müssen.

## Training Builder

Die Mitte ist die eigentliche Arbeitsfläche. Trainer setzen Titel, Datum, Startzeit und Zuweisung, fügen Bausteine per Tap oder Drag-and-Drop hinzu und sehen den Ablauf als sortierbare Timeline mit Gesamtdauer.

## Inspector

Der rechte Bereich zeigt entweder die Live-Vorschau des gesamten Trainings oder die Detailbearbeitung des ausgewählten Abschnitts. Dauer, Intensität, Bootsklasse, Fokus, Beschreibung und optionale Abschnitte werden dort bearbeitet, ohne ein großes Modal über den Kalender zu legen.

## Drag & Drop

Vorlagen können auf die Timeline gezogen werden. Beim Drop wird daraus ein Abschnitt mit Dauer, Intensität, Bootsklasse, Fokus und Beschreibung; als Alternative reicht ein Tap auf den Baustein.

## Tablet Landscape

Landscape nutzt drei Zonen mit festen Mindestbreiten: Bausteine, Timeline, Inspector. Die Struktur verhindert gequetschte Textspalten und hält Touch-Ziele bei mindestens 44 px.

## Tablet Portrait

Portrait stapelt die drei Bereiche untereinander. Dadurch bleibt der Builder touchfähig, ohne eine enge Desktop-ähnliche Dreispaltenansicht zu erzwingen.

## Vorlagen, Wochenplanung und Saison

Trainingsvorlagen bleiben die Quelle für Builder-Bausteine. Wochen- und Saisonvorlagen bleiben in der bestehenden Vorlagenbibliothek, werden aber nicht in kleine Trainingsabschnitte gepresst.

## Accessibility

Zentrale Eingaben behalten sichtbare Labels, Touch-Ziele sind groß genug, Texte werden gekürzt statt buchstabenweise gebrochen, und die Vorschau bleibt per Screenreader als eigener Bereich erkennbar.

## Performance

`PlanView` wird nun lazy geladen. Dadurch sinkt der Haupt-JS-Chunk deutlich und das Bundle-Budget bleibt trotz Builder-Erweiterung unter der bestehenden Grenze.

## Tests

Geprüft werden Build, Beta-Gates und E2E-Screenshots fuer Landscape und Portrait. Die neue Spec schreibt Bilder nach `docs/ui/paddlio-one/tablet-training-builder/`.

## Offene Punkte

Der Builder speichert Abschnittsdaten aktuell in Beschreibung/Notizen des bestehenden Trainingseintrags. Ein eigenes strukturiertes Abschnittsmodell waere spaeter sinnvoll, wurde aber bewusst nicht als Migration eingefuehrt.
