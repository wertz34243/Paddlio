# Paddlio 4.0 Beta Readiness

## Beta-Check

Der Admin-Bereich `Mehr > Beta-Check` prueft und dokumentiert:

- Supabase Verbindung
- Vercel Deployment
- Login, Registrierung und Passwort-Reset
- Cloud-Sync und Offline-Fallback
- Rollen Athlete, Coach, ClubAdmin und Admin
- Trainingsplanung
- Kommunikation
- Aufgaben und Anwesenheit
- Wettkämpfe und Ergebnisse
- Analyse und Smart Coach
- Integrationen/Polar-Vorbereitung
- Feedback-System
- Mobile Navigation
- Testanleitung und bekannte Grenzen
- Datenschutz/RLS

Einige Punkte sind bewusst `manual`, weil sie im echten Supabase-/Vercel-/Geräte-Setup bestaetigt werden muessen.

## Supabase Health Check

Aktuelle App-Signale:

- `CloudStatusBadge` zeigt verbunden, synchronisiert, wartende Änderungen, offline oder Fehler.
- Admins sehen Sync-Anzahl und letzten Sync-Zeitpunkt.
- Cloud-Fehler werden in der Konsole mit `[Paddlio Cloud]` protokolliert.

## Datenschutzpruefung

Beta-Regeln:

- Athlete: nur eigene Daten.
- Coach: eigener Verein und eigene Gruppen.
- ClubAdmin: eigener Verein.
- Admin: alles.

RLS muss im Supabase Dashboard zusaetzlich geprueft werden. UI-Filter ersetzen keine serverseitigen Policies.

## Freigabe

Beta-Freigabe ist sinnvoll, wenn:

- Build grün ist.
- Vercel Deployment grün ist.
- Admin Login funktioniert.
- Feedback gespeichert werden kann.
- Ein Athlete keine Admin-/Coach-Daten sieht.
- Ein Coach keine fremden Vereine sieht.
- iPhone Layout keine verdeckten Buttons hat.
