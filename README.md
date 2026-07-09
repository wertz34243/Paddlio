# Paddlio

Paddlio ist eine moderne Trainings- und Wettkampfplattform für Kanuslalom.

**Train. Analyze. Improve.**

Version 4.1.3 ist der Schema-Sync- und Encoding-Hotfix auf Basis des Dark-Water-Performance-Designs. Paddlio kombiniert Training, Wettkämpfe, Analyse, Material, Profil, Kommunikation, Verein, Aufgaben, Anwesenheit, Beta-Feedback und regelbasierte Athlete Intelligence in einer mobilen Web-App.

## Datenschutz und Auth

Paddlio nutzt Supabase Auth für Registrierung, Login, Logout und Session-Wiederherstellung. App-Daten werden in Supabase gespeichert und lokal nur als Offline-/Performance-Cache gehalten. Rollen dürfen nicht aus Formularwerten entstehen: neue Konten starten immer als `Athlete`, Coach-, TeamAdmin- und Admin-Rechte werden ausschließlich im Adminbereich beziehungsweise direkt in Supabase durch berechtigte Admins vergeben.

Wenn Supabase Auth `email rate limit exceeded` meldet, hat das Projekt zu viele E-Mail-/Registrierungsanfragen in kurzer Zeit erzeugt. Ein Browser-Client darf dieses Limit ohne serverseitigen Admin-Schluessel nicht umgehen. Für produktive Tests sollten in Supabase Auth die unten dokumentierten E-Mail- und Rate-Limit-Einstellungen passend gesetzt werden.

## Version 4.1.3 - Schema Sync and Encoding Hotfix

- Neue zentrale Supabase-Migration `0016_schema_sync_413.sql`.
- Fehlende optionale Tabellen für Kommunikation, Verein, Beta, Ergebnisse, externe Trainings, Material, Boote und Smart Coach werden idempotent angelegt.
- `competitions.organizer` wird ergänzt.
- CloudStatus meldet optionale Modulfehler als `Cloud eingeschränkt`.
- App bleibt mit lokalem Cache nutzbar, wenn optionale Supabase-Module fehlen oder langsam sind.

## Version 4.1.2 - Cloud Sync and Encoding Fix

- Profil-Sync-Timeouts werden als eingeschränkter Cloud-Zustand behandelt, nicht als kompletter App-Fehler.
- App bleibt mit lokalem Cache nutzbar, wenn `profiles` langsam oder temporaer nicht lesbar ist.
- Neue Supabase-Migration `0015_profile_sync_rls_hotfix.sql` erlaubt eingeloggten Nutzern eigenes Profil lesen, erstellen und aktualisieren.
- CloudStatus unterscheidet jetzt `Cloud eingeschränkt` von `Cloud Fehler`.
- Bottom-Navigation besitzt eindeutige Accessibility-Labels.

## Version 4.1.1 - Beta Stabilisierung Hotfix

- Startup zeigt lokalen Cache sofort und synchronisiert Supabase nachgelagert.
- Auth-, Profil- und optionale Cloud-Reads sind mit Timeouts/Fallbacks abgesichert.
- Neue idempotente Migration `0014_beta_stabilization_hotfix.sql` ergänzt fehlende optionale Tabellen und `competitions.organizer`.
- Wochentagslogik für reine Datumswerte nutzt Europe/Berlin ohne UTC-Verschiebung.
- Analyse- und Tabellenbereiche sind gegen horizontalen Overflow gehärtet.
- Heute-Seite hat ein sichtbares `h1`.
- Wiederholte Dashboard-Buttons haben eindeutige Accessibility-Labels.
- Sichtbare deutsche Texte wurden mit Umlauten geglaettet.

## Version 4.1.0 - Dark Water Performance Design

Paddlio 4.1 ist ein Design- und UX-Release ohne großes neues Fachfunktionspaket.

