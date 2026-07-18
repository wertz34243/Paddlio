# Paddlio V1 Product Brief

## Leitidee

Paddlio hilft Kanuslalom-Athleten, ihr Training, ihre Wettkämpfe, ihre Analyse und ihr Material an einem Ort zu organisieren. Die Plattform soll sich wie ein ruhiges, leistungsorientiertes Cockpit anfühlen: schnell erfassbar, praktisch im Alltag und stark genug für langfristige Entwicklung.

Slogan: Train. Analyze. Improve.

## Zielgruppe für Version 1

Version 1 richtet sich an einzelne Athletinnen und Athleten im Kanuslalom.

Primäre Nutzer:

- ambitionierte Nachwuchsathleten
- Kader- und Leistungssportler
- erfahrene Vereinssportler mit strukturiertem Training

Noch nicht Teil von V1:

- Trainerverwaltung
- Team- oder Gruppenplanung
- Freigaben zwischen Trainer und Athlet
- Verbands- oder Vereinsadministration

## Produktziele

1. Athleten können ihr Training schnell und konsistent dokumentieren.
2. Wettkämpfe und Ergebnisse werden mit relevanten Kanuslalom-Daten abgebildet.
3. Entwicklungen werden über Zeit sichtbar: Technik, Zeiten, Strafsekunden, Belastung und Material.
4. Material wird nicht als Nebenliste behandelt, sondern mit Training und Wettkampf verknüpft.
5. Die Plattform bleibt fokussiert genug, um als tägliches Arbeitswerkzeug genutzt zu werden.

## Kernmodule

### Dashboard

Das Dashboard ist der Startpunkt für den Athleten.

Inhalte:

- nächste Trainingseinheiten
- anstehende Wettkämpfe
- letzte Fahrten und wichtigste Kennzahlen
- Wochenbelastung
- offene Notizen oder Analysepunkte
- Materialhinweise, zum Beispiel Wartung oder Setup-Änderungen

### Training

Das Trainingsmodul bildet geplante und absolvierte Einheiten ab.

Funktionen:

- Trainingseinheiten anlegen
- Disziplin oder Schwerpunkt wählen, zum Beispiel Technik, Start, Ausdauer, Wettkampfsimulation
- Strecke, Wasserstand, Wetter und Bedingungen erfassen
- Laufzeiten, Strafsekunden und Torfehler dokumentieren
- subjektive Belastung, Fokus und Tagesform erfassen
- Notizen pro Einheit und optional pro Lauf

Wichtige Kennzahlen:

- Trainingsdauer
- Anzahl Läufe
- beste Laufzeit
- Durchschnittszeit
- Strafsekunden
- Fehlerquote
- Belastung
- Technikfokus

### Wettkämpfe

Das Wettkampfmodul hilft bei Vorbereitung, Durchführung und Nachbereitung.

Funktionen:

- Wettkampf anlegen mit Ort, Datum, Kategorie und Bootsklasse
- Ziele für den Wettkampf erfassen
- Qualifikation, Halbfinale und Finale dokumentieren
- Zeiten, Strafsekunden, Platzierung und Abstand zur Spitze speichern
- Streckennotizen und Learnings festhalten
- verwendetes Material verknüpfen

Wichtige Kennzahlen:

- Ergebnisplatzierung
- Gesamtzeit
- reine Fahrzeit
- Strafsekunden
- Abstand zur Bestzeit
- Fehlerarten
- Zielerreichung

### Analyse

Die Analyse verdichtet Trainings- und Wettkampfdaten.

Ansichten:

- Wochen- und Monatsübersicht
- Entwicklung der Laufzeiten
- Strafsekunden und Fehlerhäufigkeit
- Vergleich Training gegen Wettkampf
- Schwerpunktverteilung im Training
- Belastungsentwicklung
- Materialvergleich bei aehnlichen Bedingungen

Erste V1-Analysen:

- Beste Zeit pro Strecke
- Durchschnittliche Strafsekunden pro Einheit
- Fehlerquote nach Torabschnitt oder Technikfokus
- Belastung pro Woche
- Wettkampftrend über die Saison

### Material

Das Materialmodul verwaltet Ausrüstung und Setups.

