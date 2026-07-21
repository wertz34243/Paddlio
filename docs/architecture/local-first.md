# Local-First-Strategie

## Prinzip

Die App darf beim Start nicht auf jedes optionale Cloud-Modul warten. Bereits bekannte Daten werden sofort angezeigt, danach aktualisiert ein Hintergrundsync die Ansicht.

## Startreihenfolge

1. Auth-Session prüfen.
2. Profil, Rolle und Verein laden.
3. passenden lokalen Cache für den Benutzer öffnen.
4. Heute und aktuelle Woche aus Cache anzeigen.
5. ausstehende lokale Änderungen hochladen.
6. Cloud-Deltas herunterladen.
7. optionale Module nachladen, wenn die Ansicht sie benötigt.

## Nutzerfeedback

Die UI unterscheidet:

- lokal geladen
- Synchronisierung läuft
- synchronisiert
- offline
- lokale Änderungen ausstehend
- Konflikt erkannt
- Synchronisierung fehlgeschlagen

Ein einzelnes optionales Modul wie Polar, Akademie oder Import darf den normalen App-Start nicht blockieren.

## Grenzen

Local-first bedeutet nicht, dass der Client Berechtigungen entscheidet. Schreibzugriffe müssen weiterhin durch Supabase, RLS und serverseitige Prüfungen abgesichert sein.
