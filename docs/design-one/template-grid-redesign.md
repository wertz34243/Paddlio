# Paddlio Vorlagenbibliothek Redesign

## Ausgangslage

Die Trainingsvorlagen wurden auf Tablet und Desktop als lange Listen dargestellt. Dadurch waren Kategorien, Dauer, Intensitaet und Herkunft nur schwer schnell scannbar, und die Bibliothek fuehlte sich mehr wie ein Formulararchiv als wie ein Trainer-Werkzeugkasten an.

## Neues Grid-System

Auf Tablet und Desktop nutzt die Trainingsbibliothek jetzt ein kompaktes Kachelraster. Jede Kachel zeigt nur Kategorie, Titel, Dauer, Intensitaet, Favorit und Herkunft; Fokus, Beschreibung und Tags bleiben im Detailpanel.

Die Rasterlogik ist responsiv:

- Tablet Landscape: bevorzugt drei sinnvolle Spalten, bei mehr Breite auch vier.
- Tablet Portrait: zwei Spalten, bei knapper Breite ohne horizontales Overflow.
- Desktop: vier bis fuenf Spalten mit begrenzter Kartenbreite.
- Phone: bleibt bei der bestehenden kompakten Listenlogik.

## Kategorie-Farbmodell

Die Kategorie wird nicht vollflaechig bunt dargestellt. Farbe erscheint nur als schmaler Akzent, Punkt und dezente Border-Toenung:

- GA1 / GA2 / Ausdauer: Cyan
- Technik: Gruen
- Kraft: Orange
- Wettkampf: Rot/Pink
- Regeneration: Lila
- Allgemein: Neutral

Die Kategorie bleibt zusaetzlich als Text sichtbar, damit Farbe nicht die einzige Information ist.

## Filtermodell

Kategorie und Quelle sind getrennt:

- Kategorie: Alle, GA1, GA2, Technik, Kraft, Wettkampf, Regeneration
- Quelle: Alle, Favoriten, Meine, Verein, System

Suche, Kategorie und Quelle arbeiten gemeinsam. Wenn kein Ergebnis gefunden wird, zeigt die Bibliothek einen Empty State mit Filter-Zuruecksetzen.

## Interaktionsmodell

Ein Klick oder Tap auf eine Trainingsvorlage oeffnet kein neues Modul, sondern ein Detailpanel. Dort stehen der volle Titel, Kategorie, Dauer, Intensitaet, Trainingsart, Bootsklasse, Fokus, Beschreibung, Tags, Herkunft und Favoritenstatus.

Aktionen bleiben im Detail:

- Verwenden
- Bearbeiten, wenn die Rolle und Vorlage es erlauben
- Duplizieren
- Favorit

Systemvorlagen bleiben geschuetzt und werden nicht direkt editierbar gemacht.

## Tablet/PC Unterschiede

Tablet nutzt groessere Touch-Ziele und ein enger gefuehrtes Kontextpanel. In Portrait erscheint das Detailpanel als Slide-over, damit das Raster nicht gequetscht wird. Desktop zeigt Raster und Detailpanel dauerhaft nebeneinander, solange genug Platz vorhanden ist.

## Bestehende Workflows

Der Kalender, der Training-erstellen-Step-Builder, Drag & Drop und die bestehende Speicherlogik wurden nicht umgebaut. Wochen- und Saisonvorlagen bleiben eigene kompakte Bereiche im Vorlagenkasten und werden nicht in die kleinen Trainingskacheln gezwungen.

## Testresultate

- `npm.cmd run test`: 14 Testdateien, 62 Tests bestanden.
- `npm.cmd run build`: erfolgreich, Main JS `649335` Bytes; Vite meldet weiterhin die bekannte grosse-Chunk-Warnung.
- `npm.cmd run check:beta`: bestanden.
- `npm.cmd run test:e2e:roles`: 9 bestanden, 1 definierter mobile-edge Skip.
- `npm.cmd run test:e2e`: 24 bestanden, 12 projektbedingt skipped.

Screenshots liegen unter `docs/ui/paddlio-one/template-grid-redesign/`.

## Offene Punkte

Der vorhandene Verwenden-Flow waehlt weiterhin eine Vorlage fuer die bestehende Planung aus. Ein noch direkterer Datum/Uhrzeit-Dialog waere moeglich, waere aber ein neuer Workflow und wurde in diesem Redesign bewusst nicht eingefuehrt.
