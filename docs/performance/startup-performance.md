# Startup Performance

## Messpunkte

Vor und nach Performance-Änderungen werden dokumentiert:

- Zeit bis erster sichtbarer Inhalt
- Zeit bis Heute sichtbar ist
- initiale Supabase-Requests
- initiale Datenmenge
- globale Realtime-Abos
- initiale JavaScript-Chunks
- nachgeladene Feature-Chunks

## Zielbild

Phone:

- sofort lokaler Inhalt
- keine Admin-, XLSX-, Import-, Archiv- oder Akademie-Redaktionschunks im Startpfad
- aktuelle Woche und Polar im Hintergrund

Tablet:

- aktuelle Woche, Gruppen, Anwesenheit und Feedback früh laden
- Archive lazy

Desktop:

- vollständiger Funktionsumfang
- schwere Bereiche trotzdem route-basiert laden

## Aktuelle bekannte Warnung

Vite meldet große Chunks. Das bestehende Bundle-Budget akzeptiert sie, aber `xlsx` und große Spezialbereiche müssen weiter lazy geladen bleiben.