- Dark Water Performance Design mit dunklem Wasserlook, Cyan-Akzenten und ruhigeren Karten
- Bottom Navigation bleibt mobil bei Heute, Training, Analyse, Kommunikation und Mehr
- Heute-Ansicht zeigt die wichtigsten Tagesinformationen schneller und mit weniger visueller Unruhe
- Karten, Buttons, Badges, Empty States, Error/Offline States und Chat-Flächen sind einheitlicher gestaltet
- Kommunikation, Training, Analyse, Ergebnisse, Profil/Einstellungen und Admin/Beta-Bereiche wurden optisch geglaettet
- PWA Theme Color wurde an das dunklere App-Gefühl angepasst

Geplante nächste Schritte: 4.2 Excel Import, 4.3 Paddlio Academy, 4.4 Technik-Check nach DKV Manual, 4.5 Trainingsvorlagen aus Ausbildungs- und Technikmanual.

## Version 4.0.0-beta - Beta Test Release

Paddlio ist jetzt für eine kontrollierte Beta-Testphase vorbereitet. Version 4.0 fügt keine großen neuen Produktbereiche hinzu, sondern stabilisiert Navigation, Feedback, Beta-Check, Tester-Dokumentation und mobile Bedienung.

- Beta-Modus sichtbar mit `Paddlio Beta` und Version `4.0.0-beta`
- Bottom Navigation mobil reduziert auf Heute, Training, Analyse, Kommunikation und Mehr
- Feedback-System für alle eingeloggten Nutzer mit Kategorie, Priorität, Rolle, Version und Geräteinfo
- Admin kann Feedback auswerten und Beta-Tester verwalten
- Beta-Check erweitert um System, Rollen, Funktionen, Mobile, Feedback und Datenschutz/RLS
- Beta-Test Anleitung und bekannte Beta-Grenzen direkt in der App unter `Mehr`
- Neue Supabase-Migration `0013_beta_test_release.sql` für `beta_feedback` und `beta_testers`

Bekannte Grenzen der Beta: Polar Sync, Excel Import, Videoanalyse, Paddlio Academy, native Pushs und das große Design-Redesign sind vorbereitet oder geplant, aber nicht Teil von 4.0.

## Version 3.9 - Results, Polar Sync & Beta Readiness

- Ergebnisverwaltung erweitert um Laufdetails, Abstaende, Quellen, Trainerkommentar und automatische Bestzeiten
- Neues Wettkampfsegment `Ergebnisanalyse` mit Bestzeiten, Strafschnitt, Bootsklassenverteilung und Saisonvergleich-Grundlage
- Importbereich für CSV, Excel, PDF und Web-Quellen vorbereitet, ohne fragile Scraper zu erzwingen
- Integrationen-Bereich für Polar Flow vorbereitet; echte OAuth-Aktivierung muss später über Backend oder Supabase Edge Functions erfolgen
- Externe Trainingseinheiten, Trainingsbelastung und Verknuepfung mit Paddlio-Trainings vorbereitet
- Smart Coach erkennt jetzt externe unverknuepfte Trainings, Ergebnisverbesserungen, lange Ergebnispausen und Belastungsspruenge
- Admin-Bereich `Beta-Check` mit Checkliste für Supabase, Rollen, Gruppen, Training, Kommunikation, Ergebnisse, Mobile und RLS
- Supabase-Migration `0012_results_polar_beta_readiness.sql` ergänzt Ergebnisfelder, `personal_bests`, `result_imports`, `external_connections`, `external_training_sessions` und `beta_readiness_checks`

Polar-Hinweis: Paddlio speichert keine echten Polar-Secrets im Frontend. `VITE_*` Variablen dürfen nur oeffentliche Werte enthalten. Sichere Token-Verarbeitung gehört in eine Supabase Edge Function oder ein separates Backend.

## Version 3.8 - Communication & Team System

