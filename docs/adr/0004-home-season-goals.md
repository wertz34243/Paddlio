# ADR 0004: Saisonziele prominent auf Home für Version 0.4

## Kontext

Die Athleten-App soll motivierender wirken. Saisonziele sind für den täglichen Fokus wichtiger als Materialnotizen und sollen direkt beim Öffnen sichtbar sein.

## Entscheidung

Saisonziele werden nur noch auf der Home-Seite angezeigt. Die Material-Seite zeigt ausschließlich Materialdaten. Zielwerte, Fortschritt und Status werden weiterhin aus gespeicherten Wettkampf- und Trainingsdaten berechnet.

## Konsequenzen

- Home bekommt prominentere Zielkarten mit Fortschrittsbalken.
- Material bleibt fachlich auf Boote, Paddel und Zubehör fokussiert.
- Das Datenmodell bleibt unverändert; der LocalStorage-Key `paddlemotion:v0.3:data` bleibt gueltig.
- Version 0.4 ist eine UI- und Motivationsverbesserung ohne Datenmigration.

