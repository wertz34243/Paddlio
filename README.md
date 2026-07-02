# Paddlio

Paddlio ist eine moderne Trainings- und Wettkampfplattform fuer Kanuslalom.

**Train. Analyze. Improve.**

Version 1.0 richtet sich an Athletinnen und Athleten. Paddlio kombiniert Training, Wettkaempfe, Analyse, Material, Profil, persoenliche Rekorde und regelbasierte Athlete Intelligence in einer mobilen Web-App.

## Datenschutz und Demo-Auth

Paddlio speichert Daten in der aktuellen Version lokal im Browser per LocalStorage. Die lokale Demo-Authentifizierung ist fuer Entwicklung, Tests und Produktvalidierung gedacht, aber nicht fuer produktive sensible Vereins-, Trainer- oder Gesundheitsdaten geeignet. Fuer echte Vereins- und Trainer-Nutzung ist eine Cloud-Speicherung mit serverseitiger Authentifizierung und Rechtepruefung erforderlich.

## Version 1.5 - QA & Stabilitaet

- Robustere lokale Auth- und LocalStorage-Schicht mit In-Memory-Fallback, falls Browser-Speicher kurzzeitig nicht verfuegbar ist
- Gespeicherte App-Daten werden beim Laden und Speichern konsequent an den eingeloggten Nutzer und dessen Athletenprofil gebunden
- Leere Zustaende fuer Wettkaempfe und Material verbessert
- Mobile Layout-Haertung fuer Header, Bottom Navigation, Safe Area, Karten, lange Texte und kleine Screens
- Sichtbare Beispiel-/Alttexte weiter bereinigt, damit neue Nutzer eine leere, eigene App sehen

## Version 1.6 - Cross-Platform PWA

- Web App Manifest fuer iPhone, iPad, Android, Windows und moderne Desktop-Browser
- Standalone-Display, Dark-Mode Theme Color, maskable Icon, Apple Touch Icon und Windows Tile-Metadaten
- Service Worker als Offline-Grundlage fuer App-Shell und Offline-Fallback
- Verbesserte Safe-Area-Unterstuetzung fuer installierte iOS/iPadOS Apps

## Version 1.7 - Mobile Layout Feinschliff

- Home startet ohne grossen globalen Header direkt mit Begruessung, Tagesinfo und den wichtigsten Karten
- Unterseiten nutzen einen kompakten Header, der beim Scrollen normal aus dem Sichtbereich verschwindet
- Logout ist in die Einstellungen verschoben und nicht mehr prominent auf dem Dashboard
- Bottom Navigation ist flacher, sicherer fuer iPhone-Safe-Areas und verdeckt weniger Inhalt
- Mobile Abstaende, Home-Hero und Sticky-Aktionen wurden fuer mehr sichtbaren Inhalt gestrafft
- Athletenprofil fachlich fuer Kanuslalom geschaerft: K1/C1-Auswahl, Altersklasse, C1-Paddelseite und Migration alter Profildaten

## Version 1.8 - Profil QA & Mobile Feinschliff

- Bootsklassen im Profil sind echte Checkbox-Karten fuer K1, C1 und K1 + C1
- C1-Profile muessen explizit eine Paddelseite Links/Rechts speichern, K1-only blendet das Feld aus
- Profilkarte, Altersklasse und Bootsklassen-Anzeige wurden fuer iPhone, iPad und Desktop gehaertet
- Speichern-Bereich und Formularfelder haben mehr Luft zur Bottom Navigation und Safe Area

## Version 2.0 - Coach Foundation

- Rollen-System fuer Athlete, Coach, TeamAdmin und Admin mit automatischer Admin-Rolle fuer `T.Kanu@outlook.com`
- Einladungscodes fuer Coach, TeamAdmin und Athlete im lokalen Demo-Auth-System
- Erster Coach/Admin-Bereich mit Dashboard, Sportlerverwaltung, Gruppenverwaltung, Trainingszuweisung und Sportler-Vorschau
- Coach-Daten werden pro eingeloggtem Nutzer im bestehenden `paddlio_data_<userId>` LocalStorage getrennt gespeichert

## Version 2.1 - Benutzerverwaltung & Einladungen

