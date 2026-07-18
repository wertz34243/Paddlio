# Paddlio Device Strategy

Paddlio unterscheidet künftig zwischen Rolle und Geräteklasse. Die Rolle entscheidet, ob eine Funktion fachlich erlaubt ist. Die Geräteklasse entscheidet, wie umfangreich die Funktion dargestellt wird.

## Geräteklassen

| Klasse | Zweck | Typische Nutzung |
| --- | --- | --- |
| Phone | Alltag, Training, Feedback, Nachrichten | kurze Nutzung am Wasser oder unterwegs |
| Tablet | Trainerarbeit, Planung, Anwesenheit | Split View, Touch, Arbeit am Wasser |
| Desktop | Verwaltung, Import, Analyse, Admin | Tabellen, Tastatur, große Bearbeitung |

Die technische Erkennung liegt in `src/lib/deviceCapabilities.ts` und nutzt Viewport, Pointer, Hover, Standalone-Modus und Plattformhinweise.

## Grundregel

Sichtbarkeit = Rolle + Geräteklasse + Kontext.

Eine Funktion wird nicht nur per CSS versteckt. Der Einstieg wird zentral über die Feature-Capability-Matrix gesteuert. Serverseitige Sicherheit bleibt Aufgabe von Rollenlogik und RLS.
