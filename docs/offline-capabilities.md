# Paddlio Offline-Faehigkeiten

## Lokal nutzbar

- Bereits geladene Kalender-, Trainings-, Feedback-, Journal-, Material- und Wettkampfdaten bleiben im accountbezogenen Cache lesbar.
- Unterstuetzte Aenderungen werden lokal sofort dargestellt und als user-scoped Queue-Eintrag gespeichert.
- Nach Wiederverbindung verarbeitet Paddlio retrybare Writes automatisch. Queue-Eintraege eines anderen Kontos werden nicht unter dem aktuellen Konto gesendet.

## Internet erforderlich

- Login, Registrierung, E-Mail-Bestaetigung und Passwort-Recovery
- erstmaliges Laden noch nicht gecachter Daten
- Polar verbinden und neue Polar-Einheiten abrufen
- Dateiimport, wenn die fachlichen Datensaetze noch nicht erfolgreich in DEV gespeichert werden koennen
- Kontodatenexport und Kontoloeschung

## Fehlerverhalten

- Offline und voruebergehende Netzwerkfehler werden als ausstehend gespeichert.
- RLS-, Auth-, Fremdschluessel- und nicht reparierbare Constraint-Fehler werden nicht endlos wiederholt.
- Der Cloud-Status zeigt fuer das aktuelle Konto getrennt synchronisierte, ausstehende und fehlgeschlagene Eintraege.
- Ein erfolgreicher leerer Cloud-Abruf ist die gueltige Wahrheit; nur ein fehlgeschlagener Abruf darf auf Cache-Daten zurueckfallen.

Nicht unterstuetzte Online-Aktionen zeigen eine verstaendliche Meldung. Browser-Cache oder Queue duerfen nicht pauschal geloescht werden, weil dadurch noch nicht synchronisierte Aenderungen verloren gehen koennten.
