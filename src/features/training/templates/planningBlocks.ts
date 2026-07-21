import type {
  TrainingArea,
  TrainingBoatClass,
  TrainingIntensity,
  TrainingPlanType,
  TrainingTemplate,
  TrainingTemplateCategory,
} from "../../../domain/types";

export type WeeklyPlanningTemplateItem = {
  dayOffset: number;
  templateId?: string;
  title: string;
  time: string;
  durationMinutes: number;
  area: TrainingArea;
  trainingType: TrainingPlanType;
  boatClass: TrainingBoatClass;
  intensity: TrainingIntensity;
  focus: string;
  description: string;
};

export type WeeklyPlanningTemplate = {
  id: string;
  title: string;
  category: TrainingTemplateCategory;
  description: string;
  items: WeeklyPlanningTemplateItem[];
};

export type SeasonPlanningBlock = {
  id: string;
  title: string;
  description: string;
  weeklyTemplateIds: string[];
};

const systemUserId = "paddlio-system";

const quickTemplate = (
  clubId: string,
  id: string,
  title: string,
  category: TrainingTemplateCategory,
  trainingArea: TrainingArea,
  trainingType: TrainingPlanType,
  defaultDurationMinutes: number,
  defaultIntensity: TrainingIntensity,
  focus: string,
  description: string,
  boatClass: TrainingBoatClass = "none",
  tags: string[] = [],
): TrainingTemplate => ({
  id,
  ownerUserId: systemUserId,
  clubId,
  createdByUserId: systemUserId,
  title,
  category,
  trainingArea,
  trainingType,
  boatClass,
  defaultDurationMinutes,
  defaultIntensity,
  focus,
  description,
  notes: "",
  tags,
  academyLessonId: "",
  isFavorite: false,
  visibility: "club",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

export const createCalendarQuickTemplates = (clubId: string): TrainingTemplate[] => [
  quickTemplate(clubId, "system-calendar-k1-technique", "K1 Technik", "K1", "Wassertraining", "K1 Technik", 60, "mittel", "Bootskontrolle, Linienwahl, saubere Schlagfolge", "Technikeinheit im K1 mit ruhiger Wiederholung und klaren Knotenpunkten.", "K1", ["K1", "Technik"]),
  quickTemplate(clubId, "system-calendar-c1-technique", "C1 Technik", "C1", "Wassertraining", "C1 Technik", 60, "mittel", "C1-Bootskontrolle, Kanteneinsatz, Blickführung", "Technikeinheit im C1 mit kontrollierter Linie und stabiler Bootsposition.", "C1", ["C1", "Technik"]),
  quickTemplate(clubId, "system-calendar-competition", "Wettkampf", "Wettkampf", "Wettkampf", "Wettkampftag", 120, "hart", "Start-Routine, Streckenbesichtigung, Rennplan", "Wettkampftermin mit Vorbereitung, Laufanalyse und Nachbereitung.", "K1+C1", ["Wettkampf"]),
  quickTemplate(clubId, "system-calendar-free-training", "Freies Training", "Allgemein", "Wassertraining", "Kindertraining", 60, "locker", "eigene Aufgabe, Technik wiederholen, Belastung steuern", "Freies Training mit eigener Schwerpunktsetzung.", "none", ["frei"]),
  quickTemplate(clubId, "system-calendar-video-analysis", "Videoanalyse", "Technik", "Trainerarbeit", "Technikbetreuung", 45, "locker", "Video aufnehmen, Technik bewerten, Korrektur festlegen", "Technikeinheit mit Videoaufnahme und kurzer Auswertung.", "K1+C1", ["Video", "Analyse"]),
  quickTemplate(clubId, "system-calendar-material-test", "Materialtest", "Allgemein", "Wassertraining", "neues Paddel testen", 45, "locker", "Boot, Paddel oder Sitzposition prüfen", "Materialtest mit klarer Rückmeldung zu Fahrgefühl und Kontrolle.", "K1+C1", ["Material"]),
  quickTemplate(clubId, "system-calendar-athletics", "Athletik", "Kraft", "Krafttraining", "Rumpfstabilitaet", 45, "mittel", "Rumpf, Schulter, Ganzkörperstabilität", "Athletikeinheit an Land mit kontrollierter Ausführung.", "none", ["Athletik"]),
  quickTemplate(clubId, "system-calendar-individual", "Individueller Termin", "Allgemein", "Trainerarbeit", "Gruppenbetreuung", 30, "locker", "individuelle Aufgabe oder kurzer Termin", "Individueller Termin für Einzelbetreuung, Gespräch oder kurze Zusatzaufgabe.", "none", ["individuell"]),
];

export const weeklyPlanningTemplates: WeeklyPlanningTemplate[] = [
  {
    id: "weekly-foundation",
    title: "Grundlagenwoche",
    category: "Ausdauer",
    description: "Ruhige Ausdauerbasis mit Technik und Kraftausdauer.",
    items: [
      { dayOffset: 0, templateId: "system-periodization-ga1", title: "GA1 Grundlagenfahrt", time: "17:30", durationMinutes: 75, area: "Ausdauer", trainingType: "GA1", boatClass: "K1+C1", intensity: "locker", focus: "aerobe Grundlagenausdauer, gleichmäßiger Rhythmus", description: "Ruhige Grundlagenfahrt mit sauberer Paddeltechnik." },
      { dayOffset: 1, templateId: "system-periodization-kaus", title: "Kraftausdauer Zirkel", time: "17:30", durationMinutes: 45, area: "Krafttraining", trainingType: "Kraftausdauer", boatClass: "none", intensity: "mittel", focus: "Rumpfstabilität, Schulterstabilität", description: "Kraftausdauerzirkel mit sauberer Bewegungskontrolle." },
      { dayOffset: 2, templateId: "system-periodization-technik", title: "Technik unter geringer Belastung", time: "17:30", durationMinutes: 60, area: "Wassertraining", trainingType: "K1 Technik", boatClass: "K1+C1", intensity: "locker", focus: "Grundschläge, Blickführung, Linienwahl", description: "Techniktraining mit niedriger Intensität." },
      { dayOffset: 4, templateId: "system-periodization-ga2", title: "GA2 Tempoausdauer", time: "17:30", durationMinutes: 60, area: "Ausdauer", trainingType: "GA2", boatClass: "K1+C1", intensity: "mittel", focus: "Tempoausdauer, Belastungskontrolle", description: "Kontrollierte Tempobelastung mit stabilem Rhythmus." },
    ],
  },
  {
    id: "weekly-technique-block",
    title: "Technikblock",
    category: "Technik",
    description: "Mehrere kurze Technikeinheiten mit einem klaren Schwerpunkt.",
    items: [
      { dayOffset: 0, templateId: "system-calendar-k1-technique", title: "K1 Technik", time: "17:30", durationMinutes: 60, area: "Wassertraining", trainingType: "K1 Technik", boatClass: "K1", intensity: "locker", focus: "Grundschläge, Bootskontrolle", description: "K1-Technik mit Wiederholungsfokus." },
      { dayOffset: 2, templateId: "system-periodization-technik", title: "Technik unter geringer Belastung", time: "17:30", durationMinutes: 60, area: "Wassertraining", trainingType: "Slalomstrecke", boatClass: "K1+C1", intensity: "locker", focus: "Torplanung, Knotenpunkte, Linienwahl", description: "Kurze Technikstrecken mit Selbstkontrolle." },
      { dayOffset: 4, templateId: "system-calendar-video-analysis", title: "Videoanalyse", time: "17:30", durationMinutes: 45, area: "Trainerarbeit", trainingType: "Technikbetreuung", boatClass: "K1+C1", intensity: "locker", focus: "Video, Fehlerkorrektur, Trainerfeedback", description: "Videoanalyse mit maximal drei Korrekturpunkten." },
    ],
  },
  {
    id: "weekly-competition",
    title: "Wettkampfwoche",
    category: "Wettkampf",
    description: "Belastung reduzieren, Technik stabilisieren, Wettkampf vorbereiten.",
    items: [
      { dayOffset: 0, templateId: "system-periodization-ga1", title: "GA1 Grundlagenfahrt", time: "17:30", durationMinutes: 45, area: "Ausdauer", trainingType: "GA1", boatClass: "K1+C1", intensity: "locker", focus: "locker einfahren, Rhythmus halten", description: "Kurze lockere Fahrt zum Wochenstart." },
      { dayOffset: 2, templateId: "system-periodization-wa", title: "Wettkampfausdauer Simulation", time: "17:30", durationMinutes: 60, area: "Wettkampf", trainingType: "Wettkampfsimulation", boatClass: "K1+C1", intensity: "hart", focus: "Rennplan, Start-Routine, Fehlerreaktion", description: "Wettkampfsimulation mit Zeit und Strafsekunden." },
      { dayOffset: 4, templateId: "system-periodization-regeneration", title: "Regeneration & Beweglichkeit", time: "17:30", durationMinutes: 35, area: "Regeneration", trainingType: "Mobility", boatClass: "none", intensity: "locker", focus: "Beweglichkeit, Aktivierung, Erholung", description: "Kurze Regeneration und Beweglichkeit vor dem Wettkampf." },
      { dayOffset: 5, templateId: "system-calendar-competition", title: "Wettkampf", time: "09:00", durationMinutes: 180, area: "Wettkampf", trainingType: "Wettkampftag", boatClass: "K1+C1", intensity: "hart", focus: "Streckenbesichtigung, Rennplan, Laufanalyse", description: "Wettkampftag mit Vorbereitung und Nachbereitung." },
    ],
  },
  {
    id: "weekly-recovery",
    title: "Regenerationswoche",
    category: "Regeneration",
    description: "Reduzierte Belastung mit Mobilität und sehr lockerer Bewegung.",
    items: [
      { dayOffset: 1, templateId: "system-periodization-regeneration", title: "Regeneration & Beweglichkeit", time: "17:30", durationMinutes: 35, area: "Regeneration", trainingType: "Mobility", boatClass: "none", intensity: "locker", focus: "Mobilisation, lockere Durchblutung", description: "Regeneration mit Beweglichkeit und ruhiger Aktivierung." },
      { dayOffset: 3, templateId: "system-periodization-ga1", title: "Aktive Regenerationsfahrt", time: "17:30", durationMinutes: 45, area: "Ausdauer", trainingType: "Regeneration", boatClass: "K1+C1", intensity: "locker", focus: "aktive Regeneration, ruhiger Rhythmus", description: "Sehr lockere Fahrt ohne intensive Beschleunigungen." },
    ],
  },
];

export const seasonPlanningBlocks: SeasonPlanningBlock[] = [
  {
    id: "season-foundation-phase",
    title: "Grundlagenphase - 4 Wochen",
    description: "Moderater Einstieg, Steigerung, Technikschwerpunkt und Entlastung.",
    weeklyTemplateIds: ["weekly-foundation", "weekly-foundation", "weekly-technique-block", "weekly-recovery"],
  },
  {
    id: "season-competition-prep",
    title: "Wettkampfvorbereitung - 4 Wochen",
    description: "Technikblock, Belastungswoche, Wettkampfwoche und Regeneration.",
    weeklyTemplateIds: ["weekly-technique-block", "weekly-foundation", "weekly-competition", "weekly-recovery"],
  },
];
