# Paddlio Polar Integration

Paddlio verbindet Polar über Polar AccessLink OAuth2. Der Browser erhält keine Polar-Tokens. OAuth, Tokenablage und Sync laufen über serverseitige API-Endpunkte unter `/api/polar/*`.

## Supabase

Diese Migration muss auf der bestehenden Datenbank ausgeführt sein:

`supabase/migrations/0028_polar_integration.sql`

Sie ergänzt:

- `device_connections`
- `polar_accounts`
- `polar_oauth_states`
- `polar_sync_jobs`
- `polar_training_imports`
- zusätzliche Felder auf `external_training_sessions`

Die Tabelle `polar_accounts` hat bewusst keine Frontend-Policies. Tokens werden nur serverseitig mit `SUPABASE_SERVICE_ROLE_KEY` gelesen und geschrieben.

## Vercel Environment Variables

Erforderlich:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POLAR_CLIENT_ID`
- `POLAR_CLIENT_SECRET`
- `POLAR_REDIRECT_URI`
- `POLAR_TOKEN_ENCRYPTION_KEY`
- `POLAR_APP_RETURN_URL`

`POLAR_TOKEN_ENCRYPTION_KEY` sollte ein 32-Byte-Key sein, z. B. als Base64 oder 64-stelliger Hex-String.

`POLAR_REDIRECT_URI` muss exakt auch im Polar AccessLink Admin Portal eingetragen sein, z. B.:

`https://paddlio.vercel.app/api/polar/callback`

## Ablauf

1. Nutzer öffnet `Mehr -> Integrationen -> Polar`.
2. `Polar verbinden` ruft `/api/polar/start` auf.
3. Paddlio erzeugt einen kurzlebigen OAuth-State in `polar_oauth_states`.
4. Polar leitet nach `/api/polar/callback` zurück.
5. Paddlio tauscht den Code gegen ein Token und speichert es verschlüsselt.
6. `Jetzt synchronisieren` ruft `/api/polar/sync` auf.
7. Paddlio liest Polar-Trainings, verhindert Duplikate per `user_id + provider_activity_id` und schreibt:
   - `polar_training_imports`
   - `external_training_sessions`
   - Status in `device_connections` und `external_connections`

## Vorbereitete Erweiterungen

Die Adapter-Struktur liegt in `src/features/integrations/deviceAdapters.ts` und bereitet Garmin, Apple Health, Strava, Coros und Suunto vor.

## Grenzen

- Webhook-Sync ist vorbereitet, aber noch nicht aktiv verdrahtet.
- Polar AccessLink liefert je nach Sportart/Datenschutz nicht immer GPS, HR-Samples oder Training Benefit.
- Trainerzugriff auf Polar-Daten ist RLS-seitig nur über Vereinskontext vorbereitet. Eine ausdrückliche Freigabe pro Sportler sollte vor externer Beta ergänzt werden.