- Oeffentliche Registrierung entfernt: neue Nutzer aktivieren ihr Konto nur noch mit Einladungscode und Passwort
- Admins und berechtigte Coaches koennen Einladungen fuer Athlete und Coach erstellen; echte E-Mail-Zustellung ist architektonisch vorbereitet
- Einladungen werden lokal mit Status `offen`, `angenommen` oder `abgelaufen` gespeichert und beim Annehmen automatisch in Benutzerkonten migriert
- Neue Admin-/Coach-Benutzerverwaltung mit Suche, Rollenfilter, Sortierung, Gruppen-Zuweisung, Statusverwaltung und Admin-Loeschfunktion
- Datenschutzregeln geschaerft: Athleten sehen eigene Daten, Coaches nur Athleten aus Verein/Gruppen, Admins alle lokalen Benutzer
- LocalStorage-Struktur: `paddlio_users`, `paddlio_session`, `paddlio_invitation_codes`, `paddlio_data_<userId>`

## Version 2.2 - Registrierung & Traineranfrage

- Oeffentliche Registrierung fuer alle Sportler mit Vorname, Nachname, E-Mail, Passwort, Verein und Datenschutz-Bestaetigung
- Neue Nutzer erhalten automatisch die Rolle `Athlete`; Trainerrechte werden nicht mehr per Registrierung oder Einladung vergeben
- Admin-E-Mail `T.Kanu@outlook.com` wird beim Laden/Login weiterhin automatisch als `Admin` normalisiert
- Profilbereich `Trainerstatus`: Athleten koennen eine Traineranfrage mit Lizenz, Qualifikation, Telefon und Nachricht absenden
- Adminbereich `Traineranfragen`: Admin kann Anfragen genehmigen oder ablehnen; Genehmigung setzt die Rolle `Coach`
- Benutzerverwaltung zeigt Rollen, Status und Verein; Adminrechte koennen nicht per UI vergeben werden
- LocalStorage vorbereitet fuer Plattformbetrieb: `paddlio_users`, `paddlio_sessions`, `paddlio_trainer_requests`, `paddlio_data_<userId>`

## Version 2.3 - Individuelle Saisonziele & Leistungsentwicklung

- Saisonziele sind nicht mehr fest im Code hinterlegt, sondern werden pro Nutzer in `paddlio_data_<userId>` gespeichert
- Neue Zielverwaltung mit Erstellen, Bearbeiten, Loeschen, Status, Prioritaet, Zeitraum, Kategorie und Notizen
- Automatische Fortschrittsberechnung fuer K1-Bestzeit, C1-Bestzeit, Strafschnitt, Trainingseinheiten und Trainingsminuten
- Manuelle Ziele fuer Technik, persoenliche Entwicklung und Coach-Feedback vorbereitet
- Dashboard zeigt individuelle Ziele oder einen leeren Zustand, wenn noch keine Ziele angelegt wurden
- Datenmodell `SeasonGoal` enthaelt `ownerUserId` und `assignedByUserId` als Grundlage fuer Coach-, Team- und Cloud-Funktionen

## Version 2.4 - Vereinsverwaltung

- Admins verwalten offizielle Vereine mit Kurzname, Stadt, Kontaktdaten, Farben, Status und moderner Kartenansicht
- Registrierung bietet eine Vereinsauswahl oder speichert neue Vereine als Vorschlag fuer die Admin-Pruefung
- Vereinsvorschlaege koennen angenommen, abgelehnt oder bearbeitet und angenommen werden; angenommene Vereine werden in `paddlio_clubs` gespeichert
- Bestehende Freitext-Vereine werden als Vereinsvorschlaege migriert, ohne Nutzerdaten zu loeschen
- Coach Dashboard zeigt den eigenen Verein, Sportler im Verein, Gruppen im Verein und offene Rueckmeldungen
- LocalStorage-Struktur erweitert um `paddlio_clubs` und `paddlio_club_requests`

## Version 2.5 - Trainingsgruppen & Sportlerverwaltung

- Coach Dashboard erweitert um die Karte `Meine Trainingsgruppen` mit Sportlern, Gruppen, Wochen-Trainings und offenen Rueckmeldungen
- Trainingsgruppen haben jetzt Club-Zuordnung, Coach-Zuordnung, Altersklasse, Bootsklassen, Trainingsfokus, Farbe und Status
- Coach-Sportlerverwaltung mit Suche, Filter, Tabellenansicht, Einladungsoffen-Status und Mehrfachzuweisung zu Gruppen
- Sportlerprofil fuer Coaches zeigt Verein, Gruppen, Ziele, Trainings, Wettkampf-/Material-/Journal-Platzhalter und Trainernotizen
- Bestehende Coach-Gruppen und Coach-Sportler werden beim Laden in die neue 2.5-Struktur migriert
- Coaches sehen weiterhin nur Sportler und Gruppen ihres Vereins; Admins sehen alles

