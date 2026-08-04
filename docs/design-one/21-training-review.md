# Paddlio One - Training-Review

Stand: Development, Branch `develop`  
Bewertung Training aktuell: **6,7 / 10**

## Kurzfazit

Der Trainingsbereich enthält viele wichtige Funktionen, aber der Ablauf ist noch nicht flüssig genug. Es gibt Training, Plan, Kalender, Journal und Übersicht, doch der Nutzer muss zu oft zwischen Bereichen springen. Besonders auf Phone muss der Weg lauten:

**Training sehen -> starten -> abschließen -> Feedback geben -> Journal fertig**

Aktuell ist dieser Weg technisch möglich, aber noch nicht gefühlt "geführt".

## Vorhandene Unterbereiche

| Bereich | Zweck | Status |
|---|---|---|
| Übersicht | Tagesfokus, nächste Einheit, Status | gute Basis |
| Kalender | Trainingstermine anzeigen und Vorlagen einfügen | gute Basis |
| Plan | vollständige Planung, Wiederholungen, Gruppen, Vorlagen | funktionsstark, aber schwer |
| Einheiten | freie Trainingseinheiten und Journalformular | vorhanden, teils doppelt |
| Journal | Trainingstagebuch und Soll/Ist-Übersicht | gute Basis |

## Was gut ist

- Es gibt einen klaren Trainings-Workflow als Denkmodell.
- Soll/Ist wird in Übersicht und Journal bereits sichtbar.
- Das Journal erfasst wichtige subjektive Werte: RPE, Gefühl, Müdigkeit, Schlaf, Motivation.
- Trainerfunktionen wie Gruppen, Kopieren, Wiederholen, Vorlagen und Aufgaben sind vorhanden.
- Phone wird bereits teilweise vereinfacht.

## Hauptprobleme

### A - "Training starten" ist noch kein echter Startmodus

Der Button setzt im Wesentlichen einen Status. Für Sportler und Trainer braucht es eine geführte Durchführung:

- Was mache ich jetzt?
- Welche Übungen?
- Welche Dauer?
- Welche Intensität?
- Was muss ich danach eintragen?
- Gibt es individuelle Anpassungen?

Empfehlung: Eigener Durchführungsmodus als fokussierte Ansicht.

### A - Abschlussformular ist auf Phone zu schwer

Das Feedback-/Journalformular enthält viele Felder. Inhaltlich sind sie wertvoll, aber auf dem Handy muss es in zwei Stufen laufen:

1. Schnellabschluss: durchgeführt, teilweise, RPE, kurzer Kommentar.
2. Details optional: Dauer, Distanz, HF, Gefühl, Müdigkeit, Schlaf, Motivation, Schmerzen, Notizen.

### A - Plan und Journal sind nicht eng genug verbunden

Nach dem Abschließen sollte der Nutzer nicht suchen müssen. Paddlio sollte direkt zeigen:

- Geplant war: 75 min Technik
- Du hast gemacht: 70 min, RPE 7
- Feedback offen: 1 Feld

### B - Einheiten und Plan können verwechselt werden

Es gibt geplante Trainings und freie Trainingseinheiten. Das ist fachlich sinnvoll, aber die Oberfläche muss klarer trennen:

- "Geplante Einheit"
- "Freies Training"
- "Journal-Eintrag"

Aktuell kann es sich wie mehrere ähnliche Trainingslisten anfühlen.

### B - Trainingskarten brauchen stärkere Informationshierarchie

Eine gute Trainingskarte sollte auf einen Blick zeigen:

```text
Techniktraining Aufwärtstore
Heute 16:30-18:00 · 90 min · K1 · mittel · geplant
Fokus: Aufwärtstore, Übergriff, Linie
Aktionen: Starten · Feedback · Details
```

Weniger Nebentext, mehr direkte Entscheidung.

### B - Trainerperspektive braucht mehr Status

Ein Coach will nicht nur einzelne Trainings sehen, sondern:

