# Paddlio DEV Security Verification

Stand: 06.10.2026

Gilt ausschliesslich fuer Supabase DEV `nlllqsfdhfiwticrcrnp` und `https://dev.paddlio.de`.

## Verifiziert

- [x] Zielprojekt vor Migration/Deploy: `nlllqsfdhfiwticrcrnp`.
- [x] HTTPS 200 und HTTP-zu-HTTPS 308.
- [x] CSP, HSTS, Frame-, MIME-, Referrer- und Permissions-Schutz in echten DEV-Responses.
- [x] Keine CSP-Verstoesse in den geprueften Browserablaeufen.
- [x] Site URL `https://dev.paddlio.de` und Redirect-Allowlist `https://dev.paddlio.de/**`.
- [x] E-Mail-Bestaetigung aktiv; Confirmation- und Recovery-Flows bleiben getrennt.
- [x] Anonymous Sign-in und manuelles Account-Linking deaktiviert.
- [x] RLS- und Rollenchecks fuer Athlete, Coach, ClubAdmin und Admin bestanden.
- [x] Security Advisor: 52 auf 22 Warnungen reduziert; 30 Findings beseitigt.
- [x] `anon`/`public` EXECUTE fuer Definer-Helfer entzogen; Triggerfunktionen nicht durch authenticated aufrufbar.
- [x] `set_updated_at` und `default_roles_for_email` mit festem leerem `search_path`.
- [x] PostgREST-Schema-Reload nach Migration.
- [x] `account-privacy` auf DEV deployed; ohne JWT 401.
- [x] Eigener JSON-Export gueltig, kontobezogen, Fremdidentitaeten maskiert, keine Provider-Secrets.
- [x] Falsche Loeschphrase abgelehnt.
- [x] Entbehrliches DEV-Testkonto geloescht; fremde Profile/Clubs unveraendert, Login danach abgelehnt.
- [x] Storage inventarisiert: aktuell 0 Buckets.
- [x] Dateianhang-Metadatenformular fuer normale Nutzer entfernt.
- [x] Polar als Beta markiert und ohne Serverkonfiguration deaktiviert.
- [x] `npm audit`: 0 bekannte Schwachstellen.

## Auth-Sollzustand und offene Entscheidungen

- [x] Registrierung und E-Mail-Verifikation aktiv.
- [x] OTP: 3600 Sekunden, 8 Zeichen.
- [x] Access Token: 3600 Sekunden; Refresh-Reuse-Erkennung aktiv (10 Sekunden).
- [ ] Leaked Password Protection: im aktuellen Free-Plan nicht verfuegbar. Plan/Alternative vor oeffentlichem Release entscheiden.
- [x] Mindestpasswortlaenge 10 und staerkste Zeichenanforderung in DEV aktiviert; Client und Recovery stimmen ueberein.
- [ ] Secure Password Change / Require Current Password fachlich entscheiden.
- [ ] CAPTCHA: fuer Production vorgesehen; Provider-Keys, Dashboard-Aktivierung und Client-Token fehlen noch.
- [x] MFA fuer 5.0 nicht verpflichtend; keine unfertige UI. Spaeteres Sicherheitsupdate fuer privilegierte Rollen pruefen.
- [x] Before-User-Created-Hook `paddlio_before_user_created_500` in DEV aktiv und direkter Unter-16-Signup mit 403 blockiert.
- [x] Gemeinsame Nachrichten werden bei Kontoloeschung anonymisiert statt fremd mitgeloescht.
- [ ] Single-Session-, Time-box- und Inactivity-Limits entscheiden; im Free-Plan teilweise nicht verfuegbar.

## Verbleibende Advisor-Warnungen

21 authenticated-Definer-Warnungen bleiben bewusst bestehen, weil die Funktionen von RLS-Policies oder als kontrollierter Kontakt-RPC benoetigt werden. Vor einem spaeteren Entzug muss zuerst auf ein nicht exponiertes Policy-Helper-Schema migriert werden. Die Leaked-Password-Warnung bleibt bis zur Plan-/Produktentscheidung bestehen.

## Vor dem ersten Storage-Release

- [ ] Private Bucket-Entscheidung und Policies.
- [ ] MIME-/Groessenpruefung serverseitig.
- [ ] Kurzlebige Signed URLs.
- [ ] Kontoloeschung entfernt eigene private Objekte.
- [ ] Fremdzugriff mit Athlete/Coach/Admin negativ testen.

## Polar vor Vollfreigabe

- [ ] Reales DEV-OAuth mit Providerkonto.
- [ ] Token-Refresh, Disconnect und Widerruf.
- [ ] Scopes, lokale Zeit/UTC, Deduplizierung und Loeschung importierter Daten.
- [ ] Bis dahin Beta-Hinweis beziehungsweise deaktivierte Verbindung beibehalten.

## Rechtliches

- [ ] Betreiberangaben in Impressum und Datenschutz einsetzen; nichts erfinden.
- [ ] Rechtsgrundlagen, Auftragsverarbeiter, Transfer, Aufbewahrung und Loeschfristen pruefen.
- [ ] Minderjaehrigen-Konzept festlegen. Technische Einfuegepunkte sind Registerformular, serverseitig geschuetzte Consent-Daten, RLS und Datenschutzexport/-loeschung.

## Protokollregel

Jeden manuellen Punkt mit Datum, pruefender Person, DEV-Build-Commit und datensparsamem Nachweis dokumentieren. Nicht gepruefte Punkte gelten nicht als bestanden.