- Neues Kommunikationsmodul unter `Mehr > Kommunikation`
- Direktnachrichten, Gruppenchats, Vereinsnews, Aufgaben, Anwesenheit und Datei-Anhaenge vorbereitet
- Dashboard zeigt neue Nachrichten, Gruppenaktivitaet, offene Aufgaben, offene Anwesenheit und aktuelle Vereinsnews
- Supabase-Migration `0011_communication_team_system.sql` erstellt Kommunikationstabellen, RLS-Policies und bereitet den Storage-Bucket `paddlio-files` vor
- Offline-Queue-Fallback für Nachrichten, Aufgaben, Anwesenheit und Anhang-Metadaten

## Version 3.7 - Vereinsportal & Organisationsmanagement

- Neuer Hauptbereich `Verein` für Coach, ClubAdmin und Admin
- Vereinsdashboard mit Mitgliederzahl, Trainern, Gruppen, Trainings, Wettkämpfen, Material und Vereinszielen
- Mitglieder-, Trainer- und Gruppenübersichten für den eigenen Verein
- Vereinsmaterial und Bootsverwaltung mit Inventar-, Zustands- und Besitzerfeldern
- Vereinskalender für Training, Wettkampf, Sitzungen, Vereinsfeiern und Arbeitseinsätze
- Dokument-Metadaten, Vereinsnachrichten und Vereineinstellungen vorbereitet
- Neue Supabase-Migration `0010_club_management_portal.sql` mit RLS für die Vereinsportal-Tabellen

## Version 3.6 - Smart Coach & Trainingsintelligenz

- Neuer Smart-Coach-Bereich im Analysezentrum mit regelbasierten Empfehlungen für Training, Regeneration, Technik, Ausdauer, Wettkampf, Ziele, Material und Motivation
- Home zeigt die drei wichtigsten persönlichen Hinweise direkt als Karte `Dein Smart Coach`
- Coach-Hinweise erkennen Sportler ohne Wochenplan, hohe Belastung, offene Rückmeldungen und gefaehrdete Ziele im eigenen Verein
- Empfehlungen können erledigt, ausgeblendet und mit Notizen versehen werden
- Supabase-Migration `0009_smart_coach_recommendations.sql` erstellt die Tabelle `smart_coach_recommendations` mit RLS für Athlete, Coach und Admin
- Smart Coach ist regelbasiert und ersetzt keinen Trainer, Arzt oder medizinische Beratung

## Version 1.5 - QA & Stabilitaet

- Robustere lokale Auth- und LocalStorage-Schicht mit In-Memory-Fallback, falls Browser-Speicher kurzzeitig nicht verfuegbar ist
- Gespeicherte App-Daten werden beim Laden und Speichern konsequent an den eingeloggten Nutzer und dessen Athletenprofil gebunden
- Leere Zustände für Wettkämpfe und Material verbessert
- Mobile Layout-Haertung für Header, Bottom Navigation, Safe Area, Karten, lange Texte und kleine Screens
- Sichtbare Beispiel-/Alttexte weiter bereinigt, damit neue Nutzer eine leere, eigene App sehen

## Version 1.6 - Cross-Platform PWA

- Web App Manifest für iPhone, iPad, Android, Windows und moderne Desktop-Browser
- Standalone-Display, Dark-Mode Theme Color, maskable Icon, Apple Touch Icon und Windows Tile-Metadaten
- Service Worker als Offline-Grundlage für App-Shell und Offline-Fallback
- Verbesserte Safe-Area-Unterstuetzung für installierte iOS/iPadOS Apps

## Version 1.7 - Mobile Layout Feinschliff

