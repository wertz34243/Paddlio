# Paddlio - naechster Codex-Auftrag

Status: DONE

Auftragsbasis: Paddlio 5.0 letzter Release-Fix vor Schritt 3.

Ergebnis:
- Trainingseinheiten werden mit stabiler UUID und Cloud-Metadaten im Trainingstagebuch gespeichert.
- Wettkampfergebnisse verwenden stabile Identitaeten; Lauf 2 und Bestzeit werden korrekt behandelt.
- Startlisten bleiben echte `competition_start_entries` und verlangen bei gleichnamigen Wettkaempfen eine eindeutige Datumszuordnung.
- Dark-/Light-Theme wird am App-Root angewendet; Auswahlzustaende besitzen einheitliche Kontrastfarben.
- Migration `20261005134123_import_journal_metadata_500.sql` ist auf Supabase DEV angewendet und verifiziert.
- Unit-, Build-, Beta-, E2E-, Rollen- und Audit-Pruefungen sind gruen.
- Manueller iPhone-/iPad-/PC-Nachtest mit fiktiven Importdateien bleibt vor Schritt 3 erforderlich.

Naechster Auftrag erst wieder mit `Status: READY`.

