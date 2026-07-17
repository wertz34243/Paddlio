import type { ImportField, ImportType } from "./types";

type FieldDefinition = {
  field: ImportField;
  label: string;
  synonyms: string[];
  requiredFor: ImportType[];
};

export const importTypeLabels: Record<ImportType, string> = {
  athletes: "Sportlerliste",
  training_plans: "Trainingsplan",
  training_sessions: "Trainingseinheiten",
  start_lists: "Startliste",
  competition_results: "Wettkampfergebnisse",
  club_members: "Vereinsmitglieder",
  groups: "Gruppen",
  materials: "Materialliste",
};

export const supportedImportTypes: Array<{ id: ImportType; label: string; description: string; enabled: boolean }> = [
  { id: "athletes", label: "Sportlerliste", description: "Namen, Verein, Bootsklasse, Geburtsdatum und E-Mail prüfen.", enabled: true },
  { id: "training_plans", label: "Trainingsplan", description: "Datum, Uhrzeit, Dauer, Fokus und Beschreibung importieren.", enabled: true },
  { id: "training_sessions", label: "Trainingseinheiten", description: "Durchgeführte Einheiten ins Trainingstagebuch übernehmen.", enabled: true },
  { id: "competition_results", label: "Wettkampfergebnisse", description: "Fahrzeit, Strafsekunden, Platzierung und Bootsklasse prüfen.", enabled: true },
  { id: "start_lists", label: "Startliste", description: "Startnummern, Namen, Verein und Klassen vorbereiten.", enabled: true },
  { id: "club_members", label: "Vereinsmitglieder", description: "Mitgliederlisten als Vorschau prüfen.", enabled: true },
  { id: "groups", label: "Gruppen", description: "Trainingsgruppen und Zuordnungen vorbereiten.", enabled: true },
  { id: "materials", label: "Materialliste", description: "Boote, Paddel und Vereinsmaterial importieren.", enabled: true },
];

