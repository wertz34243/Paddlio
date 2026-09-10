# Paddlio Desktop Training Workspace

## Ziel

Der Desktop-Trainingsbereich übernimmt die Tablet-Informationsarchitektur: Kalender, Erstellen, Vorlagen und Journal bleiben die vier klaren Arbeitsmodi. Desktop nutzt dieselben Daten und Kernkomponenten, zeigt aber mehr Breite, mehr Dichte und Maus-/Tastaturinteraktionen.

## Layout

Der Kalender nutzt auf Desktop ein 3-Zonen-Modell: links die bestehende App-Navigation, in der Mitte die Kalender-Arbeitsfläche und rechts genau ein Kontextpanel. Wenn kein Panel offen ist, expandiert der Kalender auf die volle Arbeitsbreite; bei Details, Quick Edit, Vorlagen oder Filter schrumpft er auf eine professionelle Arbeitsbreite mit Inspector.

## Tablet / Desktop

Tablet bleibt touch-first mit Long Press, Double Tap und Drawer-Verhalten. Desktop verwendet dieselbe Logik, ergänzt aber Rechtsklick-Kontextmenü, Ctrl/Cmd-Klick-Auswahl, Tastaturkürzel und dichtere Wochen-/Journal-Darstellung.

## Kalender

Desktop verwendet die kompakte Vivendi-artige Kalenderkarte aus dem Tablet-Konzept. Karten zeigen Zeit, Titel, Kategorie, Status und Menü, aber keine Button-Wand. Details, Feedback, Traineraufgaben und Löschen laufen über Inspector oder Kontextmenü.

## Shortcuts

- `N`: neues Training öffnen
- `F`: Filterpanel öffnen
- `T`: Vorlagenpanel öffnen/schließen
- `Esc`: Auswahl, Kontextmenü oder Panel schließen
- `Delete`: markierte Trainings nach Bestätigung löschen
- `Ctrl/Cmd + D`: ausgewähltes Training duplizieren
- `Ctrl/Cmd + C`: markierte Trainings kopieren

## Multi Select

Mehrfachauswahl funktioniert weiter über Long Press auf Touch und zusätzlich über Ctrl/Cmd-Klick auf Desktop. Die Auswahlleiste zeigt kompakte Aktionen für Verschieben, Kopieren, Status, Zuweisen und weitere Aktionen. Löschen bleibt im Menü und verlangt Bestätigung.

## Context Menu

Rechtsklick auf eine Trainingskarte öffnet ein Desktop-Kontextmenü mit Öffnen, Bearbeiten, Duplizieren, Status erledigt, Traineraufgabe, Als Vorlage speichern und Löschen. Die destruktive Aktion ist getrennt und bestätigt.

## Quick Edit

Quick Edit bleibt rechts im Kontextpanel. Direkt sichtbar sind Status, Datum, Start, Dauer, Boot, Zuweisung, Ziel und Ort; Trainer, Wiederholung und individuelle Anpassung liegen in Weitere Details. Der Footer bleibt sticky.

## Builder

Desktop verwendet den bestehenden Bausteine-Timeline-Inspector-Builder. Die alte lange Desktop-Form wird nicht mehr als primärer Desktop-Weg gerendert; Phone bleibt davon unberührt. Builder-Spalten sind auf Desktop dichter: Bausteine links, Timeline zentral, Inspector rechts.

## Vorlagen

Die Vorlagenbibliothek bleibt ein eigener Workspace mit Filter, Kachelraster und Detail-Inspector. Desktop zeigt mehr Spalten als Tablet, ohne lange Beschreibungen in der Hauptübersicht.

## Journal

Das Journal bleibt Rückblick statt Planung. Auf Desktop wird die Liste dichter und tabellarischer dargestellt, mit Filterleiste für Sportler, Zeitraum, Gruppe, Kategorie und Status.

## Responsive Fallback

Ab etwa 1280 px greift das Desktop-Layout. Zwischen 1024 und 1279 px bleibt das Tablet-Landscape-Verhalten aktiv. Unter 1024 px nutzt Paddlio weiterhin Tablet-Portrait beziehungsweise Phone-spezifische Logik.

## Tests und Screenshots

Die Desktop-Screenshots liegen unter `docs/ui/paddlio-one/desktop-training-workspace/`. Ergänzt wurde ein Desktop-E2E, der Kalender, Inspector, Quick Edit, Multi Select, Kontextmenü, Builder, Vorlagen und Journal bei Desktop-Breiten prüft.

## Bekannte Einschränkungen

Verschieben und Zuweisen in der Multi-Select-Leiste öffnen aktuell die vorhandenen Bearbeitungs-/Detailwege statt einen eigenen Bulk-Dialog. Undo ist noch nicht aktiv, weil keine bestehende Undo-Architektur vorhanden ist.