- Home startet ohne großen globalen Header direkt mit Begruessung, Tagesinfo und den wichtigsten Karten
- Unterseiten nutzen einen kompakten Header, der beim Scrollen normal aus dem Sichtbereich verschwindet
- Logout ist in die Einstellungen verschoben und nicht mehr prominent auf dem Dashboard
- Bottom Navigation ist flacher, sicherer für iPhone-Safe-Areas und verdeckt weniger Inhalt
- Mobile Abstaende, Home-Hero und Sticky-Aktionen wurden für mehr sichtbaren Inhalt gestrafft
- Athletenprofil fachlich für Kanuslalom geschärft: K1/C1-Auswahl, Altersklasse, C1-Paddelseite und Migration alter Profildaten

## Version 1.8 - Profil QA & Mobile Feinschliff

- Bootsklassen im Profil sind echte Checkbox-Karten für K1, C1 und K1 + C1
- C1-Profile muessen explizit eine Paddelseite Links/Rechts speichern, K1-only blendet das Feld aus
- Profilkarte, Altersklasse und Bootsklassen-Anzeige wurden für iPhone, iPad und Desktop gehärtet
- Speichern-Bereich und Formularfelder haben mehr Luft zur Bottom Navigation und Safe Area

## Version 2.0 - Coach Foundation

- Rollen-System für Athlete, Coach, TeamAdmin und Admin mit vorbereitetem Adminbereich
- Einladungscodes für Coach, TeamAdmin und Athlete im lokalen Demo-Auth-System
- Erster Coach/Admin-Bereich mit Dashboard, Sportlerverwaltung, Gruppenverwaltung, Trainingszuweisung und Sportler-Vorschau
- Coach-Daten werden pro eingeloggtem Nutzer im bestehenden `paddlio_data_<userId>` LocalStorage getrennt gespeichert

## Version 2.1 - Benutzerverwaltung & Einladungen

- Oeffentliche Registrierung entfernt: neue Nutzer aktivieren ihr Konto nur noch mit Einladungscode und Passwort
- Admins und berechtigte Coaches können Einladungen für Athlete und Coach erstellen; echte E-Mail-Zustellung ist architektonisch vorbereitet
- Einladungen werden lokal mit Status `offen`, `angenommen` oder `abgelaufen` gespeichert und beim Annehmen automatisch in Benutzerkonten migriert
- Neue Admin-/Coach-Benutzerverwaltung mit Suche, Rollenfilter, Sortierung, Gruppen-Zuweisung, Statusverwaltung und Admin-Loeschfunktion
- Datenschutzregeln geschärft: Athleten sehen eigene Daten, Coaches nur Athleten aus Verein/Gruppen, Admins alle lokalen Benutzer
- LocalStorage-Struktur: `paddlio_users`, `paddlio_session`, `paddlio_invitation_codes`, `paddlio_data_<userId>`

## Version 2.2 - Registrierung & Traineranfrage

- Oeffentliche Registrierung für alle Sportler mit Vorname, Nachname, E-Mail, Passwort, Verein und Datenschutz-Bestätigung
- Neue Nutzer erhalten automatisch die Rolle `Athlete`; Trainerrechte werden nicht mehr per Registrierung oder Einladung vergeben
- Neue Nutzer erhalten ausschließlich `Athlete`; Admin- und Coach-Rechte werden nur durch Adminentscheidung vergeben
- Profilbereich `Trainerstatus`: Athleten können eine Traineranfrage mit Lizenz, Qualifikation, Telefon und Nachricht absenden
- Adminbereich `Traineranfragen`: Admin kann Anfragen genehmigen oder ablehnen; Genehmigung setzt die Rolle `Coach`
- Benutzerverwaltung zeigt Rollen, Status und Verein; Adminrechte können nicht per UI vergeben werden
- LocalStorage vorbereitet für Plattformbetrieb: `paddlio_users`, `paddlio_sessions`, `paddlio_trainer_requests`, `paddlio_data_<userId>`

## Version 2.3 - Individuelle Saisonziele & Leistungsentwicklung

