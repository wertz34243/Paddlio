# Paddlio Architecture

## Grundsatz

Paddlio wird architekturgetrieben entwickelt. Vor jeder groesseren Implementierung wird zuerst festgelegt:

- welche fachliche Domaene betroffen ist
- welche Daten und Regeln entstehen
- welche UI-Flows benoetigt werden
- welche Erweiterung in spaeteren Phasen wahrscheinlich ist
- welche Tests die Funktion absichern sollen

Code wird erst geschrieben, wenn diese Punkte ausreichend geklaert sind.

## Entwicklungsphasen

### Phase 1: Athleten-App

Ziel: Einzelne Athleten koennen Training, Wettkaempfe, Analyse, Material und Ziele eigenstaendig verwalten.

Module:

- Dashboard
- Training
- Wettkaempfe
- Analyse
- Material
- Ziele
- Profil

Architekturannahme:

Phase 1 wird bewusst als Single-Athlete-Erlebnis gebaut, aber nicht als technische Einbahnstrasse. Datenmodelle enthalten bereits klare Ownership-Felder, damit spaeter Trainer-, Sportler- und Vereinskontexte angebunden werden koennen.

### Phase 2: Trainerbereich

Ziel: Trainer koennen mehrere Athleten betreuen, Plaene erstellen, Fortschritte beobachten und Feedback geben.

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
- Berechtigungen werden frueh als Konzept vorgesehen
- Analysefunktionen werden als wiederverwendbare Services geplant

### Phase 3: Sportlerbereich

Ziel: Vereinfachter Modus fuer juengere oder weniger datenorientierte Sportler.

Erweiterungen:

- reduzierte Eingabemasken
- gefuehrte Trainingsdokumentation
- einfache Fortschrittsanzeigen
- motivierende Zielerreichung
- optionaler Trainerzugriff

Technische Vorbereitung:

- UI-Varianten duerfen nicht zu Datenmodell-Varianten fuehren
- Komplexitaet wird ueber Rollen, Views und Feature Flags gesteuert
- Kernobjekte wie Training, Wettkampf und Ziel bleiben dieselben

### Phase 4: Vereinsbereich

Ziel: Vereine koennen Athleten, Trainer, Gruppen, Material und Termine organisieren.

Erweiterungen:

- Club-Organisation
- Rollen und Rechte
- Gruppen und Teams
- gemeinsamer Kalender
- Vereinsmaterial
- Export und Reporting

Technische Vorbereitung:

- Organisationszugehoerigkeit wird als spaeteres Ownership-Modell vorgesehen
- Material kann perspektivisch privat oder vereinsbezogen sein
- Kalenderdaten bleiben generisch genug fuer Training, Wettkampf und Vereinsevents

## Empfohlene technische Zielarchitektur

Die Plattform sollte als moderne Web-App mit klarer Trennung zwischen UI, Domain-Logik und Datenzugriff aufgebaut werden.

Empfohlener Stack fuer den Projektstart:

- Frontend: React mit TypeScript
- App Framework: Next.js oder Vite, abhaengig von Hosting- und Backend-Entscheidung
- Styling: Tailwind CSS oder ein leichtes Design-System auf CSS-Variablen
- Backend: zunaechst API-Schicht mit klaren Domain-Services
- Datenbank: PostgreSQL
- ORM: Prisma oder Drizzle
- Authentifizierung: rollenfaehig, auch wenn V1 nur Athleten nutzt
- Tests: Unit-Tests fuer Domain-Logik, Integrationstests fuer Datenzugriff, UI-Tests fuer Kernflows

Noch offen vor Implementierungsstart:

- Soll die App serverseitig gerendert werden oder als reine SPA starten?
- Soll Authentifizierung direkt eingebaut oder fuer einen Prototyp simuliert werden?
- Soll lokal zuerst mit Mock-Daten oder sofort mit Datenbank entwickelt werden?
- Wird Offline-Nutzung am Trainingsort in V1 gebraucht?

## Modulgrenzen

### Dashboard

Das Dashboard aggregiert Daten, besitzt aber moeglichst wenig eigene Fachlogik.

Abhaengigkeiten:

- liest Training
- liest Wettkaempfe
- liest Ziele
- liest Materialhinweise
- liest Analyse-Summaries

Regel:

Dashboard-Komponenten duerfen keine Trainings- oder Analyseberechnung selbst implementieren.

### Training

Training ist eine Kerndomaene.

Enthaelt:

- Trainingseinheiten
- Trainingslaeufe
- Bedingungen
- Belastung
- technische Schwerpunkte
- Notizen

Spaetere Erweiterung:

- Trainerfeedback
- Trainingsplaene
- Videoanalyse
- Abschnittszeiten
- Sensorwerte

### Wettkaempfe

Wettkaempfe sind eine eigene Kerndomaene, auch wenn sie aehnliche Daten wie Training enthalten.

Enthaelt:

- Wettkampftermine
- Runden
- Ergebnisse
- Platzierungen
- Ziele und Learnings
- eingesetztes Material

Spaetere Erweiterung:

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

Material ist eine eigenstaendige Domaene, nicht nur ein Freitextfeld.

Enthaelt:

- Ausruestungsgegenstaende
- Zustand
- Wartung
- Setup-Notizen
- Verwendung in Training und Wettkampf

Spaetere Erweiterung:

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

Spaetere Erweiterung:

- Trainerfreigabe
- Zielvorschlaege
- Meilensteine
- Rueckblick pro Saison

## Domaenenmodell: Erweiterbare Ownership

Jedes zentrale Objekt sollte langfristig eindeutig zuordenbar sein.

V1:

- athleteId als primaerer Besitzer

Spaeter:

- coachId fuer Trainerkontext
- clubId fuer Vereinskontext
- visibility fuer Freigaben
- createdBy und updatedBy fuer Nachvollziehbarkeit

Empfohlene Basiseigenschaften fuer zentrale Entitaeten:

- id
- createdAt
- updatedAt
- athleteId
- createdBy
- updatedBy

Bei spaeter gemeinschaftlich genutzten Objekten:

- clubId
- ownerType
- ownerId
- visibility

## Rollenmodell

Auch wenn V1 nur Athleten adressiert, sollte das Rollenmodell frueh mitgedacht werden.

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
- zentrale Typen fuer Domaenenobjekte
- keine doppelten Berechnungen in mehreren Komponenten
- keine direkten Datenbankdetails in UI-Code

## Teststrategie

Mindeststandard fuer neue Funktionen:

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

## Qualitaetsregeln

- TypeScript strikt verwenden
- fachliche Typen statt lose Strings
- Validierung fuer Nutzereingaben
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
