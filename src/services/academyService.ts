import type {
  AcademyAssignment,
  AcademyCategory,
  AcademyContentBlock,
  AcademyCourse,
  AcademyFavorite,
  AcademyLearningPath,
  AcademyLearningPathItem,
  AcademyLesson,
  AcademyMedia,
  AcademyProgress,
  AcademyQuiz,
  AcademyQuizAttempt,
  AcademyQuizQuestion,
} from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload } from "./cloudIds";
import { enqueueSyncChange } from "./syncService";

const toCloudProgress = (progress: AcademyProgress) => sanitizeCloudPayload({
  id: progress.id,
  user_id: progress.userId,
  lesson_id: progress.lessonId,
  status: progress.status,
  progress_percent: progress.progressPercent,
  last_position: progress.lastPosition,
  started_at: progress.startedAt ?? null,
  completed_at: progress.completedAt ?? null,
  updated_at: progress.updatedAt,
});

const toCloudFavorite = (favorite: AcademyFavorite) => sanitizeCloudPayload({
  id: favorite.id,
  user_id: favorite.userId,
  lesson_id: favorite.lessonId,
  created_at: favorite.createdAt,
});

const toCloudAssignment = (assignment: AcademyAssignment) => sanitizeCloudPayload({
  id: assignment.id,
  assigned_by: assignment.assignedBy,
  assigned_to: assignment.assignedTo ?? null,
  group_id: assignment.groupId ?? null,
  lesson_id: assignment.lessonId ?? null,
  course_id: assignment.courseId ?? null,
  due_date: assignment.dueDate ?? null,
  status: assignment.status,
  note: assignment.note ?? "",
  created_at: assignment.createdAt,
  updated_at: assignment.updatedAt,
});

const toCloudQuizAttempt = (attempt: AcademyQuizAttempt) => sanitizeCloudPayload({
  id: attempt.id,
  quiz_id: attempt.quizId,
  user_id: attempt.userId,
  score: attempt.score,
  answers: attempt.answers,
  completed_at: attempt.completedAt,
});

const listTable = async <T>(tableName: string, mapper: (row: any) => T): Promise<T[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from(tableName) as any).select("*");
  if (error) throw error;
  return (data ?? []).map(mapper);
};

