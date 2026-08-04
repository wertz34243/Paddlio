# Paddlio One - Design Review

Stand: 2026-08-04  
Branch: `develop`

## Kurzfazit

Die visuelle Richtung ist richtig: dunkel, ruhig, sportlich, mit Cyan/Türkis als Paddlio-Akzent. Die App wirkt nicht mehr wie ein klassisches Formularsystem. Gleichzeitig ist das Design noch nicht überall konsistent, weil alte App-Stile, neue Paddlio-One-Tokens und spezielle Kalenderstile gleichzeitig existieren.

Designbewertung: **74 / 100**

## Designsystem

Vorhanden:

- Paddlio-One-Farbtokens.
- Responsive Dichte für Phone, Tablet und Desktop.
- Komponentenbasis: Card, Button, KPI, Section, Toolbar, Input, Empty State.
- Dark Mode und Light Mode Variablen.
- High-Contrast-Ansatz.
- Kalender-Kategorie-Farben.

Problem:

Die Tokens liegen zusätzlich zu älteren `:root`-Blöcken und vielen bestehenden Klassen in `src/styles.css`. Dadurch kann eine Seite modern wirken, eine andere aber noch nach der älteren Paddlio-Version.

## Farben

Stärken:

- Cyan/Türkis ist als Marke klar.
- Grün, Orange, Rot, Blau und Violett sind fachlich passend.
- Dark Mode passt gut zu Sport- und Trainingsdaten.

Risiken:

- Zu viele Statusfarben können auf Analyse- oder Kalenderseiten schnell laut werden.
- Einige ältere Karten nutzen noch stärkere Flächen/Gradients als nötig.
- Light Mode braucht mehr Sichtprüfung, weil viele Entscheidungen vom Dark Mode ausgehen.

Empfehlung:

Farben nur für Status, Kategorie und primäre Handlung einsetzen. Neutrale Karten sollten mehr Ruhe bekommen.

## Typografie

Stärken:

- Responsive Schriftgrößen sind vorhanden.
- Desktop ist kleiner als Phone gedacht.
- Hierarchie aus Page Title, Section Title, Card Title, Metric und Caption ist angelegt.

Risiken:

- Ältere Komponenten bringen eigene Größen mit.
- Einige Desktopbereiche können noch zu groß wirken, weil sie nicht konsequent Paddlio-One-Komponenten nutzen.
- Metriken sind teilweise visuell stärker als ihre Entscheidungskraft.

Empfehlung:

Nur eine typografische Skala aktiv verwenden. Alte Überschriftenklassen sollten auf Paddlio-One-Tokens gemappt oder entfernt werden.

## Karten

Stärken:

- Karten wirken hochwertig.
- KPI- und Trainingskarten sind grundsätzlich gut lesbar.
- Kalender- und Trainingseinträge werden fachlicher.

Risiken:

- Zu viele Informationen werden noch als Einzelkarte dargestellt.
- Auf Desktop sollten häufiger Listen, Tabellen und kompakte Zeilen verwendet werden.
- Kartenabstände sind nicht überall gleich.

Empfehlung:

Phone darf Karten behalten. Tablet und Desktop brauchen mehr Zeilen, Panels und Master-Detail-Strukturen.

## Navigation

Stärken:

- Phone-Bottom-Navigation ist klar.
- Desktop-Sidebar ist vorhanden.
- Aktive Bereiche sind erkennbar.

Risiken:

- Hauptnavigation enthält viele Punkte; je Rolle und Gerät ist das nicht überall ideal.
- `Kalender`, `Plan` und `Training` konkurrieren in der Wahrnehmung.
- `Mehr` kann weiterhin zum Sammelbecken werden.

Empfehlung:

Navigation stärker nach Aufgabe benennen:

- Heute
- Kalender
- Training
- Team
- Analyse
- Mehr

Spezialbereiche sollten kontextuell erscheinen, nicht dauerhaft gleich prominent.

## Kalenderdesign

Stärken:

- Master-Kalender hat eigene visuelle Sprache.
- Vorlagenleiste und Detaildrawer sind die richtige Richtung.
- Kategorien sind farblich unterscheidbar.

Risiken:

- Kalender braucht mehr "echte Kalenderwirkung": Zeitachse, Dichte, klare Drop-Zonen, Konfliktzustände.
- Auf Desktop darf die rechte Leiste kompakter und funktionaler sein.
- Auf Tablet muss die Touch-Interaktion sichtbarer geprüft werden.

## Fazit

Das Design ist gut genug für interne Tests und stark genug als Grundlage. Vor externer Beta sollte aber eine Design-Konsolidierung erfolgen: ein Token-System, ein Card-System, ein Navigation-System, ein Kalender-System.

