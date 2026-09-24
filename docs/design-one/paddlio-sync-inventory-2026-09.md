# Paddlio Sync-Inventur (Develop, 24.09.2026)

## Bewertungsgrundlage

- **A - Voll synchronisiert:** Cloud-Codepfad, geräteübergreifender Aktualisierungspfad und geeigneter Test sind vorhanden.
- **B - Teilweise synchronisiert:** Cloud-Persistenz existiert, aber mindestens ein Feld, Delete-, Offline-, Realtime- oder Testpfad ist unvollständig.
- **C - Nur lokal:** Daten werden im lokalen `PaddleMotionData`/Local Storage gehalten, ohne verlässliche Cloud-Persistenz.
- **D - Nicht implementiert/unklar:** Kein belastbarer vollständiger Produktpfad erkennbar.

Eine Supabase-Tabelle allein zählt nicht als vollständiger Sync. Der öffentliche Develop-Build liefert den Status-Fix `fa6be9e` und den Service Worker `paddlio-shell-v5.0.1-sync-fix`; echte physische Mehrgerätetests bleiben offen.

## P0-Härtung vom 24.09.2026

- Cloud-Leseergebnisse unterscheiden jetzt **erfolgreich leer** von **fehlgeschlagen**. Erfolgreich leere Listen ersetzen den lokalen Cache; nur ein markierter Ladefehler verwendet den Cache als Fallback.
- Offline-Queues liegen unter `paddlio_sync_queue:<userId>`. Flush, Zähler und Status berücksichtigen ausschließlich den aktiven Nutzer.
- Alte globale Queue-Einträge werden nur migriert, wenn ihre Eigentümerschaft eindeutig dem aktiven Nutzer entspricht. Nicht eindeutig zuordenbare Einträge bleiben verlustfrei unter `paddlio_sync_queue:unscoped` quarantänisiert und werden nie unter einem fremden Konto gesendet.
- Der zentrale Cloud-Write-Wrapper queued Offline-, Netzwerk-, Timeout- und temporäre Serverfehler. RLS-, Auth-, Foreign-Key-, Validierungs- und Constraintfehler werden als nicht retrybar beendet.
- Explizite Cloud-Deletes wurden für Trainingsvorlagen, Journal, Material und Wettkämpfe ergänzt. Trainings verwenden weiterhin Tombstones, Anwesenheit und Academy-Favoriten ihre fachlichen Deletes.
- Automatisiert bestätigt: Account-Isolation, Rückkehr zur ursprünglichen Queue, Legacy-Quarantäne, Cloud-empty, Cloud-failure-Fallback, transienter Online-Write und nicht retrybarer Write.

## A. Aktueller Fehler `training_plan_items`

### Root Cause

Die App kennt die Statuswerte `completed`, `partially_completed` und `in_progress`, die ursprüngliche Datenbank-Constraint aber nur `planned`, `done`, `skipped` und `cancelled`. Das Mapping war bereits vorhanden, aber alte Queue-Einträge mit fünf Fehlversuchen wurden vor dem Cloud-Write übersprungen. Die Payload war beim Lesen repariert, der Eintrag blieb jedoch durch `retryCount >= 5` dauerhaft blockiert. Ein unveränderter PWA-Cache konnte zusätzlich alten JavaScript-Code weiterverwenden.

### Fix

- Kompatibilitätsmapping bei direktem Training-Write, Queue-Einreihung, Queue-Lesen und unmittelbar vor dem Flush.
- Einmalige Reparaturversion reaktiviert vorhandene `training_plan_items`-Queueeinträge ohne Datenverlust.
- `completed`/`partially_completed` werden als `done`, `in_progress`/unbekannt als `planned` gesendet.
- Pending und Failed werden getrennt gezählt; Failed führt zu `Teilweise synchronisiert`.
- Technische SQL-Fehler bleiben in Development-Logs, nicht in der normalen UI.
- Service Worker nutzt für App-Bundles network-first und einen neuen Cache-Namen.

### Tests

- 93 Unit-Tests bestanden.
- Alter Eintrag `partially_completed`, `failed`, Retry 5 wird als `done` übertragen und danach aus der Queue entfernt.
- Build und `check:beta` bestanden.
- Rollen-/Sync-E2E: 9 bestanden, 1 mobiler Mehrgerätefall planmäßig übersprungen.

## B. Produktweite Matrix

