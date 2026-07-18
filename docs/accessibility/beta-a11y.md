# Paddlio Beta Accessibility Baseline

Dieser Stand deckt die wichtigsten Beta-Regeln automatisiert ab:

- Hauptnavigation markiert die aktive Seite mit `aria-current`.
- Icon-lastige Bottom-Navigation besitzt eindeutige `aria-labels`.
- Bereichsnavigation nutzt `tablist`, `tab` und `aria-selected`.
- Header, Bereichsnavigation und Bottom Navigation besitzen stabile `data-testid`s.
- Fokuszustände sind über `:focus-visible` sichtbar.
- `prefers-reduced-motion` wird berücksichtigt.
- Touch-Ziele nutzen mindestens 44 px Höhe.

Zusätzlich prüft Playwright im öffentlichen Einstieg, dass keine Buttons ohne zugänglichen Namen gerendert werden.

Noch manuell für externe Beta zu prüfen:

- VoiceOver auf iPhone/iPad.
- Tastaturnavigation in angemeldeten Coach- und Admin-Flows.
- Dialogfokus bei Vorlagen, Import, Akademie und Polar.
- Farbkontraste in Light Mode und Dark Mode.
