# Paddlio Project Analysis

## Stand Version 4.1.0

Paddlio ist eine React/Vite/TypeScript-PWA fuer Kanuslalom mit Supabase Auth und Supabase als Hauptspeicher fuer die Plattformbereiche. LocalStorage bleibt als Cache und Offline-Fallback erhalten.

Version 4.1 ist ein Design- und UX-Release. Der Schwerpunkt liegt auf Dark Water Performance Design, ruhigerer Heute-Ansicht, besserer mobiler Navigation, einheitlichen Karten, konsistenteren Statuszustaenden und einer App-Anmutung fuer echte Beta-Tester. Grosse neue Fachfunktionen bleiben eingefroren.

## Architektur

- `AuthProvider` ist die zentrale Auth- und Cloud-Sync-Schicht.
- Supabase-Zugriffe liegen in `src/services/` und nicht direkt in Seitenkomponenten.
- Rollen werden aus `profiles.roles` geladen.
- Neue Nutzer starten als `Athlete`.
- Admin-, Coach- und TeamAdmin-Rechte werden administrativ vergeben.
- Bottom Navigation ist fuer mobile Beta-Tests auf fuenf Hauptpunkte reduziert; weitere Bereiche liegen unter `Mehr`.
- Beta-Feedback und Beta-Tester liegen in Supabase und werden lokal nur gecacht.
- Das visuelle Grundsystem liegt zentral in `src/styles.css` mit 4.1-Overlay fuer Tokens, Karten, Navigation, Buttons, Empty/Error/Offline States und mobile Safe Areas.

## Version 4.1 Schwerpunkt

- Dark Water Performance Design mit sehr dunklem Blau, Wasser-Cyan, ruhigen Flaechen und reduzierten Schatten.
- Heute bleibt zentrale Startseite und priorisiert Training, Kommunikation, Aufgaben, Anwesenheit, Ziele und Smart Coach.
- Mobile Bottom Navigation bleibt bei Heute, Training, Analyse, Kommunikation und Mehr.
- Kommunikation wirkt mehr wie Messenger/Team-App: Kontakte, Chat-Bubbles, sticky Eingabe und klare Empty States.
- Training, Analyse, Ergebnisse, Profil, Einstellungen und Admin/Beta profitieren von gemeinsamen Karten-, Button- und Statusregeln.
- PWA Theme Color ist auf den dunkleren App-Shell angepasst.
- Naechste Versionen: 4.2 Excel Import, 4.3 Paddlio Academy, 4.4 Technik-Check nach DKV Manual, 4.5 Trainingsvorlagen aus Ausbildungs- und Technikmanual.

## Version 4.0 Beta Schwerpunkt

- Beta-Modus mit sichtbarer Version und Testhinweis.
- Feedback-System fuer Athlete, Coach, ClubAdmin und Admin.
- Admin kann Feedbackstatus pflegen und Beta-Tester markieren.
- Beta-Check deckt System, Rollen, Funktionen, Mobile, Doku und RLS ab.
- Tester erhalten eine einfache Anleitung und bekannte Grenzen direkt in der App.
- Feature-Freeze: kein vollstaendiger Polar OAuth, Excel Import, Videoanalyse, KI-Coach, Academy oder Redesign.
- Naechste Versionen: 4.1 Dark Water Performance Design, 4.2 Excel Import, 4.3 Paddlio Academy, 4.4 Technik-Check nach DKV Manual, 4.5 Trainingsvorlagen aus Ausbildungs- und Technikmanual.

## Version 3.1 Schwerpunkt

- Admin verwaltet Vereine, Vereinsanfragen, Mitglieder, Rollen und Traineranfragen.
- Coaches und TeamAdmins sehen nur den eigenen Verein.
- Trainingsgruppen und Gruppenzuweisungen laufen ueber `training_groups` und `group_members`.
- Supabase RLS muss serverseitig sicherstellen, dass Athleten nur eigene Daten, Coaches nur Vereinsdaten und Admins alles sehen.

## Version 3.2 Schwerpunkt

