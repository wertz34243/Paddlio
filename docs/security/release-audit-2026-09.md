# Paddlio 5.0 Security- und Datenschutz-Audit

Stand: 06.10.2026

Dieses Dokument ist eine technische Bestandsaufnahme und kein rechtsanwaltlich gepruefter Rechtstext.

## Freigabeempfehlung

**Technischer Stand: TECHNICALLY READY mit manuellen Auth-Aufgaben.** Die automatisierten Sicherheits-, RLS-, Rollen-, Datenschutz- und Header-Pruefungen sind bestanden. Der offizielle oeffentliche Release bleibt **BLOCKED**, bis die unten genannten Auth-Entscheidungen und rechtlichen Betreiberangaben abgeschlossen sind.

## Security Advisor

Der Supabase DEV Security Advisor wurde fuer `nlllqsfdhfiwticrcrnp` vor und nach der Haertung ausgelesen.

| Zustand | Warnungen | Details |
|---|---:|---|
| Vorher | 52 | 24 anon-ausfuehrbare Definer, 25 authenticated-ausfuehrbare Definer, 2 mutable `search_path`, 1 Leaked-Password-Schutz |
| Nachher | 22 | 21 bewusst fuer RLS/RPC benoetigte authenticated-Definer, 1 Leaked-Password-Schutz |
| Behoben | 30 | anon EXECUTE entzogen, Triggerfunktionen fuer authenticated gesperrt, 2 `search_path` gehaertet |

Alle bekannten `SECURITY DEFINER`-Helfer sind fuer `anon` und `public` nicht mehr direkt ausfuehrbar. Triggerfunktionen sind zusaetzlich fuer `authenticated` gesperrt. Die verbleibenden authenticated-Rechte werden von RLS-Policies oder dem bewusst exponierten Kontaktverzeichnis-RPC benoetigt:

- Kern/Rollen: `current_user_club_id`, `current_user_is_admin`, `current_user_is_club_manager`, `has_role`, `is_admin`.
- Training: `paddlio_can_author_trainer_feedback_0041`, `paddlio_can_read_training_feedback_0024`, `paddlio_can_read_training_item_0024`, `paddlio_can_write_training_feedback_0024`, `paddlio_can_write_training_item_0024`.
- Club/Gruppe/Admin: `paddlio_can_manage_club_415`, `paddlio_can_manage_group_415`, `paddlio_is_admin_414`, `paddlio_is_admin_415`, `paddlio_is_admin_profile_sync_415`, `paddlio_user_has_club_role_0024`, `paddlio_user_has_club_role_0031`.
- Academy: `paddlio_can_read_academy_course_0031`, `paddlio_can_read_academy_lesson_0031`, `paddlio_is_admin_0031`.
- Legitimer Client-RPC: `paddlio_visible_contact_profiles_20261002`.

Ein spaeterer Umbau dieser Policy-Helfer in ein nicht exponiertes Schema waere Defense-in-Depth, ist aber keine sichere kurzfristige Rechteaenderung. Die Migration `20261006154000_security_release_hardening.sql` aendert keine RLS-Fachregel.

## Auth-Konfiguration DEV

Real im DEV-Dashboard verifiziert:

- Site URL: `https://dev.paddlio.de`
- Redirect-Allowlist: `https://dev.paddlio.de/**`
- E-Mail/Passwort und Registrierung aktiv; E-Mail-Bestaetigung aktiv.
- Anonymous Sign-in und manuelles Account-Linking deaktiviert.
- Secure Email Change aktiv.
- Access Token 3600 Sekunden; Refresh-Token-Reuse-Erkennung aktiv, Intervall 10 Sekunden.
- OTP-Ablauf 3600 Sekunden, OTP-Laenge 8.
- Leaked Password Protection deaktiviert und im aktuellen Free-Plan nicht verfuegbar.
- CAPTCHA deaktiviert; MFA, Passwortkomplexitaet, Secure Password Change und Session-Limits benoetigen eine dokumentierte Betreiberentscheidung.

Rollen werden nicht aus editierbaren Client-Metadaten vergeben. Berechtigungsquelle bleiben `public.profiles.roles`, aktiver Profilstatus und RLS.

## Web-Security

Die tatsaechlichen HTTP-Responses von `dev.paddlio.de` wurden geprueft:

