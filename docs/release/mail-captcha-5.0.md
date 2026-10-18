# Offizielle Mailadressen und CAPTCHA – 18.10.2026

## Bestandsaufnahme vor der Änderung

| Datei/Bereich | Bisher | Umsetzung |
|---|---|---|
| src/public/PublicWebsite.tsx | Offizielle Adressen als Text; Mailbetrieb angeblich ungeprüft | Klickbare Kontakte, obsolete Mail-Gates entfernt, Footer ergänzt |
| src/views/SettingsView.tsx | Betreiber-Platzhalter | Tobias Kuhn, Opladener Str. 131, 42699 Solingen, Deutschland; info-Kontakt, Support und Datenschutz |
| src/views/AuthView.tsx | Rechtlicher Platzhalter, kein Support, kein CAPTCHA | Betreiber-/Kontaktangaben, Datenschutzlink, Support, Turnstile |
| src/views/PasswordRecoveryView.tsx | Kein Supportkontakt | support@paddlio.de |
| docs/design-one/supabase-auth-email-templates.md | Kein Mail-Support im Footer | Supportlinks und serverseitige noreply-Konfiguration |
| .env.example | Server-Supabase-Beispiel zeigte auf Production | DEV-Ref; öffentliche Turnstile-Konfiguration |
| Alte Migrationen/Audit-Dokumente | Persönliche Testadresse in historischer Admin-Logik | Nicht verändert, keine Ausführung und keine Rollenänderung |
| Tests/Seeds | example.com und paddlio.test | Absichtliche synthetische Fixtures beibehalten |

Repository-Suche: Kontakt-/Support-/Datenschutz-/Impressumtexte, Mailto, offizielle Adressen, example.com, private Adressen, Mail-Templates, CAPTCHA/Turnstile/hCaptcha/reCAPTCHA, Resend/SMTP. In API/Edge Functions existiert kein eigener Resend-Mailversender; Auth-Mailversand erfolgt über Supabase. Die tatsächliche SMTP-Konfiguration wurde nicht geändert. Tobias hat Versand und Empfang der offiziellen Adressen bestätigt; in dieser Aufgabe wurden keine echten Testmails gesendet.

## Mail-Zuordnung

- info@paddlio.de: Impressum, Betreiberkontakt, allgemeiner Footer-Kontakt.
- support@paddlio.de: öffentliche Hilfe, Login, Recovery, Einstellungen und Mail-Template-Footer.
- datenschutz@paddlio.de: Verantwortlichen-/Datenschutzkontakt, Auskunft/Löschung/Betroffenenrechte sowie Auth-/App-Hinweise.
- admin@paddlio.de: ausschließlich künftig interne Administration. Kein öffentlicher Link, kein Konto angelegt, keine Sonderrolle eingeführt.
- noreply@paddlio.de: gewünschter automatischer Absender in Supabase Custom SMTP/Resend, nicht als Frontend-Versandfunktion. Unter Authentication → Emails → SMTP Settings in DEV Sender email und Sender name prüfen. Zugangsdaten beibehalten. Die Templates sind lokale Vorlagen und wurden nicht automatisch ins Dashboard übertragen.
- Reply-To: support@paddlio.de, sofern die bestehende serverseitige Versandkonfiguration dies unterstützt. Der vorhandene Supabase-Client bietet dafür keinen per-Request-Mailheader; deshalb kein vorgetäuschtes Reply-To im Client und kein neues Mail-Gateway. Der explizite Supportlink funktioniert unabhängig davon.

## CAPTCHA-Bestand und Implementierung

Vorher nur Release-TODOs, kein Widget/Tokenfluss; bestehende Auth-Rate-Limits und 16+-Hook sind zusätzliche, separate Maßnahmen. Am 18.10.2026 im DEV-Dashboard `nlllqsfdhfiwticrcrnp/auth/protection` rein lesend bestätigt: Enable Captcha protection ausgeschaltet. Keine Dashboard-Einstellung geändert.

