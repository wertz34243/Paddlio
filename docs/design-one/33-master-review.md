# Paddlio One - Master Review

Stand: 2026-08-04  
Branch: `develop`  
Umgebung: Development  
Review-Modus: Nur Analyse und Dokumentation, keine Produktänderungen.

## Gesamturteil

Paddlio ist fachlich stark und hat inzwischen eine ernsthafte Grundlage für eine moderne Trainingsplattform. Die App deckt Training, Kalender, Planung, Journal, Team, Analyse, Polar, Akademie, Wettkampf, Material, Import und Administration bereits breit ab. Die neue Paddlio-One-Richtung ist sichtbar, besonders bei Design-Tokens, Device-Capabilities und dem Kalender-/Trainingsworkflow.

Trotzdem ist der aktuelle Stand noch kein vollständig einheitliches Produkt. Die größte Herausforderung ist nicht mehr "fehlt eine Funktion?", sondern "greifen die vorhandenen Funktionen logisch, ruhig und zuverlässig ineinander?". Es gibt noch zu viele parallele Einstiege, große Dateien, alte und neue Layoutschichten nebeneinander und einige Workflows, die technisch vorhanden sind, aber für Trainer oder Sportler noch nicht selbstverständlich wirken.

Aktuelle Gesamtbewertung: **76 / 100**

## Bewertung nach Bereichen

| Bereich | Bewertung | Einschätzung |
|---|---:|---|
| Architektur | 72 | Gute Services und Domainlogik, aber App.tsx, PlanView, TrainingCalendarView und styles.css sind zu groß. |
| Designsystem | 74 | Paddlio-One-Tokens existieren, alte CSS-Schichten bleiben aber parallel aktiv. |
| UX | 73 | Viele gute Einzelideen, aber noch zu viele Sprünge zwischen Kalender, Plan, Training und Journal. |
| Kalender | 78 | Nach Phase 2.5 deutlich verbessert, jetzt braucht er echte Rollen- und Touch-Validierung. |
| Training | 76 | Workflow von Plan zu Durchführung zu Feedback ist angelegt, aber noch nicht überall geführt genug. |
| Tablet | 72 | Richtung stimmt, aber noch nicht durchgehend eine eigene Trainer-Arbeitsfläche. |
| Desktop | 74 | Kompakter geworden, aber einige Bereiche wirken noch wie modulare Altseiten. |
| Phone | 80 | Beste Geräteklasse im aktuellen Stand: klar, reduziert, alltagstauglich. |
| Rollenlogik | 75 | Device-Capability ist vorhanden; Rollen-/E2E-Nachweis war in diesem Lauf teilweise übersprungen. |
| Performance | 70 | Build grün, aber Hauptchunk und CSS sind groß. |
| Wartbarkeit | 66 | Größter Schwachpunkt durch Dateigrößen, CSS-Duplikate und Übergangsarchitektur. |
| Beta-Reife | 74 | Interne Beta gut vertretbar, externe Beta nur begrenzt und mit klarer Testdisziplin. |

## Größte Stärken

- Paddlio hat ein sehr klares fachliches Ziel: Kanuslalom-Training, Planung, Feedback, Analyse und Verein in einer App.
- Die Phone-Navigation ist fokussiert und überschreitet nicht die kritische Grenze von fünf Hauptpunkten.
- Device-Capabilities und Feature-Capabilities sind zentral vorhanden.
- Kalender und Training wurden zuletzt deutlich näher zusammengeführt.
- Die App hat bereits konkrete Prüfprogramme: Build, Beta-Check, Unit-Tests, E2E-Smoke, Bundle-, Encoding-, RLS- und A11y-Checks.
- Lazy Loading ist für mehrere schwere Bereiche vorhanden.
- Die Domainlogik ist stärker als die UI-Konsistenz; das ist gut, weil Design später leichter vereinheitlicht werden kann als unsaubere Datenlogik.

## Größte Schwächen

- Zu viele große Dateien tragen zu viel Verantwortung.
- Der Nutzer kann ähnliche Dinge über mehrere Wege erreichen: Kalender, Plan, Training, Einheiten, Journal, Heute.
- Einige ältere Dokumente enthalten noch Mojibake. Der Encoding-Check läuft grün, aber ältere Planungsdocs zeigen sichtbare kaputte Umlaute.
- CSS ist stark gewachsen und enthält mehrere Generationen von Tokens und Layoutregeln.
- Rollen-/Zwei-Geräte-E2E wurden in diesem Lauf übersprungen, weil die Umgebung dafür nicht gesetzt war.
- Der neue Kalender ist vielversprechend, aber noch nicht vollständig manuell mit echten Rollen und Daten bestätigt.
- Admin- und ClubAdmin-Erlebnis sind funktional vorhanden, aber noch nicht so ruhig und sicher geführt wie Athlete/Coach.

## Kritische Produktfragen

1. Ist `Kalender` künftig die zentrale Planungsfläche und `Plan` nur noch eine Detail-/Expertenansicht?
2. Soll `Training` primär Durchführung und Journal sein, während Planung im Kalender liegt?
3. Welche Funktionen müssen Phone wirklich bearbeiten dürfen, und welche sollen nur Status oder einfache Aktionen zeigen?
4. Wie streng soll Paddlio zwischen Vereinsverwaltung und sportlicher Trainerarbeit trennen?
5. Welche Workflows müssen vor externer Beta als echte Zwei-Geräte-Szenarien grün sein?

## Empfohlene Entscheidung

Für die nächste Umsetzungsphase sollte Paddlio nicht weiter "mehr Seiten" bekommen. Der richtige Schritt ist eine **Konsolidierung der Arbeitsflächen**:

- `Heute` = Start und Entscheidung.
- `Kalender` = Planung und Vorlagen.
- `Training` = Durchführung, Feedback, Journal.
- `Team` = Personen, Gruppen, Nachrichten, Aufgaben.
- `Analyse` = Entwicklung, Belastung, Polar, Soll/Ist.
- `Mehr` = Konto, Einstellungen, Integrationen, Verwaltung.

Alles andere sollte als Unterbereich oder Kontextpanel in diese Struktur einsortiert werden.

## Prüfung in diesem Review

Ausgeführt:

- `npm.cmd run build`: bestanden.
- `npm.cmd run check:beta`: bestanden.
- `npm.cmd run test`: bestanden.
- `npm.cmd run test:e2e`: bestanden mit 4 Public-Smoke-Tests, 8 Rollen-/Sync-Tests übersprungen.
- `npm.cmd run test:e2e:roles`: 8 Rollen-/Sync-Tests übersprungen.

Wichtige Messwerte aus Build:

- Haupt-JS: `623.12 kB`, gzip `169.42 kB`.
- CSS: `160.06 kB`, gzip `28.95 kB`.
- XLSX-Chunk: `500.06 kB`, gzip `163.12 kB`.
- Supabase-Chunk: `213.62 kB`, gzip `55.17 kB`.

## Master-Risiko

Das größte Risiko für Paddlio ist derzeit nicht ein einzelner Bug. Das größte Risiko ist **Produktstreuung**: viele starke Funktionen, aber noch zu wenig gemeinsame Oberfläche, gemeinsame Komponenten und eindeutige Hauptwege.

## Empfehlung für Freigabe

Vor großen weiteren Funktionen sollte freigegeben werden:

1. Konsolidierung Kalender/Plan/Training.
2. Reduktion großer Dateien.
3. Bereinigung alter CSS-Schichten.
4. Rollen-/Zwei-Geräte-E2E mit aktiver Testumgebung.
5. Visuelle Abnahme für Phone, Tablet und Desktop.

