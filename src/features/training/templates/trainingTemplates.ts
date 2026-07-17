import type {
  TrainingTemplate,
  TrainingTemplateVisibility,
} from "../../../domain/types";

export type TrainingTemplateExercise = {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  trainingGoal: string;
  optionalLoad?: string;
  defaultDuration?: string;
  defaultRepetitions?: string;
  trainerNotes?: string[];
};

export type TrainingTemplateGuidance = {
  templateId: string;
  focusOptions: string[];
  exercises: TrainingTemplateExercise[];
};

const timestamp = "2026-01-01T00:00:00.000Z";

export const createPeriodizationTemplates = (clubId: string): TrainingTemplate[] => {
  const base = {
    ownerUserId: "paddlio-system",
    clubId,
    createdByUserId: "paddlio-system",
    visibility: "club" as TrainingTemplateVisibility,
    isFavorite: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return [
    {
      ...base,
      id: "system-periodization-ga1",
      title: "GA1 Grundlagenfahrt",
      category: "Ausdauer",
      trainingArea: "Ausdauer",
      trainingType: "GA1",
      boatClass: "K1+C1",
      defaultDurationMinutes: 75,
      defaultIntensity: "locker",
      focus: "aerobe Grundlagenausdauer, ruhige Dauermethode, saubere Paddeltechnik",
      description: "Ruhige Grundlagenfahrt mit gleichmäßigem Rhythmus und kontrollierter Paddeltechnik.",
      notes: "Passt in Grundlagen- und Entlastungswochen. Pulsbereich ruhig halten.",
      tags: ["Periodisierung", "GA1", "Grundlage"],
    },
    {
      ...base,
      id: "system-periodization-ga2",
      title: "GA2 Tempoausdauer",
      category: "Ausdauer",
      trainingArea: "Ausdauer",
      trainingType: "GA2",
      boatClass: "K1+C1",
      defaultDurationMinutes: 60,
      defaultIntensity: "mittel",
      focus: "Tempoausdauer, Belastungskontrolle, Rhythmusstabilität",
      description: "Längere Serien oder Intervalle in kontrolliert hohem Tempo mit stabiler Technik.",
      notes: "Nicht direkt nach sehr harten Einheiten einplanen.",
      tags: ["Periodisierung", "GA2", "Aufbau"],
    },
    {
      ...base,
      id: "system-periodization-kaus",
      title: "Kraftausdauer Zirkel",
      category: "Kraft",
      trainingArea: "Krafttraining",
      trainingType: "Kraftausdauer",
      boatClass: "none",
      defaultDurationMinutes: 55,
      defaultIntensity: "mittel",
      focus: "Kraftausdauer, Rumpfstabilität, paddelspezifische Kraft",
      description: "Zirkeltraining mit Rumpf, Schulter, Rotation und Zugbewegungen.",
      notes: "In Aufbauphasen einsetzen. Technikqualität nicht verlieren.",
      tags: ["Periodisierung", "Kaus", "Kraft"],
    },
    {
      ...base,
      id: "system-periodization-regeneration",
      title: "Regeneration & Beweglichkeit",
      category: "Regeneration",
      trainingArea: "Regeneration",
      trainingType: "Mobility",
      boatClass: "none",
      defaultDurationMinutes: 35,
      defaultIntensity: "locker",
      focus: "aktive Regeneration, Beweglichkeit, Mobilisation",
      description: "Lockere Mobility, Dehnen oder sehr lockeres Paddeln ohne harte Belastung.",
      notes: "Nach Wettkampfblöcken oder jeder dritten Belastungswoche sinnvoll.",
      tags: ["Periodisierung", "Regeneration", "Mobility"],
    },
    {
      ...base,
      id: "system-periodization-sa",
      title: "Schnelligkeitsausdauer",
      category: "Technik",
      trainingArea: "Wassertraining",
      trainingType: "Starttraining",
      boatClass: "K1+C1",
      defaultDurationMinutes: 50,
      defaultIntensity: "hart",
      focus: "Schnelligkeitsausdauer, hohe Schlagfrequenz, Startleistung",
      description: "Kurze intensive Belastungen mit hoher Geschwindigkeit und ausreichender Pause.",
      notes: "Nur einsetzen, wenn Sportler erholt sind.",
      tags: ["Periodisierung", "SA", "Start"],
    },
    {
      ...base,
      id: "system-periodization-technik",
      title: "Technik unter geringer Belastung",
      category: "Technik",
      trainingArea: "Wassertraining",
      trainingType: "K1 Technik",
      boatClass: "K1+C1",
      defaultDurationMinutes: 60,
      defaultIntensity: "locker",
      focus: "Linienwahl, Bootskontrolle, geringe Intensität",
      description: "Kurze Technikstrecken mit geringer Geschwindigkeit und maximaler Bewegungsqualität.",
      notes: "Ideal in Entlastungswochen und nach Wettkämpfen.",
      tags: ["Periodisierung", "Technik", "Qualität"],
    },
    {
      ...base,
      id: "system-periodization-wa",
      title: "Wettkampfausdauer Simulation",
      category: "Wettkampf",
      trainingArea: "Wettkampf",
      trainingType: "Wettkampfsimulation",
      boatClass: "K1+C1",
      defaultDurationMinutes: 70,
      defaultIntensity: "hart",
      focus: "Wettkampfausdauer, Renntempo, Technik unter Ermüdung",
      description: "Komplette Wettkampfstrecke in Wettkampfgeschwindigkeit fahren und auswerten.",
      notes: "Gut vier bis sechs Wochen vor wichtigen Wettkämpfen.",
      tags: ["Periodisierung", "WA", "Wettkampf"],
    },
  ];
};

export const isSystemTemplate = (template: TrainingTemplate): boolean =>
  template.id.startsWith("system-periodization-") || template.createdByUserId === "paddlio-system";

const exercise = (
  templateId: string,
  id: string,
  name: string,
  category: string,
  shortDescription: string,
  trainingGoal: string,
  options: Partial<TrainingTemplateExercise> = {},
): TrainingTemplateExercise => ({
  id: `${templateId}-${id}`,
  name,
  category,
  shortDescription,
  trainingGoal,
  ...options,
});

export const templateGuidance: Record<string, TrainingTemplateGuidance> = {
  "system-periodization-ga1": {
    templateId: "system-periodization-ga1",
    focusOptions: [
      "aerobe Grundlagenausdauer",
      "ruhige Dauermethode",
      "saubere Paddeltechnik",
      "gleichmäßiger Rhythmus",
      "niedrige bis mittlere Intensität",
      "Belastungsverträglichkeit",
      "Grundlagenausdauer auf dem Wasser",
      "aktive Regeneration",
      "Technikstabilität unter Dauerbelastung",
    ],
    exercises: [
      exercise("system-periodization-ga1", "steady", "Gleichmäßige Grundlagenfahrt", "Ausdauer", "Durchgehende ruhige Fahrt mit gleichmäßigem Rhythmus und kontrollierter Paddeltechnik.", "aerobe Basis und Rhythmusstabilität", { defaultDuration: "30 bis 90 Minuten", optionalLoad: "niedrige Intensität, Unterhaltung möglich" }),
      exercise("system-periodization-ga1", "technique-blocks", "Grundlagenfahrt mit Technikabschnitten", "Ausdauer + Technik", "Ruhige Ausdauerfahrt mit regelmäßigen kurzen Technikabschnitten und Fokus auf sauberen Vorwärtsschlag.", "Technikqualität im Grundlagenbereich", { defaultDuration: "10 Minuten locker, 5 Minuten Technikfokus, wiederholen" }),
      exercise("system-periodization-ga1", "frequency", "Grundlagenfahrt mit Frequenzwechsel", "Ausdauer", "Gleichmäßige Grundlagenfahrt mit kurzen kontrollierten Erhöhungen der Schlagfrequenz.", "Frequenzkontrolle ohne Verlassen des Grundlagenbereichs"),
      exercise("system-periodization-ga1", "gates", "Grundlagenfahrt mit Torpassagen", "Ausdauer + Slalom", "Ruhige Ausdauerfahrt mit einzelnen technisch sauberen Torpassagen bei kontrollierter Geschwindigkeit.", "saubere Linien unter Dauerbelastung"),
      exercise("system-periodization-ga1", "long", "Lange ruhige Strecke", "Ausdauer", "Längere zusammenhängende Strecke mit gleichmäßiger Belastung, stabiler Körperposition und ruhigem Paddelrhythmus.", "Belastungsverträglichkeit"),
      exercise("system-periodization-ga1", "recovery", "Aktive Regenerationsfahrt", "Regeneration", "Sehr lockere Fahrt zur Förderung der Durchblutung und Regeneration. Keine intensiven Beschleunigungen.", "aktive Erholung"),
    ],
  },
  "system-periodization-ga2": {
    templateId: "system-periodization-ga2",
    focusOptions: [
      "Tempoausdauer",
      "oberer Grundlagenbereich",
      "Belastungskontrolle",
      "gleichmäßiges hohes Tempo",
      "Renntempo über längere Abschnitte",
      "Technik unter zunehmender Ermüdung",
      "Rhythmusstabilität",
      "hohe aerobe Belastung",
    ],
    exercises: [
      exercise("system-periodization-ga2", "long-intervals", "Längere Tempointervalle", "Tempoausdauer", "Mehrere längere Belastungsabschnitte in kontrolliert hohem Tempo mit aktiver Pause.", "Tempo über längere Abschnitte stabil halten", { defaultDuration: "4 x 6 Minuten, 5 x 5 Minuten oder 3 x 8 Minuten" }),
      exercise("system-periodization-ga2", "tempo-change", "Tempowechselfahrt", "Tempoausdauer", "Wechsel zwischen ruhigem Grundlagentempo und längeren zügigen Abschnitten.", "Belastungswechsel kontrollieren", { defaultDuration: "5 Minuten locker, 3 Minuten zügig, mehrfach wiederholen" }),
      exercise("system-periodization-ga2", "threshold", "Schwellennahe Fahrt", "Tempoausdauer", "Kontrollierte längere Belastung nahe dem individuell hohen Dauerleistungsbereich.", "Technik und Rhythmus unter hoher Belastung stabilisieren"),
      exercise("system-periodization-ga2", "timed-sections", "Streckenabschnitte mit Zeitvorgabe", "Tempoausdauer", "Mehrere festgelegte Streckenabschnitte mit möglichst gleichmäßigen Zeiten absolvieren.", "Pacing und Tempogefühl"),
      exercise("system-periodization-ga2", "gates", "GA2 mit Toren", "Tempo + Technik", "Längere technisch anspruchsvolle Torfolgen in hohem, aber kontrolliertem Tempo fahren.", "Technik unter Ermüdung"),
      exercise("system-periodization-ga2", "negative-split", "Negative-Split-Einheit", "Tempoausdauer", "Die zweite Hälfte jedes Belastungsabschnitts wird etwas schneller gefahren als die erste.", "Tempogefühl und Belastungssteuerung"),
    ],
  },
  "system-periodization-kaus": {
    templateId: "system-periodization-kaus",
    focusOptions: [
      "Kraftausdauer",
      "Rumpfstabilität",
      "Schulterstabilität",
      "Zugmuskulatur",
      "Druckmuskulatur",
      "Ganzkörperstabilität",
      "Bewegungskontrolle",
      "paddelspezifische Kraft",
      "koordinative Kraftausdauer",
    ],
    exercises: [
      exercise("system-periodization-kaus", "core", "Rumpfstabilitätszirkel", "Rumpf", "Unterarmstütz, Seitstütz, dynamischer Unterarmstütz, Rotation im Stütz, Rückenstrecker, Dead Bug und Bird Dog.", "stabile Körpermitte", { defaultRepetitions: "3 bis 5 Runden" }),
      exercise("system-periodization-kaus", "upper", "Oberkörper-Kraftausdauerzirkel", "Oberkörper", "Latzug, Rudern, Bankdrücken, Liegestütz, Kabelzug, Zugrotation und Schulterstabilisation.", "Zug- und Druckmuskulatur kräftigen"),
      exercise("system-periodization-kaus", "paddle-pull", "Paddelspezifischer Zugzirkel", "Paddelspezifisch", "Einarmiges Rudern, Kabelzug in Paddelbewegung, Rumpfrotation, Zug mit Widerstandsband und Schlagbewegung mit Zugband.", "paddelspezifische Kraftausdauer"),
      exercise("system-periodization-kaus", "full-body", "Ganzkörperzirkel", "Ganzkörper", "Kniebeuge, Ausfallschritte, Liegestütz, Rudern, Rumpfrotation, Sprungseil und Unterarmstütz.", "Ganzkörperstabilität"),
      exercise("system-periodization-kaus", "time", "Zeitbasierter Zirkel", "Zirkel", "Mehrere Übungen nacheinander mit festgelegter Belastungs- und Pausenzeit durchführen.", "Belastungsrhythmus halten", { defaultDuration: "40 Sekunden Belastung, 20 Sekunden Wechsel, 3 bis 5 Runden" }),
      exercise("system-periodization-kaus", "reps", "Wiederholungsbasierter Zirkel", "Zirkel", "Alle Übungen mit vorgegebener Wiederholungszahl absolvieren.", "saubere Wiederholungsqualität", { defaultRepetitions: "15 bis 30 Wiederholungen, 3 Runden" }),
    ],
  },
  "system-periodization-regeneration": {
    templateId: "system-periodization-regeneration",
    focusOptions: [
      "aktive Regeneration",
      "Beweglichkeit",
      "Mobilisation",
      "Schulterbeweglichkeit",
      "Brustwirbelsäule",
      "Hüftbeweglichkeit",
      "Entspannung",
      "lockere Durchblutung",
      "Verletzungsvorbeugung",
      "Technik ohne Belastungsdruck",
    ],
    exercises: [
      exercise("system-periodization-regeneration", "easy-paddle", "Lockeres Einpaddeln", "Regeneration", "Sehr lockeres Paddeln ohne Zeit- oder Leistungsdruck.", "Durchblutung und Bewegungsgefühl"),
      exercise("system-periodization-regeneration", "shoulder", "Schulter-Mobilisation", "Mobilisation", "Armkreisen, Schulterblattbewegungen, Mobilisation mit Widerstandsband, kontrollierte Außenrotation und Brustmuskeldehnung.", "Schulterbeweglichkeit"),
      exercise("system-periodization-regeneration", "spine", "Rumpf- und Wirbelsäulenmobilität", "Mobilisation", "Rotation der Brustwirbelsäule, Katzenbuckel/Pferderücken, kontrollierte Rumpfdrehung, Seitneigung und Hüftbeuger-Mobilisation.", "Beweglichkeit im Rumpf"),
      exercise("system-periodization-regeneration", "mobility", "Beweglichkeitsprogramm", "Beweglichkeit", "Ruhige Beweglichkeitsübungen für Schultern, Rücken, Hüfte und Beine.", "Bewegungsumfang erhalten"),
      exercise("system-periodization-regeneration", "stability", "Leichte Stabilisation", "Stabilisation", "Kurze kontrollierte Stabilisationsübungen mit geringer Belastung und sauberer Ausführung.", "saubere Körperkontrolle"),
      exercise("system-periodization-regeneration", "routine", "Regenerationsroutine", "Regeneration", "Kombination aus lockerer Bewegung, Mobilisation, Atmung und kurzer Entspannung.", "aktive Erholung"),
    ],
  },
  "system-periodization-sa": {
    templateId: "system-periodization-sa",
    focusOptions: [
      "Schnelligkeitsausdauer",
      "hohe Schlagfrequenz",
      "maximale Beschleunigung",
      "Technik bei hoher Geschwindigkeit",
      "kurze intensive Belastung",
      "Erholung zwischen Wiederholungen",
      "Startleistung",
      "Endspurt",
      "Laktattoleranz",
    ],
    exercises: [
      exercise("system-periodization-sa", "sprints", "Kurze Sprintintervalle", "Sprint", "Kurze intensive Belastungen mit hoher Geschwindigkeit und ausreichender Pause.", "Schnelligkeitsausdauer", { defaultDuration: "10 x 20 Sekunden, 8 x 30 Sekunden oder 6 x 40 Sekunden" }),
      exercise("system-periodization-sa", "starts", "Startbeschleunigungen", "Start", "Aus dem Stand oder aus langsamer Fahrt maximal beschleunigen und die Geschwindigkeit kurz halten.", "Startleistung"),
      exercise("system-periodization-sa", "gate-sprint", "Sprint mit Torfolge", "Sprint + Technik", "Kurze Torfolge mit maximal kontrollierter Geschwindigkeit absolvieren.", "Tempo und Präzision verbinden"),
      exercise("system-periodization-sa", "race-starts", "Wiederholte Wettkampfstarts", "Start", "Mehrere Starts mit Konzentration auf Beschleunigung, Rhythmus und die ersten Tore.", "Start-Routine stabilisieren"),
      exercise("system-periodization-sa", "finish", "Endspurttraining", "Endspurt", "Nach einer Vorbelastung einen kurzen maximalen Endspurt absolvieren.", "Endspurtfähigkeit"),
      exercise("system-periodization-sa", "high-frequency", "Technik unter hoher Frequenz", "Technik", "Hohe Schlagfrequenz fahren, während Bootskontrolle, Linienwahl und saubere Schläge erhalten bleiben.", "Technik bei hoher Geschwindigkeit"),
      exercise("system-periodization-sa", "short-rest", "Belastungsserie mit unvollständiger Pause", "Belastungsserie", "Mehrere intensive Wiederholungen mit bewusst verkürzter Pause.", "Schnelligkeitsausdauer entwickeln"),
    ],
  },
  "system-periodization-technik": {
    templateId: "system-periodization-technik",
    focusOptions: [
      "Vorwärtsschlag",
      "Bogenschlag",
      "Ziehschlag",
      "Rückwärtsschlag",
      "seitliches Versetzen",
      "Wriggen",
      "Achterziehen",
      "Übergriffdrehung K1",
      "Kanteneinsatz",
      "Paddelblattkontrolle",
      "Oberkörperarbeit",
      "Blickführung",
      "Schlagkombinationen",
      "klassisches Aufwärtstor",
      "S-Aufwärtstor",
      "Rückwärtstor",
      "Abwärtstor",
      "Linienwahl",
      "Torplanung",
      "Knotenpunkte",
      "geringe Intensität",
      "hohe Ausführungsqualität",
    ],
    exercises: [
      exercise("system-periodization-technik", "forward-entry", "Vorwärtsschlag - Einsatzpunkt", "A: Grundschläge", "Die vordere Hand bis ungefähr auf Augenhöhe nach vorn führen und das Paddelblatt vollständig einsetzen.", "sauberer Vorwärtsschlag", { trainerNotes: ["Blatt vollständig im Wasser", "vordere Hand nicht über die Bootsmitte führen", "gleichmäßiger Durchzug"] }),
      exercise("system-periodization-technik", "forward-line", "Vorwärtsschlag - gerade Bootslinie", "A: Grundschläge", "Mehrere gleichmäßige Vorwärtsschläge mit stabiler Bootslinie und ruhiger Oberkörperarbeit.", "Bootslinie stabilisieren"),
      exercise("system-periodization-technik", "bow-front", "Bogenschlag vorn", "A: Grundschläge", "Paddel weit vorn mit gestrecktem Arm einsetzen, großen Bogen ausführen und ungefähr auf Körperhöhe aus dem Wasser nehmen.", "Drehung kontrollieren"),
      exercise("system-periodization-technik", "draw", "Ziehschlag", "A: Grundschläge", "Paddelblatt aufgedreht seitlich auf Körperhöhe einsetzen und die Bootsspitze kontrolliert zur Zugseite bewegen.", "Bootsspitze aktiv kontrollieren", { trainerNotes: ["obere Hand auf Stirn- bis Kopfhöhe", "Bewegung der Bootsspitze beobachten"] }),
      exercise("system-periodization-technik", "reverse", "Rückwärtsschlag", "A: Grundschläge", "Paddel weit hinten nahe am Heck einsetzen und dicht am Boot nach vorn führen.", "Rückwärtskontrolle"),
      exercise("system-periodization-technik", "combo-bow-draw", "Bogenschlag + Ziehschlag", "B: Schlagkombinationen", "Bogenschlag und Ziehschlag auf einer Schlagseite fließend miteinander verbinden.", "fließende Übergänge"),
      exercise("system-periodization-technik", "combo-counter", "Bogenschlag + Konter + Ziehschlag", "B: Schlagkombinationen", "Drei Schläge ohne unnötige Pause zu einer kontrollierten Drehbewegung verbinden.", "Schlagfolge stabilisieren"),
      exercise("system-periodization-technik", "tic-toc", "Tic-Toc-Schlag", "B: Schlagkombinationen", "Vorwärts- und Rückwärtsbogenschlag direkt nacheinander auf derselben Seite ausführen.", "präziser Schlagwechsel"),
      exercise("system-periodization-technik", "upstream-classic", "Klassisches Aufwärtstor - drei Schläge", "C: Aufwärtstore", "Aufwärtstor mit Bogenschlag, Ziehschlag und anschließendem Bogenschlag fahren.", "saubere Aufwärtstor-Passage", { trainerNotes: ["ungefähr 45 Grad anfahren", "Bootsspitze knapp hinter den Innenstab", "früh zum nächsten Tor blicken"] }),
      exercise("system-periodization-technik", "upstream-draw", "Aufwärtstor mit Ziehschlag", "C: Aufwärtstore", "Von außen kontrolliert anfahren und den Ziehschlag kurz vor dem Innenstab einsetzen.", "Kontrolle am Innenstab"),
      exercise("system-periodization-technik", "upstream-s-good", "S-Aufwärtstor mit gutem Kehrwasser", "C: Aufwärtstore", "Flach anfahren, Bogenschlag und Ziehschlag bis zum Innenstab verbinden und direkt zur Ausfahrt setzen.", "S-Aufwärtstor lösen"),
      exercise("system-periodization-technik", "reverse-gate", "Klassisches Rückwärtstor", "D: Rückwärtstore", "Mit flachem Anfahrtswinkel und einleitendem Bogenschlag anfahren, anschließend Konter und Ziehschlag verbinden.", "Rückwärtstor kontrolliert fahren"),
      exercise("system-periodization-technik", "reverse-traverse", "Rückwärtstraverse", "D: Rückwärtstore", "Bootsspitze während der Traverse stromabwärts ausrichten und das Boot mit wenigen Rückwärtsschlägen versetzen.", "Rückwärtstraverse stabilisieren"),
      exercise("system-periodization-technik", "downstream-classic", "Klassisches Abwärtstor", "E: Abwärtstore", "Das Tor kontrolliert auf direkter Linie überfahren und die Bootsspitze früh auf das nächste Tor ausrichten.", "direkte Linie halten"),
      exercise("system-periodization-technik", "downstream-edge", "Abwärtstor mit Kanteneinsatz", "E: Abwärtstore", "Torpassage mit gezieltem Verkanten, kontrollierter Oberkörperposition und anschließendem Auflösen der Rücklage fahren.", "Kanteneinsatz kontrollieren"),
      exercise("system-periodization-technik", "three-nodes", "Technikstrecke mit drei Knotenpunkten", "F: Technikstrecken", "Eine kurze Strecke fahren und für jede zentrale Bewegung höchstens drei Kontrollpunkte festlegen.", "Technik fokussiert verbessern"),
      exercise("system-periodization-technik", "plan-a-b", "Plan-A-/Plan-B-Training", "F: Technikstrecken", "Vor der Fahrt eine bevorzugte und eine alternative Lösung für schwierige Torfolgen festlegen.", "Entscheidungen vorbereiten"),
      exercise("system-periodization-technik", "video", "Videoanalyse", "F: Technikstrecken", "Technikstrecke aufnehmen und anhand vorher festgelegter Knotenpunkte auswerten.", "Selbstanalyse verbessern"),
    ],
  },
  "system-periodization-wa": {
    templateId: "system-periodization-wa",
    focusOptions: [
      "Wettkampfausdauer",
      "komplette Wettkampfstrecke",
      "Renntempo",
      "Technik unter Ermüdung",
      "Laufvorbereitung",
      "Start-Routine",
      "Streckenbesichtigung",
      "Konzentration",
      "Fehlerreaktion",
      "zweiter Wettkampflauf",
      "mentale Stabilität",
      "Zeit- und Strafsekunden",
    ],
    exercises: [
      exercise("system-periodization-wa", "full-run", "Vollständiger Wettkampflauf", "Wettkampf", "Komplette Strecke in Wettkampfgeschwindigkeit fahren. Reine Fahrzeit und Strafsekunden getrennt dokumentieren.", "Rennleistung prüfen"),
      exercise("system-periodization-wa", "two-runs", "Zwei-Läufe-Simulation", "Wettkampf", "Zwei vollständige Wettkampfläufe mit realistischer Pause und erneuter Vorbereitung absolvieren.", "Wettkampftag simulieren"),
      exercise("system-periodization-wa", "qualification", "Qualifikationssimulation", "Wettkampf", "Erster Lauf kontrolliert und sicher, zweiter Lauf abhängig vom Ergebnis offensiver planen.", "Laufstrategie"),
      exercise("system-periodization-wa", "inspection", "Wettkampf mit Streckenbesichtigung", "Vorbereitung", "Strecke vor dem Lauf besichtigen, Schlüsselstellen festlegen und Plan A/Plan B bestimmen.", "Streckenplanung"),
      exercise("system-periodization-wa", "pre-fatigue", "Wettkampflauf unter Vorbelastung", "Belastung", "Vor dem vollständigen Lauf eine kurze körperliche Vorbelastung absolvieren.", "Technik unter Ermüdung"),
      exercise("system-periodization-wa", "error-reaction", "Lauf mit Fehlerreaktion", "Mental", "Bei einer Berührung oder einem Fahrfehler bewusst fortsetzen und schnell in den normalen Rhythmus zurückfinden.", "Fehlerreaktion"),
      exercise("system-periodization-wa", "time-compare", "Zeitvergleich mehrerer Läufe", "Auswertung", "Mehrere Läufe durchführen und Fahrzeit, Strafsekunden, Linienwahl und technische Qualität vergleichen.", "Läufe auswerten"),
      exercise("system-periodization-wa", "final", "Finale Simulation", "Wettkampf", "Aufwärmen, Streckenbesichtigung, Startvorbereitung, Wettkampflauf und Nachbereitung wie bei einem echten Rennen durchführen.", "komplette Wettkampfroutine"),
      exercise("system-periodization-wa", "mental-cues", "Mentale Kurzkommandos", "Mental", "Für wichtige Stellen kurze technische Schlüsselwörter festlegen und während der Vorbereitung mental wiederholen.", "Konzentration stabilisieren"),
    ],
  },
};

export const getTemplateGuidance = (template?: TrainingTemplate): TrainingTemplateGuidance => {
  if (!template) {
    return { templateId: "", focusOptions: [], exercises: [] };
  }

  return templateGuidance[template.id] ?? {
    templateId: template.id,
    focusOptions: template.focus ? [template.focus] : [],
    exercises: template.description
      ? [exercise(template.id, "custom-description", template.title, template.category, template.description, template.focus || "Training umsetzen")]
      : [],
  };
};

export const buildExerciseDescription = (
  exercises: TrainingTemplateExercise[],
  customDescription: string,
): string => {
  const exerciseText = exercises.map((item, index) => {
    const details = [
      `${index + 1}. ${item.name}`,
      item.shortDescription,
      `Ziel: ${item.trainingGoal}`,
      item.optionalLoad ? `Belastung: ${item.optionalLoad}` : "",
      item.defaultDuration ? `Dauer: ${item.defaultDuration}` : "",
      item.defaultRepetitions ? `Umfang: ${item.defaultRepetitions}` : "",
      item.trainerNotes?.length ? `Trainerhinweis: ${item.trainerNotes.join("; ")}` : "",
    ].filter(Boolean);

    return details.join("\n");
  });

  return [...exerciseText, customDescription.trim()].filter(Boolean).join("\n\n");
};
