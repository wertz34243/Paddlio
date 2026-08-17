# Phone UI Hotfix Review

Stand: 2026-08-17  
Branch: develop  
Ziel: sichtbare Phone-UI-Fehler fuer den realen Wochenlauf beheben, ohne neue Features oder Desktop-/Tablet-Umbauten.

## Behobene sichtbare Fehler

### Safe Area und oberer Abstand
- Phone-Seiten erhalten zusaetzliches Top-Padding oberhalb des Inhaltsbereichs.
- Betroffen sind allgemeine Seiteninhalte, Category-Shells, Training und Profil/Einstellungen.
- Ziel: iPhone-Statusleiste kollidiert nicht mehr mit Seitentiteln, Section-Headern oder Top-Aktionen.

### Top Action / Plus-Button
- Top-Aktionen in Phone-Section-Headern werden sauber innerhalb der Header-Zeile ausgerichtet.
- Runde/kompakte Aktionen erhalten Mindestgroesse, aber keinen negativen optischen Versatz in Richtung Statusleiste.

### Phone Header
- Section-Eyebrows und Titel wurden fuer Phone kompakter gemacht.
- Lange Titel koennen umbrechen, ohne aus dem Container zu laufen.
- Kombinationen wie "TRAININGSTAGEBUCH" und "Training" wirken ruhiger und ueberlagern sich nicht.

### Training-Wizard
- Der Wizard "Neue Einheit" ist auf Phone jetzt strikt einspaltig.
- Header, Schrittanzeige und Formularfelder sind kompakter.
- Aktionen sind hierarchisiert:
  - Primaer: Weiter/Speichern
  - Sekundaer: Zurueck
  - Tertiaer: Abbrechen
- Buttons werden auf kleinen Screens nicht mehr als drei gleichwertige breite Aktionen nebeneinander gepresst.

### Einstellungen und Form Controls
- Datei-Upload in der Profil-/Einstellungsansicht ist auf Phone begrenzt und bricht sauber um.
- Lange Dateinamen laufen nicht mehr aus dem Control heraus.
- Toggle-Zeilen sind auf Phone als Text + Control sauber ausgerichtet.

### Profil-Sync-Fehler
- "Profil konnte nicht synchronisiert werden" wird nicht mehr als normaler Text unter dem Speichern-Button dargestellt.
- Der Fehler erscheint jetzt als klare Statusbox mit Titel, Warnfarbe und getrenntem Text.

### Empty-State-Konflikt im Training
- Im Erstellmodus konkurriert "Keine Einheiten fuer diesen Filter" nicht mehr visuell mit dem Wizard.
- Der Erstellmodus ist dadurch fokussierter.

## Login / Cloud-Warnung

### Ursache
Die Meldung "Cloud eingeschraenkt: 27 optionale Module konnten spaeter nicht synchronisiert werden" kam aus dem optionalen Cloud-Preload im AuthProvider.

Betroffene optionale Module:
- personal_bests
- result_imports
- external_connections
- external_training_sessions
- beta_readiness_checks
- beta_feedback
- beta_testers
- club_material
- boats
- club_events
- club_documents
- club_settings
- club_posts
- file_attachments
- academy_categories
- academy_courses
- academy_lessons
- academy_content_blocks
- academy_learning_paths
- academy_learning_path_items
- academy_progress
- academy_assignments
- academy_quizzes
- academy_quiz_questions
- academy_quiz_attempts
- academy_favorites
- academy_media

### Bewertung fuer Wochenlauf
Diese 27 Module gehoeren nicht zum unmittelbaren Phone-Wochenlauf-Kern fuer Kalender, Training, Vorlagen, Feedback, Journal, Rollen und Team-Grundnutzung. Es handelt sich um Zusatzbereiche wie Akademie, Material, Import-/Resultatdaten, Beta-Status und externe Verbindungen.

### Aenderung
- Technische Modulzahlen werden nicht mehr als Login-Warnung fuer normale Nutzer angezeigt.
- Der AuthProvider formuliert optionale Modulprobleme generisch als Zusatzfunktions-Hinweis.
- Die Login-Seite blendet diese optionalen Zusatzfunktionshinweise aus.
- Relevante Login-/Konfigurationsprobleme bleiben sichtbar.

## Geaenderte Phone-Komponenten
- Auth/Login Cloud-Meldung
- Phone-Seitenabstaende
- Section Header
- Training Create Wizard
- Training Empty State
- Profil/Einstellungen Datei-Upload
- Profil/Einstellungen Toggle Row
- Profil Error State

## Gepruefte Seiten
- Login
- Training
- Training erstellen
- Trainingstagebuch / Journal
- Einstellungen / Profil
- Heute, Kalender, Vorlagen und Feedback ueber bestehende E2E-Mobile-Guards

## Testergebnisse
- Unit Tests: bestanden, 14 Dateien / 62 Tests
- Build: bestanden
- check:beta: bestanden
- test:e2e: bestanden, 17 passed / 5 skipped
- test:e2e:roles: bestanden, 9 passed / 1 skipped

Hinweis: Ein Rollen-E2E-Lauf wurde zuerst parallel zum Full-E2E gestartet und kollidierte beim Zwei-Geraete-Feedback mit denselben Testdaten. Der anschliessende Einzel-Lauf war gruen.

## Offene Punkte
- Keine manuelle Safari/PWA-Pruefung auf echtem iPhone im Rahmen dieses Hotfix-Laufs durchgefuehrt.
- Vite meldet weiterhin die bekannte Chunk-Warnung fuer grosse Bundles; der Beta-Bundle-Check ist bestanden.
- Optionalmodule bleiben als technische Zusatzfunktions-Themen bestehen, blockieren aber den Phone-Wochenlauf nicht.

## Restbewertung Phone
Phone UI nach Hotfix: 91/100

Begruendung:
- Sichtbare Top-Safe-Area-, Wizard-, Error-State- und Form-Control-Probleme sind behoben.
- Login ist fuer normale Nutzer deutlich ruhiger.
- Der Kern ist fuer den Wochenlauf nutzbar.
- Restunsicherheit bleibt bei echter iOS-PWA-Darstellung und optionalen Zusatzmodulen.

## Wochenlauf-Gate
PHONE BEREIT FUER REALEN WOCHENLAUF: JA

Freigabe gilt fuer den Kern:
- Heute
- Kalender
- Training
- Vorlagen
- Feedback
- Journal
- Profil/Einstellungen

Nicht als Freigabe fuer optionale Zusatzmodule wie Akademie, Material, Import/Resultate oder externe Integrationen verstehen.
