# ADR 0001: Vite, React, TypeScript und LocalStorage für Version 0.1

## Kontext

Paddlio Version 0.1 soll schnell im Browser startbar sein, auf dem Handy gut aussehen und ohne Backend funktionieren. Die erste Version dient als funktionierender Athleten-App-Prototyp mit Dashboard, Training, Wettkämpfen, Analyse und Material.

## Entscheidung

Version 0.1 wird als React-App mit Vite, TypeScript und CSS umgesetzt. Daten werden über einen kleinen Storage-Layer in LocalStorage gehalten und initial mit Tobias' Beispieldaten befuellt.

## Alternativen

- Next.js: für spätere Server-Funktionen stark, für V0.1 aber schwerer als nötig.
- Reine HTML/CSS/JS-App: sehr leicht, aber weniger geeignet für die geplante erweiterbare Produktstruktur.
- Sofortige Datenbank: fachlich später sinnvoll, für V0.1 aber zu früh.

## Konsequenzen

- Die App kann lokal schnell entwickelt und getestet werden.
- Der Datenzugriff ist bereits gekapselt und kann später durch API oder Datenbank ersetzt werden.
- Domain-Typen und Kennzahlen sind getrennt von UI-Komponenten.
- LocalStorage ist nur für Prototyping geeignet und ersetzt keine spätere Persistenzstrategie.
