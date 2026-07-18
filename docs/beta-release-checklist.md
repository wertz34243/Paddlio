# Paddlio 5.0 Beta Release Checklist

Vor externer Beta ausfuehren und dokumentieren.

## Technisch

- [ ] `npm.cmd run build`
- [ ] `npm.cmd run check:beta`
- [ ] `npm.cmd run test`
- [ ] `npm.cmd run test:unit`
- [ ] `npm.cmd run test:e2e`
- [ ] `npm.cmd run test:e2e:roles` mit Test-Credentials
- [ ] `npm.cmd audit --omit=dev`
- [ ] Bundle-Budget pruefen
- [ ] Encoding-Check pruefen
- [ ] Date-only-Tests pruefen
- [ ] RLS-Tests pruefen
- [ ] Migrationen in Supabase ausfuehren
- [ ] keine Secrets im Git-Diff

## Manuell

- [ ] Admin, ClubAdmin, Coach, Athlete testen
- [ ] fremder Verein isoliert
- [ ] zwei Geraete gleichzeitig
- [ ] Offline/Reconnect
- [ ] Training erstellen, bearbeiten, loeschen
- [ ] Feedback Coach/Athlete
- [ ] Nachrichten Coach/Athlete
- [ ] Akademie oeffnen, Fortschritt speichern
- [ ] Importvorschau und Importbericht
- [ ] Export CSV/XLSX
- [ ] Polar verbinden, Sync, Duplikatschutz
- [ ] Smartphone Portrait
- [ ] Smartphone Landscape
- [ ] Tablet
- [ ] Desktop
- [ ] Dark Mode
- [ ] Light Mode

## Datenschutz und Sicherheit

- [ ] RLS-Matrix aktuell
- [ ] keine offenen `using (true)` Policies ohne Begruendung
- [ ] keine `service_role` im Frontend
- [ ] Adminbereiche nur Admin
- [ ] Coach sieht keine fremden Vereine
- [ ] Athlete sieht keine Coach/Adminbereiche
- [ ] Export sensibler Spalten geprueft
- [ ] Polar-Tokens serverseitig geschuetzt

## Betrieb

- [ ] Supabase Backup vorhanden
- [ ] Rollbackplan dokumentiert
- [ ] Vercel Deployment gruen
- [ ] Production-URL erreichbar
- [ ] bekannte Einschraenkungen dokumentiert
