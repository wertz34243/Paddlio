# Stabilization 2.8 Summary

## Umgesetzt

- Tablet Portrait nutzt Overlay-Kontext statt dauerhafter rechter Spalte.
- Tablet Portrait wechselt bei zu geringer Breite automatisch von Woche auf 3 Tage.
- Kalender bleibt Hauptflaeche.
- Quick Edit, Vorlagen und Trainingsdetails bleiben erreichbar, verdecken den Kalender aber nur als gezielter Kontext.
- Phone wurde als eigener Stabilisierungsteil mitgeprueft.
- Phone-Vorlagen werden nicht mehr sofort eingefuegt, sondern ueber ein Bottom Sheet mit Tag und Uhrzeit bestaetigt.
- Phone-Sheets fuer Feedback, Quick Edit, Wochenkopie und Live-Training wurden gegen Safe-Area- und Bottom-Nav-Ueberdeckung abgesichert.
- Mobile-E2E enthaelt jetzt optionale authentifizierte Phone-Checks fuer Athlete und Coach.
- Development-Seed wurde robuster und realistischer.
- Rollen-E2E wurde auf aktuelle UI und Seed-Namen angepasst.
- ClubAdmin-E2E wurde ergaenzt.
- Mobile-Layout-Timeouts im Desktop-Projekt wurden durch saubere Projekttrennung behoben.

## Tests

- `npm.cmd run build`: bestanden
- `npm.cmd run check:beta`: bestanden
- `npm.cmd run test`: 13 Dateien, 58 Tests bestanden
- `npm.cmd run test:e2e`: 6 bestanden, 16 uebersprungen
- `npm.cmd run test:e2e:roles`: 10 uebersprungen
- Authentifizierter Rollenlauf mit Development-URL:
  - Athlete: bestanden
  - Coach: fehlgeschlagen, weil `dev.coach@paddlio.test` in der App als Sportler erkannt wird

## Rollen-E2E-Befund

Der App-Code uebersetzt Cloud-Rollen korrekt:

- `Coach` -> `coach`
- `ClubAdmin` -> `clubAdmin`
- `Admin` -> `admin`

Der echte Development-Lauf zeigt daher kein UI-Layoutproblem, sondern ein Testdatenproblem: Das Development-Profil des Coach-Testkontos liefert nicht die erwartete Coach-Rolle. Solange `dev.coach@paddlio.test` in `profiles.roles` nicht `Coach` enthaelt, bleiben Coach-, ClubAdmin-/Admin- und Zwei-Geraete-Tests blockiert.

Wichtig: Die lokale `.env.local` zeigt aktuell auf ein anderes Supabase-Projekt als die Development-Testkonten. Rollen-E2E muss mit der Development-URL `https://nlllqsfdhfiwticrcrnp.supabase.co` und den Development-E2E-Variablen laufen.

## Build-Hinweis

Vite meldet weiterhin die bekannte Chunk-Warnung:

- Main JS: ca. 627 kB
- `xlsx`: ca. 500 kB

Das Bundle-Budget ist trotzdem bestanden.

## Nicht nachgewiesen

- Coach-/ClubAdmin-/Admin-Rollen-E2E, bis die Development-Testprofile korrekt gesetzt sind
- Zwei-Geraete-Sync mit echten parallelen Login-Sessions, bis der Coach-Testaccount als Coach erkannt wird
- Offline/Online-Sync
- echte Screenshots mit eingeloggten Development-Testdaten
- Seed-Ausfuehrung gegen Development, falls `SUPABASE_SERVICE_ROLE_KEY` fehlt
- Phone-UX mit Coach-Rolle, solange das Coach-Testprofil als Sportler erkannt wird

## Grund

Rollen- und Sync-Nachweise duerfen nur gegen die Development-Umgebung laufen. Wenn die aktuelle Shell keine sicheren Development-Variablen bereitstellt oder die Development-Profile falsche Rollen liefern, werden diese Tests nicht als bestanden dargestellt.

## Bewertung

- Tablet Portrait: 88/100 lokal technisch verbessert, visuell mit Testdaten noch nicht final nachgewiesen
- Tablet Landscape: 90/100 gehalten
- Kalender: 87/100
- Phone Kalender: 88/100
- Phone Training: 88/100
- Phone Vorlagen: 90/100
- Phone Live Training: 86/100
- Phone Feedback: 88/100
- Phone Navigation: 90/100
- Phone Gesamt-UX: 88/100
- Rollen-E2E: Athlete bestanden, Coach durch Development-Testprofil blockiert
- Zwei-Geraete-Sync: blockiert, bis Coach-Testprofil korrekt ist
- Beta-Status: interne Nutzung moeglich, Trainer-Test erst nach korrigiertem Coach-Profil und gruenem Rollen-/Sync-Lauf
