# Paddlio RLS Matrix

Stand: Paddlio 5.0 Beta-Stabilisierung, Migration `0031_role_rls_beta_hardening.sql`.

Grundregel: Frontend-Rollen dienen nur der Bedienung. Zugriff auf produktive Daten muss über Supabase RLS, sichere Serverfunktionen oder Edge Functions abgesichert sein. `service_role` darf nicht im Client verwendet oder sichtbar dokumentiert werden.

| Ressource | Aktion | Athlete | Coach | ClubAdmin | Admin | Fremder Verein |
| --- | --- | --- | --- | --- | --- | --- |
| `profiles` | SELECT | eigenes Profil | eigene/zugeordnete Vereinsdaten, soweit Policy erlaubt | eigener Verein | alle relevanten Profile | nein |
| `profiles` | UPDATE | eigenes Profil ohne Rolleneskalation | eigenes Profil | Vereinsdaten nach Rolle, keine Systemadmin-Eskalation | ja | nein |
| `clubs` | SELECT | aktive Vereine | aktive/eigene Vereine | eigener Verein | alle aktiven/adminrelevanten Vereine | nur aktive öffentliche Vereinsdaten |
| `club_memberships` | SELECT | eigene Mitgliedschaft | eigene Gruppen/Vereinskontext | eigener Verein | alle | nein |
| `club_memberships` | INSERT/UPDATE | nein | nein, außer explizit freigegebene Coach-Funktionen | eigener Verein ohne Systemadmin-Eskalation | ja | nein |
| `training_groups` | SELECT | eigene Gruppen | eigene/Club-Gruppen | eigener Verein | alle | nein |
| `group_memberships` | SELECT | eigene Gruppenmitgliedschaft | eigene Gruppen und Athleten | eigener Verein | alle | nein |
| `training_plan_items` | SELECT | eigene oder Gruppentrainings | eigene Athleten/Gruppen im Verein | eigener Verein | alle | nein |
| `training_plan_items` | INSERT/UPDATE | eigene freie Trainings, soweit erlaubt | eigene Athleten/Gruppen im Verein | eigener Verein | alle | nein |
| `training_plan_items` | DELETE | eigene freie Trainings | eigene Trainings/Coach-Kontext | eigener Verein | alle | nein |
| `training_feedback` | SELECT | eigenes Feedback | Feedback eigener Athleten/Gruppen | eigener Verein | alle | nein |
| `training_feedback` | INSERT/UPDATE | eigenes Feedback | Trainerantwort im eigenen Kontext | eigener Verein | alle | nein |
| `direct_messages` | SELECT | eigene Konversationen | eigene Konversationen/erlaubte Athleten | eigener Verein nach Fachkontext | alle | nein |
| `direct_messages` | INSERT/UPDATE | eigene Konversationen | eigene Konversationen/erlaubte Athleten | eigener Verein nach Fachkontext | alle | nein |
| `competitions` | SELECT | eigene oder freigegebene Club-Wettkämpfe | eigener Verein | eigener Verein | alle | nein |
| `competitions` | INSERT/UPDATE/DELETE | eigene Wettkämpfe, wenn Policy erlaubt | eigener Verein | eigener Verein | alle | nein |
| `competition_results` | SELECT | eigene Ergebnisse | Ergebnisse eigener Vereinsathleten | eigener Verein | alle | nein |
| `academy_*` Inhalte | SELECT | veröffentlichte globale/eigene Vereinsinhalte | veröffentlichte globale/eigene Vereinsinhalte | eigener Verein | alle berechtigten Inhalte | nein |
| `academy_progress` | SELECT/WRITE | eigener Fortschritt | nur bei legitimer Zuordnung, nicht pauschal | eigener Verein nur fachlich notwendig | alle nach Adminpolicy | nein |
| `academy_assignments` | SELECT | eigene Zuweisungen | selbst vergebene/eigene Gruppen | eigener Verein | alle | nein |
| `import_jobs` / `import_rows` | SELECT | eigene Jobs | eigene/berechtigte Vereinsjobs | eigener Verein | alle | nein |
| `import_profiles` | SELECT | Systemprofile/eigene Profile | Systemprofile/eigene/Vereinsprofile | eigener Verein | alle | nein |
| `export_jobs` | SELECT | eigene Exporte | eigene/berechtigte Vereinsjobs | eigener Verein | alle | nein |
| `device_connections` | SELECT/WRITE | eigene Verbindung | eigene Verbindung | eigene Verbindung | administrative Einsicht | nein |
| `polar_training_imports` | SELECT | eigene Polar-Daten | nur berechtigte Vereinsathleten | eigener Verein nach Policy | alle | nein |
| `polar_accounts` / `polar_oauth_states` | SELECT/WRITE | nein im Client | nein im Client | nein im Client | nur serverseitig | nein |

## Phase-6-Korrekturen

- Die historische offene Competition-Policy `competitions_authenticated_select` wird in `0031_role_rls_beta_hardening.sql` entfernt. Die späteren, engeren Competition-Policies bleiben maßgeblich.
- Akademie-Untertabellen (`academy_learning_path_items`, `academy_quizzes`, `academy_quiz_questions`) sind nicht mehr pauschal mit `using (true)` lesbar, sondern nur noch über lesbare Kurse/Lektionen.
- Akademie-Medien und Lernpfade sind auf globale oder eigene Vereinsinhalte begrenzt.
- `check:rls` verhindert clientseitige `service_role`-Hinweise und prüft, dass die RLS-Härtungsmigration vorhanden ist.

## Noch manuell in Supabase zu prüfen

Diese Matrix ersetzt keine produktive RLS-Abnahme. Vor externer Beta müssen die Policies mit echten Testnutzern geprüft werden:

- Athlete aus Verein A gegen Coach/Admin-Daten.
- Coach aus Verein A gegen Verein B.
- ClubAdmin gegen Systemadmin-Rollenvergabe.
- Training erstellen, Feedback schreiben, Nachricht senden, Training löschen.
- Akademie-Fortschritt und Zuweisungen zwischen Coach und Athlete.
