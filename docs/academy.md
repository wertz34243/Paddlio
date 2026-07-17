# Paddlio Akademie

Die Paddlio Akademie ist als eigener Lernbereich vorbereitet und bleibt fachlich vom Trainingsbereich getrennt.

## Einstieg

- App: `Mehr -> Akademie`
- Kontext: Training kann passende Techniklektionen öffnen und wieder in den Trainingsplan führen.
- Keine zusätzliche Bottom-Navigation. Die Hauptnavigation bleibt `Heute`, `Training`, `Analyse`, `Team`, `Mehr`.

## Inhalte

Die erste Ausbaustufe enthält acht Hauptkategorien:

- Technik
- Kraft & Stabilisation
- Koordination
- Ausdauer
- Mentaltraining
- Sicherheit & Retten
- Wettkampf
- Trainerwissen

Vorbereitet sind erste Kurse für Technik-Grundlagen, Trainer-Grundlagen und Mentaltraining. Die Inhalte sind kurze Startversionen oder Entwürfe, keine vollständige Lernplattform.

## Funktionen

- Kategorie, Kurs und Lektion öffnen
- Lektion starten und abschließen
- Fortschritt speichern
- Lektion favorisieren
- einfache Quizversuche speichern
- Trainer können Lektionen zuweisen
- Admins sehen einen vorbereiteten Redaktionsbereich

## Datenquellen

Startinhalte liegen typisiert im Frontend unter:

- `src/features/academy/academyContent.ts`

Persönliche Zustände und Zuweisungen können in Supabase synchronisiert werden, sobald die Migration ausgeführt wurde:

- `supabase/migrations/0026_academy_module.sql`

## Supabase

Diese Datei in Supabase ausführen:

`supabase/migrations/0026_academy_module.sql`

Die Migration ist idempotent und legt Akademie-Tabellen, Indizes und RLS-Policies an. Es werden keine bestehenden Trainings-, Profil- oder Wettkampfdaten gelöscht.

## Grenzen

- Medien-Upload ist strukturell vorbereitet, aber noch kein vollständiges Medien-CMS.
- Akademie-Inhalte sind Startinhalte und als Entwurf zu verstehen.
- Vollständige Offline-Lektionen sind noch nicht aktiv.
- RLS ist für eigene Fortschritte, Favoriten, Quizversuche und Zuweisungen vorbereitet.