- Saisonziele sind nicht mehr fest im Code hinterlegt, sondern werden pro Nutzer in `paddlio_data_<userId>` gespeichert
- Neue Zielverwaltung mit Erstellen, Bearbeiten, Löschen, Status, Priorität, Zeitraum, Kategorie und Notizen
- Automatische Fortschrittsberechnung für K1-Bestzeit, C1-Bestzeit, Strafschnitt, Trainingseinheiten und Trainingsminuten
- Manuelle Ziele für Technik, persönliche Entwicklung und Coach-Feedback vorbereitet
- Dashboard zeigt individuelle Ziele oder einen leeren Zustand, wenn noch keine Ziele angelegt wurden
- Datenmodell `SeasonGoal` enthält `ownerUserId` und `assignedByUserId` als Grundlage für Coach-, Team- und Cloud-Funktionen

## Version 2.4 - Vereinsverwaltung

- Admins verwalten offizielle Vereine mit Kurzname, Stadt, Kontaktdaten, Farben, Status und moderner Kartenansicht
- Registrierung bietet eine Vereinsauswahl oder speichert neue Vereine als Vorschlag für die Admin-Prüfung
- Vereinsvorschlaege können angenommen, abgelehnt oder bearbeitet und angenommen werden; angenommene Vereine werden in `paddlio_clubs` gespeichert
- Bestehende Freitext-Vereine werden als Vereinsvorschlaege migriert, ohne Nutzerdaten zu löschen
- Coach Dashboard zeigt den eigenen Verein, Sportler im Verein, Gruppen im Verein und offene Rückmeldungen
- LocalStorage-Struktur erweitert um `paddlio_clubs` und `paddlio_club_requests`

## Version 2.5 - Trainingsgruppen & Sportlerverwaltung

- Coach Dashboard erweitert um die Karte `Meine Trainingsgruppen` mit Sportlern, Gruppen, Wochen-Trainings und offenen Rückmeldungen
- Trainingsgruppen haben jetzt Club-Zuordnung, Coach-Zuordnung, Altersklasse, Bootsklassen, Trainingsfokus, Farbe und Status
- Coach-Sportlerverwaltung mit Suche, Filter, Tabellenansicht, Einladungsoffen-Status und Mehrfachzuweisung zu Gruppen
- Sportlerprofil für Coaches zeigt Verein, Gruppen, Ziele, Trainings, Wettkampf-/Material-/Journal-Platzhalter und Trainernotizen
- Bestehende Coach-Gruppen und Coach-Sportler werden beim Laden in die neue 2.5-Struktur migriert
- Coaches sehen weiterhin nur Sportler und Gruppen ihres Vereins; Admins sehen alles

## Version 2.6 - Trainingsplanung & Kalender

- Trainingsplan ist jetzt ein Kalender mit Tagesansicht, Wochenansicht, Monatsübersicht und Listenansicht
- Trainings können für sich selbst, einzelne Sportler oder Trainingsgruppen geplant werden
- PlanItem-Datenmodell erweitert um Owner, Club, Zuweisungstyp, Sportler-/Gruppenlisten, Bootsklasse, Wiederholung und neue Statuswerte
- Wiederkehrende Trainings erzeugen beim Speichern mehrere einzelne Kalendereintraege bis zum Wiederholungsdatum
- Sportler können Trainings erledigen, auslassen und Feedback mit Gefühl, Schwierigkeit, Müdigkeit, Motivation, Schlaf und Kommentar speichern
- Kalenderfilter für Zeitraum, Bereich, Bootsklasse, Intensität, Status, Sportler und Gruppe
- Dashboard und Analyse nutzen die neue Planstruktur weiterhin aus `paddlio_data_<userId>`, ohne bestehende Daten zu löschen

## Version 2.6.1 - Trainingsvorlagen & Planungsassistent