- Trainingsplanung wird zum Coach-Workflow mit Heute, Woche, Monat, Vorlagen, Gruppen und Rueckmeldungen.
- Athleten erhalten eine reduzierte Planansicht fuer Heute, Diese Woche, kommende und erledigte Einheiten.
- Vorlagen, Einzeltraining, Wochenkopie, Trainingsblock-Kopie und Feedback laufen weiter ueber die bestehende Planstruktur.
- Supabase ist fuer Trainingsplanung ueber `training_plan_items`, `training_feedback` und `training_templates` vorbereitet; Migration `0006_training_planning_2_0.sql` ergaenzt Indizes und Realtime-Eintragung.

## Version 3.3 Schwerpunkt

- Realtime-Subscriptions liegen zentral in `src/services/realtimeService.ts`.
- Offline-Aenderungen laufen ueber `src/services/offlineQueueService.ts` und `paddlio_sync_queue`.
- Benachrichtigungen werden in `notifications` gespeichert und im Mehr-Bereich unter `Updates` angezeigt.
- CloudStatus unterscheidet synchronisiert, synchronisiert..., offline, wartende Aenderungen und Cloud-Fehler.
- Migration `0007_realtime_notifications_offline_sync.sql` ergaenzt Notification-Felder, Indizes und Realtime-Publication.

## Version 3.4 Schwerpunkt

- Wettkampfbereich ist ein Portal mit Ergebnisverwaltung, Bestzeiten, Saisonstatistik und Coach/Admin-Auswertung.
- Competition-Datenmodell ist fuer Veranstalter, Strecke, Ebene, Starterfeld und spaetere Importquellen erweitert.
- Supabase nutzt `competitions` und `competition_results` als Hauptspeicher fuer Portal- und Ergebnisdaten.
- Migration `0008_competition_portal_results.sql` ergaenzt Felder, Indizes, Realtime und RLS-Select-Policies.

## Version 3.5 Schwerpunkt

- Analysezentrum buendelt Training, Wettkampf, Ziele, Belastung, Coach-Analyse und Admin-Uebersicht.
- Zeitraumfilter steuert alle Kennzahlen im Analysezentrum.
- Belastungsanalyse ist regelbasiert aus Dauer, Intensitaet, Feedback und Regeneration.
- Coach- und Admin-Views bleiben rollenabhaengig sichtbar und basieren auf dem geladenen, RLS-geschuetzten Snapshot.

## Version 3.6 Schwerpunkt

- Smart Coach erzeugt regelbasierte Empfehlungen aus Training, Feedback, Zielen, Wettkaempfen und Material.
- Empfehlungen haben Kategorie, Prioritaet, Begruendung, vorgeschlagene Aktion und Status.
- Athleten sehen eigene Hinweise auf Home und im Analysezentrum.
- Coaches sehen Hinweise fuer Sportler/Gruppen aus dem eigenen Verein; Admins sehen den geladenen Gesamtsnapshot.
- Supabase-Tabelle `smart_coach_recommendations` speichert erledigt/ausgeblendet/Notizen und ist per RLS abgesichert.

## Version 3.7 Schwerpunkt

- Vereinsportal ist als eigener Hauptbereich `Verein` eingebaut.
- Coach, TeamAdmin, ClubAdmin und Admin verwalten Mitglieder, Trainer, Gruppen, Material, Boote, Kalender, Dokumente, Nachrichten und Einstellungen.
- ClubAdmin ist als eigene Rolle in Frontend, Typen und Supabase-Migration vorbereitet.
- Vereinsdaten liegen in eigenen Supabase-Tabellen und bleiben lokal nur Cache/Offline-Fallback.
- Datei-Uploads sind als Dokument-Metadaten vorbereitet; echte Storage-Buckets folgen spaeter.

## Version 3.8 Schwerpunkt

- Kommunikation ist als eigener Bereich unter Mehr integriert.
- Direktnachrichten, Gruppenchats, Vereinsnews, Aufgaben, Anwesenheit und Anhang-Metadaten sind als eigene Modelle und Supabase-Tabellen vorbereitet.
- Dashboard zeigt Kommunikations- und Team-Signale direkt auf Home.
- Offline-Queue und Realtime-Service kennen die neuen Kommunikationstabellen.
- Supabase RLS schuetzt private Nachrichten, Gruppendaten, Aufgaben und Anwesenheit.

