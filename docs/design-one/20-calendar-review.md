# Paddlio One - Kalender-Review

Stand: Development, Branch `develop`  
Bewertung Kalender aktuell: **6,4 / 10**

## Kurzfazit

Der Kalender ist sichtbar auf dem Weg zu einer echten Trainingszentrale. Die neue Kalenderseite nutzt bereits kompaktere Bausteine, Vorlagen, Wochenansicht, Monatsansicht und eine periodisierte Jahresidee. Für Trainer fühlt sich der Bereich aber noch nicht wie ein durchgängiger Arbeitskalender an, sondern wie mehrere gute Module nebeneinander.

Der wichtigste nächste Schritt ist nicht mehr "mehr Karten", sondern **mehr Arbeitsfluss**: Vorlage wählen, im Kalender platzieren, kurz anpassen, Konflikte sehen, speichern, danach Detail öffnen oder Woche weiterplanen.

## Vorhandene Funktionen

| Funktion | Status | Bewertung |
|---|---:|---|
| Tagansicht | vorhanden | solide, aber noch wenig zeitliche Präzision |
| Wochenansicht | vorhanden | gute Basis, noch nicht wie ein Arbeitskalender |
| Monatsansicht | vorhanden | sichtbar, aber fachlich noch flach |
| Jahres-/Periodisierung | vorbereitet | eher Vorschau als echte Jahresplanung |
| Listen-/Agenda-Darstellung | teilweise vorhanden | nützlich für Phone, noch ausbaufähig |
| Vorlagen rechts | vorhanden | gute Richtung |
| Drag & Drop | vorhanden | technisch einfach, UX noch unfertig |
| Statuswechsel | vorhanden | hilfreich, aber nicht vollständig genug |
| Woche kopieren | im Planbereich vorhanden | stark, aber nicht eng genug im Kalender integriert |
| Trainingsblock kopieren | im Planbereich vorhanden | stark, aber nicht prominent genug |
| Wiederholungen | im Planbereich vorhanden | wichtig, aber nicht kalendernah genug |
| Traineraufgaben | im Planbereich vorhanden | gute Grundlage |
| Filter | im Planbereich vorhanden | im Kalender nicht klar genug sichtbar |
| Suche | im Planbereich für Vorlagen vorhanden | Kalender braucht globale Suche |
| Multi-Select | fehlt | hoher Wert für Trainer |
| Konfliktprüfung | fehlt oder nicht sichtbar genug | kritischer UX-Punkt |

## Was gut ist

- Die Trennung nach Gerät ist erkennbar: Phone bleibt einfacher, Tablet/Desktop bekommen mehr Raum.
- Die Kalenderseite hat eine eigene Vorlagenbibliothek und ist nicht nur eine Liste.
- Die Wochenplanung im Planbereich enthält bereits viele wichtige Trainerfunktionen.
- Trainingsblöcke zeigen Status und Kategorie grundsätzlich erkennbar.
- Das Design geht in Richtung Paddlio One und wirkt ruhiger als alte Kartenwände.

## Hauptprobleme

### A - Kalender und Plan sind noch zu getrennt

Der Kalender zeigt und nimmt Vorlagen an, aber viele wichtige Planfunktionen liegen weiterhin im separaten Planbereich. Trainer müssen mental wechseln zwischen:

- Kalender ansehen
- Plan bearbeiten
- Vorlage wählen
- Woche kopieren
- Wiederholung einstellen
- Traineraufgabe erstellen

Empfehlung: Der Kalender soll die primäre Arbeitsfläche werden. Planfunktionen gehören als rechte Seitenleiste, unteres Panel oder Detaildrawer direkt an den Kalender.

### A - Drag & Drop endet zu früh

Aktuell kann eine Vorlage in den Kalender fallen, aber danach fehlt der professionelle Abschluss:

- keine sichtbare Drop-Bestätigung
- kein Quick-Edit mit Zeit, Gruppe, Trainer, Ort
- keine Konfliktwarnung
- keine Option "mehr Details"
- keine Undo-Möglichkeit

Ziel: Nach Drop sofort ein kleines Quick-Edit öffnen.

### A - Kein Detaildrawer

Kalenderblöcke brauchen eine schnelle Detailansicht, ohne die Seite zu verlassen:

- Basisdaten
- Soll/Ist
- Gruppe/Sportler
- Trainer
- individuelle Anpassungen
- Traineraufgaben
- Feedbackstatus
- Polar-Zuordnung
- Aktionen

Aktuell ist der Weg zu Details zu indirekt.

### A - Kein Multi-Select

Trainer brauchen Massenaktionen:

- mehrere Einheiten verschieben
- mehrere kopieren
- mehrere absagen
- mehrere als Vorlage speichern
- mehrere auf Gruppe ändern

Das fehlt als Kalender-Interaktion.

### B - Monatswechsel wirkt riskant

In Teilen wird für Monatsnavigation ein fester Tagesversatz verwendet. Für Kalender-UX ist das verwirrend, weil Monatsnavigation echte Monate springen muss.

Empfehlung: Monatsnavigation immer kalenderlogisch nach Monat, nicht nach 28 oder 30 Tagen.

### B - Wochenansicht nutzt Zeitachsen noch nicht genug

Die Wochenansicht ist eher eine Spaltenliste. Für Trainer wäre stärker:

