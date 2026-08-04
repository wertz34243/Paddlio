# Paddlio One Informationsarchitektur

Stand: 2026-08-04  
Branch: `develop`

## Grundstruktur

Paddlio One trennt nicht in neue parallele Apps. Die vorhandenen Funktionen werden in eine klarere Informationsarchitektur überführt.

```text
Heute
  Nächstes Training
  Tagesplan
  Feedback
  Aufgaben
  Polar/Recovery
  Smart Coach

Kalender
  Tag
  3 Tage
  Woche
  Monat
  Jahr
  Saison
  Liste
  Vorlagen
  Quick Edit

Training
  Übersicht
  Durchführung
  Live-Training
  Journal
  Feedback
  Soll/Ist
  Vorlagen

Plan
  Wochenplanung
  Wochen kopieren
  Wochenvorlagen
  Saisonbausteine
  Jahresplanung

Team
  Sportler
  Trainer
  Gruppen
  Anwesenheit
  Aufgaben
  Nachrichten

Analyse
  Training
  Belastung
  Polar
  Soll/Ist
  Wettkampf
  Ziele
  Rekorde

Mehr / Einstellungen
  Profil
  Akademie
  Material
  Wettkampf
  Polar
  Import/Export
  Syncstatus
  Datenschutz
  Hilfe

Admin
  Nutzer
  Rollen
  Vereine
  Freigaben
  Import/Export
  Systemstatus
  Audit
```

## Kontextmodi

| Kontextmodus | Primärer Bereich | Sichtbare Sekundärbereiche |
|---|---|---|
| Tagesmodus | Heute | Training, Aufgaben, Feedback, Polar |
| Planungsmodus | Kalender/Plan | Vorlagen, Sportler, Gruppen, Konflikte |
| Trainingsmodus | Live-Training | Timer, HF, Abschnitt, Notizen, Beenden |
| Analysemodus | Analyse | Polar, Feedback, Ziele, Wettkampf |
| Wettkampfmodus | Wettkampf | Startliste, Zeiten, Strafsekunden, Ergebnisse |
| Verwaltungsmodus | Admin/Verein | Nutzer, Rollen, Gruppen, Import, Systemstatus |

## Navigationslogik

### Phone

Bottom Navigation:

1. Heute
2. Kalender
3. Training
4. Team
5. Mehr

Analyse, Polar, Akademie, Wettkampf und Material sind über `Mehr` oder kontextbezogene Karten erreichbar.

### Tablet

Sidebar:

- Heute
- Kalender
- Training
- Plan
- Team
- Analyse
- Polar
- Akademie
- Mehr

Kalender und Planung werden als Hauptarbeitsfläche priorisiert.

### Desktop

Sidebar:

- Übersicht
- Kalender
- Plan
- Training
- Sportler
- Team
- Analyse
- Polar
- Aufgaben
- Nachrichten
- Wettkampf
- Akademie
- Material
- Einstellungen

Adminbereiche erscheinen nur rollenabhängig.

## Deep-Link-Verhalten

| Fall | Verhalten |
|---|---|
| Nicht angemeldet | Login mit Rückkehrziel |
| Nicht berechtigt | verständlicher Berechtigungshinweis, keine sensible Datenabfrage |
| Gerät eingeschränkt | `ContinueOnLargerDevice` oder Lesemodus |
| Funktion noch nicht verfügbar | Empty State mit Erklärung |
| Netzwerkfehler | verständlicher Fehler plus technische Details optional |

## Priorisierte Startdaten

| Priorität | Daten | Zweck |
|---|---|---|
| 1 | Profil, Rolle, Verein, heutige Trainings, Aufgaben, Nachrichtenstatus | schneller Start |
| 2 | aktuelle Woche, Feedback, Team-Kontext, Polarstatus | Alltag/Planung |
| 3 | Analyse-Snapshots, Akademie, Material, Wettkampf | nachgelagert |
| 4 | Archive, Importhistorie, alte Saisons | on demand |
