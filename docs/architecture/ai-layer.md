# KI-Schicht

## Grundregel

KI ist die Interpretationsschicht. Sie darf keine fehlende Sync-, Cache- oder Analysearchitektur ersetzen.

## Ebenen

1. Daten- und Sync-Ebene: Cache, Delta-Sync, Realtime, Offline-Queue.
2. Analyse-Ebene: Kennzahlen, Trends, Belastung, vorbereitete Zusammenfassungen.
3. KI-Ebene: Empfehlungen, verständliche Texte, Trainerhinweise.

## Sicherheit

- Keine Polar Tokens an KI senden.
- Keine Service-Keys im Frontend.
- Nur Daten verwenden, die der aktuelle Nutzer fachlich sehen darf.
- Daten minimieren: keine vollständigen E-Mail-Adressen, keine unnötigen internen IDs, keine fremden Vereinsdaten.
- KI-Ausfälle dürfen die App nicht blockieren.

## Fallback

Wenn KI nicht verfügbar ist, bleiben Training, Kalender, Analyse, Polar, Sync und regelbasierter Smart Coach funktionsfähig.