const fromCategory = (row: any): AcademyCategory => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description ?? "",
  icon: row.icon ?? "",
  color: row.color ?? "#4bd8ff",
  sortOrder: row.sort_order ?? 0,
  targetGroups: row.target_groups ?? [],
  subcategories: row.subcategories ?? [],
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromCourse = (row: any): AcademyCourse => ({
  id: row.id,
  categoryId: row.category_id,
  title: row.title,
  description: row.description ?? "",
  targetGroup: row.target_group ?? "",
  difficulty: row.difficulty ?? "beginner",
  estimatedMinutes: row.estimated_minutes ?? 0,
  status: row.status ?? "draft",
  clubId: row.club_id ?? undefined,
  createdBy: row.created_by ?? undefined,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromLesson = (row: any): AcademyLesson => ({
  id: row.id,
  courseId: row.course_id,
  categoryId: row.category_id,
  slug: row.slug,
  title: row.title,
  summary: row.summary ?? "",
  estimatedMinutes: row.estimated_minutes ?? 0,
  lessonType: row.lesson_type ?? "technique",
  difficulty: row.difficulty ?? "beginner",
  boatClasses: row.boat_classes ?? [],
  ageGroups: row.age_groups ?? [],
  status: row.status ?? "draft",
  sortOrder: row.sort_order ?? 0,
  linkedTrainingTemplateIds: row.linked_training_template_ids ?? [],
  clubId: row.club_id ?? undefined,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromContentBlock = (row: any): AcademyContentBlock => ({
  id: row.id,
  lessonId: row.lesson_id,
  blockType: row.block_type,
  title: row.title ?? undefined,
  content: row.content ?? "",
  items: row.items ?? [],
  metadata: row.metadata ?? {},
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromLearningPath = (row: any): AcademyLearningPath => ({
  id: row.id,
  title: row.title,
  description: row.description ?? "",
  targetGroup: row.target_group ?? "",
  badge: row.badge ?? undefined,
  isActive: row.is_active ?? true,
  clubId: row.club_id ?? undefined,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromLearningPathItem = (row: any): AcademyLearningPathItem => ({
  id: row.id,
  learningPathId: row.learning_path_id,
  lessonId: row.lesson_id ?? undefined,
  courseId: row.course_id ?? undefined,
  sortOrder: row.sort_order ?? 0,
  isRequired: row.is_required ?? false,
});

const fromProgress = (row: any): AcademyProgress => ({
  id: row.id,
  userId: row.user_id,
  lessonId: row.lesson_id,
  status: row.status ?? "not_started",
  progressPercent: row.progress_percent ?? 0,
  lastPosition: row.last_position ?? "",
  startedAt: row.started_at ?? undefined,
  completedAt: row.completed_at ?? undefined,
  updatedAt: row.updated_at,
});

const fromAssignment = (row: any): AcademyAssignment => ({
  id: row.id,
  assignedBy: row.assigned_by,
  assignedTo: row.assigned_to ?? undefined,
  groupId: row.group_id ?? undefined,
  lessonId: row.lesson_id ?? undefined,
  courseId: row.course_id ?? undefined,
  dueDate: row.due_date ?? undefined,
  status: row.status ?? "open",
  note: row.note ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fromQuiz = (row: any): AcademyQuiz => ({
  id: row.id,
  lessonId: row.lesson_id,
  title: row.title,
  passingScore: row.passing_score ?? 1,
});

const fromQuizQuestion = (row: any): AcademyQuizQuestion => ({
  id: row.id,
  quizId: row.quiz_id,
  questionType: row.question_type,
  question: row.question,
  answers: row.answers ?? [],
  correctAnswer: row.correct_answer ?? "",
  explanation: row.explanation ?? "",
  sortOrder: row.sort_order ?? 0,
});

const fromQuizAttempt = (row: any): AcademyQuizAttempt => ({
  id: row.id,
  quizId: row.quiz_id,
  userId: row.user_id,
  score: row.score ?? 0,
  answers: row.answers ?? {},
  completedAt: row.completed_at,
});

const fromFavorite = (row: any): AcademyFavorite => ({
  id: row.id,
  userId: row.user_id,
  lessonId: row.lesson_id,
  createdAt: row.created_at,
});

const fromMedia = (row: any): AcademyMedia => ({
  id: row.id,
  title: row.title,
  mediaType: row.media_type,
  storagePath: row.storage_path ?? undefined,
  externalUrl: row.external_url ?? undefined,
  thumbnailPath: row.thumbnail_path ?? undefined,
  durationSeconds: row.duration_seconds ?? undefined,
  source: row.source ?? undefined,
  copyrightStatus: row.copyright_status ?? "pending",
  clubId: row.club_id ?? undefined,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at,
});

export const listCloudAcademyCategories = () => listTable("academy_categories", fromCategory);
export const listCloudAcademyCourses = () => listTable("academy_courses", fromCourse);
export const listCloudAcademyLessons = () => listTable("academy_lessons", fromLesson);
export const listCloudAcademyContentBlocks = () => listTable("academy_content_blocks", fromContentBlock);
export const listCloudAcademyLearningPaths = () => listTable("academy_learning_paths", fromLearningPath);
export const listCloudAcademyLearningPathItems = () => listTable("academy_learning_path_items", fromLearningPathItem);
export const listCloudAcademyProgress = () => listTable("academy_progress", fromProgress);
export const listCloudAcademyAssignments = () => listTable("academy_assignments", fromAssignment);
export const listCloudAcademyQuizzes = () => listTable("academy_quizzes", fromQuiz);
export const listCloudAcademyQuizQuestions = () => listTable("academy_quiz_questions", fromQuizQuestion);
export const listCloudAcademyQuizAttempts = () => listTable("academy_quiz_attempts", fromQuizAttempt);
export const listCloudAcademyFavorites = () => listTable("academy_favorites", fromFavorite);
export const listCloudAcademyMedia = () => listTable("academy_media", fromMedia);

const upsertCloudRow = async (tableName: string, payload: Record<string, unknown>, onConflict: string): Promise<void> => {
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName, action: "upsert", payload });
    return;
  }

  const { error } = await (client.from(tableName) as any).upsert(payload, { onConflict });
  if (error) throw error;
};

export const upsertCloudAcademyProgress = async (progress: AcademyProgress): Promise<void> =>
  upsertCloudRow("academy_progress", toCloudProgress(progress), "user_id,lesson_id");

export const upsertCloudAcademyFavorite = async (favorite: AcademyFavorite): Promise<void> =>
  upsertCloudRow("academy_favorites", toCloudFavorite(favorite), "user_id,lesson_id");

export const deleteCloudAcademyFavorite = async (favorite: AcademyFavorite): Promise<void> => {
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: "academy_favorites", action: "delete", payload: toCloudFavorite(favorite) });
    return;
  }

  const { error } = await (client.from("academy_favorites") as any)
    .delete()
    .eq("user_id", favorite.userId)
    .eq("lesson_id", favorite.lessonId);
  if (error) throw error;
};

export const upsertCloudAcademyAssignment = async (assignment: AcademyAssignment): Promise<void> =>
  upsertCloudRow("academy_assignments", toCloudAssignment(assignment), "id");

export const upsertCloudAcademyQuizAttempt = async (attempt: AcademyQuizAttempt): Promise<void> =>
  upsertCloudRow("academy_quiz_attempts", toCloudQuizAttempt(attempt), "id");
