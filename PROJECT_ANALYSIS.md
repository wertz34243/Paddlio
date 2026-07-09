# Paddlio Project Analysis

## Stand Version 4.1.5

Paddlio ist eine React/Vite/TypeScript-PWA für Kanuslalom mit Supabase Auth und Supabase als Hauptspeicher für die Plattformbereiche. LocalStorage bleibt als Cache und Offline-Fallback erhalten.

Version 4.1.5 ist ein Privacy- und Beta-Polish-Fix. Der Schwerpunkt liegt auf geschützten E-Mail-Anzeigen, klarerem CloudStatus, besseren aria-Labels, weniger Overflow in Updates, finaler Textglättung und stabilerem Cloud-Speichern vor externer Beta. Große neue Fachfunktionen bleiben eingefroren.

## Architektur

- `AuthProvider` ist die zentrale Auth- und Cloud-Sync-Schicht.
- Supabase-Zugriffe liegen in `src/services/` und nicht direkt in Seitenkomponenten.
- Rollen werden aus `profiles.roles` geladen.
- Neue Nutzer starten als `Athlete`.
- Admin-, Coach- und TeamAdmin-Rechte werden administrativ vergeben.
- Bottom Navigation ist für mobile Beta-Tests auf fünf Hauptpunkte reduziert; weitere Bereiche liegen unter `Mehr`.
- Beta-Feedback und Beta-Tester liegen in Supabase und werden lokal nur gecacht.
- Das visuelle Grundsystem liegt zentral in `src/styles.css` mit 4.1-Overlay für Tokens, Karten, Navigation, Buttons, Empty/Error/Offline States und mobile Safe Areas.

## Version 4.1.5 Schwerpunkt

- Athleten laden beim Cloud-Profil-Sync nur noch das eigene Profil in den App-Snapshot.
- E-Mail-Adressen werden in Updates, Coach-Listen und Feedbackflächen für Nicht-Admins maskiert oder entfernt.
- Admin-/Beta-Tester-Daten bleiben echten Admins vorbehalten.
- CloudStatus erklärt `verbunden`, `eingeschränkt`, `offline` und `Fehler` nutzerfreundlicher.
- Wiederholte Hauptaktionen erhalten eindeutigere aria-Labels.
- Updates, Beta-Zeilen, Chat-Bubbles und technische Strings erhalten zusätzliche Overflow-Guards.
- Sichtbare deutsche UI-Texte wurden weiter geglättet.
- Trainingstagebuch-Einträge werden über `training_journal_entries` in Supabase gespeichert, migriert, geladen und per Realtime aktualisiert.
- Passwort-Reset nutzt ein Inline-Formular statt `prompt()`, weil Browser-/Testumgebungen Prompts blockieren können.

## Version 4.1.4 Schwerpunkt

- Migration `0017_external_beta_readiness_414.sql` ergänzt `competitions.course` und erwartete Competition-Metadaten idempotent.
- `profiles` erhält eigene Self-Select/Insert/Update-Policies für eingeloggte Nutzer.
- `ensureCloudProfile` erstellt fehlende Profile per Insert, ohne bestehende Rollen bei Login-Sync zu überschreiben.
- Der Mehr-Bereich zeigt auf kleinen Viewports eine Kachel-/Listenansicht, damit alle Bereiche erreichbar bleiben.
- Wichtige wiederholte Buttons erhalten eindeutige aria-Labels.
- Restliche sichtbare Encoding-/Umlautfehler wurden bereinigt.

## Version 4.1.3 Schwerpunkt

- Migration `0016_schema_sync_413.sql` synchronisiert fehlende optionale Tabellen für Kommunikation, Verein, Beta, Ergebnisse, externe Trainings, Material, Boote und Smart Coach.
- `competitions.organizer` wird idempotent ergänzt.
- Optionale Cloud-Fehler setzen CloudStatus auf eingeschränkt statt auf synchronisiert.
- Build ist grün; verbleibende Bundle-Size-Warnung ist bekannt und nicht blockierend.

## Version 4.1.2 Schwerpunkt

