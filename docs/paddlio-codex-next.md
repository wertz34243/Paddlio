# Paddlio - naechster Codex-Auftrag

Status: DONE

Auftragsbasis: Speicherprobleme bei Zielen, Material und Profil vom 03.10.2026.

Ergebnis:
- Ziele und persoenliches Material besitzen jetzt echte Cloud-Schreibpfade und bleiben nach Reload erhalten.
- Erweiterte Profilfelder werden nicht mehr still verworfen, sondern in `profiles.profile_data` persistiert.
- Die additive Migration `20261003071613_reliable_goals_material_profile_persistence.sql` ist auf Supabase DEV angewendet und verifiziert.
- Erfolg, Offline-Queue und nicht wiederholbare Fehler werden fachlich getrennt behandelt.
- Mobile Formulare bleiben oberhalb der festen Navigation erreichbar.
- Unit-, Build-, Beta-, E2E- und Rollen-Suiten sind gruen.
- Details und manueller iPhone-/iPad-/PC-Retest stehen in `docs/paddlio-codex-handoff.md`.

Naechster Auftrag erst wieder mit `Status: READY`.
