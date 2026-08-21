# Phone Overlay State

## Regel

Auf Phone darf immer nur eine aktive Ebene sichtbar sein:

- Detail
- Quick Edit
- Live
- Feedback
- Filter

## Umsetzung

Beim Öffnen von Training Details werden Quick Edit, Feedback und Live geschlossen.

Beim Öffnen von Quick Edit werden Detail, Feedback und Live geschlossen.

Beim Starten von Live werden Detail, Quick Edit und Feedback geschlossen.

Beim Öffnen von Feedback werden Detail, Quick Edit und Live geschlossen.

## Gesten

Folgende Ebenen unterstützen Edge-Swipe oder Swipe-Down:

- Training Detail
- Quick Edit
- Feedback
- Live Training
- Kalenderfilter

Bei potenziellem Datenverlust wird bestätigt:

- Quick Edit: Änderungen verwerfen?
- Feedback: Feedback verwerfen?
- Live: Live-Training schließen?

## Nicht geändert

Browser-History und Routing wurden nicht umgebaut. Die Geste schließt die aktuelle Paddlio-Ebene, nicht die App-Route.