- Profil-Sync wird nicht mehr als harter App-Blocker behandelt.
- Bei Profil-Timeout nutzt Paddlio ein lokales Fallback-Profil und markiert CloudStatus als eingeschränkt.
- Migration `0015_profile_sync_rls_hotfix.sql` stellt eigene `profiles` Select/Insert/Update-Policies bereit.
- Bottom-Navigation erhält eindeutige `aria-labels`.
- Build ist grün; verbleibende Bundle-Size-Warnung ist bekannt und nicht blockierend.

## Version 4.1.1 Schwerpunkt

- Dashboard darf nicht mehr auf optionale Cloud-Module warten: lokaler Cache wird sofort angezeigt, Cloud Sync läuft nachgelagert.
- Supabase-Aufrufe für Session, Profil und optionale Tabellen sind mit Timeouts und Fallbacks abgesichert.
- Migration `0014_beta_stabilization_hotfix.sql` repariert fehlende optionale Tabellen/Spalten idempotent.
- Reine `YYYY-MM-DD` Datumswerte werden ohne UTC-Verschiebung und mit Europe/Berlin-Wochentag verarbeitet.
- Analyse-, Tabellen-, Chart- und Kartenbereiche erhalten Overflow-Guards für Mobile, Tablet und Desktop.
- Heute-Seite hat genau ein sichtbares `h1`.
- Wiederholte Dashboard-Buttons besitzen eindeutige `aria-labels`.
- Sichtbare deutsche Texte wurden auf Umlaute geglaettet; interne Daten-IDs bleiben stabil.

## Version 4.1 Schwerpunkt

- Dark Water Performance Design mit sehr dunklem Blau, Wasser-Cyan, ruhigen Flächen und reduzierten Schatten.
- Heute bleibt zentrale Startseite und priorisiert Training, Kommunikation, Aufgaben, Anwesenheit, Ziele und Smart Coach.
- Mobile Bottom Navigation bleibt bei Heute, Training, Analyse, Kommunikation und Mehr.
- Kommunikation wirkt mehr wie Messenger/Team-App: Kontakte, Chat-Bubbles, sticky Eingabe und klare Empty States.
- Training, Analyse, Ergebnisse, Profil, Einstellungen und Admin/Beta profitieren von gemeinsamen Karten-, Button- und Statusregeln.
- PWA Theme Color ist auf den dunkleren App-Shell angepasst.
- Nächste Versionen: 4.2 Excel Import, 4.3 Paddlio Academy, 4.4 Technik-Check nach DKV Manual, 4.5 Trainingsvorlagen aus Ausbildungs- und Technikmanual.

## Version 4.0 Beta Schwerpunkt

- Beta-Modus mit sichtbarer Version und Testhinweis.
- Feedback-System für Athlete, Coach, ClubAdmin und Admin.
- Admin kann Feedbackstatus pflegen und Beta-Tester markieren.
- Beta-Check deckt System, Rollen, Funktionen, Mobile, Doku und RLS ab.
- Tester erhalten eine einfache Anleitung und bekannte Grenzen direkt in der App.
- Feature-Freeze: kein vollständiger Polar OAuth, Excel Import, Videoanalyse, KI-Coach, Academy oder Redesign.
- Nächste Versionen: 4.1 Dark Water Performance Design, 4.2 Excel Import, 4.3 Paddlio Academy, 4.4 Technik-Check nach DKV Manual, 4.5 Trainingsvorlagen aus Ausbildungs- und Technikmanual.

## Version 3.1 Schwerpunkt

- Admin verwaltet Vereine, Vereinsanfragen, Mitglieder, Rollen und Traineranfragen.
- Coaches und TeamAdmins sehen nur den eigenen Verein.
- Trainingsgruppen und Gruppenzuweisungen laufen über `training_groups` und `group_members`.
- Supabase RLS muss serverseitig sicherstellen, dass Athleten nur eigene Daten, Coaches nur Vereinsdaten und Admins alles sehen.

## Version 3.2 Schwerpunkt

