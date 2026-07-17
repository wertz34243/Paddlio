import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type {
  AcademyAssignment,
  AcademyCategory,
  AcademyCourse,
  AcademyFavorite,
  AcademyLesson,
  AcademyProgress,
  AcademyQuizAttempt,
  PaddleMotionData,
  User,
} from "../domain/types";
import { getDisplayName } from "../domain/profile";
import {
  deleteCloudAcademyFavorite,
  upsertCloudAcademyAssignment,
  upsertCloudAcademyFavorite,
  upsertCloudAcademyProgress,
  upsertCloudAcademyQuizAttempt,
} from "../services/academyService";

type AcademyMode = "home" | "category" | "course" | "lesson" | "progress" | "favorites" | "coach" | "admin";

type AcademyViewProps = {
  data: PaddleMotionData;
  user: User;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
  onOpenTrainingPlan?: () => void;
};

const canCoach = (role: string): boolean => ["coach", "teamAdmin", "clubAdmin", "admin"].includes(role);
const canAdmin = (role: string): boolean => role === "admin" || role === "clubAdmin";
const timestamp = (): string => new Date().toISOString();
const createLocalId = (prefix: string): string => `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

export function AcademyView({ data, user, onDataChange, onOpenTrainingPlan }: AcademyViewProps) {
  const [mode, setMode] = useState<AcademyMode>("home");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("technik");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("course-technique-basics");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("lesson-vorwaertsschlag");
  const [assignmentLessonId, setAssignmentLessonId] = useState<string>("lesson-vorwaertsschlag");
  const [assignmentTargetId, setAssignmentTargetId] = useState<string>(data.coachAthletes[0]?.id ?? "");

  const userProgress = data.academyProgress.filter((item) => item.userId === user.userId || item.userId === user.id);
  const favorites = data.academyFavorites.filter((item) => item.userId === user.userId || item.userId === user.id);
  const startedProgress = userProgress.filter((item) => item.status !== "not_started");
  const completedProgress = userProgress.filter((item) => item.status === "completed");
  const assignmentsForUser = data.academyAssignments.filter((item) => item.assignedTo === user.userId || item.assignedTo === user.id);
  const currentLesson = data.academyLessons.find((item) => item.id === selectedLessonId) ?? data.academyLessons[0];
  const currentCourse = data.academyCourses.find((item) => item.id === selectedCourseId) ?? data.academyCourses[0];
  const currentCategory = data.academyCategories.find((item) => item.id === selectedCategoryId) ?? data.academyCategories[0];
  const categoryLessonCounts = useMemo(
    () => new Map(data.academyCategories.map((category) => [category.id, data.academyLessons.filter((lesson) => lesson.categoryId === category.id).length])),
    [data.academyCategories, data.academyLessons],
  );
  const lastProgress = startedProgress.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const continueLesson = data.academyLessons.find((item) => item.id === lastProgress?.lessonId) ?? data.academyLessons[0];
  const recommendedLessons = data.academyLessons
    .filter((lesson) => user.role !== "athlete" || lesson.categoryId !== "trainerwissen")
    .filter((lesson) => !completedProgress.some((progress) => progress.lessonId === lesson.id))
    .slice(0, 4);

  const upsertProgress = (lesson: AcademyLesson, status: AcademyProgress["status"], progressPercent: number) => {
    const existing = data.academyProgress.find((item) => item.userId === user.userId && item.lessonId === lesson.id);
    const next: AcademyProgress = {
      id: existing?.id ?? createLocalId("academy-progress"),
      userId: user.userId,
      lessonId: lesson.id,
      status,
      progressPercent,
      lastPosition: status === "completed" ? "completed" : "lesson",
      startedAt: existing?.startedAt ?? timestamp(),
      completedAt: status === "completed" ? timestamp() : existing?.completedAt,
      updatedAt: timestamp(),
    };

    onDataChange((current) => ({
      ...current,
      academyProgress: existing
        ? current.academyProgress.map((item) => (item.id === existing.id ? next : item))
        : [...current.academyProgress, next],
    }));
    void upsertCloudAcademyProgress(next).catch((error) => console.error("Akademie-Fortschritt konnte nicht synchronisiert werden", error));
  };

  const toggleFavorite = (lesson: AcademyLesson) => {
    const existing = favorites.find((item) => item.lessonId === lesson.id);
    if (existing) {
      onDataChange((current) => ({
        ...current,
        academyFavorites: current.academyFavorites.filter((item) => item.id !== existing.id),
      }));
      void deleteCloudAcademyFavorite(existing).catch((error) => console.error("Akademie-Favorit konnte nicht entfernt werden", error));
      return;
    }

    const next: AcademyFavorite = {
      id: createLocalId("academy-favorite"),
      userId: user.userId,
      lessonId: lesson.id,
      createdAt: timestamp(),
    };
    onDataChange((current) => ({ ...current, academyFavorites: [...current.academyFavorites, next] }));
    void upsertCloudAcademyFavorite(next).catch((error) => console.error("Akademie-Favorit konnte nicht synchronisiert werden", error));
  };

  const assignLesson = () => {
    if (!assignmentTargetId || !assignmentLessonId) return;
    const next: AcademyAssignment = {
      id: createLocalId("academy-assignment"),
      assignedBy: user.userId,
      assignedTo: assignmentTargetId,
      lessonId: assignmentLessonId,
      status: "open",
      note: "Bitte vor dem nächsten Techniktraining ansehen.",
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };
    onDataChange((current) => ({ ...current, academyAssignments: [...current.academyAssignments, next] }));
    void upsertCloudAcademyAssignment(next).catch((error) => console.error("Akademie-Zuweisung konnte nicht synchronisiert werden", error));
  };

  const completeQuiz = () => {
    const quiz = data.academyQuizzes.find((item) => item.lessonId === currentLesson.id);
    if (!quiz) return;
    const next: AcademyQuizAttempt = {
      id: createLocalId("academy-quiz-attempt"),
      quizId: quiz.id,
      userId: user.userId,
      score: 1,
      answers: {},
      completedAt: timestamp(),
    };
    onDataChange((current) => ({ ...current, academyQuizAttempts: [...current.academyQuizAttempts, next] }));
    void upsertCloudAcademyQuizAttempt(next).catch((error) => console.error("Akademie-Quiz konnte nicht synchronisiert werden", error));
  };

  const openCategory = (category: AcademyCategory) => {
    setSelectedCategoryId(category.id);
    setMode("category");
  };

  const openCourse = (course: AcademyCourse) => {
    setSelectedCourseId(course.id);
    setSelectedCategoryId(course.categoryId);
    setMode("course");
  };

  const openLesson = (lesson: AcademyLesson) => {
    setSelectedLessonId(lesson.id);
    setSelectedCourseId(lesson.courseId);
    setSelectedCategoryId(lesson.categoryId);
    setMode("lesson");
  };

  return (
    <section className="academy-shell" aria-label="Paddlio Akademie">
      <header className="academy-hero">
        <div>
          <p className="eyebrow">Paddlio Akademie</p>
          <h1>Lernen. Anwenden. Verbessern.</h1>
          <p>Eigenständiger Lernbereich für Technik, Training, Sicherheit, Wettkampf und Trainerwissen.</p>
        </div>
        <div className="academy-progress-ring" aria-label={`${completedProgress.length} Lektionen abgeschlossen`}>
          <strong>{completedProgress.length}</strong>
          <span>abgeschlossen</span>
        </div>
      </header>

      <nav className="academy-mode-nav" aria-label="Akademie Navigation">
        <button type="button" className={mode === "home" ? "active" : ""} onClick={() => setMode("home")}>Start</button>
        <button type="button" className={mode === "progress" ? "active" : ""} onClick={() => setMode("progress")}>Fortschritt</button>
        <button type="button" className={mode === "favorites" ? "active" : ""} onClick={() => setMode("favorites")}>Favoriten</button>
        {canCoach(user.role) ? <button type="button" className={mode === "coach" ? "active" : ""} onClick={() => setMode("coach")}>Coach</button> : null}
        {canAdmin(user.role) ? <button type="button" className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>Redaktion</button> : null}
      </nav>

      {mode === "home" ? (
        <div className="academy-grid-layout">
          <section className="academy-panel academy-continue">
            <p className="eyebrow">Weiterlernen</p>
            <h2>{continueLesson?.title ?? "Noch keine Lektion gestartet"}</h2>
            <p>{continueLesson?.summary ?? "Starte eine Lektion, um deinen Fortschritt hier zu sehen."}</p>
            {continueLesson ? <button className="primary-button" type="button" onClick={() => openLesson(continueLesson)}>Fortsetzen</button> : null}
          </section>

          <section className="academy-panel">
            <p className="eyebrow">Für dich empfohlen</p>
            <div className="academy-lesson-list">
              {recommendedLessons.map((lesson) => (
                <LessonButton key={lesson.id} lesson={lesson} onOpen={openLesson} progress={userProgress.find((item) => item.lessonId === lesson.id)} />
              ))}
            </div>
          </section>

          <section className="academy-panel wide">
            <p className="eyebrow">Kategorien</p>
            <div className="academy-category-grid">
              {data.academyCategories.map((category) => (
                <button className="academy-category-card" type="button" key={category.id} onClick={() => openCategory(category)} style={{ "--academy-accent": category.color } as CSSProperties}>
                  <span>{category.icon}</span>
                  <strong>{category.title}</strong>
                  <small>{category.description}</small>
                  <em>{categoryLessonCounts.get(category.id) ?? 0} Lektionen</em>
                </button>
              ))}
            </div>
          </section>

          <section className="academy-panel">
            <p className="eyebrow">Meine Lernpfade</p>
            <div className="academy-path-list">
              {data.academyLearningPaths.slice(0, 6).map((path) => (
                <div className="academy-path-row" key={path.id}>
                  <strong>{path.title}</strong>
                  <small>{path.description}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="academy-panel">
            <p className="eyebrow">Trainer-Zuweisungen</p>
            {assignmentsForUser.length > 0 ? assignmentsForUser.map((assignment) => {
              const lessonItem = data.academyLessons.find((item) => item.id === assignment.lessonId);
              return <LessonButton key={assignment.id} lesson={lessonItem} onOpen={lessonItem ? openLesson : undefined} />;
            }) : <p className="empty-hint">Noch keine Akademie-Zuweisung vorhanden.</p>}
          </section>
        </div>
      ) : null}

      {mode === "category" ? (
        <ListingPanel title={currentCategory.title} subtitle={currentCategory.description} onBack={() => setMode("home")}>
          <div className="academy-category-detail">
            <div>
              <p className="eyebrow">Unterkategorien</p>
              <div className="academy-chip-cloud">
                {currentCategory.subcategories.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
            <div className="academy-lesson-list">
              {data.academyCourses.filter((course) => course.categoryId === currentCategory.id).map((course) => (
                <button className="academy-list-button" type="button" key={course.id} onClick={() => openCourse(course)}>
                  <strong>{course.title}</strong>
                  <small>{course.description}</small>
                  <em>{course.status === "draft" ? "Entwurf" : "Veröffentlicht"}</em>
                </button>
              ))}
            </div>
          </div>
        </ListingPanel>
      ) : null}

      {mode === "course" ? (
        <ListingPanel title={currentCourse.title} subtitle={currentCourse.description} onBack={() => setMode("category")}>
          <div className="academy-lesson-list">
            {data.academyLessons.filter((lesson) => lesson.courseId === currentCourse.id).map((lesson) => (
              <LessonButton key={lesson.id} lesson={lesson} onOpen={openLesson} progress={userProgress.find((item) => item.lessonId === lesson.id)} />
            ))}
          </div>
        </ListingPanel>
      ) : null}

      {mode === "lesson" && currentLesson ? (
        <ListingPanel title={currentLesson.title} subtitle={currentLesson.summary} onBack={() => setMode("course")}>
          <div className="academy-lesson-toolbar">
            <button className="primary-button" type="button" onClick={() => upsertProgress(currentLesson, "started", 25)}>Lektion starten</button>
            <button className="secondary-button" type="button" onClick={() => upsertProgress(currentLesson, "completed", 100)}>Abschließen</button>
            <button className="secondary-button" type="button" onClick={() => toggleFavorite(currentLesson)}>
              {favorites.some((item) => item.lessonId === currentLesson.id) ? "Favorit entfernen" : "Favorit setzen"}
            </button>
            {currentLesson.linkedTrainingTemplateIds.length > 0 ? (
              <button className="secondary-button" type="button" onClick={onOpenTrainingPlan}>Trainingsvorlage öffnen</button>
            ) : null}
          </div>
          <div className="academy-block-list">
            {data.academyContentBlocks.filter((blockItem) => blockItem.lessonId === currentLesson.id).sort((a, b) => a.sortOrder - b.sortOrder).map((blockItem) => (
              <article className={`academy-content-block type-${blockItem.blockType}`} key={blockItem.id}>
                <p className="eyebrow">{blockItem.blockType.replace("_", " ")}</p>
                <h3>{blockItem.title}</h3>
                <p>{blockItem.content}</p>
                {blockItem.items ? (
                  <ul>
                    {blockItem.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
          {data.academyQuizzes.some((quiz) => quiz.lessonId === currentLesson.id) ? (
            <section className="academy-panel inline-panel">
              <p className="eyebrow">Quiz</p>
              <h3>Selbstcheck durchführen</h3>
              <p>Die erste Quizfunktion ist vorbereitet und speichert einen einfachen Versuch.</p>
              <button className="secondary-button" type="button" onClick={completeQuiz}>Quiz als bestanden speichern</button>
            </section>
          ) : null}
        </ListingPanel>
      ) : null}

      {mode === "progress" ? (
        <ListingPanel title="Mein Fortschritt" subtitle="Lernzeit, abgeschlossene Lektionen und nächste Empfehlung." onBack={() => setMode("home")}>
          <div className="academy-stat-grid">
            <Stat title="Abgeschlossen" value={completedProgress.length} />
            <Stat title="Aktiv" value={startedProgress.length} />
            <Stat title="Favoriten" value={favorites.length} />
            <Stat title="Zuweisungen" value={assignmentsForUser.length} />
          </div>
        </ListingPanel>
      ) : null}

      {mode === "favorites" ? (
        <ListingPanel title="Favoriten" subtitle="Vorgemerkte Lektionen für dein nächstes Training." onBack={() => setMode("home")}>
          <div className="academy-lesson-list">
            {favorites.length > 0 ? favorites.map((favorite) => (
              <LessonButton key={favorite.id} lesson={data.academyLessons.find((lesson) => lesson.id === favorite.lessonId)} onOpen={openLesson} />
            )) : <p className="empty-hint">Noch keine Lektion als Favorit markiert.</p>}
          </div>
        </ListingPanel>
      ) : null}

      {mode === "coach" ? (
        <ListingPanel title="Coach Akademie" subtitle="Lerninhalte Sportlern zuweisen und Fortschritt im Blick behalten." onBack={() => setMode("home")}>
          <div className="academy-form-grid">
            <label>
              Lektion
              <select value={assignmentLessonId} onChange={(event) => setAssignmentLessonId(event.target.value)}>
                {data.academyLessons.map((lesson) => <option value={lesson.id} key={lesson.id}>{lesson.title}</option>)}
              </select>
            </label>
            <label>
              Sportler
              <select value={assignmentTargetId} onChange={(event) => setAssignmentTargetId(event.target.value)}>
                {data.coachAthletes.length > 0 ? data.coachAthletes.map((athlete) => (
                  <option value={athlete.id} key={athlete.id}>{athlete.name}</option>
                )) : <option value={user.userId}>{getDisplayName(user.profile)}</option>}
              </select>
            </label>
            <button className="primary-button" type="button" onClick={assignLesson}>Lektion zuweisen</button>
          </div>
        </ListingPanel>
      ) : null}

      {mode === "admin" ? (
        <ListingPanel title="Redaktion" subtitle="Ein einfacher Redaktionsbereich für Kategorien, Kurse und Entwürfe ist vorbereitet." onBack={() => setMode("home")}>
          <div className="academy-stat-grid">
            <Stat title="Kategorien" value={data.academyCategories.length} />
            <Stat title="Kurse" value={data.academyCourses.length} />
            <Stat title="Lektionen" value={data.academyLessons.length} />
            <Stat title="Entwürfe" value={data.academyLessons.filter((lesson) => lesson.status === "draft").length} />
          </div>
          <p className="empty-hint">Vollständige Medienverwaltung, Veröffentlichung und Vereinsinhalte sind technisch vorbereitet, aber noch als redaktionelle Ausbaustufe gekennzeichnet.</p>
        </ListingPanel>
      ) : null}
    </section>
  );
}

function ListingPanel({ title, subtitle, children, onBack }: { title: string; subtitle: string; children: ReactNode; onBack: () => void }) {
  return (
    <section className="academy-panel academy-detail-panel">
      <button className="secondary-button" type="button" onClick={onBack}>Zurück</button>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function LessonButton({ lesson, progress, onOpen }: { lesson?: AcademyLesson; progress?: AcademyProgress; onOpen?: (lesson: AcademyLesson) => void }) {
  if (!lesson) return null;
  return (
    <button className="academy-list-button" type="button" onClick={() => onOpen?.(lesson)}>
      <strong>{lesson.title}</strong>
      <small>{lesson.summary}</small>
      <em>{progress?.status === "completed" ? "Abgeschlossen" : lesson.status === "draft" ? "Entwurf" : "Offen"}</em>
    </button>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="academy-stat">
      <strong>{value}</strong>
      <span>{title}</span>
    </div>
  );
}