- Uhrzeiten links
- Blöcke nach Dauer proportional
- parallele Trainings sichtbar
- Konflikte direkt erkennbar

### B - Jahresplanung ist noch nicht saisonlogisch genug

Die Jahres-/Periodisierungsansicht zeigt Monate, aber noch keine vollwertige Saisonplanung:

- Saisonphasen
- Wettkampfhöhepunkte
- Trainingslager
- Belastungsblöcke
- Entlastungswochen
- Kopieren über Kalenderwochen

### B - Kalenderblöcke zeigen zu wenig Entscheidungshilfe

Ein Trainer sollte direkt sehen:

- Wer trainiert?
- Wer betreut?
- Ist es Soll oder Ist?
- Ist Feedback offen?
- Gibt es individuelle Anpassungen?
- Gibt es Aufgaben?
- Ist Polar zugeordnet?

Aktuell wirkt ein Block noch zu stark wie ein einfacher Termin.

## Rollenbewertung

| Rolle | Aktueller Nutzen | Hauptproblem | Ziel |
|---|---:|---|---|
| Sportler | gut für Übersicht | Durchführung/Feedback nicht nahtlos genug | Tagesfokus, Training starten, Feedback |
| Trainer | mittel | Planung zu verteilt | Kalender als Arbeitszentrale |
| Vereinstrainer | mittel | Gruppenvergleich fehlt | mehrere Gruppen parallel |
| Landestrainer | niedrig bis mittel | Jahres-/Kaderplanung fehlt | Saison, Kader, Belastung |
| Leistungszentrum | niedrig bis mittel | Mehrpersonenplanung und Analyse fehlen | Training + Belastung + Athletenstatus |
| Vereinsadmin | niedrig | Kalender nicht organisatorisch genug | Termine, Gruppen, Ressourcen |

## Gerätebewertung

| Gerät | Bewertung | Begründung |
|---|---:|---|
| Phone | 7/10 | gute Vereinfachung, aber noch nicht perfekt für "nächstes Training erledigen" |
| Tablet | 6/10 | sollte Hauptarbeitsfläche sein, braucht Split-View mit Kalender + Vorlagen + Detail |
| Desktop | 6/10 | mehr Platz nutzbar, Kalender braucht höhere Dichte und bessere Toolbars |
| Ultrawide | 5/10 | noch nicht genügend Mehrspalten-Nutzen |

## Ziel-Wireframes

### Phone Kalender

```text
┌─────────────────────────┐
│ Paddlio        Profil   │
│ Kalender                │
│ Heute  Woche  Liste     │
├─────────────────────────┤
│ Mo Di Mi Do Fr Sa So    │
│       21 markiert       │
├─────────────────────────┤
│ 16:30 Techniktraining   │
│ Fokus: Aufwärtstore     │
│ [Starten] [Details]     │
├─────────────────────────┤
│ 18:00 Kraft             │
│ [Durchgeführt]          │
├─────────────────────────┤
│ + Training / Vorlage    │
└─────────────────────────┘
```

### Tablet Kalender

```text
┌────────┬──────────────────────────────┬───────────────┐
│Sidebar │ Kalender Woche               │ Vorlagen      │
│Heute   │ Toolbar: Heute < > Woche +   │ Favoriten     │
│Kalender│ Mo Di Mi Do Fr Sa So         │ GA1 60 min    │
│Training│ Zeitachse + Trainingsblöcke  │ Technik 75    │
│Team    │                              │ Kraft 45      │
│Analyse │                              │ Wochenvorlage │
└────────┴──────────────────────────────┴───────────────┘
```

### Desktop Kalender

```text
┌──────────┬────────────────────────────────────────┬──────────────────┐
│ Sidebar  │ Kalender-Arbeitsfläche                 │ Vorlagen/Details │
│ Übersicht│ Toolbar, Filter, Suche, KW             │ Tabs: Vorlagen   │
│ Kalender │ 7 Tage mit Zeitachse                   │      Details     │
│ Plan     │ Trainingsblöcke mit Status             │      Aufgaben    │
│ Training │                                        │ Quick Edit       │
├──────────┴────────────────────────────────────────┴──────────────────┤
│ Wochenplan / Konflikte / offene Rückmeldungen                         │
└───────────────────────────────────────────────────────────────────────┘
```

## Prioritäten

### A - Muss als nächstes kommen

- Kalender und Plan stärker zusammenführen.
- Quick-Edit nach Drag & Drop.
- Detaildrawer für Kalenderblöcke.
- Kalenderweite Filter und Suche.
- Multi-Select für Desktop/Tablet.
- Konfliktwarnungen sichtbar machen.
- Phone-Aktion "Training heute starten/abschließen" direkter machen.

### B - Danach

- Echte Zeitachsen-Woche.
- Monatsnavigation kalenderlogisch korrigieren.
- Wochenvorlagen direkt im Kalender anwenden.
- Jahresplanung mit Saisonphasen und Wettkampfhöhepunkten.
- Traineraufgaben direkt im Kalenderblock sichtbar machen.

### C - Später

- Ressourcenplanung für Orte/Boote.
- Drag & Drop über mehrere Gruppen.
- Belastungs-Simulation beim Planen.
- KI-Vorschläge für Wochenstruktur.