- HTTPS liefert 200; HTTP leitet mit 308 auf HTTPS um.
- CSP ist aktiv; in den geprueften Browserablaeufen wurden keine CSP-Verstoesse gefunden.
- HSTS: `max-age=31536000; includeSubDomains`.
- `X-Content-Type-Options: nosniff`.
- Frame-Schutz durch `frame-ancestors 'none'` und `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- Permissions Policy sperrt Kamera, Mikrofon, Geolocation, Payment und USB.

## Datenschutz und Eingaben

- Keine geheimen Service-Role-, Polar- oder Provider-Schluessel wurden im Client gefunden. Der Supabase-Anon-Key ist ein vorgesehener oeffentlicher Client-Key.
- React escaped Nutzereingaben; keine produktive unsichere HTML-Ausgabe wurde gefunden.
- CSV/XLS/XLSX-Import ist begrenzt und Export schuetzt gegen Spreadsheet-Formula-Injection.
- Eigene Profildaten koennen berichtigt werden; Logout, JSON-Auskunftsexport und serverseitige Kontoloeschung sind vorhanden.
- Der reale DEV-Auskunftsexport war kontobezogen, gueltiges JSON, maskierte Fremdidentitaeten und enthielt keine Provider-Secrets.
- Nicht authentifizierter Export wurde mit 401 abgelehnt; falsche Loeschphrase und fremde Origin wurden abgelehnt.
- Ein eigens erstelltes entbehrliches DEV-Testkonto wurde erfolgreich geloescht. Eigene Testdaten verschwanden, fremde Profile und Clubs blieben unveraendert, erneuter Login wurde abgelehnt.
- DEV hat aktuell keine Storage-Buckets. Eine reale Storage-Loeschung war deshalb nicht testbar; bei Einfuehrung des ersten Buckets muss der Loeschpfad erweitert und erneut geprueft werden.

## Noch nicht freigegebene Features

- Das technische Metadatenformular fuer Dateianhaenge ist fuer normale Nutzer entfernt. Ein echter Upload wird erst mit Storage und Policies in 5.1 freigegeben.
- Polar ist sichtbar als Beta gekennzeichnet. Ohne vollstaendige Serverkonfiguration ist der Verbindungsbutton deaktiviert. Der reale OAuth-Ende-zu-Ende-Test bleibt vor einer Vollfreigabe erforderlich.

## Abhaengigkeiten und Tests

`source-map-js` wurde ohne Major-/Force-Upgrade von 1.2.1 auf 1.2.2 aktualisiert. `npm audit` meldet 0 bekannte Schwachstellen.

- Unit/Integration: 170/170 bestanden.
- Build: bestanden; bestehender Hinweis auf grossen Bundle-Chunk.
- Encoding, RLS, Security, Bundle, A11y und Beta: bestanden.
- Rollen-E2E: 9 bestanden, 1 vorgesehener mobiler Multi-Device-Skip.
- Ein vorhandener iPad-Screenshot-Test traf einen React-DOM-Replacement-Race. Der Test wurde zustandsbasiert gehaertet und bestand danach dreimal in Folge. Der abschliessende Gesamtlauf bestand mit 50 Tests und 32 vorgesehenen projekt-/viewportabhaengigen Skips.

## Manuelle technische Aufgaben vor oeffentlichem Release

1. Supabase-Plan/Alternative fuer Leaked Password Protection entscheiden und aktivieren, sobald verfuegbar.
2. Mindestlaenge und Komplexitaet der Passwoerter verbindlich festlegen; Secure Password Change, CAPTCHA, MFA und Session-Limits entscheiden.
3. Polar-OAuth mit realem DEV-Providerkonto Ende-zu-Ende testen oder Beta fuer den oeffentlichen Release deaktiviert lassen.
4. Bei Einfuehrung von Storage private Buckets, Policies, Signed URLs und Kontoloeschung erneut testen.

## Rechtliche Blocker

1. Verantwortlichen, ladungsfaehige Anschrift, Kontakt und gegebenenfalls Datenschutzkontakt einsetzen.
2. Rechtsgrundlagen, Auftragsverarbeiter, Drittlandtransfer, Aufbewahrungs- und Loeschfristen rechtlich pruefen lassen.
3. Minderjaehrigen-Konzept, Einwilligung/Sorgeberechtigte, Sichtbarkeit und Aufbewahrung fachlich und rechtlich entscheiden.
4. Kommunikations-, Vereins- und spaetere Storage-Aufbewahrung verbindlich festlegen.

## Grenzen

- Migration und Cloud-Tests liefen ausschliesslich gegen Supabase DEV `nlllqsfdhfiwticrcrnp`.
- `main` und Production Supabase `twlkhfbrrwjwppxinmpn` wurden nicht veraendert.
- Bestehende Nutzdaten wurden nicht geloescht; der Loeschtest verwendete ausschliesslich ein eigens angelegtes DEV-Testkonto.