- Wer hat erledigt?
- Wer hat Feedback geschrieben?
- Wer fehlt?
- Wo gibt es Warnungen?
- Welche Traineraufgabe ist offen?

Diese Informationen müssen näher an Training und Kalender.

## Rollenbewertung

| Rolle | Training aktuell | Wichtigster nächster Schritt |
|---|---:|---|
| Sportler | 7/10 | geführtes Durchführen und schnelles Feedback |
| Trainer | 6,5/10 | Gruppenstatus, Feedbackstatus, Aufgaben direkt sichtbar |
| Vereinstrainer | 6/10 | Wochenplanung und Anwesenheit stärker verbinden |
| Landestrainer | 5/10 | Mehrathletenvergleich und Saisonlogik |
| Leistungszentrum | 5/10 | Belastung, Polar und Soll/Ist gemeinsam |
| Vereinsadmin | 4/10 | Trainingsbereich nur organisatorisch relevant |

## Gerätebewertung

| Gerät | Bewertung | Begründung |
|---|---:|---|
| Phone | 7/10 | gut für Alltag, aber Abschluss muss kürzer |
| Tablet | 6,5/10 | braucht Trainerarbeitsfläche mit Details rechts |
| Desktop | 6/10 | noch zu wenig Arbeitsdichte im Trainingsprozess |
| Ultrawide | 5/10 | kann deutlich mehr Parallelbereiche zeigen |

## Ziel-Wireframes

### Phone Training Durchführen

```text
┌─────────────────────────┐
│ Techniktraining         │
│ Heute 16:30 · 90 min    │
│ K1 · Intensität mittel  │
├─────────────────────────┤
│ Fokus                   │
│ Aufwärtstore, Linie     │
├─────────────────────────┤
│ Übungen                 │
│ 1. Einfahren            │
│ 2. Technikblock         │
│ 3. Läufe                │
├─────────────────────────┤
│ [Training starten]      │
│ [Als durchgeführt]      │
│ [Teilweise]             │
└─────────────────────────┘
```

### Phone Feedback

```text
┌─────────────────────────┐
│ Training abschließen    │
│ Geplant: 90 min mittel  │
├─────────────────────────┤
│ Dauer: 82 min           │
│ RPE: 7                  │
│ Gefühl: gut             │
│ Notiz: [kurzer Text]    │
├─────────────────────────┤
│ [Speichern]             │
│ Details ergänzen        │
└─────────────────────────┘
```

### Tablet Training

```text
┌────────┬──────────────────────┬──────────────────┐
│Sidebar │ Wochenplan / Liste   │ Training Details │
│        │ heutige Einheiten    │ Soll/Ist         │
│        │ Status je Sportler   │ Feedback         │
│        │                      │ Aufgaben         │
└────────┴──────────────────────┴──────────────────┘
```

### Desktop Training

```text
┌──────────┬─────────────────────────────┬─────────────────────┬──────────────┐
│ Sidebar  │ Trainingsliste/Wochenplan   │ Detail/Soll-Ist     │ Feedback     │
│          │ Filter, Suche, Status       │ Übungen, Material   │ Aufgaben     │
└──────────┴─────────────────────────────┴─────────────────────┴──────────────┘
```

## Prioritäten

### A - Muss als nächstes kommen

- Geführter Durchführungsmodus für geplante Trainings.
- Schnelles Feedback auf Phone.
- Trainingdetail als Drawer/Panel statt Seitenwechsel.
- Klare Trennung: geplant, frei, Journal.
- Coach-Status je Training direkt sichtbar.

### B - Danach

- Soll/Ist-Vergleich besser visualisieren.
- Trainingskarten komprimieren und vereinheitlichen.
- Journalfilter nach Woche, Sportler, Gruppe, Status.
- Trainerantwort auf Feedback näher an Training.

### C - Später

- Live-Timer, Pausen, Splits.
- Video-/Material-Checkliste.
- Automatische Polar-Zuordnung im Abschlussflow.
- KI-Zusammenfassung nach Wochenabschluss.

