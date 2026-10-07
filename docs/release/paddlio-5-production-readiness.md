# Paddlio 5.0 Production Readiness

Stand: 06.10.2026

Diese technische Freigabe ist keine Rechtsberatung. Sie dokumentiert den Stand auf `develop` und Supabase DEV `nlllqsfdhfiwticrcrnp`. Production wurde nicht gelesen oder verändert.

## Release-Entscheidung

**READY FOR PRODUCTION, mit verbindlichen manuellen Go-Live-Gates.** Es bestehen nach der technischen Abnahme keine bekannten Code-, Datenintegritäts-, Auth-, RLS- oder Security-Blocker. Vor dem tatsächlichen Go-Live müssen Mail-Empfang, Production-Konfiguration, CAPTCHA und die rechtliche Textprüfung bestätigt werden. Ohne diese Bestätigungen darf nicht veröffentlicht werden.

## Auth-Sollzustand

- Passwort: mindestens 10 Zeichen, jeweils mindestens ein Großbuchstabe, Kleinbuchstabe, eine Zahl und ein Sonderzeichen. DEV erzwingt dies serverseitig; UI, Registrierung und Recovery verwenden dieselbe Policy.
- E-Mail-Bestätigung: aktiv. Bestätigungslink führt weiterhin zur Anmeldung; keine automatische Dashboard-Freigabe.
- 16+: `paddlio_before_user_created_500` läuft als Before-User-Created-Hook und blockiert fehlende, ungültige und unter 16 liegende Geburtsdaten vor dem Anlegen des Auth-Nutzers.
- Rollen: fachliche Quelle ist `public.profiles.roles` plus aktiver Profilstatus und RLS. Editierbare `user_metadata` vergeben keine Rolle.
- Leaked Password Protection: im aktuellen Free-Plan nicht verfügbar und nicht als aktiv dargestellt. Vor Go-Live Planentscheidung dokumentieren.
- MFA: für 5.0 nicht verpflichtend; es wird keine unfertige MFA-UI ausgeliefert. Optionales MFA ist ein späteres Sicherheitsupdate.
- CAPTCHA: Supabase unterstützt hCaptcha und Cloudflare Turnstile für Signup, Login und Recovery. Wegen fehlender Provider-Keys nicht vorgetäuscht oder halb aktiviert. Vor Go-Live Provider wählen, Site-/Secret-Key anlegen, DEV integrieren und End-to-End testen.
- Rate Limits: Dashboard-Werte bleiben providerseitig konfiguriert; keine unrealistischen Client-Limits. Vor Production die Auth-Rate-Limits gegen das erwartete Startvolumen prüfen.

## Datenschutz und Löschung

- Eigene Profildaten, JSON-Auskunft und serverseitige Kontolöschung sind vorhanden.
- Gemeinsame Direkt-, Gruppen-, Clubnachrichten und Clubposts werden bei Kontolöschung nicht mehr zusammen mit fremden Gesprächsverläufen gelöscht. Identitätsbezüge werden auf `NULL` gesetzt; vollständig verwaiste Direktnachrichten werden entfernt.
- Persönliche Datensätze werden wie bisher gelöscht oder von gemeinsam verwalteten Objekten getrennt.
- Aktuell existieren keine Storage-Buckets. Vor dem ersten Upload-Release muss die Kontolöschung private Storage-Objekte entfernen.

## Security Advisor

DEV meldet 22 Warnungen:

- 21 `authenticated_security_definer_function_executable`: `current_user_club_id`, `current_user_is_admin`, `current_user_is_club_manager`, `has_role`, `is_admin`, `paddlio_can_author_trainer_feedback_0041`, `paddlio_can_manage_club_415`, `paddlio_can_manage_group_415`, `paddlio_can_read_academy_course_0031`, `paddlio_can_read_academy_lesson_0031`, `paddlio_can_read_training_feedback_0024`, `paddlio_can_read_training_item_0024`, `paddlio_can_write_training_feedback_0024`, `paddlio_can_write_training_item_0024`, `paddlio_is_admin_0031`, `paddlio_is_admin_414`, `paddlio_is_admin_415`, `paddlio_is_admin_profile_sync_415`, `paddlio_user_has_club_role_0024`, `paddlio_user_has_club_role_0031`, `paddlio_visible_contact_profiles_20261002`.
- Diese Funktionen sind für RLS-Policy-Auswertung beziehungsweise den kontrollierten Kontakt-RPC erforderlich. `anon` und `public` besitzen kein EXECUTE; Triggerfunktionen sind für `authenticated` gesperrt. Ein späterer Umzug in ein nicht exponiertes Schema ist Defense-in-Depth, kein 5.0-Blocker.
- 1 `auth_leaked_password_protection`: bleibt wegen Free-Plan bewusst offen. Kompensation: starke serverseitige Passwortpolicy, E-Mail-Bestätigung, Rate Limits und CAPTCHA als Production-Gate.

