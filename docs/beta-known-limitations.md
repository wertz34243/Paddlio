# Paddlio 5.0 Beta Known Limitations

Diese Punkte sind für eine Beta bekannt und dürfen nicht als verdeckte Fehler behandelt werden.

## Noch eingeschraenkt

- Polar Webhook-/Background-Sync ist vorbereitet, aber nicht dauerhaft aktiv verdrahtet.
- Trainerzugriff auf Polar-Daten sollte später über explizite Sportlerfreigaben verfeinert werden.
- Rollenbasierte E2E-Tests benoetigen Test-Credentials als Umgebungsvariablen und werden ohne diese übersprungen.
- XLSX bleibt ein grosser separater Chunk. Er wird lazy geladen und nicht im initialen App-Start geladen.
- Komplexe Import-Rollbacks werden nur angeboten, wenn sie eindeutig sicher sind.
- Vollständige mobile Geräteabnahme muss mit echten iPhone/iPad/Android-Geräten erfolgen.

## Nicht akzeptabel für externe Beta

- kaputte sichtbare Umlaute
- falsche Rollen nach Login
- Training erscheint am falschen Kalendertag
- geloeschtes Training erscheint nach Reload wieder
- Athlete sieht Coach/Admin-Daten
- fremde Vereinsdaten sichtbar
- Feedback oder Nachrichten gehen zwischen Coach und Athlete verloren