Objekte:

- Boot
- Paddel
- Spritzdecke
- Helm
- Schwimmweste
- Schuhe und weitere Ausrüstung

Funktionen:

- Material erfassen
- Seriennummern, Modell, Kaufdatum und Zustand speichern
- Setup-Notizen dokumentieren
- Wartungen und Reparaturen festhalten
- Material mit Training oder Wettkampf verknüpfen

## Datenmodell V1

### Athlete

- id
- name
- birthDate
- boatClasses
- club
- seasonGoals
- technicalGoals

### TrainingSession

- id
- athleteId
- date
- location
- sessionType
- focus
- durationMinutes
- waterCondition
- weather
- perceivedLoad
- notes

### TrainingRun

- id
- trainingSessionId
- runNumber
- timeSeconds
- penaltySeconds
- touchedGates
- missedGates
- sectionNotes
- videoUrl

### Competition

- id
- athleteId
- name
- location
- startDate
- endDate
- category
- boatClass
- goals
- notes

### CompetitionRun

- id
- competitionId
- round
- startNumber
- timeSeconds
- penaltySeconds
- rank
- gapToBestSeconds
- notes
- videoUrl

### Equipment

- id
- athleteId
- type
- brand
- model
- serialNumber
- purchaseDate
- condition
- notes

### EquipmentUsage

- id
- equipmentId
- trainingSessionId
- competitionId
- setupNotes

### MaintenanceLog

- id
- equipmentId
- date
- type
- description
- cost

## V1 Navigation

Hauptnavigation:

- Dashboard
- Training
- Wettkämpfe
- Analyse
- Material
- Profil

## Wichtige User Stories

1. Als Athlet möchte ich eine Trainingseinheit in unter zwei Minuten erfassen, damit mein Trainingstagebuch vollständig bleibt.
2. Als Athlet möchte ich einzelne Läufe mit Zeit und Strafsekunden speichern, damit ich meine technische Entwicklung sehe.
3. Als Athlet möchte ich Wettkampfergebnisse nach Runden dokumentieren, damit ich später nachvollziehen kann, wo ich Zeit verloren habe.
4. Als Athlet möchte ich Material mit Trainings und Wettkämpfen verknüpfen, damit Setup-Änderungen nicht verloren gehen.
5. Als Athlet möchte ich Trends über Wochen und Monate sehen, damit ich meine Saison besser steuern kann.

## Nichtziele für V1

- Trainer-Dashboard
- Athletenfreigaben
- Teamkalender
- Chat oder Messaging
- Zahlungsfunktionen
- automatische Videoanalyse
- Integration mit offiziellen Ergebnisdiensten
- komplexe Trainingsperiodisierung mit Trainerfreigabe

## Spätere Ausbaustufen

### Trainer-Modus

- mehrere Athleten verwalten
- Trainingspläne zuweisen
- Feedback geben
- Fortschritt vergleichen
- Wettkampfreisen und Gruppenplanung

### Sportler-Modus

- vereinfachte Ansicht für jüngere oder breitensportliche Nutzer
- weniger Kennzahlen
- stärker geführte Eingabe
- Motivation und Fortschrittsmarker

### Erweiterte Analyse

- Video-Timestamps
- Abschnittszeiten
- Torlinien und Fehlerzonen
- Sensor- und GPS-Daten
- Imports aus Timing-Systemen

## MVP-Schnitt

Ein erster MVP sollte diese Funktionen enthalten:

1. Athletenprofil
2. Trainingseinheiten mit Läufen
3. Wettkämpfe mit Ergebnisrunden
4. Materialliste
5. Dashboard mit nächsten Terminen und letzten Ergebnissen
6. einfache Analyse für Zeiten, Strafsekunden und Wochenbelastung

## Offene Produktfragen

- Soll V1 als mobile-first Web-App, Desktop-Web-App oder responsive Plattform starten?
- Sollen Videos nur verlinkt oder direkt hochgeladen werden?
- Welche Bootsklassen müssen zu Beginn unterstuetzt werden?
- Wird eine Offline-Funktion für Trainings am Kanal gebraucht?
- Soll es bereits in V1 Datenexport als CSV oder PDF geben?
