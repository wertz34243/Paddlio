# Tablet Portrait Review

## Ausgangszustand

Tablet Portrait war vor dieser Phase funktional, aber nicht eigenständig genug. Der Kalender wurde bei Breiten unter 1024 px durch einen dauerhaften rechten Kontextbereich zu stark eingeengt. Trainingsdetails, Quick Edit und Vorlagen konkurrierten um dieselbe Fläche.

## Anpassung

- Tablet Portrait nutzt jetzt einen Kalender-first-Ansatz.
- Kontextbereiche werden bei Tablet-Breiten unter 1024 px als Overlay/Slide-over geöffnet.
- Der Kalender bleibt als Hauptfläche sichtbar und wird nicht dauerhaft durch eine rechte Spalte verkleinert.
- Die Wochenansicht wechselt in Portrait automatisch auf die 3-Tage-Ansicht, wenn die Breite für sieben Tage nicht sinnvoll ist.
- Vorlagen, Quick Edit und Trainingsdetails sind weiterhin erreichbar, aber immer nur als ein aktiver Kontextbereich.

## Ergebnis

Tablet Portrait ist deutlich näher am Zielbild: Kalender zuerst, Kontext bei Bedarf. Die Umsetzung ist build- und unit-test-grün. Eine echte visuelle Bewertung mit eingeloggten Dev-Testdaten konnte in dieser Shell nicht abgeschlossen werden, weil Rollen-E2E-Variablen nicht gesetzt waren.

