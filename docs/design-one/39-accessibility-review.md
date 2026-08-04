# Paddlio One - Accessibility Review

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Der automatisierte Accessibility-Beta-Check ist grün. Die App hat wichtige Grundlagen wie Skip-Link, Button-Labels und reduzierte Bewegungsregeln. Für externe Beta reicht das als Basissignal, aber nicht als vollständige Barrierefreiheitsfreigabe.

Accessibility-Bewertung: **72 / 100**

## Automatisierte Prüfung

Ausgeführt:

- `npm.cmd run check:beta`: Accessibility beta check passed.
- `npm.cmd run test:e2e`: Public Controls expose accessible names passed.

Einschränkung:

Automatische Checks finden nicht alle Probleme. Dialogfokus, Screenreader-Reihenfolge, Tastaturfluss und echte Touch-Ziele müssen manuell geprüft werden.

## Stärken

- Skip-Link zum Hauptinhalt vorhanden.
- Navigation nutzt `aria-current`.
- Bottom-Navigation hat `aria-label`.
- Buttons sind semantisch Buttons.
- Reduced-Motion-Regeln sind vorhanden.
- High-Contrast-Tokens existieren.
- Phone-Touchflächen sind grundsätzlich groß.

## Risiken

- Dialoge, Drawer und Bottom Sheets brauchen Fokusmanagement.
- Drag & Drop darf nicht die einzige Eingabemethode sein.
- Kalender muss tastaturbedienbare Alternativen bieten.
- Farbcodierte Trainingskategorien brauchen Text/Icons zusätzlich.
- Charts brauchen Textzusammenfassung.
- Alte und neue Komponenten können unterschiedliche Fokuszustände haben.
- Fehlermeldungen müssen Screenreader-freundlich am Formularfeld hängen.

## Prüfung nach Bereich

| Bereich | Risiko | Empfehlung |
|---|---|---|
| Kalender | Drag & Drop, Fokus, Zeitblöcke | Tastaturaktionen: Vorlage auswählen, Tag wählen, speichern. |
| Training | Feedbackformular | Fehler je Feld, Schnellmodus, klare Labels. |
| Navigation | viele Ziele | Rollen- und Gerätemodus nicht nur visuell anzeigen. |
| Dialoge | Fokus kann verloren gehen | Fokus trap, Escape, Rückkehr zum auslösenden Button. |
| Charts | visuell dominant | Textalternative mit Kernaussage. |
| Tabellen | Desktop wichtig | Header, Sortierung, Tastaturzugriff. |
| Toasts/Status | Syncmeldungen | `aria-live` für wichtige Meldungen. |

## Mindestanforderungen vor externer Beta

1. Dialog- und Drawer-Fokus manuell prüfen.
2. Kalender ohne Maus bedienbar machen oder Alternativflow bereitstellen.
3. Farbcodierungen nie allein verwenden.
4. Fehlerzustände Formularfeldern zuordnen.
5. Screenreader-Namen für Icon-Buttons prüfen.
6. 200-%-Zoom auf Phone, Tablet und Desktop prüfen.
7. Touch-Ziele auf Tablet nicht zu klein machen.

## Fazit

Paddlio ist auf einem guten Weg, aber Accessibility muss mit dem neuen Designsystem bewusst mitgezogen werden. Besonders Kalender, Drag & Drop, Dialoge und Charts sind die nächsten Prüfstellen.

