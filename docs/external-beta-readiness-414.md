# Paddlio 4.1.4 External Beta Readiness

Version 4.1.4 ist ein Stabilitätsfix für externe Beta-Tests. Es wurden keine neuen Fachfunktionen eingebaut.

## Datenbank

Die Migration `0017_external_beta_readiness_414.sql` ergänzt fehlende Wettkampf-Metadaten, insbesondere `competitions.course`, idempotent. Außerdem werden eigene `profiles`-Policies für Lesen, Erstellen und Aktualisieren des eigenen Profils ergänzt.

## Profil-Sync

`ensureCloudProfile` liest zuerst das eigene Profil. Wenn es fehlt, wird ein minimales Profil erstellt. Bestehende Profile werden beim Login nicht per Upsert überschrieben, damit Rollen wie `Coach`, `ClubAdmin` oder `Admin` erhalten bleiben.

## Mobile Mehr-Navigation

Auf kleinen Viewports wird der Bereich `Mehr` zusätzlich als Kachel-/Listenansicht angezeigt. Dadurch bleiben Profil, Verein, Wettkampf, Material, Ziele, Rekorde, Updates, Integrationen, Feedback, Beta, Admin und Einstellungen erreichbar, ohne horizontal versteckte Tabs.

## Accessibility

Wiederholte Buttons wie `Training planen`, `Erledigt`, `Ausblenden`, `Bearbeiten` und `Löschen` erhalten kontextbezogene `aria-labels`, damit automatisierte Tests und Screenreader die Aktionen eindeutig unterscheiden können.

## Grenzen

Die Migration muss im Supabase SQL Editor oder über die Supabase CLI ausgeführt werden, bevor die Live-Datenbank garantiert `competitions.course` bereitstellt.
