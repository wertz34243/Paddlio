# Supabase Setup fuer Paddlio

Paddlio 3.0.1 bereitet Supabase vor, schaltet die App aber noch nicht vollstaendig auf Cloud-Daten um. Ohne Supabase-Variablen laeuft Paddlio weiterhin mit LocalStorage.

## Benoetigte Environment Variablen

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
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
3. `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` eintragen.
4. Deployment neu starten oder einen neuen Commit deployen.

## Migration ausfuehren

Die erste Migration liegt unter:

```text
supabase/migrations/0001_initial_schema.sql
```

Mit Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Alternativ kann die SQL-Datei im Supabase SQL Editor ausgefuehrt werden.

## Tabellen

Die Migration legt diese Tabellen an:

- `profiles`
- `clubs`
- `club_requests`
- `trainer_requests`
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

## Sicherheit

Die Migration aktiviert Row Level Security fuer alle App-Tabellen und legt erste Policies fuer Athlete, Coach, TeamAdmin und Admin an. Diese Policies sind die Grundlage fuer Version 3.0, muessen aber vor produktiver Vereinsnutzung mit echten Testnutzern und Supabase Auth End-to-End geprueft werden.
