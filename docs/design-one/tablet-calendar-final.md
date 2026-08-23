# Tablet Calendar Final

## Ausgangsproblem

Die Tablet-Wochenplanung war funktional, aber zu nah an Desktop und Phone: zu viele Informationen in Karten, zu viele Aktionen direkt im Kalender und zu enge Tagesbreiten bei aktiver Kontextspalte.

## Neue Struktur

- Links bleibt die kompakte App-Navigation.
- Die Mitte bleibt die Kalender-Arbeitsfläche.
- Rechts ist genau ein Kontextzustand aktiv: Vorlagen, Quick Edit oder Training Detail.
- Phone-Topbar, Phone-Bottom-Navigation und Phone-Overlays wurden nicht verändert.

## Kalenderregeln

- Woche bleibt die wichtigste Landscape-Ansicht.
- Tablet Landscape nutzt lesbare Tages-Mindestbreiten und darf horizontal scrollen, statt Text zu zerbrechen.
- Tablet Portrait bevorzugt eine 3-Tage-/Drawer-Logik statt gequetschter 7-Spalten.
- Monatsansicht zeigt kompakte Tageseinträge und keine vollständigen Trainingsbeschreibungen.

## Trainingskarten

Kalenderkarten zeigen nur:

- Uhrzeit
- Titel
- Dauer
- Kategorie/Intensität kompakt
- Status minimal

Aktionen liegen im Detailpanel oder Quick Edit.

## Restpunkte

Die aktuelle Kalenderbasis ist für den Tablet-Workflow tragfähig. Desktop-spezifische Dichte, Tastaturshortcuts und Bulk-Planung bleiben bewusst für eine spätere Desktop-Phase.
