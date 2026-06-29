# ADR 0001: Vite, React, TypeScript und LocalStorage fuer Version 0.1

## Kontext

Paddlio Version 0.1 soll schnell im Browser startbar sein, auf dem Handy gut aussehen und ohne Backend funktionieren. Die erste Version dient als funktionierender Athleten-App-Prototyp mit Dashboard, Training, Wettkaempfen, Analyse und Material.

## Entscheidung

Version 0.1 wird als React-App mit Vite, TypeScript und CSS umgesetzt. Daten werden ueber einen kleinen Storage-Layer in LocalStorage gehalten und initial mit Tobias' Beispieldaten befuellt.

## Alternativen

- Next.js: fuer spaetere Server-Funktionen stark, fuer V0.1 aber schwerer als noetig.
- Reine HTML/CSS/JS-App: sehr leicht, aber weniger geeignet fuer die geplante erweiterbare Produktstruktur.
- Sofortige Datenbank: fachlich spaeter sinnvoll, fuer V0.1 aber zu frueh.

## Konsequenzen

- Die App kann lokal schnell entwickelt und getestet werden.
- Der Datenzugriff ist bereits gekapselt und kann spaeter durch API oder Datenbank ersetzt werden.
- Domain-Typen und Kennzahlen sind getrennt von UI-Komponenten.
- LocalStorage ist nur fuer Prototyping geeignet und ersetzt keine spaetere Persistenzstrategie.
