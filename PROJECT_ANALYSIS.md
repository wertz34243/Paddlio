# Paddlio Project Analysis

## Stand Version 3.5

Paddlio ist eine React/Vite/TypeScript-PWA fuer Kanuslalom mit Supabase Auth und Supabase als Hauptspeicher fuer die Plattformbereiche. LocalStorage bleibt als Cache und Offline-Fallback erhalten.

## Architektur

- `AuthProvider` ist die zentrale Auth- und Cloud-Sync-Schicht.
- Supabase-Zugriffe liegen in `src/services/` und nicht direkt in Seitenkomponenten.
- Rollen werden aus `profiles.roles` geladen.
- Neue Nutzer starten als `Athlete`.
- Admin-, Coach- und TeamAdmin-Rechte werden administrativ vergeben.

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

## Naechste Risiken

- Die produktive Admin-Bootstrap-Strategie muss dauerhaft geregelt werden, ohne automatische Adminrolle bei Registrierung.
- Supabase Auth Rate Limits brauchen fuer reale Tests ein sauberes SMTP-/Limit-Setup.
- Trainer-Notizen und Sportlerstatus sollten spaeter als eigene Cloud-Tabelle statt Profilstatus modelliert werden.
- Breite Admin-Listen brauchen mittelfristig Pagination.
