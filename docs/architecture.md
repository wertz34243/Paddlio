# Paddlio Architecture

## Grundsatz

Paddlio wird architekturgetrieben entwickelt. Vor jeder groesseren Implementierung wird zuerst festgelegt:

- welche fachliche Domaene betroffen ist
- welche Daten und Regeln entstehen
- welche UI-Flows benötigt werden
- welche Erweiterung in späteren Phasen wahrscheinlich ist
- welche Tests die Funktion absichern sollen

Code wird erst geschrieben, wenn diese Punkte ausreichend geklaert sind.

## Entwicklungsphasen

### Phase 1: Athleten-App

Ziel: Einzelne Athleten können Training, Wettkämpfe, Analyse, Material und Ziele eigenständig verwalten.

Module:

- Dashboard
- Training
- Wettkämpfe
- Analyse
- Material
- Ziele
- Profil

Architekturannahme:

Phase 1 wird bewusst als Single-Athlete-Erlebnis gebaut, aber nicht als technische Einbahnstrasse. Datenmodelle enthalten bereits klare Ownership-Felder, damit später Trainer-, Sportler- und Vereinskontexte angebunden werden können.

### Phase 2: Trainerbereich

Ziel: Trainer können mehrere Athleten betreuen, Pläne erstellen, Fortschritte beobachten und Feedback geben.

Erweiterungen:

- Coach-Profil
- Athletenzuordnung
- Trainingsplanung
- Feedback und Kommentare
- Freigaben und Sichtbarkeiten
- Vergleichsansichten

Technische Vorbereitung in Phase 1:

- Athleten-Daten werden nicht global angenommen
- Fachlogik wird nicht direkt an UI-Komponenten gekoppelt
- Berechtigungen werden früh als Konzept vorgesehen
- Analysefunktionen werden als wiederverwendbare Services geplant

### Phase 3: Sportlerbereich

Ziel: Vereinfachter Modus für jüngere oder weniger datenorientierte Sportler.

Erweiterungen:

- reduzierte Eingabemasken
- geführte Trainingsdokumentation
- einfache Fortschrittsanzeigen
- motivierende Zielerreichung
- optionaler Trainerzugriff

Technische Vorbereitung:

- UI-Varianten dürfen nicht zu Datenmodell-Varianten führen
- Komplexitaet wird über Rollen, Views und Feature Flags gesteuert
- Kernobjekte wie Training, Wettkampf und Ziel bleiben dieselben

### Phase 4: Vereinsbereich

Ziel: Vereine können Athleten, Trainer, Gruppen, Material und Termine organisieren.

Erweiterungen:

- Club-Organisation
- Rollen und Rechte
- Gruppen und Teams
- gemeinsamer Kalender
- Vereinsmaterial
- Export und Reporting

Technische Vorbereitung:

- Organisationszugehoerigkeit wird als späteres Ownership-Modell vorgesehen
- Material kann perspektivisch privat oder vereinsbezogen sein
- Kalenderdaten bleiben generisch genug für Training, Wettkampf und Vereinsevents

## Empfohlene technische Zielarchitektur

Die Plattform sollte als moderne Web-App mit klarer Trennung zwischen UI, Domain-Logik und Datenzugriff aufgebaut werden.

Empfohlener Stack für den Projektstart:

- Frontend: React mit TypeScript
- App Framework: Next.js oder Vite, abhängig von Hosting- und Backend-Entscheidung
- Styling: Tailwind CSS oder ein leichtes Design-System auf CSS-Variablen
- Backend: zunächst API-Schicht mit klaren Domain-Services
- Datenbank: PostgreSQL
- ORM: Prisma oder Drizzle
- Authentifizierung: rollenfähig, auch wenn V1 nur Athleten nutzt
- Tests: Unit-Tests für Domain-Logik, Integrationstests für Datenzugriff, UI-Tests für Kernflows

Noch offen vor Implementierungsstart:

- Soll die App serverseitig gerendert werden oder als reine SPA starten?
- Soll Authentifizierung direkt eingebaut oder für einen Prototyp simuliert werden?
- Soll lokal zuerst mit Mock-Daten oder sofort mit Datenbank entwickelt werden?
- Wird Offline-Nutzung am Trainingsort in V1 gebraucht?

## Modulgrenzen

### Dashboard

Das Dashboard aggregiert Daten, besitzt aber möglichst wenig eigene Fachlogik.

Abhaengigkeiten:

- liest Training
- liest Wettkämpfe
- liest Ziele
- liest Materialhinweise
- liest Analyse-Summaries

Regel:

Dashboard-Komponenten dürfen keine Trainings- oder Analyseberechnung selbst implementieren.

### Training

Training ist eine Kerndomaene.

