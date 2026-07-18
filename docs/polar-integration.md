# Paddlio Polar Integration

Paddlio verbindet Polar über Polar AccessLink OAuth2. Der Browser erhaelt keine Polar-Tokens. OAuth, Tokenablage, Token-Erneuerung und Sync laufen über serverseitige API-Endpunkte unter `/api/polar/*`.

## Supabase

Diese Migration muss auf der bestehenden Datenbank ausgeführt sein:

`supabase/migrations/0028_polar_integration.sql`

Sie ergaenzt:

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

1. Nutzer oeffnet `Mehr -> Integrationen -> Polar`.
2. `Polar verbinden` ruft `/api/polar/start` auf.
3. Paddlio erzeugt einen kurzlebigen OAuth-State in `polar_oauth_states`.
4. Polar leitet nach `/api/polar/callback` zurück.
5. Paddlio tauscht den Code gegen ein Token und speichert Access- und Refresh-Token verschluesselt.
6. `Jetzt synchronisieren` ruft `/api/polar/sync` auf.
7. Vor dem Sync erneuert Paddlio ablaufende Access-Tokens serverseitig mit dem Refresh-Token.
8. Paddlio liest Polar-Trainings, verhindert Duplikate per `user_id + provider_activity_id` und schreibt:
   - `polar_training_imports`
   - `external_training_sessions`
   - Status in `device_connections` und `external_connections`

## Trainingsabgleich

Importierte Polar-Einheiten werden lokal auch als Trainingstagebuch-Eintrag angelegt. Das Datum wird aus dem Polar-Zeitstempel als lokaler Kalendertag erzeugt, nicht per UTC-Slice.

Wenn eine Polar-Einheit zu einer geplanten Paddlio-Einheit passen könnte, zeigt die UI nur einen Vorschlag. Automatisches Zusammenfuehren passiert nicht, solange die Zuordnung unsicher ist.

Kriterien für Vorschläge:

- gleicher lokaler Kalendertag
- gleicher Sportler
- aehnliche Dauer
- grob passende Trainingsart

## Fehlerbehandlung

Die UI unterscheidet wichtige Fehler:

- Verbindung abgelaufen
- Token konnte nicht erneuert werden
- Polar lehnt die Anfrage ab
- Polar begrenzt Anfragen
- Polar ist nicht verbunden
- Nutzer muss sich erneut anmelden

Technische Details bleiben in der Konsole, Nutzer sehen verstaendliche Meldungen.

## Vorbereitete Erweiterungen

Die Adapter-Struktur liegt in `src/features/integrations/deviceAdapters.ts` und bereitet Garmin, Apple Health, Strava, Coros und Suunto vor.

## Grenzen

- Webhook-Sync ist vorbereitet, aber noch nicht aktiv verdrahtet.
- Polar AccessLink liefert je nach Sportart und Datenschutzeinstellung nicht immer GPS, HR-Samples oder Training Benefit.
- Trainerzugriff auf Polar-Daten ist RLS-seitig nur über Vereinskontext vorbereitet. Eine ausdrueckliche Freigabe pro Sportler bleibt für eine spätere Version sinnvoll.
