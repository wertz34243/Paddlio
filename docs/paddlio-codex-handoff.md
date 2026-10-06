# Paddlio Codex Handoff

## Stand

- Datum/Uhrzeit: 2026-10-06 18:20 CEST
- Stabilitaetsblock: Paddlio 5.0 Schritt 3C - öffentliche Website und App-Domain
- Status: IMPLEMENTIERT UND GETESTET, PRODUCTION-AKTIVIERUNG BEWUSST OFFEN

## Änderungen

- Öffentliche responsive Website mit den Routen `/`, `/funktionen`, `/sportler`, `/trainer`, `/vereine`, `/installation`, `/hilfe`, `/datenschutz` und `/impressum`.
- Dark-Water-Design mit Paddlio-Branding, Produktvorschau, Rollenbereichen, Gerätehinweisen und klaren App-CTAs.
- Polar ausschließlich als „Beta / in Vorbereitung“ beschrieben; Datei-Upload und nicht freigegebene Academy-/Video-Funktionen werden nicht beworben.
- Release-Entwürfe für Impressum und Datenschutz mit den bereitgestellten Betreiberangaben und klarer Kennzeichnung der noch ausstehenden rechtlichen Prüfung.
- SEO-Basis: Title, Description, OpenGraph, Favicon, semantische Überschriften, `robots.txt` und öffentliche `sitemap.xml`.
- Registrierung verlangt ein Geburtsdatum und blockiert im UI sowie AuthProvider die selbstständige Registrierung unter 16.

## Technische Trennung

- `paddlio.de` und `www.paddlio.de` laden ausschließlich das Public-Website-Bundle.
- `app.paddlio.de` und `dev.paddlio.de` laden weiterhin die PWA mit Auth/Supabase.
- App, Supabase und App-CSS werden dynamisch nicht in die öffentliche Website initialisiert.
- Die öffentliche Website registriert keinen PWA-Service-Worker und entfernt den App-Manifest-Link.
- DEV-/Preview-Testweg: `/public-preview`; optional `VITE_PUBLIC_SITE_MODE=true`.
- DEV-App-Link zeigt sicher auf `https://dev.paddlio.de`; Production-Public-Site später auf `https://app.paddlio.de`.

## Domain-Konzept

- `paddlio.de`: öffentliche Website.
- `www.paddlio.de`: permanente Weiterleitung auf `paddlio.de`.
- `app.paddlio.de`: Paddlio-PWA.
- `dev.paddlio.de`: bestehende DEV-App und `/public-preview`.
- Vercel-/DNS-/Supabase-Auth-Schritte sind in `docs/release/public-web-domain-plan.md` dokumentiert.
- Keine DNS-, Production-Vercel- oder Production-Supabase-Änderung wurde ausgeführt.

## Supabase DEV

- Keine Migration erforderlich.
- Supabase DEV `nlllqsfdhfiwticrcrnp` wurde nicht verändert.
- Production Supabase `twlkhfbrrwjwppxinmpn` wurde nicht verwendet.

## Tests

- `npm audit`: 0 Schwachstellen.
- Unit/Integration: 31 Dateien, 176/176 bestanden.
- Build: bestanden.
- Encoding, RLS, Security, Bundle, A11y und Beta: bestanden.
- Bundle-Trennung: Entry 196,926 Bytes, private App 374,815 Bytes, Public Website 16,214 Bytes.
- Öffentliche Website E2E: Landingpage ohne Login/Supabase, App-Link, Installation, Datenschutz, Impressum, Phone/Desktop und kein horizontaler Overflow bestanden.
- Gesamte E2E-Suite: 56 bestanden, 32 vorgesehene projekt-/viewportabhängige Skips, 0 Fehler.
- Rollen-E2E: 9 bestanden, 1 vorgesehener mobiler Multi-Device-Skip.
- Visuelle Browserprüfung auf Desktop durchgeführt.

## Offene Release-Blocker

- `info@paddlio.de`, `support@paddlio.de` und `datenschutz@paddlio.de` vor öffentlicher Aktivierung real auf Empfang prüfen.
- Impressum und Datenschutzerklärung rechtlich final prüfen.
- Die 16+-Regel ist in der regulären UI und im AuthProvider umgesetzt, aber noch nicht serverseitig nicht-umgehbar. Vor Production Auth-Hook/Trigger oder einen gleichwertigen Sorgeberechtigten-/Einladungsprozess festlegen.
- Production-Domains, Vercel-Projekte, DNS und Supabase-Auth-Redirects erst in einem ausdrücklich freigegebenen Production-Schritt konfigurieren.
- App-Domain mit app-spezifischem `robots.txt` vollständig von Indexierung ausschließen.

## Commit / Push

- Commit: wird nach finaler Statusprüfung erstellt.
- Pushstatus: ausstehend.

## Grenzen bestätigt

- Nur Branch `develop`.
- `main` unverändert.
- Production Supabase unverändert.
- Keine DEV- oder Production-Nutzdaten gelöscht.