| Bereich | Lokal | Cloud | Realtime | Offline Queue | Löschen Sync | Multi-Gerät | Status |
|---|---|---|---|---|---|---|---|
| Auth/Session | Supabase Session + lokaler Cache | Supabase Auth | Auth Events | nicht erforderlich | Logout lokal/Cloud | Auth-E2E vorhanden | **A** |
| Profil/Einstellungen | `PaddleMotionData`, Local Storage | `profiles`, `profile_data` | Profil für Nutzer/Club abonniert | Profiländerungen nicht konsequent queued | kein Profil-Delete | Codepfad; echter Offline-Test offen | **B** |
| Rollen/Verein | lokaler User wird aus Cloudprofil aufgebaut | `profiles`, `club_memberships`, `clubs` | Profile/Club teilweise | Admin-Zuweisungen direkt, nicht vollständig queued | Status statt vollständigem Delete | Rollen-E2E vorhanden | **B** |
| Geplante Trainings/Kalender | `data.plan` | `training_plan_items` | Nutzer- und Club-Abos | ja, inklusive Statusreparatur | Tombstone vorhanden | Zwei-Rollen-E2E vorhanden; Live-Deploy offen | **B** |
| Trainingsvorlagen | `trainingTemplates` | `training_templates` | kein aktives Abo | Upsert/Delete accountgebunden | Hard Delete vorhanden | Reload/Empty-Cloud automatisiert; Live-Realtime offen | **B** |
| Wochen-/Saisonvorlagen | statische Programmbausteine | keine eigene Persistenz | nein | nein | nicht relevant | erzeugte Trainings synchronisieren | **D** |
| Zuweisung/Planner | Planfelder + Metadaten in Notes | Plan-Spalten und Metadaten | über Trainingsabo | über Plan-Queue | mit Training | Coach→Athlete E2E vorhanden | **B** |
| Durchführung | Legacy `data.training`; Ist-Daten auch Journal | Legacy Sessions nicht vollständig; Journal vorhanden | Journal nur Nutzerabo | Journal-Upsert ja | kein vollständiger Delete | Teilfluss getestet | **B/C** |
| Athleten-/Trainerfeedback | `trainingFeedback` | `training_feedback` | Nutzer und Club | Upsert ja | kein fachlicher Delete | Coach/Athlete-E2E und Dedupe-Test | **A** |
| Journal | `journal` | `training_journal_entries` | Nutzerabo, Coach-Club unvollständig | Upsert/Delete accountgebunden | Hard Delete vorhanden | Reload/Empty-Cloud automatisiert; Rollen-Live offen | **B** |
| Gruppen/Mitglieder | `coachGroups`, `coachAthletes` | `training_groups`, `group_members`, `group_memberships` | teilweise | direkte Mutationen nicht queued | direkte Deletes | Rollen-E2E, Offline offen | **B** |
| Nachrichten | lokale Threads | `direct_messages`, `group_messages`, `club_messages` | Direct/Group teilweise | Upserts ja | Soft-Delete-Konfiguration, UI unvollständig | kein vollständiger E2E | **B** |
| Aufgaben | lokale Tasks/Assignments | `tasks`, `task_assignments` | Club/User teilweise | Upserts ja | Task Tombstone konfiguriert, UI unvollständig | offen | **B** |
| Anwesenheit | `trainingAttendance` | `training_attendance` | Nutzer/Club | Upsert/Delete ja | Hard Delete mit Rollen-/Endzeit-RLS | Code-/Unit-Test, echtes Gerät offen | **B** |
| Club/Vereinsportal | lokale Clublisten | Club-, Boat-, Event-, Document-, Settings-Tabellen | nur Teilmengen | Upsert ja | überwiegend kein Delete | offen | **B** |
| Persönliches Material | `material` | `materials` | nein | Upsert/Delete accountgebunden | Hard Delete vorhanden | Empty-Cloud automatisiert; echtes Gerät offen | **B** |
| Vereinsmaterial/Boote | `clubMaterial`, `clubBoats` | `club_material`, `boats` | nein | Upsert ja | kein Delete | offen | **B** |
| Polar | lokaler Spiegel | Server-API + External-/Polar-Tabellen | Funktionen vorhanden, nicht im AuthProvider aktiviert | Teilpfade | Disconnect serverseitig | echte Polar-Umgebung offen | **B** |
| Wettkampf/Ergebnisse/Bestzeiten | lokale Listen | `competitions`, `competition_results`, `personal_bests` | Analyse-Abo vorhanden, nicht aktiviert | Upserts/Delete accountgebunden | Wettkampf-Delete vorhanden; Ergebnis-Nebenpfade teilweise | Empty-Cloud automatisiert; echtes Gerät offen | **B** |
| Academy | Inhalte und Nutzerzustände lokal gespiegelt | Academy-Tabellen | Funktion vorhanden, nicht aktiviert | Fortschritt/Favoriten/Versuche ja | Favorit Delete ja | offen | **B** |
| Import/Export | Importergebnis zunächst lokal | Jobs/Profile/Rows/Exports Cloud | nein | Metadaten ja | nein | importierte Zieldaten nur über nachfolgenden Snapshot | **B** |
| Benachrichtigungen | lokale Liste | `notifications` | aktives Nutzerabo | Insert/Read ja | kein Delete | Codepfad, E2E offen | **B** |
| Smart Coach | lokale Empfehlungen | `smart_coach_recommendations` | Analyse-Abo nicht aktiviert | Upsert ja | kein Delete | offen | **B** |
| Onboarding-/UI-Zustände | Local Storage | keine Cloud | nein | nein | lokal | geräteabhängig | **C** |