Implementiert: Cloudflare Turnstile per offizieller API, ohne neue npm-Abhängigkeit. Die Site Key ist öffentlich. Das Secret kommt ausschließlich in Supabase Auth. Supabase übernimmt die serverseitige Verifikation; ein Widget allein schützt keine Endpunkte.

| Ablauf | Code vorbereitet | Grenze |
|---|---|---|
| Login | Widget, Sperre ohne Token, signInWithPassword options.captchaToken | Echter Schutz erst nach DEV-Konfiguration |
| Registrierung | Widget, signUp options.captchaToken | Bestehende 16+-Validierung/Hook und Rollen bleiben unverändert |
| Passwort vergessen | resetPasswordForEmail options.captchaToken | Frischer Token pro Anfrage |
| Bestätigung erneut senden | resend options.captchaToken | Kein Token-Reuse |
| Neues Passwort über Recovery-Link setzen | Bestehende Sessionprüfung und Passwortpolicy | updateUser unterstützt hier keinen CAPTCHA-Parameter; keine sinnlose Scheinprüfung hinzugefügt |
| Öffentliche Website/Hilfe | Mailto-Kontakte; kein anonymes serverseitiges Kontaktformular | Keine CAPTCHA-Abfrage für reine Links oder lokale Checklisten nötig |

Tokens nur im Arbeitsspeicher, kein LocalStorage/Log. Laden nur in der Auth-Ansicht und nur bei konfigurierter Aktivierung. Fehlgeschlagene/abgelaufene Prüfungen entwerten den Token; erneutes Laden möglich. Ein Token wird nach jedem Auth-Versuch verworfen. Doppelsenden blockiert, Eingaben bleiben bei Fehlern erhalten. Netzwerk-/Providerfehler erscheinen deutsch ohne Rohdetails. CSP erlaubt ausschließlich challenges.cloudflare.com zusätzlich in script-src und frame-src.

## Tobias: DEV-Konfiguration

1. In Cloudflare Dashboard → Turnstile → Add widget ein **separates DEV-Widget** erstellen, Typ Managed. Hostname `dev.paddlio.de`; für echte lokale Tests `localhost` und `127.0.0.1` passend zulassen. Keine Production-DNS-Änderung nötig. Site Key und Secret Key stammen aus diesem Widget; Werte hier nicht posten.
2. Öffentlichen Site Key in der lokalen ignorierten `.env.local` und der **DEV/Preview-Umgebung** hinterlegen:

   ```dotenv
   VITE_TURNSTILE_ENABLED=true
   VITE_TURNSTILE_SITE_KEY=<öffentlicher DEV-Site-Key>
   ```

   Entwicklungsserver neu starten bzw. DEV neu bauen. Ohne Aktivierung und ohne Site Key bleibt der alte Ablauf erhalten. Mit enabled=true, aber fehlendem Site Key, bleibt Auth gesperrt. Ein vorhandener Site Key aktiviert die Integration auch ohne Flag; zum vollständigen lokalen Deaktivieren beide Werte entfernen/leeren bzw. Flag false setzen.
3. **Bitte in Supabase DEV eintragen:** Authentication → Attack Protection → Bot and Abuse Protection → Enable Captcha protection: an; CAPTCHA provider: **Cloudflare Turnstile**; CAPTCHA secret: **geheimer DEV-Secret-Key aus demselben Cloudflare-Widget**. Dort wird der Secret Key benötigt, nicht der öffentliche Site Key. Secret niemals in VITE_, Git oder Chat eintragen. Erst aktivieren, wenn das DEV-Frontend das Widget laden kann, damit kein Login-Lockout entsteht.
4. Auf DEV echte Prüfung durchführen: Login, Signup mit freigegebenem Testkonto, Reset-Anforderung, erneute Bestätigung; abgelaufene/ungültige Tokens und direkte Requests ohne Token müssen serverseitig abgewiesen werden. Zustellung und Redirects kontrollieren. CAPTCHA-Testkeys und Mocks belegen keine echte serverseitige Aktivierung.
5. 16+-Hook und Rate Limits beibehalten. Echte End-to-End-Abnahme und rechtliche Prüfung des ergänzten Dienstes bleiben Release-Gates.

