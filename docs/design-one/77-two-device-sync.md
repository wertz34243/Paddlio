# Two Device Sync

## Ziel

Nachweisbarer Flow:

1. Coach erstellt Training.
2. Athlete sieht Training.
3. Coach ändert Training.
4. Athlete sieht Änderung.
5. Athlete gibt Feedback.
6. Coach sieht Feedback.
7. Beide laden neu.
8. Daten bleiben konsistent.

## Aktueller Stand

Der E2E-Flow ist in `tests/e2e/roles-and-sync.spec.ts` vorbereitet und wurde auf aktuelle UI-Labels und Development-Testdaten angepasst.

## Blocker

Der echte Lauf konnte in dieser Shell nicht ausgeführt werden, weil folgende Variablen nicht gesetzt waren:

- `PADDLIO_E2E_COACH_EMAIL`
- `PADDLIO_E2E_COACH_PASSWORD`
- `PADDLIO_E2E_ATHLETE_EMAIL`
- `PADDLIO_E2E_ATHLETE_PASSWORD`

Optional für weitere Rollen:

- `PADDLIO_E2E_CLUBADMIN_EMAIL`
- `PADDLIO_E2E_CLUBADMIN_PASSWORD`
- `PADDLIO_E2E_ADMIN_EMAIL`
- `PADDLIO_E2E_ADMIN_PASSWORD`

## Bewertung

Zwei-Geräte-Sync ist technisch testbar vorbereitet, aber in dieser Phase nicht real nachgewiesen. Für Beta-Freigabe muss der Rollenlauf mit gesetzten Development-E2E-Variablen grün laufen.

