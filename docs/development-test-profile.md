# Development-Testprofil

Dieses Testprofil ist ausschließlich für die Development-Umgebung gedacht.

## Ziel

Die Development-Instanz soll realistisch testbar sein, ohne Production-Daten zu berühren:

- ein Testverein
- ein Test-Admin
- ein Test-ClubAdmin
- ein Test-Coach
- drei Test-Sportler
- eine Trainingsgruppe
- Trainings für Heute und diese Woche
- Feedback
- Traineraufgaben
- Trainingsvorlagen
- ein Polar-Mock-Training

## Strikte Trennung

Production:

- Branch: `main`
- URL: `https://paddlio.vercel.app`
- echte Supabase-Daten

Development:

- Branch: `develop`
- URL: `https://paddlio-git-develop-paddlio.vercel.app`
- separates Supabase-Projekt
- Testdaten

Der Seed-Script blockiert, wenn die Supabase-URL nicht zum Development-Projekt passt.

## Benötigte Umgebungsvariablen

Diese Werte werden nicht ins Repository geschrieben.

PowerShell-Beispiel:

```powershell
$env:VITE_APP_ENV="development"
$env:PADDLIO_SEED_ALLOW_DEVELOPMENT="true"
$env:PADDLIO_DEV_SUPABASE_PROJECT_REF="nlllqsfdhfiwticrcnrp"
$env:SUPABASE_URL="https://nlllqsfdhfiwticrcnrp.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="DEIN_DEV_SERVICE_ROLE_KEY"
$env:PADDLIO_DEV_TEST_PASSWORD="EIN_SICHERES_TEST_PASSWORT"
npm.cmd run seed:development
```

Regeln:

- `SUPABASE_SERVICE_ROLE_KEY` muss aus dem Development-Supabase-Projekt kommen.
- `PADDLIO_DEV_TEST_PASSWORD` wird für alle Testkonten verwendet.
- Das Passwort muss mindestens 12 Zeichen lang sein.
- Der Script darf nicht auf Production ausgeführt werden.

## Testkonten

Der Script legt diese E-Mail-Adressen an oder aktualisiert ihre Profile:

- `dev.admin@paddlio.test`
- `dev.clubadmin@paddlio.test`
- `dev.coach@paddlio.test`
- `dev.athlete1@paddlio.test`
- `dev.athlete2@paddlio.test`
- `dev.athlete3@paddlio.test`

Das Passwort kommt ausschließlich aus `PADDLIO_DEV_TEST_PASSWORD`.

## Enthaltene Testszenarien

Training:

- Gruppenplan für U14
- heutiges Techniktraining
- GA1-Grundlagentraining
- Kraftausdauer
- Regeneration
- Wiederholungsserie mit `repeat_series_id`

Feedback:

- ein abgeschlossenes Training mit Sportlerfeedback
- Coach kann Rückmeldung prüfen

Traineraufgaben:

- Strecke aufbauen
- Video aufnehmen
- Anwesenheit erfassen

Polar:

- ein Mock-Datensatz in `external_training_sessions`
- keine echten Polar-Tokens

## Ausführen

```powershell
npm.cmd run seed:development
```

Wenn eine Sperre greift, bricht der Script mit einer klaren Fehlermeldung ab.

## Nicht enthalten

- keine Production-Daten
- keine echten Nutzer
- keine echten Polar-Tokens
- keine Passwörter im Repository
- keine Migrationen