- Trainingsplanung wird zum Coach-Workflow mit Heute, Woche, Monat, Vorlagen, Gruppen und Rückmeldungen.
- Athleten erhalten eine reduzierte Planansicht für Heute, Diese Woche, kommende und erledigte Einheiten.
- Vorlagen, Einzeltraining, Wochenkopie, Trainingsblock-Kopie und Feedback laufen weiter über die bestehende Planstruktur.
- Supabase ist für Trainingsplanung über `training_plan_items`, `training_feedback` und `training_templates` vorbereitet; Migration `0006_training_planning_2_0.sql` ergänzt Indizes und Realtime-Eintragung.

## Version 3.3 Schwerpunkt

- Realtime-Subscriptions liegen zentral in `src/services/realtimeService.ts`.
- Offline-Änderungen laufen über `src/services/offlineQueueService.ts` und `paddlio_sync_queue`.
- Benachrichtigungen werden in `notifications` gespeichert und im Mehr-Bereich unter `Updates` angezeigt.
- CloudStatus unterscheidet synchronisiert, synchronisiert..., offline, wartende Änderungen und Cloud-Fehler.
- Migration `0007_realtime_notifications_offline_sync.sql` ergänzt Notification-Felder, Indizes und Realtime-Publication.

## Version 3.4 Schwerpunkt

- Wettkampfbereich ist ein Portal mit Ergebnisverwaltung, Bestzeiten, Saisonstatistik und Coach/Admin-Auswertung.
- Competition-Datenmodell ist für Veranstalter, Strecke, Ebene, Starterfeld und spätere Importquellen erweitert.
- Supabase nutzt `competitions` und `competition_results` als Hauptspeicher für Portal- und Ergebnisdaten.
- Migration `0008_competition_portal_results.sql` ergänzt Felder, Indizes, Realtime und RLS-Select-Policies.

## Version 3.5 Schwerpunkt

- Analysezentrum bündelt Training, Wettkampf, Ziele, Belastung, Coach-Analyse und Admin-Übersicht.
- Zeitraumfilter steuert alle Kennzahlen im Analysezentrum.
- Belastungsanalyse ist regelbasiert aus Dauer, Intensität, Feedback und Regeneration.
- Coach- und Admin-Views bleiben rollenabhängig sichtbar und basieren auf dem geladenen, RLS-geschützten Snapshot.

## Version 3.6 Schwerpunkt

- Smart Coach erzeugt regelbasierte Empfehlungen aus Training, Feedback, Zielen, Wettkämpfen und Material.
- Empfehlungen haben Kategorie, Priorität, Begründung, vorgeschlagene Aktion und Status.
- Athleten sehen eigene Hinweise auf Home und im Analysezentrum.
- Coaches sehen Hinweise für Sportler/Gruppen aus dem eigenen Verein; Admins sehen den geladenen Gesamtsnapshot.
- Supabase-Tabelle `smart_coach_recommendations` speichert erledigt/ausgeblendet/Notizen und ist per RLS abgesichert.

## Version 3.7 Schwerpunkt

- Vereinsportal ist als eigener Hauptbereich `Verein` eingebaut.
- Coach, TeamAdmin, ClubAdmin und Admin verwalten Mitglieder, Trainer, Gruppen, Material, Boote, Kalender, Dokumente, Nachrichten und Einstellungen.
- ClubAdmin ist als eigene Rolle in Frontend, Typen und Supabase-Migration vorbereitet.
- Vereinsdaten liegen in eigenen Supabase-Tabellen und bleiben lokal nur Cache/Offline-Fallback.
- Datei-Uploads sind als Dokument-Metadaten vorbereitet; echte Storage-Buckets folgen später.

## Version 3.8 Schwerpunkt

- Kommunikation ist als eigener Bereich unter Mehr integriert.
- Direktnachrichten, Gruppenchats, Vereinsnews, Aufgaben, Anwesenheit und Anhang-Metadaten sind als eigene Modelle und Supabase-Tabellen vorbereitet.
- Dashboard zeigt Kommunikations- und Team-Signale direkt auf Home.
- Offline-Queue und Realtime-Service kennen die neuen Kommunikationstabellen.
- Supabase RLS schuetzt private Nachrichten, Gruppendaten, Aufgaben und Anwesenheit.

