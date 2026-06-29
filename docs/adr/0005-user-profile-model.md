# ADR 0005: User-Modell und Athletenprofil fuer Version 0.5

## Kontext

Paddlio braucht ein vollstaendiges Athletenprofil. Dieses Profil ist spaeter Grundlage fuer Trainer-, Sportler- und Vereinsfunktionen, bei denen mehrere Nutzer und betreute Athleten relevant werden.

## Entscheidung

Version 0.5 fuehrt ein `User`-Modell mit `UserProfile` ein. Aktuell gibt es einen aktiven Nutzer ueber `activeUserId`, aber die Datenstruktur speichert bereits `users[]`, damit spaeter mehrere Profile angelegt werden koennen.

## Enthaltene Profildaten

- Personendaten
- Sportdaten und Bootsklassen
- persoenliche Ziele und Notizen
- Einstellungen mit Profilbild, Dark Mode, Einheiten und Sprache

## Konsequenzen

- Dashboard und Header nutzen Profilinformationen statt fester Athletentexte.
- Profildaten werden im LocalStorage unter `paddlemotion:v0.5:data` gespeichert.
- Bestehende Daten aus `paddlemotion:v0.3:data` werden migriert und um einen User erweitert.
- Trainings-, Wettkampf-, Plan- und Materialfunktionen bleiben fachlich unveraendert.
