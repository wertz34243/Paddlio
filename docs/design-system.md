# Paddlio Design System

Stand: Version 4.1.0

## Ziel

Das Designsystem macht Paddlio konsistenter, ruhiger und mobil besser bedienbar. Es ist bewusst leichtgewichtig: zentrale CSS-Tokens, wiederverwendbare Klassen und klare Regeln fuer Karten, Navigation, Buttons und Status.

## Tokens

Die zentralen Tokens liegen in `src/styles.css`.

- Background: sehr dunkles Blau fuer die App-Shell
- Surface: dunkle, leicht transparente Kartenflaechen
- Primary: Cyan fuer Training, Wasser und Hauptaktionen
- Secondary: Blaugruen fuer ruhige Akzente
- Success: Gruen fuer erledigt und Fortschritt
- Warning: Gelb/Orange fuer Hinweise und offene Punkte
- Danger: Rot fuer kritische oder destruktive Aktionen
- Text: Weiss fuer Haupttext, Grau fuer Meta-Informationen
- Radius: 18px als Standard fuer moderne App-Karten
- Shadow: weiche Schatten ohne schwere Glas-Effekte

## Komponentenlogik

- AppShell: Safe-Area, Bottom-Navigation und Seitenabstand.
- Cards: alle wichtigen Inhalte in ruhigen, einheitlichen Karten.
- StatCards: wichtige Zahlen groesser, Meta-Text kleiner.
- EmptyState: hilfreicher Text plus Aktion, wenn der Nutzer berechtigt ist.
- ErrorState: keine rohen Supabase-Fehler fuer normale Nutzer.
- StatusPill: kurze Statusbegriffe, keine langen Saetze.
- BottomNavigation: maximal fuenf Tabs.
- SegmentNavigation: Unterkategorien innerhalb eines Bereichs.

## Navigation

Mobile Hauptnavigation:

- Heute
- Training
- Analyse
- Kommunikation
- Mehr

Weitere Bereiche liegen unter `Mehr`: Profil, Verein, Gruppen, Wettkampf, Ergebnisse, Aufgaben, Integrationen, Feedback, Einstellungen und Admin/Beta-Bereiche fuer berechtigte Rollen.

## Mobile First Regeln

- Keine breiten Tabellen auf iPhone.
- Karten und Listen stapeln sich unter 560px.
- Buttons haben mindestens 44px Touch-Hoehe.
- Bottom Navigation darf Inhalte nicht verdecken.
- Header bleiben kompakt, Unterseiten nutzen sticky Compact Header.
- Texte duerfen nicht abgeschnitten werden; lange Inhalte brechen um.

## Statusfarben

- Training geplant: Cyan/Blau
- Erledigt: Gruen
- Ausgelassen/Offen: Gelb/Orange
- Abgesagt/Kritisch: Rot oder gedämpftes Grau
- Cloud verbunden: Gruen
- Cloud offline/eingeschraenkt: Gelb/Rot

## Grenzen

Version 4.1 vereinheitlicht das vorhandene System optisch. Einzelne Fachseiten koennen in spaeteren Versionen noch in echte Layout-Komponenten aufgeteilt werden.
