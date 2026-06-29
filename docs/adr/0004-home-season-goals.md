# ADR 0004: Saisonziele prominent auf Home fuer Version 0.4

## Kontext

Die Athleten-App soll motivierender wirken. Saisonziele sind fuer den taeglichen Fokus wichtiger als Materialnotizen und sollen direkt beim Oeffnen sichtbar sein.

## Entscheidung

Saisonziele werden nur noch auf der Home-Seite angezeigt. Die Material-Seite zeigt ausschliesslich Materialdaten. Zielwerte, Fortschritt und Status werden weiterhin aus gespeicherten Wettkampf- und Trainingsdaten berechnet.

## Konsequenzen

- Home bekommt prominentere Zielkarten mit Fortschrittsbalken.
- Material bleibt fachlich auf Boote, Paddel und Zubehoer fokussiert.
- Das Datenmodell bleibt unveraendert; der LocalStorage-Key `paddlemotion:v0.3:data` bleibt gueltig.
- Version 0.4 ist eine UI- und Motivationsverbesserung ohne Datenmigration.

