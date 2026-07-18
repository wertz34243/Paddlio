# Paddlio 5.0 Beta Known Limitations

Diese Punkte sind fuer eine Beta bekannt und duerfen nicht als verdeckte Fehler behandelt werden.

## Noch eingeschraenkt

- Polar Webhook-/Background-Sync ist vorbereitet, aber nicht dauerhaft aktiv verdrahtet.
- Trainerzugriff auf Polar-Daten sollte spaeter ueber explizite Sportlerfreigaben verfeinert werden.
- Rollenbasierte E2E-Tests benoetigen Test-Credentials als Umgebungsvariablen und werden ohne diese uebersprungen.
- XLSX bleibt ein grosser separater Chunk. Er wird lazy geladen und nicht im initialen App-Start geladen.
- Komplexe Import-Rollbacks werden nur angeboten, wenn sie eindeutig sicher sind.
- Vollstaendige mobile Geraeteabnahme muss mit echten iPhone/iPad/Android-Geraeten erfolgen.

## Nicht akzeptabel fuer externe Beta

- kaputte sichtbare Umlaute
- falsche Rollen nach Login
- Training erscheint am falschen Kalendertag
- geloeschtes Training erscheint nach Reload wieder
- Athlete sieht Coach/Admin-Daten
- fremde Vereinsdaten sichtbar
- Feedback oder Nachrichten gehen zwischen Coach und Athlete verloren