export const fieldDefinitions: FieldDefinition[] = [
  { field: "fullName", label: "Vollständiger Name", synonyms: ["name", "sportler", "teilnehmer", "athlet", "person", "fahrer", "paddler", "vorname nachname", "nachname, vorname"], requiredFor: ["athletes", "club_members", "start_lists", "competition_results"] },
  { field: "firstName", label: "Vorname", synonyms: ["vorname", "first name", "given name"], requiredFor: [] },
  { field: "lastName", label: "Nachname", synonyms: ["nachname", "familienname", "last name", "surname"], requiredFor: [] },
  { field: "email", label: "E-Mail", synonyms: ["email", "e-mail", "mail", "kontakt"], requiredFor: [] },
  { field: "birthDate", label: "Geburtsdatum", synonyms: ["geburtsdatum", "geburtstag", "dob", "birthdate", "geboren"], requiredFor: [] },
  { field: "club", label: "Verein", synonyms: ["verein", "club", "mannschaft", "organisation"], requiredFor: ["athletes", "club_members"] },
  { field: "boatClass", label: "Bootsklasse", synonyms: ["boot", "bootsklasse", "bootsklasse", "klasse", "k1", "c1", "c2"], requiredFor: [] },
  { field: "ageClass", label: "Altersklasse", synonyms: ["altersklasse", "ak", "age class", "klasse"], requiredFor: [] },
  { field: "date", label: "Datum", synonyms: ["datum", "trainingstag", "wettkampftag", "startdatum", "date", "tag"], requiredFor: ["training_plans", "training_sessions", "competition_results"] },
  { field: "time", label: "Uhrzeit", synonyms: ["uhrzeit", "startzeit", "beginn", "time"], requiredFor: [] },
  { field: "durationMinutes", label: "Dauer in Minuten", synonyms: ["dauer", "minuten", "trainingszeit", "duration", "zeitumfang"], requiredFor: ["training_plans", "training_sessions"] },
  { field: "title", label: "Titel", synonyms: ["titel", "einheit", "training", "name der einheit", "thema"], requiredFor: ["training_plans"] },
  { field: "focus", label: "Fokus", synonyms: ["fokus", "schwerpunkt", "trainingsziel", "ziel", "focus"], requiredFor: [] },
  { field: "description", label: "Beschreibung", synonyms: ["beschreibung", "inhalt", "notizen", "notiz", "ablauf", "description"], requiredFor: [] },
  { field: "trainingType", label: "Trainingsart", synonyms: ["trainingsart", "typ", "bereich", "art", "trainingstyp"], requiredFor: [] },
  { field: "group", label: "Gruppe", synonyms: ["gruppe", "team", "trainingsgruppe"], requiredFor: [] },
  { field: "athlete", label: "Sportler", synonyms: ["sportler", "athlet", "zuordnung", "athlete"], requiredFor: [] },
  { field: "startNumber", label: "Startnummer", synonyms: ["startnummer", "start-nr.", "stnr", "bib", "nummer"], requiredFor: ["start_lists"] },
  { field: "rank", label: "Platz", synonyms: ["platz", "rang", "position", "rank"], requiredFor: [] },
  { field: "run", label: "Lauf", synonyms: ["lauf", "run", "durchgang"], requiredFor: [] },
  { field: "rawTime", label: "Fahrzeit", synonyms: ["fahrzeit", "zeit", "laufzeit", "ergebnis", "nettozeit"], requiredFor: ["competition_results"] },
  { field: "penaltySeconds", label: "Strafsekunden", synonyms: ["strafe", "strafsekunden", "penalty", "penalties", "fehler"], requiredFor: [] },
  { field: "materialType", label: "Materialtyp", synonyms: ["materialtyp", "typ", "kategorie", "material"], requiredFor: ["materials"] },
  { field: "materialName", label: "Materialname", synonyms: ["bezeichnung", "materialname", "modell", "name"], requiredFor: ["materials"] },
  { field: "condition", label: "Zustand", synonyms: ["zustand", "condition", "status"], requiredFor: [] },
  { field: "inventoryNumber", label: "Inventarnummer", synonyms: ["inventarnummer", "inventar", "seriennummer", "nummer"], requiredFor: [] },
];

export const targetFieldLabels = fieldDefinitions.reduce<Record<ImportField, string>>(
  (acc, item) => ({ ...acc, [item.field]: item.label }),
  { ignore: "Ignorieren" } as Record<ImportField, string>,
);

export function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_./:-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectTargetField(header: string, importType: ImportType): { field: ImportField; confidence: number } {
  const normalized = normalizeHeader(header);
  if (!normalized) return { field: "ignore", confidence: 0 };

  let best: { field: ImportField; confidence: number } = { field: "ignore", confidence: 0 };
  fieldDefinitions.forEach((definition) => {
    definition.synonyms.forEach((synonym) => {
      const needle = normalizeHeader(synonym);
      const confidence = normalized === needle ? 1 : normalized.includes(needle) || needle.includes(normalized) ? 0.72 : 0;
      const bonus = definition.requiredFor.includes(importType) ? 0.08 : 0;
      if (confidence + bonus > best.confidence) {
        best = { field: definition.field, confidence: Math.min(1, confidence + bonus) };
      }
    });
  });

  return best.confidence >= 0.6 ? best : { field: "ignore", confidence: 0.2 };
}

export function requiredFieldsFor(importType: ImportType): ImportField[] {
  const fields = fieldDefinitions.filter((field) => field.requiredFor.includes(importType)).map((field) => field.field);
  if (importType === "athletes" || importType === "club_members") return ["fullName"];
  if (importType === "training_plans") return ["date", "durationMinutes"];
  if (importType === "training_sessions") return ["date", "durationMinutes"];
  if (importType === "competition_results") return ["date", "fullName", "rawTime"];
  if (importType === "materials") return ["materialName"];
  return fields;
}
