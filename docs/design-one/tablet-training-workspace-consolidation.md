# Tablet Training Workspace Consolidation

## Vorherige Probleme

Der Trainingsbereich hatte zu viele parallele Einstiege fuer dieselben Aufgaben: Uebersicht, Kalender, Trainingsplanung, Erstellen, Vorlagen, Schnellplanung, Journal und mehrere Detailzustaende konkurrierten sichtbar miteinander. Auf Tablet wirkte das stark, aber mental zu laut: ein Trainer musste erst entscheiden, welcher von mehreren aehnlichen Wegen der richtige ist.

Zusaetzlich waren einige Arbeitsflaechen zu voll: Kalenderkarten und Builder-Abschnitte zeigten zu viele Aktionen direkt im Hauptfluss, Vorlagen erschienen gleichzeitig als Arbeitsdock und Verwaltung, und Journal-Filter waren nicht klar genug auf Rueckblick und Feedback ausgerichtet.

## Neue Informationsarchitektur

Der Training-Hauptbereich ist auf vier Modi reduziert:

- Kalender: Wochenplanung, Training verschieben, Training oeffnen, Vorlagen in die Planung bringen.
- Erstellen: Training aus Bausteinen in einer Timeline zusammenbauen.
- Vorlagen: Trainings-, Wochen- und Saisonbausteine verwalten.
- Journal: Durchfuehrung, Status, Soll/Ist und Feedback rueckblickend auswerten.

Die alte Uebersicht ist auf Tablet/Desktop nicht mehr der primaere Trainingsmodus. Ihre Planungsfunktion liegt im Kalender, Auswertung gehoert ins Journal.

## Entfernte Duplikate

Coach-Workflow-Hinweise, grosse Statistikstreifen und zusaetzliche Planungserklaerungen werden in den eigenstaendigen Vorlagen- und Journal-Modi ausgeblendet. Die schnelle Planung aus Vorlagen bleibt im Kalender-Kontext erhalten, erscheint aber nicht mehr dauerhaft in der Vorlagenverwaltung.

Im Builder wurden direkte Abschnittsaktionen konsolidiert. Sichtbar bleiben Auswahl und Dauersteuerung; Bearbeiten, Duplizieren, Verschieben, Optional und Loeschen liegen im Drei-Punkt-Menue.

## Neue und Wiederverwendete Komponenten

Wiederverwendet werden die bestehenden Kalender-, Vorlagen-, Journal-, Rollen- und Planungsservices. Neu bzw. erweitert sind der tabletorientierte Builder-Zustand mit Bausteinbibliothek, Timeline und Inspector, die reduzierten Builder-Menues und die kompakten Wochen-/Saisonbereiche innerhalb der Vorlagenverwaltung.

Die Kalenderdatenlogik, Supabase-Struktur, Rollenlogik, Sync, RLS und Phone-Shell wurden nicht umgebaut.

## Responsive Verhalten

Tablet Landscape nutzt weiterhin den Workspace-Ansatz: Kalender oder Builder als Hauptflaeche mit Kontext rechts. Der Builder bleibt als Drei-Zonen-Arbeitsplatz organisiert: Bausteine, Timeline, Inspector/Vorschau.

Tablet Portrait priorisiert die Timeline. Bausteinbibliothek und Inspector bleiben erreichbar, werden aber dichter und scrollfaehig angeordnet, ohne das Phone-Layout neu zu gestalten.

## Drag & Drop

Drag & Drop bleibt als schnelle Bedienung erhalten: Vorlagen koennen im Kalenderkontext geplant werden, Builder-Bausteine koennen in die Timeline gezogen werden. Tap bleibt die vollwertige Alternative, damit Touch ohne praezises Dragging funktioniert.

## Journal

Das Journal ist der Rueckblick-Modus. Es filtert nach Zeitraum, Sportler, Gruppe, Kategorie und Status und zeigt kompakte Eintraege mit Durchfuehrungs- und Feedbackbezug.

## Bekannte Einschraenkungen

Portrait nutzt aktuell eine kompakte responsive Anordnung statt eines voll ausgebauten nativen Drawer-Systems. Das ist fuer den Trainer-Test bedienbar, sollte aber im spaeteren Tablet-Polish weiter verfeinert werden.

Die Konsolidierung verzichtet bewusst auf neue Datenmodelle fuer Trainingsabschnitte. Strukturierte Abschnitte werden innerhalb der bestehenden UI- und Speichermodelle vorbereitet, ohne Migration.

## Teststatus

Abschlusspruefungen:

- `npm.cmd run test`: bestanden, 14 Testdateien, 62 Tests.
- `npm.cmd run build`: bestanden; bekannte Chunk-Warnung > 500 kB bleibt ohne Beta-Blocker.
- `npm.cmd run check:beta`: bestanden; Encoding, RLS, Bundle Budget, Accessibility und Beta-Blocker gruen.
- `npm.cmd run test:e2e:roles`: bestanden, 9 Tests, 1 projektseitig uebersprungen.
- `npm.cmd run test:e2e`: bestanden, 26 Tests, 14 projektseitig uebersprungen.
- Gezielte Tablet-Screenshot-Pruefung: bestanden, 12 neue Screenshots fuer Kalender, Builder, Vorlagen, Journal und Portrait.

## Screenshots

Screenshots werden unter `docs/ui/paddlio-one/tablet-training-consolidation/` abgelegt:

- 01-calendar-landscape.png
- 02-calendar-detail-inspector.png
- 03-calendar-template-panel.png
- 04-create-builder-landscape.png
- 05-create-builder-section-selected.png
- 06-templates-library.png
- 07-week-templates.png
- 08-season-templates.png
- 09-journal-landscape.png
- 10-create-portrait.png
- 11-create-portrait-blocks-drawer.png
- 12-create-portrait-details-drawer.png

## Offene Punkte

Fuer eine spaetere Phase bleiben echte Tablet-Drawer-Gesten, feinere Desktop-Inspector-Dichte und vollstaendige Drag-and-drop-E2E-Abdeckung moegliche Verbesserungen. Diese Phase reduziert zuerst die konkurrierenden Bedienmodelle.
