# Paddlio DEV Security Verification

Stand: 25.09.2026

Diese Checkliste gilt ausschliesslich fuer Supabase DEV `nlllqsfdhfiwticrcrnp` und `https://dev.paddlio.de`. Production `twlkhfbrrwjwppxinmpn` bleibt unangetastet. Keine Schluessel oder personenbezogenen Testdaten in Screenshots oder Tickets aufnehmen.

## Hosting und Browser

- [ ] `https://dev.paddlio.de` ist ohne Zertifikatswarnung erreichbar; HTTP wird auf HTTPS umgeleitet.
- [ ] `curl -I https://dev.paddlio.de` oder Browser-Netzwerkanalyse zeigt `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- [ ] `Content-Security-Policy` entspricht `vercel.json`; Browserkonsole zeigt bei Login, Kalender, Dateiimport und Polar keine erforderlichen blockierten Quellen.
- [ ] `frame-ancestors 'none'` und `X-Frame-Options: DENY` verhindern Einbettung in fremde Frames.
- [ ] `X-Content-Type-Options: nosniff` ist vorhanden.
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` ist vorhanden.
- [ ] `Permissions-Policy` deaktiviert Kamera, Mikrofon, Geolocation, Payment und USB, solange Paddlio diese Funktionen nicht bewusst nutzt.
- [ ] Vercel-Projekt verweist beim DEV-Deployment auf Branch `develop`; keine Production-Domain wurde umgehangen.

## Supabase Auth

- [ ] Dashboard-Projekt oben zeigt vor jeder Kontrolle `nlllqsfdhfiwticrcrnp`.
- [ ] Site URL und Redirect-Allowlist enthalten `https://dev.paddlio.de`; keine sichtbare localhost-/Vercel-Rueckleitung im Nutzerfluss.
- [ ] Signup verlangt E-Mail-Bestaetigung; der Link fuehrt zur Loginseite, nicht automatisch zu Heute.
- [ ] Password Recovery fuehrt zur Passwortseite und bleibt vom Confirmation-Flow getrennt.
- [ ] Passwortregeln, Rate Limits, Bot-/CAPTCHA-Entscheidung und optional MFA sind fuer den Release dokumentiert.
- [ ] Test mit Admin, Coach und Athlete: Login, Session Restore, Logout und Accountwechsel ohne Cache-/Queue-Leak.

## RLS und Datenbank

- [ ] Security Advisor im DEV-Dashboard ausfuehren und Findings dokumentieren.
- [ ] Alle Tabellen im exponierten `public`-Schema haben RLS aktiviert.
- [ ] Admin/Coach/Athlete lesen, schreiben und loeschen nur fachlich erlaubte Zeilen; fremde Club-/Athletendaten bleiben gesperrt.
- [ ] Keine Policy autorisiert ueber `raw_user_meta_data` oder nur ueber `TO authenticated` ohne Zeilenpruefung.
- [ ] Security-Definer-Funktionen haben festen `search_path`, interne Identitaetspruefung und eingeschraenkte EXECUTE-Rechte.
- [ ] PostgREST-Schema-Cache und Realtime-Publication entsprechen dem aktuellen DEV-Migrationsstand.

## Storage und Uploads

- [ ] Storage-Buckets inventarisieren; jeder Bucket ist bewusst public oder private dokumentiert.
- [ ] Private Anhaenge sind nur ueber kurzlebige Signed URLs erreichbar.
- [ ] Storage-Policies verhindern Lesen/Schreiben fremder Nutzer und Vereine.
- [ ] Profilbild- und Dateiuploads pruefen: erlaubter MIME-Typ, Groessenlimit, kein SVG/HTML als aktiver Inhalt.
- [ ] Kontoloeschung entfernt zugehoerige private Storage-Objekte gemaess finaler Aufbewahrungsregel.

## Edge Function `account-privacy`

- [ ] Supabase CLI zeigt vor Deploy eindeutig DEV: `nlllqsfdhfiwticrcrnp`.
- [ ] `supabase functions deploy account-privacy --project-ref nlllqsfdhfiwticrcrnp` ohne `--no-verify-jwt` ausfuehren.
- [ ] `PADDLIO_ALLOWED_ORIGINS=https://dev.paddlio.de` als Function Secret setzen.
- [ ] Kein Service-Role-Key in Vite-/Browser-Variablen; er bleibt nur im Function Runtime Secret.
- [ ] Export als Athlete, Coach und Admin: Antwort enthaelt nur Datensaetze mit Bezug zum eigenen Konto und maskiert fremde Identitaets-IDs.
- [ ] Export ohne JWT, mit fremdem Origin und mit abgelaufener Session wird abgelehnt.
- [ ] Loeschtest nur mit einem neu angelegten DEV-Testkonto: falsche Phrase abgelehnt, richtige Phrase loescht Auth-Konto und eigene Daten.
- [ ] Nach Loeschtest sind Login, Profil, personenbezogene Tabellen und private Storage-Objekte kontrolliert; gemeinsame Club-Inhalte folgen der freigegebenen Aufbewahrungsregel.
- [ ] Function-Logs enthalten Fehlercodes/Tabellen, aber keine Tokens, E-Mails oder vollstaendigen Nutzdaten.

## CORS und Origins

- [ ] Edge Function akzeptiert `https://dev.paddlio.de` und lehnt nicht erlaubte Origins ab.
- [ ] Supabase API-/Auth-Konfiguration und Polar-Endpunkte erlauben nur die benoetigten DEV-Origins.
- [ ] Preflight (`OPTIONS`) fuer den Account-Export ist erfolgreich; Credentials/JWT werden nicht an fremde Origins freigegeben.

## Minderjaehrige: technische Vorbereitung

Noch keine Altersgrenze oder Form der Elternzustimmung festlegen. Vor Umsetzung muss der Betreiber die rechtliche und fachliche Regel definieren.

- Registrierung: vorgesehener Einfuegepunkt ist `AuthView`/`RegisterInput`; dort koennen spaeter Geburts-/Altersgruppe und erforderliche Einwilligungsart abgefragt werden.
- Auth-Metadaten: Einwilligung nicht als Berechtigungsquelle in editierbare `user_metadata` legen. Nach Entscheidung eigene serverseitig geschuetzte Profil-/Consent-Felder mit Zeitstempel, Version und Nachweis verwenden.
- Zugriff: `AuthProvider`, RLS-Helper und Rollenmodell muessen einen eventuell eingeschraenkten Status serverseitig erzwingen; UI-Verstecken reicht nicht.
- Coach/Verein: Einladungs- und Zuordnungsfluesse muessen geklaerte Sorgeberechtigten- und Sichtbarkeitsregeln beruecksichtigen.
- Datenschutz: Export, Berichtigung und Loeschung muessen Consent-Nachweise und besondere Aufbewahrungsregeln korrekt behandeln.
- Kommunikation/Uploads: Direktnachrichten, Dateien, Anwesenheit und Trainerfeedback benoetigen eine fachlich festgelegte Sichtbarkeits- und Moderationsregel.
- Audit: Einwilligungsfassung, Zeitpunkt, Widerruf und handelnde Person muessen manipulationsgeschuetzt nachvollziehbar sein, sobald das Konzept beschlossen ist.

## Manuelles Ergebnisprotokoll

Fuer jeden Punkt Datum, pruefende Person, DEV-Build-Commit, Ergebnis und Link zu einem datensparsamen Nachweis festhalten. Ein nicht gepruefter Punkt gilt nicht als bestanden.
