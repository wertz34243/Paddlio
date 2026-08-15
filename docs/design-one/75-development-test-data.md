# Development Test Data

## Schutzregeln

Der Development-Seed blockiert Production-Projekte hart. Er verlangt:

- `VITE_APP_ENV` oder `APP_ENV` = `development`
- `PADDLIO_SEED_ALLOW_DEVELOPMENT=true`
- Development-Projekt-Ref `nlllqsfdhfiwticrcrnp`
- gültige Development Supabase URL
- Development Service-Role-Key

Production-Ref `twlkhfbrrwjwppxinmpn` wird blockiert.

## Testprofile

Der Seed erzeugt bzw. aktualisiert:

- `dev.admin@paddlio.test`
- `dev.clubadmin@paddlio.test`
- `dev.coach@paddlio.test`
- `dev.athlete1@paddlio.test`
- `dev.athlete2@paddlio.test`
- `dev.athlete3@paddlio.test`

## Kalenderdaten

Die aktuelle Woche enthält jetzt realistische Trainingsdaten:

- Montag: K1 GA1 Grundlagenfahrt, 90 min
- Dienstag: Kraftausdauer Zirkel, 60 min
- Mittwoch: K1 Technik Aufwaertstore, 90 min
- Donnerstag: Regeneration und Beweglichkeit, 45 min
- Freitag: C1 Technik Linie und Druck, 75 min
- Samstag: Wettkampfsimulation U14, 120 min

Zusätzlich:

- Vereinsabend als Termin
- Trainingslagerblock
- abgesagtes Training
- abgeschlossenes Feedbacktraining
- Wiederholungsserie

## Individuelle und Trainerdaten

Der Seed ergänzt:

- Athlete-Override-Hinweis für Athlete 2 im Techniktraining
- Feedback für ein abgeschlossenes Training
- Traineraufgaben: Strecke aufbauen, Video aufnehmen, Zeiten erfassen, Material prüfen
- Gruppenmitgliedschaften in `group_members` und optional `group_memberships`

## Ausführung

In dieser Shell wurde der Seed nicht ausgeführt, weil kein `SUPABASE_SERVICE_ROLE_KEY` gesetzt war. Das ist korrekt: ohne Development-Service-Role-Key darf der Seed keine Daten schreiben.

