import type {
  AcademyCategory,
  AcademyContentBlock,
  AcademyCourse,
  AcademyAssignment,
  AcademyFavorite,
  AcademyLearningPath,
  AcademyLearningPathItem,
  AcademyLesson,
  AcademyMedia,
  AcademyProgress,
  AcademyQuiz,
  AcademyQuizAttempt,
  AcademyQuizQuestion,
} from "../../domain/types";

const now = "2026-07-17T00:00:00.000Z";

export const academyCategories: AcademyCategory[] = [
  {
    id: "technik",
    slug: "technik",
    title: "Technik",
    description: "Grundschläge, Tore, Linienwahl und Wildwasseranwendung.",
    icon: "Paddel",
    color: "#4bd8ff",
    sortOrder: 1,
    targetGroups: ["Sportler", "Trainer", "Nachwuchs"],
    subcategories: [
      "Grundschläge",
      "Schlagkombinationen",
      "Aufwärtstore",
      "Rückwärtstore",
      "Abwärtstore",
      "Traversieren und Versetzen",
      "Kanteneinsatz",
      "Blickführung",
      "Linienwahl",
      "Technikstrecken",
      "Wildwasseranwendung",
      "K1",
      "C1",
      "C2",
    ],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "kraft",
    slug: "kraft-stabilisation",
    title: "Kraft & Stabilisation",
    description: "Rumpf, Schulter, Zugmuskulatur und paddelspezifische Kraft.",
    icon: "Stabil",
    color: "#8df45a",
    sortOrder: 2,
    targetGroups: ["Sportler", "Trainer"],
    subcategories: ["Rumpfstabilität", "Schulterstabilität", "Zugmuskulatur", "Druckmuskulatur", "Kraftausdauer", "Beweglichkeit"],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "koordination",
    slug: "koordination",
    title: "Koordination",
    description: "Gleichgewicht, Rhythmus, Reaktion und Bootskontrolle.",
    icon: "Koord",
    color: "#a98cff",
    sortOrder: 3,
    targetGroups: ["Sportler", "Nachwuchs"],
    subcategories: ["Gleichgewicht", "Rhythmus", "Reaktion", "Orientierung", "Bootskontrolle", "Koordination an Land"],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ausdauer",
    slug: "ausdauer",
    title: "Ausdauer",
    description: "GA1, GA2, Tempoausdauer, Wettkampfausdauer und Regeneration.",
    icon: "Puls",
    color: "#3fa7ff",
    sortOrder: 4,
    targetGroups: ["Sportler", "Trainer", "Leistungssport"],
    subcategories: ["GA1", "GA2", "Tempoausdauer", "Schnelligkeitsausdauer", "Wettkampfausdauer", "Herzfrequenz", "Polar-Daten"],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mental",
    slug: "mentaltraining",
    title: "Mentaltraining",
    description: "Konzentration, Kurzkommandos, Fehlerverarbeitung und Wettkampfvorbereitung.",
    icon: "Fokus",
    color: "#ffce5c",
    sortOrder: 5,
    targetGroups: ["Sportler", "Trainer"],
    subcategories: ["Bewegungsvorstellung", "Selbstgespräch", "Konzentration", "Plan A und Plan B", "zweiter Wettkampflauf"],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sicherheit",
    slug: "sicherheit-retten",
    title: "Sicherheit & Retten",
    description: "Kenterung, Selbstrettung, Wurfsack, Gruppenorganisation und Materialcheck.",
    icon: "Safe",
    color: "#ff7a59",
    sortOrder: 6,
    targetGroups: ["Sportler", "Trainer", "Vereine"],
    subcategories: ["Sicherheitsregeln", "Selbstrettung", "Retten und Bergen", "Wurfsack", "Gruppenrettung", "Wildwasser"],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "wettkampf",
    slug: "wettkampf",
    title: "Wettkampf",
    description: "Streckenbegehung, Start-Routine, Strafsekunden, Laufanalyse und Wettkampftag.",
    icon: "Race",
    color: "#64e4c4",
    sortOrder: 7,
    targetGroups: ["Sportler", "Trainer"],
    subcategories: ["Reglement", "Streckenbegehung", "Startvorbereitung", "Rennplan", "Strafsekunden", "Laufanalyse"],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "trainerwissen",
    slug: "trainerwissen",
    title: "Trainerwissen",
    description: "Technikvermittlung, Knotenpunkte, Feedback, Sicherheit und Trainingsplanung.",
    icon: "Coach",
    color: "#c3ff5c",
    sortOrder: 8,
    targetGroups: ["Trainer", "ClubAdmin", "Admin"],
    subcategories: ["Trainingsplanung", "Technikvermittlung", "Knotenpunktsystem", "Fehleranalyse", "Kindertraining", "Belastungssteuerung"],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const academyCourses: AcademyCourse[] = [
  {
    id: "course-technique-basics",
    categoryId: "technik",
    title: "Technik-Grundlagen",
    description: "Erste strukturierte Techniklektionen mit Knotenpunkten und Trainingsbezug.",
    targetGroup: "Sportler und Trainer",
    difficulty: "beginner",
    estimatedMinutes: 55,
    status: "draft",
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "course-coach-basics",
    categoryId: "trainerwissen",
    title: "Trainer-Grundlagen",
    description: "Kurzmodule für Technikvermittlung, Feedback und selbstständiges Lernen.",
    targetGroup: "Trainer",
    difficulty: "coach",
    estimatedMinutes: 45,
    status: "draft",
    sortOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "course-mental-basics",
    categoryId: "mental",
    title: "Mentaltraining Grundlagen",
    description: "Einfache Routinen für Vorstellung, Kurzkommandos und Konzentration.",
    targetGroup: "Sportler",
    difficulty: "beginner",
    estimatedMinutes: 30,
    status: "draft",
    sortOrder: 3,
    createdAt: now,
    updatedAt: now,
  },
];

const lesson = (
  id: string,
  courseId: string,
  categoryId: AcademyLesson["categoryId"],
  title: string,
  summary: string,
  sortOrder: number,
  linkedTrainingTemplateIds: string[] = [],
): AcademyLesson => ({
  id,
  courseId,
  categoryId,
  slug: id.replace(/^lesson-/, ""),
  title,
  summary,
  estimatedMinutes: categoryId === "trainerwissen" ? 10 : 8,
  lessonType: categoryId === "technik" ? "technique" : categoryId === "trainerwissen" ? "coach" : "mental",
  difficulty: categoryId === "trainerwissen" ? "coach" : "beginner",
  boatClasses: categoryId === "technik" ? ["K1", "C1"] : ["none"],
  ageGroups: ["U10", "U12", "U14", "Fortgeschrittene"],
  status: "draft",
  sortOrder,
  linkedTrainingTemplateIds,
  createdAt: now,
  updatedAt: now,
});

export const academyLessons: AcademyLesson[] = [
  lesson("lesson-vorwaertsschlag", "course-technique-basics", "technik", "Vorwärtsschlag", "Sauberer Einsatz, stabile Bootslinie und gleichmäßiger Durchzug.", 1, ["template-technique-low-load"]),
  lesson("lesson-bogenschlag", "course-technique-basics", "technik", "Bogenschlag", "Drehung über große Bögen kontrollieren und ausrichten.", 2, ["template-technique-low-load"]),
  lesson("lesson-ziehschlag", "course-technique-basics", "technik", "Ziehschlag", "Bootsspitze kontrolliert zur Zugseite bewegen.", 3, ["template-technique-low-load"]),
  lesson("lesson-aufwaertstor", "course-technique-basics", "technik", "Klassisches Aufwärtstor", "Anfahrt, Innenstab, Ziehschlag und Ausfahrt als drei Knotenpunkte.", 4, ["template-technique-low-load"]),
  lesson("lesson-rueckwaertstor", "course-technique-basics", "technik", "Klassisches Rückwärtstor", "Rückwärtstor mit Blickkontakt, Konter und kontrollierter Drehung.", 5, ["template-technique-low-load"]),
  lesson("lesson-knotenpunkte", "course-coach-basics", "trainerwissen", "Knotenpunktsystem", "Technik mit höchstens drei zentralen Punkten erklären und kontrollieren.", 1),
  lesson("lesson-technik-einfach-erklaeren", "course-coach-basics", "trainerwissen", "Technik einfach erklären", "Weniger Begriffe, klare Bilder und direkte Rückmeldung.", 2),
  lesson("lesson-fehler-priorisieren", "course-coach-basics", "trainerwissen", "Fehler priorisieren", "Erst den wichtigsten Bewegungsfehler lösen, danach Details.", 3),
  lesson("lesson-selbststaendigkeit", "course-coach-basics", "trainerwissen", "Selbstständigkeit fördern", "Sportler lernen, eigene Knotenpunkte und Lösungen zu benennen.", 4),
  lesson("lesson-bewegungsvorstellung", "course-mental-basics", "mental", "Bewegungsvorstellung", "Vor dem Lauf die Schlüsselstellen mental sauber vorbereiten.", 1),
  lesson("lesson-kurzkommandos", "course-mental-basics", "mental", "Technische Kurzkommandos", "Kurze Wörter für wichtige Stellen festlegen und wiederholen.", 2),
  lesson("lesson-konzentration-start", "course-mental-basics", "mental", "Konzentration vor dem Start", "Ruhiger Ablauf vor dem Startsignal mit Fokus auf die erste Aktion.", 3),
];

const block = (
  lessonId: string,
  sortOrder: number,
  blockType: AcademyContentBlock["blockType"],
  title: string,
  content: string,
  items?: string[],
): AcademyContentBlock => ({
  id: `block-${lessonId}-${sortOrder}`,
  lessonId,
  blockType,
  title,
  content,
  items,
  sortOrder,
  createdAt: now,
  updatedAt: now,
});

export const academyContentBlocks: AcademyContentBlock[] = academyLessons.flatMap((item) => {
  if (item.id === "lesson-vorwaertsschlag") {
    return [
      block(item.id, 1, "text", "Was ist die Technik?", "Der Vorwärtsschlag bringt das Boot stabil nach vorn und hält die Linie ruhig."),
      block(item.id, 2, "knotenpunkte", "Drei Knotenpunkte", "Diese drei Punkte reichen für die erste Kontrolle.", [
        "Blatt vollständig vorne einsetzen",
        "Rumpf aktiv mitarbeiten lassen",
        "Druck bis etwa zur Hüfte halten",
      ]),
      block(item.id, 3, "kontrollpunkte", "Selbstkontrolle", "Nach jeder Wiederholung kurz prüfen.", [
        "Bleibt die Bootsspitze ruhig?",
        "Ist das Blatt ganz im Wasser?",
        "Bleibt der Rhythmus gleichmäßig?",
      ]),
      block(item.id, 4, "uebung", "Einfache Übung", "Fahre 6 x 60 Sekunden ruhige Geradeausfahrt mit sauberem Einsatzpunkt."),
      block(item.id, 5, "training_link", "Zum Training", "Diese Lektion ist mit Technik unter geringer Belastung verknüpft."),
    ];
  }

  if (item.categoryId === "technik") {
    return [
      block(item.id, 1, "text", "Kurzbeschreibung", item.summary),
      block(item.id, 2, "knotenpunkte", "Knotenpunkte", "Die ausführliche Lektion ist als Entwurf vorbereitet.", [
        "Anfahrt oder Einsatzpunkt festlegen",
        "Bewegung kontrolliert ausführen",
        "Früh zur nächsten Aktion ausrichten",
      ]),
      block(item.id, 3, "uebung", "Übung", "Kurze Wiederholungen mit geringer Belastung und hoher Ausführungsqualität."),
    ];
  }

  if (item.categoryId === "trainerwissen") {
    return [
      block(item.id, 1, "text", "Trainerfokus", item.summary),
      block(item.id, 2, "trainerhinweis", "Hinweis", "Diese Lektion ist ein redaktioneller Entwurf für die spätere Paddlio Akademie."),
    ];
  }

  return [
    block(item.id, 1, "text", "Einführung", item.summary),
    block(item.id, 2, "reflexion", "Selbstkontrolle", "Welche kurze Anweisung hilft dir vor dem nächsten Lauf?"),
  ];
});

const learningPathTitles = [
  "Anfänger – erstes Halbjahr",
  "Anfänger – zweites Halbjahr",
  "U10",
  "U11",
  "U12",
  "U13",
  "U14",
  "Fortgeschrittene",
  "Leistungssport",
  "Trainer Grundlagen",
  "Trainer Nachwuchs",
  "Trainer Leistungssport",
];

export const academyLearningPaths: AcademyLearningPath[] = learningPathTitles.map((title, index) => ({
  id: `path-${index + 1}`,
  title,
  description: title.startsWith("Trainer") ? "Empfohlener Lernpfad für Trainerarbeit und Technikvermittlung." : "Empfohlene Reihenfolge für altersgerechtes Lernen.",
  targetGroup: title.startsWith("Trainer") ? "Trainer" : title,
  badge: title.startsWith("Trainer") ? "Coach" : "Sportler",
  isActive: true,
  createdAt: now,
  updatedAt: now,
}));

export const academyLearningPathItems: AcademyLearningPathItem[] = academyLearningPaths.flatMap((path, pathIndex) => {
  const sourceLessons = path.title.startsWith("Trainer")
    ? academyLessons.filter((item) => item.categoryId === "trainerwissen")
    : academyLessons.filter((item) => item.categoryId === "technik").slice(0, 4);

  return sourceLessons.map((item, index) => ({
    id: `path-item-${pathIndex + 1}-${index + 1}`,
    learningPathId: path.id,
    lessonId: item.id,
    sortOrder: index + 1,
    isRequired: index < 2,
  }));
});

export const academyQuizzes: AcademyQuiz[] = [
  {
    id: "quiz-vorwaertsschlag",
    lessonId: "lesson-vorwaertsschlag",
    title: "Selbstcheck Vorwärtsschlag",
    passingScore: 1,
  },
];

export const academyQuizQuestions: AcademyQuizQuestion[] = [
  {
    id: "question-vorwaertsschlag-1",
    quizId: "quiz-vorwaertsschlag",
    questionType: "single",
    question: "Worauf achtest du beim Einsatz des Paddelblatts zuerst?",
    answers: ["Blatt vollständig einsetzen", "Möglichst laut eintauchen", "Die Hand hinter dem Körper halten"],
    correctAnswer: "Blatt vollständig einsetzen",
    explanation: "Ein sauberer, vollständiger Blatteinsatz ist die Grundlage für den ruhigen Vorwärtsschlag.",
    sortOrder: 1,
  },
];

export const emptyAcademyProgress: AcademyProgress[] = [];
export const emptyAcademyAssignments: AcademyAssignment[] = [];
export const emptyAcademyFavorites: AcademyFavorite[] = [];
export const emptyAcademyQuizAttempts: AcademyQuizAttempt[] = [];
export const academyMedia: AcademyMedia[] = [];

export const academyInitialData = {
  academyCategories,
  academyCourses,
  academyLessons,
  academyContentBlocks,
  academyLearningPaths,
  academyLearningPathItems,
  academyProgress: emptyAcademyProgress,
  academyAssignments: emptyAcademyAssignments,
  academyQuizzes,
  academyQuizQuestions,
  academyQuizAttempts: emptyAcademyQuizAttempts,
  academyFavorites: emptyAcademyFavorites,
  academyMedia,
};