- Trainingsbibliothek mit privaten Vorlagen und Vereinsvorlagen für Coach/Admin ergänzt
- Vorlagen können erstellt, bearbeitet, gelöscht, favorisiert und direkt für Trainingsplanung genutzt werden
- Trainings können einzeln, wochenweise oder als Zeitraum/Trainingsblock kopiert werden
- Wiederkehrende Trainings unterstuetzen taeglich, woechentlich, alle 2 Wochen, monatlich und eine maximale Terminanzahl
- Trainingsvorlagen werden im bestehenden `paddlio_data_<userId>` LocalStorage gespeichert, ohne vorhandene Trainingsdaten zu löschen

## Version 3.2 - Trainingsplanung 2.0 & Coach Workflow

- Trainingsplanung bekommt eine rollenabhängige Workflow-Navigation für Coach/Admin und Athlete
- Coach/Admin arbeiten mit Heute, Woche, Monat, Vorlagen, Gruppen und Rückmeldungen
- Athleten sehen Heute, Diese Woche, Kommende Einheiten, Erledigt und Rückmeldung
- Trainings können weiterhin aus Vorlagen geplant, einzeln kopiert, wochenweise kopiert oder als Trainingsblock kopiert werden
- Gruppenansicht zeigt Trainingsgruppen, Sportlerzahl, Wochenplan-Sprung und direkte Planungsaktion
- Rückmeldungsansicht bündelt offene und gespeicherte Feedbacks für Coach Workflow und Trainingstagebuch
- Supabase-Migration `0006_training_planning_2_0.sql` ergänzt Indizes und Realtime-Vorbereitung für Trainingsplanung, Feedback und Vorlagen

## Version 3.3 - Live-Synchronisierung, Benachrichtigungen & Offline-Queue

- Zentraler Realtime-Service für Trainings, Feedback, Ziele, Notifications, Gruppen, Gruppenzuordnungen und Profile
- Notification Center im Mehr-Bereich unter `Updates` mit ungelesenen Karten und Markieren-als-gelesen
- Automatische Benachrichtigungen für zugewiesene Trainings und eingehendes Feedback
- Offline-Queue für Insert/Update/Delete-Änderungen mit Retry-Zähler und automatischem Flush beim Onlinegehen
- CloudStatus zeigt Synchronisiert, Synchronisiert..., Offline, Wartende Änderungen und Cloud Fehler
- Dokumentation: `docs/realtime-and-offline-sync.md`
- Supabase-Migration `0007_realtime_notifications_offline_sync.sql` ergänzt Notification-Felder, Indizes, Policies und Realtime-Publication

## Version 3.4 - Wettkampfportal & Ergebnisverwaltung

- Wettkampfbereich ist ein Portal mit Meine Wettkämpfe, Ergebnisse, Bestzeiten, Saisonstatistik und Coach/Admin-Ansicht
- Wettkämpfe speichern Name, Ort, Datum, Veranstalter, Strecke, Ebene und Notizen
- Ergebnisse speichern Bootsklasse, beide Laufzeiten, Strafsekunden, Platz, Starterfeld, Abstand, Gefühl und Notiz
- Automatische Kennzahlen: Lauf-Gesamtzeiten, beste Gesamtzeit, Strafschnitt und Trend gegen vorheriges Ergebnis
- Bestzeiten nach Bootsklasse und Strecke sowie Monats-/Saisonstatistik
- Import vorbereitet über `source`, `external_id` und `source_url` für spätere canoeslalom.net-Anbindung
- Supabase-Migration `0008_competition_portal_results.sql` ergänzt Portal-Felder, Indizes und Realtime-Publication

## Version 3.5 - Analysezentrum & Leistungsentwicklung