## Production-Konfiguration

### Vercel und Domains

1. Release-Commit markieren und Preview vollständig prüfen.
2. `paddlio.de` der Public Site zuordnen; `www.paddlio.de` permanent dorthin weiterleiten.
3. `app.paddlio.de` der privaten PWA zuordnen; `dev.paddlio.de` bleibt DEV.
4. Public: `VITE_PUBLIC_SITE_MODE=true`, `VITE_PUBLIC_APP_URL=https://app.paddlio.de`.
5. App: ausschließlich Production-Supabase-Publishable/Anon-Konfiguration, niemals `service_role`.
6. Security-Header aus `vercel.json` beibehalten und nach Deploy real prüfen.
7. DNS nur anhand Vercels Vorgaben ergänzen. MX, SPF, DKIM, DMARC und Resend-Einträge nicht überschreiben.

### Supabase Production

1. Backup und Schema-/Migration-Historie sichern.
2. Site URL `https://app.paddlio.de`; Redirect-Allowlist `https://app.paddlio.de/**`.
3. E-Mail-Bestätigung aktiv; deutsche Confirmation-/Recovery-Templates und Custom SMTP ohne Link-Tracking testen.
4. Passwortminimum 10 und stärkste Zeichenanforderung aktivieren.
5. Before-User-Created-Hook `public.paddlio_before_user_created_500` aktivieren.
6. CAPTCHA konfigurieren und Client-Token-Flows für Signup/Login/Recovery testen.
7. Rate Limits, Sessiondauer, Refresh-Reuse-Erkennung und Secure Email Change prüfen.
8. Migrationen in kanonischer Reihenfolge nach Dry Run und Backup anwenden; RLS, Policies, Trigger, Funktionen, Realtime und Advisor danach prüfen.
9. `account-privacy` mit Production-Allow-Origin deployen; Export und Löschung nur mit entbehrlichem Production-Abnahmekonto prüfen.
10. Keine Production-Aktion ist Teil dieses Commits.

## Migrationsreihenfolge

Der Repository-Bestand umfasst 52 Migrationen. Da der letzte verlässlich dokumentierte Production-Migrationsstand nicht im Repository hinterlegt ist und Production in diesem Auftrag nicht gelesen werden durfte, ist die **Differenzmenge** vor Go-Live durch einen autorisierten Migration-Status-Check zu bestimmen. Nie alle Dateien blind erneut ausführen. Die kanonische Reihenfolge und Bewertung lautet:

