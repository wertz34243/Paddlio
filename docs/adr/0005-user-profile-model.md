# ADR 0005: User-Modell und Athletenprofil für Version 0.5

## Kontext

Paddlio braucht ein vollständiges Athletenprofil. Dieses Profil ist später Grundlage für Trainer-, Sportler- und Vereinsfunktionen, bei denen mehrere Nutzer und betreute Athleten relevant werden.

## Entscheidung

Version 0.5 fuehrt ein `User`-Modell mit `UserProfile` ein. Aktuell gibt es einen aktiven Nutzer über `activeUserId`, aber die Datenstruktur speichert bereits `users[]`, damit später mehrere Profile angelegt werden können.

## Enthaltene Profildaten

- Personendaten
- Sportdaten und Bootsklassen
- persönliche Ziele und Notizen
- Einstellungen mit Profilbild, Dark Mode, Einheiten und Sprache

## Konsequenzen

- Dashboard und Header nutzen Profilinformationen statt fester Athletentexte.
- Profildaten werden im LocalStorage unter `paddlemotion:v0.5:data` gespeichert.
- Bestehende Daten aus `paddlemotion:v0.3:data` werden migriert und um einen User erweitert.
- Trainings-, Wettkampf-, Plan- und Materialfunktionen bleiben fachlich unverändert.
