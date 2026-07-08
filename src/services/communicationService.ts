import type {
  ClubPost,
  DirectMessage,
  FileAttachment,
  GroupMessage,
  TeamTask,
  TeamTaskAssignment,
  TrainingAttendance,
} from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { enqueueSyncChange } from "./syncService";

const mapDirect = (row: any): DirectMessage => ({
  id: row.id,
  clubId: row.club_id ?? "",
  senderId: row.sender_id,
  receiverId: row.receiver_id,
  message: row.message,
  isRead: Boolean(row.is_read),
  readAt: row.read_at ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at ?? "",
});

const toDirect = (item: DirectMessage) => ({
  id: item.id,
  club_id: item.clubId || null,
  sender_id: item.senderId,
  receiver_id: item.receiverId,
  message: item.message,
  is_read: item.isRead,
  read_at: item.readAt || null,
  deleted_at: item.deletedAt || null,
});

const mapGroup = (row: any): GroupMessage => ({
  id: row.id,
  clubId: row.club_id,
  groupId: row.group_id,
  senderId: row.sender_id,
  message: row.message,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at ?? "",
});

const toGroup = (item: GroupMessage) => ({
  id: item.id,
  club_id: item.clubId,
  group_id: item.groupId,
  sender_id: item.senderId,
  message: item.message,
  deleted_at: item.deletedAt || null,
});

const mapPost = (row: any): ClubPost => ({
  id: row.id,
  clubId: row.club_id,
  authorId: row.author_id,
  title: row.title,
  content: row.content,
  category: row.category ?? "info",
  priority: row.priority ?? "normal",
  targetType: row.target_type ?? "club",
  targetGroupId: row.target_group_id ?? "",
  targetUserId: row.target_user_id ?? "",
  expiresAt: row.expires_at ?? "",
  isPinned: Boolean(row.is_pinned),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at ?? "",
});

const toPost = (item: ClubPost) => ({
  id: item.id,
  club_id: item.clubId,
  author_id: item.authorId,
  title: item.title,
  content: item.content,
  category: item.category,
  priority: item.priority,
  target_type: item.targetType,
  target_group_id: item.targetGroupId || null,
  target_user_id: item.targetUserId || null,
  expires_at: item.expiresAt || null,
  is_pinned: item.isPinned,
  deleted_at: item.deletedAt || null,
});

const mapTask = (row: any): TeamTask => ({
  id: row.id,
  clubId: row.club_id,
  createdBy: row.created_by,
  title: row.title,
  description: row.description ?? "",
  taskType: row.task_type ?? "general",
  priority: row.priority ?? "normal",
  dueDate: row.due_date ?? "",
  relatedTrainingId: row.related_training_id ?? "",
  relatedCompetitionId: row.related_competition_id ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at ?? "",
});

const toTask = (item: TeamTask) => ({
  id: item.id,
  club_id: item.clubId,
  created_by: item.createdBy,
  title: item.title,
  description: item.description || null,
  task_type: item.taskType,
  priority: item.priority,
  due_date: item.dueDate || null,
  related_training_id: item.relatedTrainingId || null,
  related_competition_id: item.relatedCompetitionId || null,
  deleted_at: item.deletedAt || null,
});

const mapAssignment = (row: any): TeamTaskAssignment => ({
  id: row.id,
  taskId: row.task_id,
  assignedTo: row.assigned_to,
  status: row.status ?? "open",
  completedAt: row.completed_at ?? "",
  responseNote: row.response_note ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toAssignment = (item: TeamTaskAssignment) => ({
  id: item.id,
  task_id: item.taskId,
  assigned_to: item.assignedTo,
  status: item.status,
  completed_at: item.completedAt || null,
  response_note: item.responseNote || null,
});

const mapAttendance = (row: any): TrainingAttendance => ({
  id: row.id,
  trainingId: row.training_id,
  athleteId: row.athlete_id,
  clubId: row.club_id ?? "",
  groupId: row.group_id ?? "",
  status: row.status ?? "pending",
  reason: row.reason ?? "",
  note: row.note ?? "",
  respondedAt: row.responded_at ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toAttendance = (item: TrainingAttendance) => ({
  id: item.id,
  training_id: item.trainingId,
  athlete_id: item.athleteId,
  club_id: item.clubId || null,
  group_id: item.groupId || null,
  status: item.status,
  reason: item.reason || null,
  note: item.note || null,
  responded_at: item.respondedAt || null,
});

const mapAttachment = (row: any): FileAttachment => ({
  id: row.id,
  clubId: row.club_id ?? "",
  ownerId: row.owner_id,
  relatedType: row.related_type,
  relatedId: row.related_id,
  fileName: row.file_name,
  filePath: row.file_path,
  fileType: row.file_type ?? "",
  fileSize: row.file_size ?? 0,
  createdAt: row.created_at,
  deletedAt: row.deleted_at ?? "",
});

const toAttachment = (item: FileAttachment) => ({
  id: item.id,
  club_id: item.clubId || null,
  owner_id: item.ownerId,
  related_type: item.relatedType,
  related_id: item.relatedId,
  file_name: item.fileName,
  file_path: item.filePath,
  file_type: item.fileType || null,
  file_size: item.fileSize || null,
  deleted_at: item.deletedAt || null,
});

const listTable = async <T,>(table: string, mapper: (row: any) => T): Promise<T[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from(table) as any).select("*").is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map(mapper);
};

const upsertTable = async (table: string, payload: Record<string, unknown>): Promise<void> => {
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName: table, action: "upsert", payload });
    return;
  }
  const { error } = await (client.from(table) as any).upsert(payload, { onConflict: "id" });
  if (error) throw error;
};

export const listCloudDirectMessages = () => listTable("direct_messages", mapDirect);
export const listCloudGroupMessages = () => listTable("group_messages", mapGroup);
export const listCloudClubPosts = () => listTable("club_posts", mapPost);
export const listCloudTasks = () => listTable("tasks", mapTask);
export const listCloudTaskAssignments = () => listTable("task_assignments", mapAssignment);
export const listCloudTrainingAttendance = () => listTable("training_attendance", mapAttendance);
export const listCloudFileAttachments = () => listTable("file_attachments", mapAttachment);

export const upsertCloudDirectMessage = (item: DirectMessage) => upsertTable("direct_messages", toDirect(item));
export const upsertCloudGroupMessage = (item: GroupMessage) => upsertTable("group_messages", toGroup(item));
export const upsertCloudClubPost = (item: ClubPost) => upsertTable("club_posts", toPost(item));
export const upsertCloudTask = (item: TeamTask) => upsertTable("tasks", toTask(item));
export const upsertCloudTaskAssignment = (item: TeamTaskAssignment) => upsertTable("task_assignments", toAssignment(item));
export const upsertCloudTrainingAttendance = (item: TrainingAttendance) => upsertTable("training_attendance", toAttendance(item));
export const upsertCloudFileAttachment = (item: FileAttachment) => upsertTable("file_attachments", toAttachment(item));