## Version 2.6 - Trainingsplanung & Kalender

- Trainingsplan ist jetzt ein Kalender mit Tagesansicht, Wochenansicht, Monatsuebersicht und Listenansicht
- Trainings koennen fuer sich selbst, einzelne Sportler oder Trainingsgruppen geplant werden
- PlanItem-Datenmodell erweitert um Owner, Club, Zuweisungstyp, Sportler-/Gruppenlisten, Bootsklasse, Wiederholung und neue Statuswerte
- Wiederkehrende Trainings erzeugen beim Speichern mehrere einzelne Kalendereintraege bis zum Wiederholungsdatum
- Sportler koennen Trainings erledigen, auslassen und Feedback mit Gefuehl, Schwierigkeit, Muedigkeit, Motivation, Schlaf und Kommentar speichern
- Kalenderfilter fuer Zeitraum, Bereich, Bootsklasse, Intensitaet, Status, Sportler und Gruppe
- Dashboard und Analyse nutzen die neue Planstruktur weiterhin aus `paddlio_data_<userId>`, ohne bestehende Daten zu loeschen

## Version 2.6.1 - Trainingsvorlagen & Planungsassistent

- Trainingsbibliothek mit privaten Vorlagen und Vereinsvorlagen fuer Coach/Admin ergaenzt
- Vorlagen koennen erstellt, bearbeitet, geloescht, favorisiert und direkt fuer Trainingsplanung genutzt werden
- Trainings koennen einzeln, wochenweise oder als Zeitraum/Trainingsblock kopiert werden
- Wiederkehrende Trainings unterstuetzen taeglich, woechentlich, alle 2 Wochen, monatlich und eine maximale Terminanzahl
- Trainingsvorlagen werden im bestehenden `paddlio_data_<userId>` LocalStorage gespeichert, ohne vorhandene Trainingsdaten zu loeschen

## Version 2.7 - Rollen, Rechte, QA & Cloud Readiness

- Gemeinsame Access-Control-Logik fuer Athlete, Coach, TeamAdmin und Admin ergaenzt
- Dashboard, Coach-Bereich und Trainingskalender filtern Daten rollen-, user- und vereinsbasiert
- Trainingsplanung prueft Zuweisungen jetzt gegen den erlaubten Coach-/Admin-Scope und zeigt freundliche Formularmeldungen
- Version und Service-Worker-Cache auf 2.7 aktualisiert
- Cloud-Readiness-Dokumentation fuer Supabase/Firebase, Serverrechte und LocalStorage-Abloesung ergaenzt

## Version 3.0.1 - Supabase Datenbank-Fundament

- Supabase-Projektstruktur vorbereitet: `src/lib/supabase.ts`, `src/lib/database.types.ts`, `supabase/migrations`
- Erste Supabase-Migration mit Tabellen fuer Profile, Vereine, Traineranfragen, Gruppen, Ziele, Trainingsplanung, Feedback, Wettkaempfe, Material, Benachrichtigungen und Audit-Logs
- Row Level Security und erste rollenbasierte Policies fuer Athlete, Coach, TeamAdmin und Admin vorbereitet
- App bleibt ohne Supabase-Environment-Variablen voll LocalStorage-faehig und stuerzt nicht ab
- Setup-Dokumentation fuer lokale Entwicklung und Vercel ergaenzt

## Version 3.0.2 - Supabase Auth & Cloud Integration

- Supabase Auth Provider fuer Registrierung, Login, Logout, Session-Wiederherstellung und Passwort-Reset
- Profile, Vereine, Benutzer, Trainingsgruppen und Traineranfragen werden aus Supabase geladen und in den lokalen Cache synchronisiert
- Rollen kommen aus dem Cloud-Profil; Admin-E-Mail `T.Kanu@outlook.com` wird per Datenbank-Trigger vorbereitet
- Cloud Status zeigt verbunden, synchronisiert oder Offline-Modus; Admins sehen synchronisierte Datensaetze
- LocalStorage bleibt als Offline-Cache erhalten, bis Trainings, Ziele, Wettkaempfe und Material in 3.0.3 in die Cloud wandern

