# Paddlio Smart Coach

Stand: Version 3.6

## Ziel

Smart Coach erzeugt regelbasierte Trainingshinweise aus vorhandenen Paddlio-Daten. Die Funktion ist bewusst ohne externe KI/API gebaut und dient als Grundlage für einen späteren KI-Coach.

## Datenquellen

- `training_plan_items`: geplante, erledigte und ausgelassene Trainings
- `training_feedback`: Gefühl, Schwierigkeit, Müdigkeit, Motivation, Schlaf und Kommentar
- `season_goals`: Zielstatus, Fortschritt und Faelligkeit
- `competitions` / `competition_results`: Wettkampfentwicklung und Strafsekunden
- `materials`: Materialstatus und Testnotizen
- `profiles`, `training_groups`, `group_members`: Rollen-, Vereins- und Coach-Zugriff

## Regelbasis

- 7 Tage kein erledigtes Training: lockere Einheit empfehlen
- 3 harte/maximale Einheiten in 5 Tagen: Regeneration empfehlen
- hohe Müdigkeit, wenig Schlaf, schlechtes Gefühl oder geringe Motivation: locker trainieren
- hoher Strafsekunden-Schnitt: Techniktraining mit Linien-/Tor-Fokus empfehlen
- kein GA1/Grundlagentraining in 14 Tagen: Ausdauerreiz empfehlen
- Wettkampf innerhalb von 7 Tagen: Wettkampfvorbereitung empfehlen
- Ziel in 21 Tagen faellig und unter 60 Prozent Fortschritt: Ziel priorisieren
- Material mit Status `pruefen`, neuem Namen oder Testnotiz: Materialtest dokumentieren
- keine akute Regel aktiv: motivierender Fokus-Hinweis

## Empfehlungstypen

Empfehlungen haben:

- Kategorie: Training, Regeneration, Technik, Ausdauer, Kraft, Wettkampf, Ziele, Material, Warnung, Motivation
- Priorität: niedrig, mittel, hoch
- Titel, Text, Begründung und vorgeschlagene Aktion
- Status: offen, erledigt, ausgeblendet
- optionale Notiz

## Rollenrechte

- Athlete sieht nur eigene Empfehlungen und kann sie erledigen oder ausblenden.
- Coach sieht Hinweise für Sportler aus dem eigenen Verein und eigene Gruppen.
- Admin sieht alle geladenen Empfehlungen.

RLS muss diese Regeln serverseitig absichern. Das Frontend filtert zusaetzlich, ersetzt aber keine Datenbankrechte.

## Grenzen

Smart Coach ist keine medizinische Beratung und ersetzt keinen Trainer, Arzt oder medizinische Betreuung. Die Hinweise sind sportliche Trainingsimpulse auf Basis der dokumentierten Daten.

## Vorbereitung KI-Coach 3.6+

Die deterministischen Regeln erzeugen stabile Empfehlungstypen und Statuswerte. Ein späterer KI-Coach kann diese Daten nutzen, um bessere Sprache, persönlichere Priorisierung und langfristige Muster zu erzeugen, ohne die Datenstruktur neu zu erfinden.
