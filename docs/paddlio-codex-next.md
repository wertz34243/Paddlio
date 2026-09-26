# Paddlio - naechster Codex-Auftrag

Status: DONE

Auftragsbasis: Release-Blocker-Auftrag vom 25.09.2026.

Auftrag:
- Letzte technische Release-Blocker abarbeiten: Desktop-Scroll-E2E, Auskunftsexport, sichere Kontoloeschung und DEV-Sicherheitscheck.

Ergebnis:
- Implementierungscommit `19890db` ist auf `origin/develop` gepusht.
- Desktop-Scroll- und Vorlagen-E2E-Races sind zustandsbasiert behoben; gesamte E2E- und Rollen-Suite ist gruen.
- Kontobezogener JSON-Export und serverseitige Edge-Function-Loeschung sind implementiert.
- Edge Function wurde ueber Supabase CLI `2.118.0` auf DEV deployed und mit Rollen- sowie entbehrlichem Loesch-Testkonto verifiziert.
- Details stehen in `docs/paddlio-codex-handoff.md` und `docs/security/manual-dev-security-check.md`.
- Naechster Auftrag erst wieder mit `Status: READY`.

DEV-Abschluss 26.09.2026:
- `account-privacy` Version 7 auf DEV deployed und real mit Admin/Coach/Athlete verifiziert.
- Entbehrliches DEV-Testkonto erfolgreich und isoliert geloescht.
- Hosting-Header, DB-Lint und Security Advisor real geprueft.
- Vollstaendige Regression gruen; verbleibende Security-Advisor- und organisatorische Punkte stehen im Handoff.