## Version 3.9 Schwerpunkt

- Wettkampfergebnisse werden um Laufdetails, Abstaende, Quellen und Trainerkommentare erweitert.
- Persönliche Bestzeiten werden aus `competition_results` beziehungsweise dem geladenen Snapshot berechnet und können in `personal_bests` gespeichert werden.
- Ergebnisimporte sind über `result_imports` vorbereitet, bleiben aber bewusst ohne instabilen Scraper.
- Polar Flow und weitere externe Datenquellen sind über `external_connections` und `external_training_sessions` vorbereitet; sichere OAuth-/Token-Verarbeitung gehört nicht ins Frontend.
- Analyse und Smart Coach berücksichtigen externe Trainings, Belastungssprünge, unverknüpfte Einheiten und Ergebnisentwicklung.
- Admins erhalten einen Beta-Check für Supabase, Rollen, Gruppen, Training, Kommunikation, Ergebnisse, Mobile und RLS.

## Datenmodelle in Nutzung

- `profiles`: Nutzerprofil, Rollen, Status, Verein, Bootsklassen.
- `clubs`: offizielle Vereine.
- `club_requests`: Vereinsvorschlaege aus Registrierung.
- `trainer_requests`: Trainerfreigaben.
- `training_groups`: Vereinsgruppen.
- `group_members`: Gruppenzuordnungen.
- `training_plan_items`: Trainings für Athleten, Gruppen und Eigenplanung.
- `training_feedback`: Rückmeldungen und Ausfallgründe.
- `training_templates`: private und Vereinsvorlagen.
- `notifications`: Live-Hinweise für Training, Feedback, Ziele, Rollen und Gruppen.
- `competitions`: Wettkampf-Stammdaten inklusive Importquelle.
- `competition_results`: Ergebnisdaten pro Sportler und Bootsklasse.
- `smart_coach_recommendations`: gespeicherte Statuswerte und Notizen für regelbasierte Hinweise.
- `club_material`: Vereinsinventar wie Boote, Paddel, Helme, Schwimmwesten und Anhänger.
- `boats`: detaillierte Bootsdaten und Sportlerverknuepfung.
- `club_events`: Vereinskalender für Training, Wettkampf, Sitzung, Feier und Arbeitseinsatz.
- `club_documents`: Dokument-Metadaten und Ordnerstruktur.
- `club_messages`: interne Vereinsnachrichten.
- `club_settings`: Logo, Farben, Adresse, Homepage, Ansprechpartner, Vereinsnummer und Impressum.
- `direct_messages`: private 1:1 Nachrichten.
- `group_messages`: Gruppenchats für Trainingsgruppen.
- `club_posts`: Vereinsnews und Pinnwand.
- `tasks`: Aufgabenstammdaten.
- `task_assignments`: Aufgabenstatus pro Nutzer.
- `training_attendance`: Anwesenheitsantworten pro Training.
- `file_attachments`: Anhang-Metadaten für spätere Storage-Uploads.

## Nächste Risiken

- Die produktive Admin-Bootstrap-Strategie muss dauerhaft geregelt werden, ohne automatische Adminrolle bei Registrierung.
- Supabase Auth Rate Limits brauchen für reale Tests ein sauberes SMTP-/Limit-Setup.
- Trainer-Notizen und Sportlerstatus sollten später als eigene Cloud-Tabelle statt Profilstatus modelliert werden.
- Breite Admin-Listen brauchen mittelfristig Pagination.
- Smart-Coach-Regeln sollten mit echten Vereinsdaten validiert werden, bevor daraus automatisierte Trainingsentscheidungen entstehen.
- Supabase Storage für echte Dokument-Uploads braucht eigene Bucket- und RLS-Policies.
- Kommunikation braucht später Benachrichtigungs-Routing und echte Push-Benachrichtigungen.
