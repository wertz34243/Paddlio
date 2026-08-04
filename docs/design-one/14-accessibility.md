# Paddlio One Accessibility

Stand: Phase 1, Branch `develop`

## Umgesetzt

- sichtbare Fokuszustände über `:focus-visible`
- Statuskomponenten mit Text statt reiner Farbe
- Icon-only-Buttons mit verpflichtendem `aria-label`
- Fehlerzustand mit `role="alert"`
- technische Details in Fehlerzuständen optional aufklappbar
- `prefers-reduced-motion` reduziert Animationen
- High-Contrast-Theme für Prüfung vorbereitet

## Mindestregeln für Folgephasen

- Dialoge müssen Fokus setzen und per Escape schließbar sein.
- Tabellen brauchen semantische Header.
- Diagramme brauchen Textalternativen.
- Formularfehler müssen feldnah und verständlich sein.
- Phone-Touchflächen bleiben groß genug.
- Desktop darf kompakter werden, aber nicht unlesbar.

## Offene Prüfung

Eine vollständige Screenreader- und Keyboard-Prüfung erfolgt nach Migration der echten Seiten auf die Foundation.
