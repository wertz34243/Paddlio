# Tablet Real iPad Polish

## Ziel

Diese Phase schliesst den Tablet-Trainingsbereich als real nutzbaren iPad-Arbeitsplatz weiter ab. Die bestehende Struktur `Kalender | Erstellen | Vorlagen | Journal` bleibt erhalten; Phone, Auth, Sync, RLS und Production wurden nicht umgebaut.

## Vorherige Probleme

- Der Kalender reservierte auf Tablet teilweise eine rechte Spalte, obwohl kein Kontextpanel offen war.
- Bei geoeffnetem Kontext konnte die Wochenansicht die rechte Spalte aus dem sichtbaren iPad-Bereich druecken.
- Das Feedback-Formular war auf realen Phone/iPad-Screens zu flach strukturiert und Werte an Slidern waren schwer erfassbar.
- Traineraufgaben waren im Kalender-Inspector sichtbar, aber nicht als eigener sauberer Erfassungszustand im iPad-Workflow verfuegbar.

## Neue Struktur

- Ohne Kontextpanel nutzt der Tablet-Kalender die volle Arbeitsbreite.
- Mit Kontextpanel entsteht rechts eine echte kompakte Spalte fuer Vorlagen, Training-Inspector oder Quick Edit.
- Der Kalender bleibt bei offenem Kontext sichtbar und reduziert seine Karten auf kurze Ellipsen-Zusammenfassungen.
- Traineraufgaben werden aus dem Aufgaben-Tab im Training-Inspector erstellt und direkt mit der Einheit verknuepft.

## Kalender

Die Wochenansicht bleibt nach dem Vivendi-Prinzip reduziert: Zeit, kurzer Titel, Kategoriekuerzel und Statuspunkt. Lange Beschreibung, Feedback, Anpassungen und grosse Aktionsleisten bleiben im Detail-Inspector.

## Kontextpanel

Das Kontextpanel wird nur gerendert, wenn es Inhalt gibt. Vorlagen, Details, Quick Edit und Filter konkurrieren nicht gleichzeitig; jeder Zustand besetzt die rechte Spalte allein.

## Feedback

Feedback wird als kompaktes Sheet angezeigt. Slider zeigen ihre aktuellen Werte direkt neben dem Label, die Notiz bleibt darunter, und die Aktionen sind klar getrennt.

## Traineraufgaben

Im Aufgaben-Tab gibt es fuer Trainer/Admins einen klaren Einstieg `Traineraufgabe erstellen`. Das Sheet schreibt bestehende `TeamTask`- und `TeamTaskAssignment`-Datensaetze und fuegt keine neue Datenstruktur ein.

## Responsive Verhalten

- Tablet Landscape ohne Kontext: volle Kalenderbreite mit 7 Spalten.
- Tablet Landscape mit Kontext: kompaktere Kalenderkarten plus rechte Spalte.
- Tablet Portrait: 3-Tage-Ansicht als Standard, Kontext als Overlay/Drawer.
- Phone bleibt auf dem abgeschlossenen Phone-UX-Strang.

## Screenshots

Die Screenshots liegen unter `docs/ui/paddlio-one/tablet-real-ipad-polish/` und decken Kalender, Kontextpanel, Inspector, Feedback, Traineraufgabe, Vorlagen, Builder, Journal und Portrait ab.

## Teststatus

Gezielter Real-iPad-Screenshot-Test: `npm.cmd exec -- playwright test tests/e2e/tablet-real-ipad-polish.spec.ts --project=edge`.

Die finale Pflicht-Testkette wird im Abschlussbericht separat dokumentiert.

## Offene Punkte

Das Journal ist funktional filterbar, bleibt bei sehr vielen Eintraegen aber noch datenlastig. Das ist kein Blocker fuer den iPad-Kalender- und Template-Polish, sollte spaeter als eigener Journal-Polish betrachtet werden.