## Später separat auf Production

Erst nach Tobias' Freigabe: eigenes Production-Widget mit den tatsächlichen Auth-Hostnames, öffentlicher Production-Site-Key in Production-Build, zugehöriger Secret-Key in Supabase Production, abgestimmte Aktivierung und echte Abnahme. Production-SMTP-Absender/Templates/Reply-To separat prüfen. Diese Aufgabe nimmt keine Production-, DNS-, Datenbank- oder Migration-History-Änderung vor.

## Reproduzierbare Prüfung

```text
npm test
npm run build
npm run check:security
npm run check:beta
npm run test:e2e
npm run test:e2e:roles
npm run test:e2e -- --config playwright.captcha.config.ts
```

Der letzte Befehl verwendet einen separaten lokalen Vite-Server auf 5174, eine fiktive Supabase-Adresse und abgefangene Auth-/Turnstile-Antworten. Er sendet keine realen E-Mails und legt keine echten Benutzer an. Im normalen E2E-Lauf sind diese acht isolierten Fälle bewusst übersprungen; dort fehlende Rollen-Zugangsdaten werden ebenfalls als Skip gemeldet. Für einen echten CAPTCHA-Lauf müssen echte Widget-/DEV-Werte konfiguriert sein; automatisierte Auth-Tests dürfen nicht als Beleg für CAPTCHA bei deaktivierter Dashboard-Einstellung gelten.

## Quellen

- [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)
- [Cloudflare Widget-Einbettung](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Cloudflare CSP](https://developers.cloudflare.com/turnstile/reference/content-security-policy/)
- [Supabase Mail-Templates auf Free: eigenes SMTP weiterhin unterstützt](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier)

Keine Migration erforderlich. Keine Änderungen an serverseitiger Altersprüfung, Profilrollen oder RLS.

## Testergebnis 18.10.2026

- Vor Änderung: 189 Unit-Tests bestanden.
- Nach Änderung: 193 Unit-Tests in 34 Dateien bestanden.
- Build bestanden; bestehende XLSX-Chunk-Warnung >500 kB, Bundle-Budget bestanden.
- check:security und check:beta bestanden (Encoding, RLS, Security, Bundle, A11y, Blocker).
- Allgemeine E2E: 22 bestanden, 80 übersprungen. Davon 8 CAPTCHA-Fälle nur in der dedizierten Konfiguration; verbleibende Skips betreffen insbesondere fehlende Rollen-Zugangsdaten bzw. Projekt-/Viewport-Voraussetzungen.
- Isolierte CAPTCHA-E2E: 8/8 bestanden (Desktop Edge und Mobile Edge). Nach Ergänzung des Resend-Fehler-Retry zusätzlich beide betroffenen Fälle bestanden.
- Rollen-E2E: alle 10 mangels Zugangsdaten übersprungen, kein behaupteter Rollen-Live-Nachweis.
- Initiale Testprobleme: unvollständige CAPTCHA-Fehlerfixture korrigiert; gemergte Playwright-Konfiguration startete zwei Webserver und störte einen parallelen Lauf. Konfiguration getrennt, vollständige Wiederholung bestanden. Unter Windows wurden nach Abschluss der Tests die jeweils von dieser Prüfung gestarteten Vite-Prozesse gezielt beendet, damit Playwright sauber mit Exitcode 0 abschließt.
- .env.local ignoriert. Scan der erfassten Quell-/Konfigurationsdateien: keine privaten Schlüssel oder Service-Role-JWTs gefunden; keine geheim benannten VITE_-Variablen in .env.local; kein öffentliches admin@paddlio.de im Anwendungscode. Dies ist ein gezielter Scan, keine Garantie für beliebig kodierte Alt-Secrets.
- Keine neuen Dependencies, keine Änderungen an vorhandenen package.json/package-lock.json-Änderungen; diese bleiben uncommittet.
