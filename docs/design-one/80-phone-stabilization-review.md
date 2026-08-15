# Phone Stabilization Review

## Ziel

Phone bleibt auf schnelle Alltagsaktionen begrenzt:

- ansehen
- Training starten
- Training beenden
- Feedback geben
- Journal pruefen
- einfache Planung
- Vorlage verwenden

Komplexe Wochen-, Monats-, Jahres- und Saisonplanung bleibt Tablet/Desktop.

## Gepruefte Bereiche

| Bereich | Ergebnis | Status |
| --- | --- | --- |
| Heute | Kompakter Tagesfokus bleibt erhalten. | OK |
| Kalender | Phone nutzt Tag, 3 Tage, Woche und Liste ohne Vorlagen-/Statistikspalten. | OK |
| Training | Bereiche bleiben Uebersicht, Erstellen, Vorlagen, Journal. | OK |
| Vorlagen | Kompakte Listen bleiben aktiv. Verwendung fordert jetzt Datum/Uhrzeit vor dem Speichern ab. | verbessert |
| Live-Training | Phone-Sheets wurden auf Bottom-Sheet-Verhalten und Safe-Area-Padding abgesichert. | verbessert |
| Feedback | Feedback-Sheet nutzt auf Phone einspaltige Felder. | verbessert |
| Journal | Kein Neuaufbau, nur in der Pruefung beruecksichtigt. | OK |
| Soll/Ist | Weiterhin ueber Training/Journal sichtbar, keine neue Logik. | OK |
| Team | Navigation bleibt ueber Bottom Nav erreichbar. | OK |
| Mehr | Navigation bleibt ueber Bottom Nav erreichbar. | OK |

## Umgesetzte Korrekturen

### Vorlage Verwenden

Vorlagen werden auf Phone nicht mehr direkt in den heutigen Kalender eingefuegt.

Neuer Ablauf:

1. Vorlage in der kompakten Liste waehlen.
2. Bottom Sheet "Vorlage verwenden" oeffnet.
3. Tag und Uhrzeit bestaetigen.
4. Speichern legt den Termin an.
5. Danach Wechsel in den Kalender.

Damit ist Phone konsistent mit der Vorgabe: kein Drag & Drop als Voraussetzung und keine unabsichtliche Sofortanlage.

### Bottom Sheets

Feedback, Quick Edit, Wochenkopie und Live-Training erhalten auf Phone:

- volle Breite
- begrenzte Hoehe
- eigenes Scrollen
- Safe-Area-Abstand unten
- einspaltige Formularfelder

Ziel: keine Inhalte hinter Bottom Navigation oder iOS-Bereichen.

### Layout Guards

Die Mobile-E2E-Tests pruefen jetzt zusaetzlich:

- kein horizontales Overflow
- Header-Hoehe
- Bottom-Navigation-Hoehe
- authentifizierte Phone-Navigation, falls E2E-Variablen vorhanden sind
- Vorlagen-Flow mit Bestaetigungsdialog fuer Coach, falls E2E-Variablen vorhanden sind

## Bekannte Grenzen

- Authentifizierte Phone-E2E-Tests laufen nur, wenn `PADDLIO_E2E_*` in der Shell gesetzt sind.
- Athlete-Phone wurde mit Development-URL erfolgreich authentifiziert.
- Coach-Phone ist aktuell durch Testdaten blockiert: `dev.coach@paddlio.test` wird in der App als Sportler erkannt.
- Kein Umbau von Polar, Analyse, Akademie, Wettkampf, Material oder Admin.

## Bewertung

| Kategorie | Bewertung |
| --- | ---: |
| Phone Kalender | 88/100 |
| Phone Training | 88/100 |
| Phone Vorlagen | 90/100 |
| Phone Live Training | 86/100 |
| Phone Feedback | 88/100 |
| Phone Navigation | 90/100 |
| Phone Groessen/Abstaende | 88/100 |
| Phone Gesamt-UX | 88/100 |

## Einschaetzung

Phone ist stabiler und klarer als vorher. Das Ziel 90/100 ist bei Vorlagen und Navigation erreicht. Fuer Kalender/Training/Live/Feedback fehlt noch der belegte Coach- und Zwei-Geraete-Test; Blocker ist aktuell das Development-Testprofil, nicht die Phone-UI.
