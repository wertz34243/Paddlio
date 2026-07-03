# Paddlio

Paddlio ist eine moderne Trainings- und Wettkampfplattform fuer Kanuslalom.

**Train. Analyze. Improve.**

Version 1.0 richtet sich an Athletinnen und Athleten. Paddlio kombiniert Training, Wettkaempfe, Analyse, Material, Profil, persoenliche Rekorde und regelbasierte Athlete Intelligence in einer mobilen Web-App.

## Datenschutz und Auth

Paddlio nutzt Supabase Auth fuer Registrierung, Login, Logout und Session-Wiederherstellung. App-Daten werden in Supabase gespeichert und lokal nur als Offline-/Performance-Cache gehalten. Rollen duerfen nicht aus Formularwerten entstehen: neue Konten starten immer als `Athlete`, Coach-, TeamAdmin- und Admin-Rechte werden ausschliesslich im Adminbereich beziehungsweise direkt in Supabase durch berechtigte Admins vergeben.

Wenn Supabase Auth `email rate limit exceeded` meldet, hat das Projekt zu viele E-Mail-/Registrierungsanfragen in kurzer Zeit erzeugt. Ein Browser-Client darf dieses Limit ohne serverseitigen Admin-Schluessel nicht umgehen. Fuer produktive Tests sollten in Supabase Auth die unten dokumentierten E-Mail- und Rate-Limit-Einstellungen passend gesetzt werden.

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

- Rollen-System fuer Athlete, Coach, TeamAdmin und Admin mit vorbereitetem Adminbereich
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
- Neue Nutzer erhalten ausschliesslich `Athlete`; Admin- und Coach-Rechte werden nur durch Adminentscheidung vergeben
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

## Version 3.2 - Trainingsplanung 2.0 & Coach Workflow

- Trainingsplanung bekommt eine rollenabhaengige Workflow-Navigation fuer Coach/Admin und Athlete
- Coach/Admin arbeiten mit Heute, Woche, Monat, Vorlagen, Gruppen und Rueckmeldungen
- Athleten sehen Heute, Diese Woche, Kommende Einheiten, Erledigt und Rueckmeldung
- Trainings koennen weiterhin aus Vorlagen geplant, einzeln kopiert, wochenweise kopiert oder als Trainingsblock kopiert werden
- Gruppenansicht zeigt Trainingsgruppen, Sportlerzahl, Wochenplan-Sprung und direkte Planungsaktion
- Rueckmeldungsansicht buendelt offene und gespeicherte Feedbacks fuer Coach Workflow und Trainingstagebuch
- Supabase-Migration `0006_training_planning_2_0.sql` ergaenzt Indizes und Realtime-Vorbereitung fuer Trainingsplanung, Feedback und Vorlagen

## Version 3.3 - Live-Synchronisierung, Benachrichtigungen & Offline-Queue

- Zentraler Realtime-Service fuer Trainings, Feedback, Ziele, Notifications, Gruppen, Gruppenzuordnungen und Profile
- Notification Center im Mehr-Bereich unter `Updates` mit ungelesenen Karten und Markieren-als-gelesen
- Automatische Benachrichtigungen fuer zugewiesene Trainings und eingehendes Feedback
- Offline-Queue fuer Insert/Update/Delete-Aenderungen mit Retry-Zaehler und automatischem Flush beim Onlinegehen
- CloudStatus zeigt Synchronisiert, Synchronisiert..., Offline, Wartende Aenderungen und Cloud Fehler
- Dokumentation: `docs/realtime-and-offline-sync.md`
- Supabase-Migration `0007_realtime_notifications_offline_sync.sql` ergaenzt Notification-Felder, Indizes, Policies und Realtime-Publication

## Version 3.4 - Wettkampfportal & Ergebnisverwaltung

- Wettkampfbereich ist ein Portal mit Meine Wettkaempfe, Ergebnisse, Bestzeiten, Saisonstatistik und Coach/Admin-Ansicht
- Wettkaempfe speichern Name, Ort, Datum, Veranstalter, Strecke, Ebene und Notizen
- Ergebnisse speichern Bootsklasse, beide Laufzeiten, Strafsekunden, Platz, Starterfeld, Abstand, Gefuehl und Notiz
- Automatische Kennzahlen: Lauf-Gesamtzeiten, beste Gesamtzeit, Strafschnitt und Trend gegen vorheriges Ergebnis
- Bestzeiten nach Bootsklasse und Strecke sowie Monats-/Saisonstatistik
- Import vorbereitet ueber `source`, `external_id` und `source_url` fuer spaetere canoeslalom.net-Anbindung
- Supabase-Migration `0008_competition_portal_results.sql` ergaenzt Portal-Felder, Indizes und Realtime-Publication

