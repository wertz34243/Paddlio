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
- Trainings für heute und diese Woche
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

## Schnellstart in PowerShell

Wichtig: Die Project URL muss so aussehen:

```text
https://DEIN-PROJEKT-REF.supabase.co
```

Falls du aus Supabase versehentlich diese REST-URL kopierst, ist das ab jetzt auch ok:

```text
https://DEIN-PROJEKT-REF.supabase.co/rest/v1/
```

Der Script bereinigt sie automatisch.

PowerShell:

```powershell
cd C:\Users\horst.DESKTOP-7IMUPAD\Documents\PaddeleMotion
$env:VITE_APP_ENV="development"
$env:PADDLIO_SEED_ALLOW_DEVELOPMENT="true"
$env:PADDLIO_DEV_SUPABASE_PROJECT_REF="nlllqsfdhfiwticrcrnp"
$env:SUPABASE_URL="https://nlllqsfdhfiwticrcrnp.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="DEIN_DEV_SERVICE_ROLE_KEY"
$env:PADDLIO_DEV_TEST_PASSWORD="CDxe4yhvOAZWAtifXc!9"
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

Passwort:

```text
CDxe4yhvOAZWAtifXc!9
```

## Wenn DNS/Fetch fehlschlägt

Wenn PowerShell meldet:

```text
ENOTFOUND ...supabase.co
```

dann ist die Supabase-Projektadresse nicht erreichbar. Dann ist nicht das Passwort falsch, sondern eine dieser Sachen:

- Projekt-Ref ist falsch kopiert.
- Supabase-Projekt ist pausiert oder nicht fertig bereitgestellt.
- Supabase zeigt eine andere Project URL als erwartet.
- DNS/Netzwerk blockiert die Domain.

Prüfung:

```powershell
nslookup DEIN-PROJEKT-REF.supabase.co
```

Wenn `Non-existent domain` kommt, kann der Seed nicht funktionieren.

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

## Nicht enthalten

- keine Production-Daten
- keine echten Nutzer
- keine echten Polar-Tokens
- keine Passwörter im Repository
- keine Migrationen