Enthaelt:

- Trainingseinheiten
- Trainingslaeufe
- Bedingungen
- Belastung
- technische Schwerpunkte
- Notizen

Spätere Erweiterung:

- Trainerfeedback
- Trainingsplaene
- Videoanalyse
- Abschnittszeiten
- Sensorwerte

### Wettkämpfe

Wettkämpfe sind eine eigene Kerndomaene, auch wenn sie aehnliche Daten wie Training enthalten.

Enthaelt:

- Wettkampftermine
- Runden
- Ergebnisse
- Platzierungen
- Ziele und Learnings
- eingesetztes Material

Spätere Erweiterung:

- offizieller Ergebnisimport
- Team- oder Vereinskalender
- Reiseplanung
- Qualifikationslogik

### Analyse

Analyse berechnet Kennzahlen aus Training, Wettkampf, Zielen und Material.

Enthaelt:

- Aggregationen
- Trends
- Vergleiche
- Leistungsindikatoren

Regel:

Analysefunktionen werden als reine, testbare Berechnungen geplant. UI-Komponenten zeigen Ergebnisse an, berechnen sie aber nicht selbst.

### Material

Material ist eine eigenständige Domaene, nicht nur ein Freitextfeld.

Enthaelt:

- Ausruestungsgegenstaende
- Zustand
- Wartung
- Setup-Notizen
- Verwendung in Training und Wettkampf

Spätere Erweiterung:

- Vereinsmaterial
- Ausleihe
- Schadenshistorie
- Setup-Vergleiche

### Ziele

Ziele verbinden Planung, Training, Wettkampf und Analyse.

Enthaelt:

- Saisonziele
- Technikziele
- Wettkampfziele
- Trainingsziele
- Status und Fortschritt

Spätere Erweiterung:

- Trainerfreigabe
- Zielvorschlaege
- Meilensteine
- Rückblick pro Saison

## Domänenmodell: Erweiterbare Ownership

Jedes zentrale Objekt sollte langfristig eindeutig zuordenbar sein.

V1:

- athleteId als primaerer Besitzer

Später:

- coachId für Trainerkontext
- clubId für Vereinskontext
- visibility für Freigaben
- createdBy und updatedBy für Nachvollziehbarkeit

Empfohlene Basiseigenschaften für zentrale Entitäten:

- id
- createdAt
- updatedAt
- athleteId
- createdBy
- updatedBy

Bei später gemeinschaftlich genutzten Objekten:

- clubId
- ownerType
- ownerId
- visibility

## Rollenmodell

Auch wenn V1 nur Athleten adressiert, sollte das Rollenmodell früh mitgedacht werden.

Geplante Rollen:

- athlete
- coach
- sportler
- clubAdmin

V1-Regel:

Die UI zeigt nur Athletenfunktionen. Die Architektur vermeidet aber Annahmen wie "jeder Nutzer ist immer ein Athlet".

## Datenfluss

Empfohlener Datenfluss:

1. UI-Komponente
2. Feature-spezifische View-Logik
3. Domain-Service oder Use Case
4. Repository oder API-Client
5. Datenbank oder externe Quelle

Regeln:

- Validierung nah am Use Case
- zentrale Typen für Domänenobjekte
- keine doppelten Berechnungen in mehreren Komponenten
- keine direkten Datenbankdetails in UI-Code

## Teststrategie

Mindeststandard für neue Funktionen:

- Domain-Logik: Unit-Test
- Datenzugriff: Integrationstest oder Repository-Test
- UI-Kernflow: Komponententest oder End-to-End-Test

Besonders testpflichtig:

- Zeitberechnung
- Strafsekunden
- Rang- und Abstandberechnung
- Wochenbelastung
- Ziel-Fortschritt
- Materialverknuepfungen
- Berechtigungen

## Qualitätsregeln

- TypeScript strikt verwenden
- fachliche Typen statt lose Strings
- Validierung für Nutzereingaben
- klare Modulstruktur
- kleine, testbare Domain-Funktionen
- keine Vermischung von UI, Fachlogik und Persistenz
- responsive und mobile-taugliche Oberflaeche
- Barrierearme Bedienung als Standard
- erweiterbare Rollen- und Berechtigungskonzepte

## Entscheidungsprotokoll

Wichtige Architekturentscheidungen werden als ADRs dokumentiert.

Geplanter Ordner:

- docs/adr

Format:

- Kontext
- Entscheidung
- Alternativen
- Konsequenzen

Erste notwendige ADRs:

1. Frontend- und App-Framework
2. Datenbank und Persistenzstrategie
3. Authentifizierungsstrategie
4. Offline-Strategie
5. Analyse- und Kennzahlenmodell
