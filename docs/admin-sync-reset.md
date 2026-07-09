# Admin Sync Reset

Dieser Reset ist für die Beta-Testbasis gedacht, wenn derselbe Supabase-Account auf PC, iPhone und iPad unterschiedliche Rollen, Vereine oder Namen zeigt.

## Warum

Paddlio nutzt Supabase als zentrale Wahrheit für Profil, Rolle, Verein und Gruppen. Wenn ältere LocalStorage-Daten oder unvollständige Profilzeilen vorhanden sind, können Geräte kurzfristig unterschiedliche lokale Fallback-Werte anzeigen. Der Testaccount `t.kanu@outlook.com` soll deshalb einmal sauber in Supabase bestätigt werden.

## Dateien

1. `supabase/CHECK_ADMIN_SYNC_STATE.sql`

   Reine Diagnose. Diese Datei ändert nichts und zeigt Auth-User, Profil, Verein, Vereinsmitgliedschaft, Gruppenmitgliedschaften und mögliche doppelte Profile.

2. `supabase/RESET_TEST_PROFILES_ADMIN.sql`

   Repariert ausschließlich den Testaccount `t.kanu@outlook.com`. Es werden keine `auth.users` gelöscht, keine Tabellen gelöscht und keine fremden Nutzer bearbeitet.

## Reihenfolge

1. `supabase/CHECK_ADMIN_SYNC_STATE.sql` im Supabase SQL Editor ausführen.
2. Ergebnis prüfen, besonders:
   - `auth_user_found`
   - `profile_found`
   - `club_found`
   - `membership_found`
   - `duplicate_profiles_found`
3. `supabase/RESET_TEST_PROFILES_ADMIN.sql` im Supabase SQL Editor ausführen.
4. Auf PC, iPhone und iPad Paddlio abmelden.
5. Browser-/App-Cache für Paddlio löschen.
6. Neu mit `t.kanu@outlook.com` anmelden.

## Erwartetes Ergebnis

Nach erfolgreichem Reset sollen PC, iPhone und iPad identisch anzeigen:

- Tobias Kuhn
- Admin
- MKC Monheim
- K1 + C1
- Cloud verbunden

## Hinweise

- Der Reset erstellt keinen Supabase-Auth-Nutzer. Der Account muss vorher über Supabase Auth existieren.
- Doppelte Profile mit derselben E-Mail werden nicht gelöscht. Wenn eindeutig zum Testaccount gehörend, werden sie nur deaktiviert, sofern `profiles.status` existiert.
- LocalStorage bleibt nur Fallback. Nach erfolgreichem Cloud-Login überschreibt Supabase die lokalen Rollen- und Vereinswerte.
