# Paddlio Project Analysis

## Stand Version 3.1

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

## Datenmodelle in Nutzung

- `profiles`: Nutzerprofil, Rollen, Status, Verein, Bootsklassen.
- `clubs`: offizielle Vereine.
- `club_requests`: Vereinsvorschlaege aus Registrierung.
- `trainer_requests`: Trainerfreigaben.
- `training_groups`: Vereinsgruppen.
- `group_members`: Gruppenzuordnungen.

## Naechste Risiken

- Die produktive Admin-Bootstrap-Strategie muss dauerhaft geregelt werden, ohne automatische Adminrolle bei Registrierung.
- Supabase Auth Rate Limits brauchen fuer reale Tests ein sauberes SMTP-/Limit-Setup.
- Trainer-Notizen und Sportlerstatus sollten spaeter als eigene Cloud-Tabelle statt Profilstatus modelliert werden.
- Breite Admin-Listen brauchen mittelfristig Pagination.
