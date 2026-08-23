# Tablet 4.1 Calendar Layout Consolidation

## Ziel

Phase 4.1 konsolidiert den Tablet-Kalender ohne Phone- oder Desktop-Redesign. Fokus ist die Lesbarkeit der Wochenansicht, die Reduktion der Trainingskarten und eine ruhigere Toolbar.

## Ursache

Die Tablet-Woche wurde mit sieben flexiblen Spalten und zu niedriger Mindestbreite gerendert. Bei offenem Kontextpanel blieb einzelnen Tagen zu wenig Platz. Dadurch wurden Uhrzeiten und lange deutsche Trainingstitel zu stark komprimiert. Zusätzlich enthielten Kalenderkarten zu viele Metadaten und Aktionen.

## Änderungen

- Tablet-Hauptansichten in der Toolbar auf Tag, 3 Tage, Woche und Monat reduziert.
- Liste und Saison bleiben auf Tablet über Overflow erreichbar.
- Tablet-Toolbar zeigt rechts nur Vorlagen, Filter, + Training und Overflow.
- Wochenkalender erhält auf Tablet Landscape feste Mindestbreiten pro Tag und horizontales Scrollen, wenn sieben Tage nicht sauber passen.
- Tablet Portrait bleibt bei drei Tagen und nutzt keine gequetschte 7-Spalten-Woche.
- Trainingskarten im Tablet-Kalender zeigen nur Titel, Zeit, Dauer und Bereich.
- Status wird bei kompakten Tablet-Karten als Mini-Punkt/Mini-Label dargestellt.
- Aktionen liegen hinter einem kleinen Drei-Punkt-Button und nicht mehr als Button-Wand auf der Karte.
- Monatsansicht zeigt kurze Zeitlabels ohne Sekunden, damit der Titel sichtbar bleibt.
- Saisonansicht wurde als kompaktes Jahresband umgesetzt.
- TemplatePanel bleibt als kompakte Toolbox mit Training, Woche und Saison erhalten.

## Mindestbreiten

- Tablet Landscape Woche: 148 px pro Tag, bei 1024-1199 px 150 px.
- Tablet 3-Tage/Portrait: 180 px pro Tag.
- Verhalten bei kleineren Tabletbreiten: Kalender bleibt lesbar, die Woche scrollt horizontal oder wechselt in drei Tage.

## Qualitätsgate

- Kein Buchstabe-für-Buchstabe-Wrap in Trainingstiteln.
- Keine vertikal zerlegten Uhrzeiten.
- Keine großen Statuschips auf kompakten Kalenderkarten.
- Keine direkten Aktionslisten auf Kalenderkarten.
- Kontextpanel bleibt ein einzelner Zustand.
- Monatsansicht bleibt kompakt.
- Portrait bleibt touchfähig.

## Nachweis

Screenshots liegen unter:

`docs/ui/paddlio-one/tablet-workspace-4/`