## Version 3.5 - Analysezentrum & Leistungsentwicklung

- Analysebereich ist ein Analysezentrum mit Uebersicht, Training, Wettkampf, Ziele, Belastung, K1/C1, Coach Analyse und Admin Uebersicht
- Zeitraumfilter fuer 7, 30, 90 Tage, Saison, Jahr und eigenen Zeitraum
- Trainingsanalyse mit Minuten, Statusquote, Trainingsbereichen, Intensitaet, Ausfallquote und Feedbackquote
- Wettkampfanalyse mit Bestzeiten, Strafschnitt, Platzierung/Abstand und K1/C1-Differenzen
- Zielanalyse mit Fortschritt, Zielquote, Status und Fortschrittsbalken
- Regelbasierte Belastungsanalyse mit sportlichen Empfehlungen ohne medizinische Aussage
- Dokumentation: `docs/analytics-center.md`

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
- Rollen kommen aus dem Cloud-Profil; neue Registrierungen starten immer als `Athlete` und erzeugen eine Admin-Benachrichtigung
- Cloud Status zeigt verbunden, synchronisiert oder Offline-Modus; Admins sehen synchronisierte Datensaetze
- LocalStorage bleibt als Offline-Cache erhalten, bis Trainings, Ziele, Wettkaempfe und Material in 3.0.3 in die Cloud wandern

## Version 3.0.3 - Cloud Data Migration & Live Synchronisierung

- Automatische Erst-Migration lokaler Daten in Supabase mit Migrationsmarkierung pro Nutzer
- Cloud-Services fuer Training, Feedback, Trainingsvorlagen, Ziele, Wettkaempfe, Material, Notifications, Migration und Sync
- Supabase Realtime aktualisiert Training, Feedback, Ziele, Traineranfragen und Profile ohne manuellen Reload
- Offline Queue `paddlio_sync_queue` speichert Aenderungen lokal und synchronisiert beim Onlinegehen
- LocalStorage bleibt Cache, Supabase ist fuer migrierte App-Daten der Hauptspeicher

## Version 3.1 - Vereins- und Teamverwaltung

- Adminbereich verwaltet Vereine, Vereinsvorschlaege, Mitglieder, Rollen, Status und Traineranfragen ueber Supabase
- Coach-Bereich nutzt Supabase fuer eigene Vereinsmitglieder, Trainingsgruppen und Gruppenzuordnungen
- Neue Nutzer bleiben immer `Athlete`; Coach-, TeamAdmin- und Admin-Rechte werden ausschliesslich administrativ vergeben
- RLS-Policies und Foreign Keys fuer `club_requests`, `trainer_requests`, `training_groups` und `group_members` ergaenzt
- Reparatur-/Update-Migration: `PADDLIO_3_1_CLUB_TEAM_MANAGEMENT.sql`

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

### Supabase Einrichtung

Paddlio ist auf dieses Supabase-Projekt vorbereitet:

- Projekt-ID: `twlkhfbrrwjwppxinmpn`
- Project URL: `https://twlkhfbrrwjwppxinmpn.supabase.co`

Die Project URL ist im Supabase Client als fester Default hinterlegt. Fuer Registrierung, Login, Passwort-Reset und Cloud-Sync muss nur noch der Publishable Key gesetzt werden:

```env
VITE_SUPABASE_URL=https://twlkhfbrrwjwppxinmpn.supabase.co
VITE_SUPABASE_ANON_KEY=<Publishable Key>
```

Keine echten Keys in Git committen. Lokal gehoert der Key in `.env.local`; `.env.example` zeigt die benoetigten Namen. In Vercel wird `VITE_SUPABASE_ANON_KEY` unter `Project Settings` -> `Environment Variables` fuer Production, Preview und Development eingetragen, danach muss ein Redeploy erfolgen. Fehlt der Key, startet Paddlio ohne Absturz und zeigt den Hinweis: `Bitte VITE_SUPABASE_ANON_KEY in Vercel oder .env.local eintragen.`

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
- [Cloud Sync](docs/cloud-sync.md)
