# Paddlio Design System

## Grundsatz

Paddlio bleibt eine moderne Sport- und Trainingsplattform. Die Oberfläche darf nicht wie ein altes Verwaltungssystem wirken, muss auf Tablet und Desktop aber deutlich mehr Inhalt zeigen als auf dem Smartphone.

Die Geräteaufteilung ist verbindlich:

- Phone: nutzen, abhaken, Feedback geben, synchronisieren
- Tablet: nutzen und planen, besonders für Trainer am Wasser
- Desktop: planen, verwalten, auswerten und importieren

## Orientierung

Paddlio orientiert sich funktional an Apple Fitness, Polar Flow, Apple/Google Calendar, IDA Kanuslalom und Vivendi. Die visuelle Sprache bleibt eigenständig:

- ruhige dunkle Flächen
- klare Cyan/Grün-Akzente
- helle Sport-App-Typografie
- kompakte Arbeitsflächen auf großen Geräten
- keine überladene Tabellenoptik

## Responsive Dichte

Die zentrale Umsetzung liegt in [responsive-density.md](responsive-density.md) und am Ende von `src/styles.css`.

Token-Schicht:

- `--density-page-padding`
- `--density-section-gap`
- `--density-card-gap`
- `--density-card-padding`
- `--density-control-height`
- `--density-input-height`
- `--density-card-radius`
- `--density-title-xl`
- `--density-title-lg`
- `--density-title-md`
- `--density-metric`
- `--density-body`
- `--density-caption`

Phone bleibt großzügig. Tablet ist etwa 10 bis 15 Prozent kompakter. Desktop ist etwa 20 bis 25 Prozent kompakter.

## Layout-Regeln

Phone:

- einspaltig
- große Touchflächen
- wenige gleichzeitige Entscheidungen
- Bottom Navigation sichtbar
- keine großen Tabellen

Tablet:

- zwei Spalten, wenn es fachlich hilft
- Kalender plus Detail möglich
- Vorlagenleiste als Sidebar oder Sheet
- Traineraufgaben und Anwesenheit direkt erreichbar

Desktop:

- Sidebar statt Bottom Navigation
- kompakte Tabs
- mehrspaltige Formulare
- Vorlagen, Kalender und Detailansicht nebeneinander
- Listen und Tabellen dort, wo sie Arbeit sparen

## Training und Kalender

Die Planungslogik bleibt zentral. Es gibt keine zweite Trainingsplanung.

Der Kalender nutzt:

- bestehende Trainingsvorlagen
- Wochenvorlagen
- Saisonbausteine
- Kopieren von Wochen
- Wiederholungsserien
- Soft Delete für gelöschte Trainings
- individuelle Anpassungen über planbezogene Daten
- Traineraufgaben über Aufgaben mit Trainingsbezug

Soll-Daten kommen aus Planung und Vorlagen. Ist-Daten kommen aus Feedback, Trainingstagebuch und Polar.

## Karten

Karten werden nur für echte Gruppierung verwendet.

Phone:

- größere Karten
- klarer Haupttext
- große Aktionen

Tablet/Desktop:

- flachere Karten
- weniger vertikaler Leerraum
- Kennzahlen näher am Label
- Aktionen als kompakte Aktionsleisten

## Buttons und Formulare

Phone:

- primäre Aktionen groß
- Buttons häufig volle Breite
- Formulare einspaltig

Tablet:

- weiterhin touchfähig
- häufig zwei Spalten
- Aktionen gruppiert

Desktop:

- kompaktere Controls
- Buttons nicht unnötig volle Breite
- Datum, Zeit, Dauer, Intensität und Zuordnung nebeneinander, wenn sinnvoll

## Farben

Farben transportieren Status und Priorität, nicht Dekoration.

- Cyan: primäre Navigation und aktive Auswahl
- Grün: erfolgreich, synchronisiert, erledigt
- Gelb/Orange: Warnung oder offene Prüfung
- Rot: kritischer Fehler oder Löschung
- Blau/Violett nur sparsam für besondere Analyse- oder Lernkontexte

## Barrierefreiheit

Kompakter heißt nicht kleiner um jeden Preis.

- Phone-Touchziele bleiben groß
- Tablet bleibt touchfähig
- Desktop bleibt lesbar
- Fokuszustände bleiben sichtbar
- Motion respektiert `prefers-reduced-motion`
- Status darf nie nur über Farbe vermittelt werden

## Development-Regel

Neue Design-Änderungen laufen über `develop` und die Development-URL. Production (`main`, `https://paddlio.vercel.app`) bekommt nur geprüfte Änderungen.