## Version 3.9 Schwerpunkt

- Wettkampfergebnisse werden um Laufdetails, Abstaende, Quellen und Trainerkommentare erweitert.
- Persoenliche Bestzeiten werden aus `competition_results` beziehungsweise dem geladenen Snapshot berechnet und koennen in `personal_bests` gespeichert werden.
- Ergebnisimporte sind ueber `result_imports` vorbereitet, bleiben aber bewusst ohne instabilen Scraper.
- Polar Flow und weitere externe Datenquellen sind ueber `external_connections` und `external_training_sessions` vorbereitet; sichere OAuth-/Token-Verarbeitung gehoert nicht ins Frontend.
- Analyse und Smart Coach beruecksichtigen externe Trainings, Belastungsspruenge, unverknuepfte Einheiten und Ergebnisentwicklung.
- Admins erhalten einen Beta-Check fuer Supabase, Rollen, Gruppen, Training, Kommunikation, Ergebnisse, Mobile und RLS.

## Datenmodelle in Nutzung

- `profiles`: Nutzerprofil, Rollen, Status, Verein, Bootsklassen.
- `clubs`: offizielle Vereine.
- `club_requests`: Vereinsvorschlaege aus Registrierung.
- `trainer_requests`: Trainerfreigaben.
- `training_groups`: Vereinsgruppen.
- `group_members`: Gruppenzuordnungen.
- `training_plan_items`: Trainings fuer Athleten, Gruppen und Eigenplanung.
- `training_feedback`: Rueckmeldungen und Ausfallgruende.
- `training_templates`: private und Vereinsvorlagen.
- `notifications`: Live-Hinweise fuer Training, Feedback, Ziele, Rollen und Gruppen.
- `competitions`: Wettkampf-Stammdaten inklusive Importquelle.
- `competition_results`: Ergebnisdaten pro Sportler und Bootsklasse.
- `smart_coach_recommendations`: gespeicherte Statuswerte und Notizen fuer regelbasierte Hinweise.
- `club_material`: Vereinsinventar wie Boote, Paddel, Helme, Schwimmwesten und Anhaenger.
- `boats`: detaillierte Bootsdaten und Sportlerverknuepfung.
- `club_events`: Vereinskalender fuer Training, Wettkampf, Sitzung, Feier und Arbeitseinsatz.
- `club_documents`: Dokument-Metadaten und Ordnerstruktur.
- `club_messages`: interne Vereinsnachrichten.
- `club_settings`: Logo, Farben, Adresse, Homepage, Ansprechpartner, Vereinsnummer und Impressum.
- `direct_messages`: private 1:1 Nachrichten.
- `group_messages`: Gruppenchats fuer Trainingsgruppen.
- `club_posts`: Vereinsnews und Pinnwand.
- `tasks`: Aufgabenstammdaten.
- `task_assignments`: Aufgabenstatus pro Nutzer.
- `training_attendance`: Anwesenheitsantworten pro Training.
- `file_attachments`: Anhang-Metadaten fuer spaetere Storage-Uploads.

## Naechste Risiken

- Die produktive Admin-Bootstrap-Strategie muss dauerhaft geregelt werden, ohne automatische Adminrolle bei Registrierung.
- Supabase Auth Rate Limits brauchen fuer reale Tests ein sauberes SMTP-/Limit-Setup.
- Trainer-Notizen und Sportlerstatus sollten spaeter als eigene Cloud-Tabelle statt Profilstatus modelliert werden.
- Breite Admin-Listen brauchen mittelfristig Pagination.
- Smart-Coach-Regeln sollten mit echten Vereinsdaten validiert werden, bevor daraus automatisierte Trainingsentscheidungen entstehen.
- Supabase Storage fuer echte Dokument-Uploads braucht eigene Bucket- und RLS-Policies.
- Kommunikation braucht spaeter Benachrichtigungs-Routing und echte Push-Benachrichtigungen.
