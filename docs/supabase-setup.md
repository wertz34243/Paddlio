# Supabase Setup fuer Paddlio

Paddlio 3.0.1 bereitet Supabase vor, schaltet die App aber noch nicht vollstaendig auf Cloud-Daten um. Ohne Supabase-Variablen laeuft Paddlio weiterhin mit LocalStorage.

## Benoetigte Environment Variablen

Paddlio ist fest auf dieses Supabase-Projekt vorbereitet:

- Projekt-ID: `twlkhfbrrwjwppxinmpn`
- Project URL: `https://twlkhfbrrwjwppxinmpn.supabase.co`

Die URL ist im Client als Default eingetragen. Der Publishable Key wird weiterhin per Environment Variable geladen:

```env
VITE_SUPABASE_URL=https://twlkhfbrrwjwppxinmpn.supabase.co
VITE_SUPABASE_ANON_KEY=DEIN_PUBLISHABLE_KEY
```

Keine geheimen Service-Role-Keys im Frontend, in der README oder in Vercel Public Environments speichern.

## Lokal einrichten

1. Im Projekt eine Datei `.env.local` erstellen.
2. Die Werte aus dem Supabase Project eintragen.
3. Den lokalen Server neu starten:

```bash
npm run dev
```

Wenn die Variablen fehlen, bleibt die Cloud-Schicht deaktiviert und Paddlio nutzt LocalStorage.

## Vercel einrichten

1. Vercel Project Settings oeffnen.
2. `Environment Variables` waehlen.
3. `VITE_SUPABASE_ANON_KEY` exakt mit diesem Namen eintragen.
4. Die Variablen fuer `Production`, `Preview` und `Development` aktivieren.
5. Deployment neu starten oder einen neuen Commit deployen.

Wenn die App `Supabase ist noch nicht vollstaendig konfiguriert` anzeigt, fehlt im ausgelieferten Vite-Build der Publishable Key. Vite liest nur Variablen mit dem Prefix `VITE_` ueber `import.meta.env`.

## Migration ausfuehren

Die erste Migration liegt unter:

```text
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_auth_integration.sql
supabase/migrations/0003_cloud_sync.sql
```

Mit Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Alternativ kann die SQL-Datei im Supabase SQL Editor ausgefuehrt werden.

## Tabellen

Die Migrationen legen diese Tabellen und Auth-Helfer an:

- `profiles`
- `clubs`
- `club_requests`
- `trainer_requests`
- `training_templates`
- `training_groups`
- `group_members`
- `season_goals`
- `training_plan_items`
- `training_feedback`
- `competitions`
- `competition_results`
- `materials`
- `notifications`
- `audit_logs`
- Trigger `on_auth_user_created`, der bei Registrierung automatisch ein Profil erstellt
- Funktion `default_roles_for_email`, die `T.Kanu@outlook.com` als Athlete, Coach und Admin vorbereitet

## Sicherheit

Die Migration aktiviert Row Level Security fuer alle App-Tabellen und legt erste Policies fuer Athlete, Coach, TeamAdmin und Admin an. Diese Policies sind die Grundlage fuer Version 3.0, muessen aber vor produktiver Vereinsnutzung mit echten Testnutzern und Supabase Auth End-to-End geprueft werden.

Ab Version 3.0.2 ruft React Supabase nicht direkt in Seitenkomponenten auf. Auth laeuft ueber `AuthProvider`, Datenzugriffe laufen ueber Services unter `src/services/`.
