# Paddlio - naechster Codex-Auftrag

Status: DONE

Auftragsbasis: Paddlio 5.0 kritischer Profilfehler vor Veroeffentlichung.

Ergebnis:
- Profil- und Einstellungswrites werden anhand der von Supabase bestaetigten Profilzeile uebernommen.
- Der konkurrierende Snapshot-/Legacy-Profilwrite wurde entfernt; bestaetigte Werte werden nicht mehr durch alte lokale Komplettstaende ueberschrieben.
- Alle editierbaren Profildaten einschliesslich K1+C1 und C1-Paddelseite liefen im echten DEV-Test ueber Reload.
- Vereinszuordnung bleibt kanonisch und geschuetzt; Self-Service kann keine fremde `club_id` setzen.
- Migration `20261004054924_harden_profile_self_update_500.sql` ist auf Supabase DEV angewendet und verifiziert.
- Ziele, Material, Unit-, Build-, Beta-, E2E- und Rollenpruefungen sind gruen.
- Details und manueller iPhone-/iPad-/PC-Retest stehen in `docs/paddlio-codex-handoff.md`.

Naechster Auftrag erst wieder mit `Status: READY`.
