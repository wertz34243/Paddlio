# Paddlio Design System

Stand: Version 4.1.0

## Ziel

Das Designsystem macht Paddlio konsistenter, ruhiger und mobil besser bedienbar. Es ist bewusst leichtgewichtig: zentrale CSS-Tokens, wiederverwendbare Klassen und klare Regeln für Karten, Navigation, Buttons und Status.

## Tokens

Die zentralen Tokens liegen in `src/styles.css`.

- Background: sehr dunkles Blau für die App-Shell
- Surface: dunkle, leicht transparente Kartenflaechen
- Primary: Cyan für Training, Wasser und Hauptaktionen
- Secondary: Blaugrün für ruhige Akzente
- Success: Grün für erledigt und Fortschritt
- Warning: Gelb/Orange für Hinweise und offene Punkte
- Danger: Rot für kritische oder destruktive Aktionen
- Text: Weiss für Haupttext, Grau für Meta-Informationen
- Radius: 18px als Standard für moderne App-Karten
- Shadow: weiche Schatten ohne schwere Glas-Effekte

## Komponentenlogik

- AppShell: Safe-Area, Bottom-Navigation und Seitenabstand.
- Cards: alle wichtigen Inhalte in ruhigen, einheitlichen Karten.
- StatCards: wichtige Zahlen größer, Meta-Text kleiner.
- EmptyState: hilfreicher Text plus Aktion, wenn der Nutzer berechtigt ist.
- ErrorState: keine rohen Supabase-Fehler für normale Nutzer.
- StatusPill: kurze Statusbegriffe, keine langen Saetze.
- BottomNavigation: maximal fünf Tabs.
- SegmentNavigation: Unterkategorien innerhalb eines Bereichs.

## Navigation

Mobile Hauptnavigation:

- Heute
- Training
- Analyse
- Kommunikation
- Mehr

Weitere Bereiche liegen unter `Mehr`: Profil, Verein, Gruppen, Wettkampf, Ergebnisse, Aufgaben, Integrationen, Feedback, Einstellungen und Admin/Beta-Bereiche für berechtigte Rollen.

## Mobile First Regeln

- Keine breiten Tabellen auf iPhone.
- Karten und Listen stapeln sich unter 560px.
- Buttons haben mindestens 44px Touch-Hoehe.
- Bottom Navigation darf Inhalte nicht verdecken.
- Header bleiben kompakt, Unterseiten nutzen sticky Compact Header.
- Texte dürfen nicht abgeschnitten werden; lange Inhalte brechen um.

## Statusfarben

- Training geplant: Cyan/Blau
- Erledigt: Grün
- Ausgelassen/Offen: Gelb/Orange
- Abgesagt/Kritisch: Rot oder gedämpftes Grau
- Cloud verbunden: Grün
- Cloud offline/eingeschränkt: Gelb/Rot

## Grenzen

Version 4.1 vereinheitlicht das vorhandene System optisch. Einzelne Fachseiten können in späteren Versionen noch in echte Layout-Komponenten aufgeteilt werden.