## Paddlio auf iPhone/iPad installieren

1. Paddlio in Safari oeffnen.
2. Teilen-Button antippen.
3. `Zum Home-Bildschirm` waehlen.
4. Name `Paddlio` bestaetigen und `Hinzufuegen` antippen.

Paddlio startet danach als eigenstaendige App im Dark-Mode Look mit iOS-Statusleiste.

## Paddlio auf Android installieren

1. Paddlio in Chrome oeffnen.
2. Im Browsermenue `App installieren` oder `Zum Startbildschirm hinzufuegen` waehlen.
3. Installation bestaetigen.

Chrome nutzt das Manifest, die 192x192-/512x512-Icons und den Standalone-Modus.

## Paddlio auf Windows installieren

1. Paddlio in Microsoft Edge oeffnen.
2. In der Adressleiste oder im Menue `Apps` die Option `Diese Website als App installieren` waehlen.
3. Installation bestaetigen.

Edge verwendet Manifest, Theme Color und Windows Tile-Metadaten.

## Milestone 1.0

- Athlete Intelligence Dashboard mit Tagesfokus, Trainingsserie, Athletenstatus und Countdown
- Paddlio Coach mit regelbasierten Empfehlungen aus Training, Wettkaempfen, Zielen und Journal
- Trainingstagebuch mit persoenlichem Journal nach jeder Einheit
- Trainingsplanung mit Wochenuebersicht, Status, Intensitaet und Fokus
- Wettkaempfe mit Timeline, Laufzeiten, Strafsekunden und Gefuehl
- Analyse mit Trends, Verteilungen, K1/C1-Vergleich und Trainingsumfang
- Ziele-Seite mit Saisonfortschritt und persoenlichen Profilzielen
- Persoenliche Rekorde fuer K1, C1, Strafsekunden, Trainingsserie und Saisonwerte
- Saisonuebersicht mit Monatswerten, Trainingsminuten, Belastung und Bestzeiten
- Materialverwaltung fuer Boote, Paddel und Zubehoer
- Athletenprofil mit Sportdaten, Zielen, Profilbild und Einstellungen
- Datenpersistenz im Browser ueber LocalStorage

## Technik

- React
- Vite
- TypeScript
- CSS
- LocalStorage

## Entwicklung starten

Voraussetzung: Node.js und npm.

```bash
npm install
npm run dev
```

Die App ist lokal normalerweise unter `http://localhost:5173` erreichbar.

## Produktions-Build

```bash
npm run build
npm run preview
```

Der Build wird in `dist/` erzeugt.

## Deployment mit Vercel

Das Projekt ist fuer Vercel vorbereitet.

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Die Datei `vercel.json` enthaelt die passenden Build- und SPA-Rewrite-Einstellungen.

### Supabase Environment Variablen

Fuer spaetere Cloud-Funktionen werden diese Variablen vorbereitet:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Keine echten Keys in Git committen. Lokal gehoeren die Werte in `.env.local`. In Vercel werden sie unter `Project Settings` -> `Environment Variables` eingetragen, danach muss ein Redeploy erfolgen. Ohne diese Werte bleibt Paddlio im LocalStorage-Modus.

## Datenhaltung

Paddlio speichert Daten lokal im Browser. Bestehende LocalStorage-Daten werden beim Laden normalisiert und migriert, damit fruehere Daten nicht verloren gehen. Alte interne Migrationsnamen bleiben deshalb bewusst im Code erhalten.

Ab Version 3.0.2 nutzt Paddlio Supabase Auth als primaere Anmeldung. Profil-, Vereins-, Benutzer-, Gruppen- und Traineranfrage-Daten werden aus Supabase geladen und lokal gecacht. Wenn keine Verbindung besteht, bleibt der letzte Cache nutzbar.

## Release-Check 1.0

- TypeScript-Build erfolgreich
- Vite-Produktionsbuild erfolgreich
- LocalStorage-Migration vorhanden
- Mobile-first Layout geprueft
- Vercel-Build-Konfiguration vorhanden
- Keine sichtbaren alten Brand-Namen

## Produktunterlagen

- [V1 Product Brief](docs/v1-product-brief.md)
- [Architecture](docs/architecture.md)
- [Cloud Readiness](docs/cloud-readiness.md)
- [Supabase Setup](docs/supabase-setup.md)