## Technische Querschnittsbefunde

### Lokale Quelle

Die App speichert einen vollständigen Snapshot pro Nutzer in Local Storage. Das ist für Offline-Start hilfreich, erzeugt aber Konfliktrisiken, wenn Cloud-Leerstände nicht als gültige Wahrheit behandelt werden.

### Cloud Merge

Cloud-Collections verwenden eine gemeinsame Read-Semantik. Ein erfolgreiches `[]` ist die Cloud-Wahrheit und leert den lokalen Spiegel. Nur ein explizit als fehlgeschlagen markiertes Ergebnis greift auf den lokalen Cache zurück.

### Offline Queue

Die Queue ist pro Account partitioniert. Zentrale Write-Pfade für Training, Vorlagen, Journal, Material, Kommunikation, Clubportal, Academy, Import/Export, Benachrichtigungen, Ziele, Ergebnisdaten, Beta und Smart Coach verwenden den gemeinsamen Retry-Wrapper oder einen gehärteten fachlichen Pfad. Direkte administrative Mehrtabellen-Operationen bleiben als P1 separat zu vereinheitlichen.

### Realtime

Training, Feedback, Benachrichtigungen und Teile des Team-Bereichs sind aktiv abonniert. Academy-, Polar- und Analyse-Abos existieren als Funktionen, werden im `AuthProvider` jedoch nicht registriert. Viele Club-/Materialtabellen haben keinen aktiven Realtime-Refresh.

### Konflikte und Deduplizierung

- Training: ID-Upsert, Tombstones und Event-Dedupe vorhanden.
- Feedback: fachlicher Unique-Key und Upsert vorhanden.
- Journal: fachlicher Upsert bei verknüpftem Training vorhanden.
- Andere Bereiche verwenden überwiegend `serverWins` oder ID-Upsert, aber ohne durchgehende Konflikttests.

## Prioritäten

### P0 - kritisch

Die im Audit identifizierten Code-P0-Punkte sind geschlossen. Vor einer Freigabe bleibt als operatives Gate ein echter Accountwechsel- und Multi-Gerät-Test mit Dev-Cloud auf iPhone/iPad/Desktop. Das ist kein bekannter offener Codepfad, aber ein noch ausstehender Nachweis unter realer Browser-, PWA- und Realtime-Umgebung.

### P1 - wichtig

1. Academy-, Polar- und Analyse-Realtime-Abos tatsächlich im Auth-Lebenszyklus registrieren.
2. Journal und Durchführung für Coach-/Gruppensicht geräteübergreifend vervollständigen.
3. Gruppen-/Mitgliedschaftsänderungen offline queuebar und atomar machen.
4. Importierte Zieldaten unmittelbar über die jeweiligen fachlichen Cloud-Services persistieren, nicht nur auf einen späteren Snapshot vertrauen.
5. Multi-Geräte-E2E für Anwesenheit, Nachrichten, Aufgaben, Wettkampf, Academy und Notifications ergänzen.

### P2 - Komfort

1. Profilbild, Sprache, Maßeinheiten und UI-Einstellungen mit klarer Feldstrategie und Offline-Queue versehen.
2. Onboarding-/UI-Präferenzen optional accountgebunden synchronisieren.
3. Einheitliche Diagnoseansicht für Admin/Development mit Bereich, Queue-ID, Retryzahl und Fehlerklasse anbieten.

## Empfohlene Reihenfolge

1. Cloud-Merge-Semantik und accountgebundene Queue beheben.
2. Einheitlichen `cloudWriteOrQueue`-Wrapper für alle Services einführen.
3. Delete-/Tombstone-Matrix schließen.
4. Fehlende Realtime-Abos aktivieren.
5. Danach echte Multi-Geräte-Testmatrix mit Admin, Coach und Athlete auf iPhone, iPad und Desktop durchführen.

## Manuell nach dem Deploy zu prüfen

1. PWA vollständig schließen und online neu öffnen; Service Worker muss `paddlio-shell-v5.0.1-sync-fix` melden.
2. Alter Queue-Eintrag muss automatisch von `failed` zu Retry wechseln.
3. Cloudstatus muss anschließend `0 ausstehend / 0 fehlgeschlagen` oder bei einem anderen Fehler `Teilweise synchronisiert` zeigen.
4. Dasselbe Konto parallel auf Phone und Desktop öffnen und eine Trainingsstatusänderung beobachten.
5. Danach Admin→Coach und Coach→Athlete mit realen Dev-Konten prüfen.