- Analysebereich ist ein Analysezentrum mit Übersicht, Training, Wettkampf, Ziele, Belastung, K1/C1, Coach Analyse und Admin Übersicht
- Zeitraumfilter für 7, 30, 90 Tage, Saison, Jahr und eigenen Zeitraum
- Trainingsanalyse mit Minuten, Statusquote, Trainingsbereichen, Intensität, Ausfallquote und Feedbackquote
- Wettkampfanalyse mit Bestzeiten, Strafschnitt, Platzierung/Abstand und K1/C1-Differenzen
- Zielanalyse mit Fortschritt, Zielquote, Status und Fortschrittsbalken
- Regelbasierte Belastungsanalyse mit sportlichen Empfehlungen ohne medizinische Aussage
- Dokumentation: `docs/analytics-center.md`

## Version 2.7 - Rollen, Rechte, QA & Cloud Readiness

- Gemeinsame Access-Control-Logik für Athlete, Coach, TeamAdmin und Admin ergänzt
- Dashboard, Coach-Bereich und Trainingskalender filtern Daten rollen-, user- und vereinsbasiert
- Trainingsplanung prueft Zuweisungen jetzt gegen den erlaubten Coach-/Admin-Scope und zeigt freundliche Formularmeldungen
- Version und Service-Worker-Cache auf 2.7 aktualisiert
- Cloud-Readiness-Dokumentation für Supabase/Firebase, Serverrechte und LocalStorage-Ablösung ergänzt

## Version 3.0.1 - Supabase Datenbank-Fundament

- Supabase-Projektstruktur vorbereitet: `src/lib/supabase.ts`, `src/lib/database.types.ts`, `supabase/migrations`
- Erste Supabase-Migration mit Tabellen für Profile, Vereine, Traineranfragen, Gruppen, Ziele, Trainingsplanung, Feedback, Wettkämpfe, Material, Benachrichtigungen und Audit-Logs
- Row Level Security und erste rollenbasierte Policies für Athlete, Coach, TeamAdmin und Admin vorbereitet
- App bleibt ohne Supabase-Environment-Variablen voll LocalStorage-fähig und stuerzt nicht ab
- Setup-Dokumentation für lokale Entwicklung und Vercel ergänzt

## Version 3.0.2 - Supabase Auth & Cloud Integration

- Supabase Auth Provider für Registrierung, Login, Logout, Session-Wiederherstellung und Passwort-Reset
- Profile, Vereine, Benutzer, Trainingsgruppen und Traineranfragen werden aus Supabase geladen und in den lokalen Cache synchronisiert
- Rollen kommen aus dem Cloud-Profil; neue Registrierungen starten immer als `Athlete` und erzeugen eine Admin-Benachrichtigung
- Cloud Status zeigt verbunden, synchronisiert oder Offline-Modus; Admins sehen synchronisierte Datensaetze
- LocalStorage bleibt als Offline-Cache erhalten, bis Trainings, Ziele, Wettkämpfe und Material in 3.0.3 in die Cloud wandern

## Version 3.0.3 - Cloud Data Migration & Live Synchronisierung

- Automatische Erst-Migration lokaler Daten in Supabase mit Migrationsmarkierung pro Nutzer
- Cloud-Services für Training, Feedback, Trainingsvorlagen, Ziele, Wettkämpfe, Material, Notifications, Migration und Sync
- Supabase Realtime aktualisiert Training, Feedback, Ziele, Traineranfragen und Profile ohne manuellen Reload
- Offline Queue `paddlio_sync_queue` speichert Änderungen lokal und synchronisiert beim Onlinegehen
- LocalStorage bleibt Cache, Supabase ist für migrierte App-Daten der Hauptspeicher

## Version 3.1 - Vereins- und Teamverwaltung

- Adminbereich verwaltet Vereine, Vereinsvorschlaege, Mitglieder, Rollen, Status und Traineranfragen über Supabase
- Coach-Bereich nutzt Supabase für eigene Vereinsmitglieder, Trainingsgruppen und Gruppenzuordnungen
- Neue Nutzer bleiben immer `Athlete`; Coach-, TeamAdmin- und Admin-Rechte werden ausschließlich administrativ vergeben
- RLS-Policies und Foreign Keys für `club_requests`, `trainer_requests`, `training_groups` und `group_members` ergänzt
- Reparatur-/Update-Migration: `PADDLIO_3_1_CLUB_TEAM_MANAGEMENT.sql`