| Migration | Zweck | Abhängigkeit | Risiko | Idempotenz |
|---|---|---|---|---|
| 0001 | Basisschema | keine | hoch | teilweise |
| 0002 | Auth-Integration | 0001 | hoch | teilweise |
| 0003 | Cloud-Sync-Basis | 0001-0002 | mittel | überwiegend |
| 0004 | Sync-Policies | 0003 | hoch | überwiegend |
| 0005 | Rollen-/Profil-Views | 0004 | mittel | überwiegend |
| 0006 | Trainingsplanung 2.0 | 0001-0005 | mittel | überwiegend |
| 0007 | Realtime/Notifications | 0003-0006 | mittel | überwiegend |
| 0008 | Wettkampfportal | 0001-0007 | mittel | überwiegend |
| 0009 | Smart-Coach-Daten | 0001 | niedrig | ja |
| 0010 | Vereinsportal | 0001-0009 | mittel | überwiegend |
| 0011 | Kommunikation/Team | 0010 | hoch | überwiegend |
| 0012 | Ergebnisse/Polar-Beta | 0008 | mittel | überwiegend |
| 0013 | Beta-Testdaten | 0001-0012 | niedrig | überwiegend |
| 0014 | Beta-Schema-Hotfix | 0001-0013 | hoch | überwiegend |
| 0015 | Profil-RLS-Hotfix | 0014 | hoch | überwiegend |
| 0016 | Schema-Sync 4.1.3 | 0014-0015 | hoch | überwiegend |
| 0017 | External-Beta-Readiness | 0016 | niedrig | überwiegend |
| 0018 | Rollen-Normalisierung | profiles | hoch | überwiegend |
| 0019 | Admin/Club/Gruppe | 0018 | hoch | überwiegend |
| 0020 | Profil-Sync | 0019 | hoch | überwiegend |
| 0021 | Realtime-Publication | Tabellen bis 0020 | mittel | ja |
| 0022 | Journal-Cloud-Sync | 0020 | mittel | überwiegend |
| 0023 | Wettkampf/Training | 0022 | mittel | überwiegend |
| 0024 | Training/Feedback-RLS | 0019-0023 | hoch | überwiegend |
| 0025 | Messages-/Feedback-Sichtbarkeit | 0024 | hoch | ja |
| 0026 | Academy-Modul | Rollenhelper | mittel | überwiegend |
| 0027 | Import/Export | Kernprofile | mittel | überwiegend |
| 0028 | Polar-Integration | Profile/Training | hoch | überwiegend |
| 0029 | Training-Tombstones | training_plan_items | mittel | ja |
| 0030 | Feedback-/Message-Stabilität | 0024-0025 | hoch | ja |
| 0031 | Rollen-/RLS-Härtung | 0024-0030 | hoch | überwiegend |
| 0032 | Profilfelder | profiles | niedrig | ja |
| 0033 | Wiederholungsserien | training_plan_items | niedrig | ja |
| 0034 | Signup-Profiltrigger | Auth/Profile | hoch | überwiegend |
| 0035 | sichere Vereinszuordnung | 0034/clubs | hoch | überwiegend |
| 0036 | Feedback-Idempotenz | training_feedback | hoch | überwiegend |
| 0037 | Anwesenheitslöschung | attendance/Rollen | hoch | ja |
| 0038 | DEV-Drift-Reconciliation | 0019-0037 | hoch | ja |
| 0039 | Auth-Baseline-Reconciliation | 0019/0024 | hoch | ja |
| 0040 | Feedback-Identität/RLS | 0036/0039 | hoch | ja |
| 0041 | Legacy-Trainerfeedback | 0040 | mittel | ja |
| 0042 | Profilverzeichnis-Adminpolicy | 0039 | hoch | ja |
| 0043 | P0-Schema-Reconciliation | vorherige Module | hoch | überwiegend |
| 20260925071005 | Import-/Polar-Reconciliation | 0027-0028/0043 | hoch | überwiegend |
| 20260925073000 | Competition-Results-Reconciliation | 0008/0012 | mittel | ja |
| 20261001131418 | Wettkampf-Startlisten | competitions/profiles | mittel | ja |
| 20261002061219 | stabiler Realtime-Content | Kommunikation/Profile | hoch | ja |
| 20261003071613 | Ziele/Material/Profil-Persistenz | Kernschema | mittel | ja |
| 20261004054924 | sichere Profil-Selbständerung | 0034/Profile | hoch | ja |
| 20261005134123 | Journal-Importmetadaten | 0022 | niedrig | ja |
| 20261006154000 | Security-Definer-Härtung | alle Helper | hoch | ja |
| 20261006163252 | 16+-Hook/Privacy-Anonymisierung | Auth/Messages | hoch | ja |

Dateinamen mit Zeitstempel müssen nach `0043` in der oben gezeigten lexikografischen Reihenfolge laufen. Reconciliation-Migrationen ersetzen keinen Production-Dry-Run; sie enthalten teils umfangreiche Policy-Neuanlagen.

## Rollback

1. Vor Release Git-Tag/Commit und Vercel-Deployment-ID protokollieren.
2. Vor jeder Production-Migration Supabase-Backup/PITR-Möglichkeit bestätigen.
3. Bei Frontendfehler den vorherigen Vercel-Deploy reaktivieren.
4. Migrationen mit Tabellen-/Policy-/FK-/Triggeränderungen nicht blind rückwärts ausführen. Vorwärtskorrektur bevorzugen.
5. Für `20261006163252`: Auth-Hook zuerst im Dashboard deaktivieren; FK-Rückbau nur nach Datenprüfung. Eine automatische Down-Migration ist absichtlich nicht enthalten.
6. Bei Account-Privacy-Problemen vorherige Edge-Function-Version redeployen; niemals Nutzerdaten pauschal zurücksetzen.

## Verbindliche Go-Live-Gates

- Empfang und Versand von `info@paddlio.de`, `support@paddlio.de`, `datenschutz@paddlio.de` real bestätigen.
- Rechtstexte durch den Betreiber beziehungsweise qualifizierte Stelle final prüfen.
- CAPTCHA inklusive Keys, Dashboard und drei Auth-Flows aktivieren/testen.
- Production-Migrationsdifferenz autorisiert ermitteln, Backup erstellen und Dry Run prüfen.
- Polar bleibt Beta; Connect bleibt ohne vollständige Backend-Konfiguration deaktiviert.
