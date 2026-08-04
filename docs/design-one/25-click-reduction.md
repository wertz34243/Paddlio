# Paddlio One - Klickreduzierung Kalender und Training

Stand: Development, Branch `develop`

## Ziel

Trainer und Sportler sollen alltägliche Aufgaben mit deutlich weniger Schritten erledigen. Die wichtigste Regel:

**Jede Karte braucht die nächste sinnvolle Aktion direkt dort, wo der Nutzer sie sieht.**

## Klickanalyse

| Aufgabe | Heute geschätzt | Ziel | Maßnahme |
|---|---:|---:|---|
| heutiges Training abschließen | 5-7 | 3 | Direktbutton auf Heute + Mini-Feedback |
| Feedback schreiben | 5-8 | 3 | Bottom Sheet mit RPE, Dauer, Notiz |
| Training aus Vorlage planen | 5-8 | 3 | Drag & Drop + Quick Edit |
| Woche kopieren | 5-7 | 4 | Button in Kalender-Toolbar |
| Training bearbeiten | 4-6 | 2 | Kalenderblock -> Detaildrawer |
| Traineraufgabe anlegen | 5-7 | 3 | Trainingdetail -> Aufgabe |
| offene Rückmeldung beantworten | 4-6 | 3 | Dashboard -> Rückmeldung -> Antwort |
| Training kopieren | 4-6 | 3 | Kartenaktion "Kopieren" |
| Wiederholung erstellen | 5-8 | 4 | Quick Repeat im Detaildrawer |
| Vorlage favorisieren | 3-5 | 1 | Stern direkt auf Vorlage |
| Vorlage nutzen auf Phone | 5-7 | 4 | Vorlage -> Datum -> Zeit -> Speichern |
| Gruppe für Woche filtern | 3-5 | 2 | Kalenderfilter dauerhaft sichtbar |
| Journal prüfen | 3-5 | 2 | Trainingdetail -> Journal |
| Soll/Ist sehen | 3-5 | 1 | direkt an Karte/Drawer |
| Konflikt erkennen | manuell | 0 | automatische Warnung |

## Prinzipien zur Reduktion

### 1. Detaildrawer statt Bereichswechsel

Ein Klick auf Training öffnet rechts oder unten:

- Details
- Soll/Ist
- Feedback
- Aufgaben
- Aktionen

### 2. Quick Edit statt Vollformular

Nach Vorlage oder Kopieren:

- Datum
- Uhrzeit
- Dauer
- Gruppe/Sportler
- Trainer
- Speichern

"Weitere Details" öffnet den großen Editor.

### 3. Zwei-Stufen-Feedback

Stufe 1:

- Status
- RPE
- Dauer
- kurze Notiz

Stufe 2 optional:

- Schlaf
- Müdigkeit
- Motivation
- Schmerzen
- Distanz
- Herzfrequenz

### 4. Aktionen an Karten

Jede Trainingskarte auf Tablet/Desktop:

```text
Ansehen | Starten | Feedback | Kopieren | Aufgabe | Mehr
```

Phone:

```text
Starten
Durchgeführt
Mehr
```

### 5. Toolbar als Arbeitsleiste

Kalender-Toolbar:

- Heute
- Woche kopieren
- Vorlage verwenden
- Training hinzufügen
- Filter
- Suche
- Mehr

## Prioritäten

### A

- Detaildrawer einführen.
- Quick Edit einführen.
- Phone-Feedback verkürzen.
- Kalenderblock-Aktionen ergänzen.
- Woche kopieren aus Kalender erreichbar machen.

### B

- Multi-Select mit Massenaktionen.
- Dauerhafte Filterleiste.
- Tastaturkürzel für Desktop.
- Vorlagenfavorit mit einem Klick.

### C

- Command Palette auf Desktop.
- KI-Vorschläge als Entwurf.
- Automatische Konfliktlösungsvorschläge.

## Erwarteter Effekt

| Bereich | Erwartete Wirkung |
|---|---|
| Phone Sportler | weniger Frust nach Training |
| Phone Coach | Anwesenheit/Feedback schneller |
| Tablet Trainer | echte Arbeitsfläche am Wasser |
| Desktop Planung | deutlich weniger Scrollen und Seitenwechsel |
| Verein | Wochenplanung schneller und konsistenter |

