# Phase 3.4 Sync und Datenintegrität

## Prüfumfang

Diese Phase bewertet die bestehenden Datenflüsse, ohne die Sync-Grundarchitektur, Auth, RLS oder Datenbankstruktur umzubauen.

## Erwartete Workflows

| Workflow | Erwartung | Status in diesem Lauf |
|---|---|---|
| Trainer erstellt Training, Sportler sieht Training | keine Duplikate, sichtbare Änderung auf zweitem Gerät | automatisierter Rollen-/Sync-E2E übersprungen |
| Sportler speichert Feedback, Trainer sieht Feedback | Feedback bleibt nach Reload erhalten | automatisierter Rollen-/Sync-E2E übersprungen |
| Reload nach Erstellen/Bearbeiten/Feedback | Daten bleiben erhalten | nicht vollständig mit echten Rollen nachgewiesen |
| Einzelnes Training löschen | Training kommt nach Reload nicht zurück | nicht vollständig mit echten Rollen nachgewiesen |
| Training aus Serie/Serie löschen | keine Resttermine oder Rückkehr alter Daten | nicht vollständig mit echten Rollen nachgewiesen |
| Woche/Block kopieren | neue IDs, keine ungewollten Referenzen | nicht vollständig mit echten Rollen nachgewiesen |

## Automatisierte Tests

- `npm.cmd run test:e2e`: 8 bestanden, 8 übersprungen.
- `npm.cmd run test:e2e:roles`: 8 übersprungen.

Grund: Die vorhandenen Rollen-/Sync-Tests benötigen `PADDLIO_E2E_*` Variablen. Diese waren in der aktuellen Shell nicht gesetzt.

## Ergebnis

Die UI- und Public-Smoke-Prüfungen sind grün. Der kritische Zwei-Geräte-Nachweis ist in diesem Lauf nicht negativ aufgefallen, aber auch nicht aktiv erbracht. Für eine externe Beta bleibt Rollen-/Sync-E2E mit gesetzten Development-Credentials ein Pflichtnachweis.
