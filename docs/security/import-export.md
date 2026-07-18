# Import- und Export-Sicherheit

Paddlio verarbeitet Importdateien in der Beta nach einem Vorschaumodell:

- Es werden nur CSV, XLS und XLSX akzeptiert.
- Dateien über 25 MB werden blockiert.
- MIME-Type und Dateiendung werden geprüft.
- Leere Dateien oder Tabellenblätter ohne lesbare Daten werden blockiert.
- Der Import schreibt erst nach ausdrücklicher Bestätigung.
- Kritische Validierungsfehler blockieren die Ausführung.
- Duplikate werden bei unterstützten Importtypen übersprungen statt ungefragt doppelt angelegt.
- Importberichte und begrenzte Zeilenprotokolle werden für Nachvollziehbarkeit gespeichert.

Exportdateien schützen Werte, die Tabellenprogramme als Formel ausführen könnten. Werte mit `=`, `+`, `-` oder `@` werden beim CSV- und XLSX-Export als Text markiert.

Bekannte Beta-Grenzen:

- Konfliktvergleich ist vorbereitet, aber noch kein vollständiger Feld-für-Feld-Merge-Dialog.
- Rollback wird nur angeboten, wenn später eindeutig nachweisbar ist, dass ausschließlich neue, unveränderte Datensätze betroffen sind.
- Große Vereinsimporte sollten auf Tablet oder Desktop geprüft werden.