## Paddlio auf iPhone/iPad installieren

1. Paddlio in Safari öffnen.
2. Teilen-Button antippen.
3. `Zum Home-Bildschirm` wählen.
4. Name `Paddlio` bestaetigen und `Hinzufügen` antippen.

Paddlio startet danach als eigenständige App im Dark-Mode Look mit iOS-Statusleiste.

## Paddlio auf Android installieren

1. Paddlio in Chrome öffnen.
2. Im Browsermenue `App installieren` oder `Zum Startbildschirm hinzufügen` wählen.
3. Installation bestaetigen.

Chrome nutzt das Manifest, die 192x192-/512x512-Icons und den Standalone-Modus.

## Paddlio auf Windows installieren

1. Paddlio in Microsoft Edge öffnen.
2. In der Adressleiste oder im Menü `Apps` die Option `Diese Website als App installieren` wählen.
3. Installation bestaetigen.

Edge verwendet Manifest, Theme Color und Windows Tile-Metadaten.

## Milestone 1.0

- Athlete Intelligence Dashboard mit Tagesfokus, Trainingsserie, Athletenstatus und Countdown
- Paddlio Coach mit regelbasierten Empfehlungen aus Training, Wettkämpfen, Zielen und Journal
- Trainingstagebuch mit persönlichem Journal nach jeder Einheit
- Trainingsplanung mit Wochenübersicht, Status, Intensität und Fokus
- Wettkämpfe mit Timeline, Laufzeiten, Strafsekunden und Gefühl
- Analyse mit Trends, Verteilungen, K1/C1-Vergleich und Trainingsumfang
- Ziele-Seite mit Saisonfortschritt und persönlichen Profilzielen
- Persönliche Rekorde für K1, C1, Strafsekunden, Trainingsserie und Saisonwerte
- Saisonübersicht mit Monatswerten, Trainingsminuten, Belastung und Bestzeiten
- Materialverwaltung für Boote, Paddel und Zubehör
- Athletenprofil mit Sportdaten, Zielen, Profilbild und Einstellungen
- Datenpersistenz im Browser über LocalStorage

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

Das Projekt ist für Vercel vorbereitet.

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Die Datei `vercel.json` enthält die passenden Build- und SPA-Rewrite-Einstellungen.

### Supabase Einrichtung

Paddlio ist auf dieses Supabase-Projekt vorbereitet:

- Projekt-ID: `twlkhfbrrwjwppxinmpn`
- Project URL: `https://twlkhfbrrwjwppxinmpn.supabase.co`

Die Project URL ist im Supabase Client als fester Default hinterlegt. Für Registrierung, Login, Passwort-Reset und Cloud-Sync muss nur noch der Publishable Key gesetzt werden:

```env
VITE_SUPABASE_URL=https://twlkhfbrrwjwppxinmpn.supabase.co
VITE_SUPABASE_ANON_KEY=<Publishable Key>
```

Keine echten Keys in Git committen. Lokal gehört der Key in `.env.local`; `.env.example` zeigt die benötigten Namen. In Vercel wird `VITE_SUPABASE_ANON_KEY` unter `Project Settings` -> `Environment Variables` für Production, Preview und Development eingetragen, danach muss ein Redeploy erfolgen. Fehlt der Key, startet Paddlio ohne Absturz und zeigt den Hinweis: `Bitte VITE_SUPABASE_ANON_KEY in Vercel oder .env.local eintragen.`

## Datenhaltung

Paddlio speichert Daten lokal im Browser. Bestehende LocalStorage-Daten werden beim Laden normalisiert und migriert, damit frühere Daten nicht verloren gehen. Alte interne Migrationsnamen bleiben deshalb bewusst im Code erhalten.

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
