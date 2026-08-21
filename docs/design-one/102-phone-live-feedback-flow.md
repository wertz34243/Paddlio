# Phone Live Feedback Flow

## Ziel

Der Live-Modus ist ein exklusiver Fokuszustand. Er darf nicht über Training Details liegen und darf nach dem Beenden kein zweites Overlay sichtbar lassen.

## Neuer Ablauf

1. Training Detail öffnen.
2. Training starten.
3. Detail wird geschlossen.
4. Live-Modus öffnet als Vollbildzustand.
5. Pause, Fortsetzen und Abschnitt wechseln bleiben im Live-Modus.
6. Beenden & Feedback schließt Live.
7. Genau ein Feedback-Sheet wird geöffnet.
8. Speichern erzeugt Feedback und Journaldaten.

## UI-Struktur

Live zeigt nur:

- Trainingstitel
- Timer
- Fokus
- Abschnitte
- Pause/Fortsetzen
- Nächster Abschnitt
- Beenden & Feedback

## Akzeptanz

- Kein Durchscheinen alter Inhalte.
- Kein paralleles Detail-Sheet.
- Kein paralleles Feedback-Sheet.
- Schließen braucht Bestätigung.
