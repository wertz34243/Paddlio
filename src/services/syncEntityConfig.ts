export type SyncPriority = "A" | "B" | "C" | "D";
export type SyncMergeStrategy = "serverWins" | "clientWins" | "fieldMerge" | "appendOnly" | "manual";

export type SyncEntityConfig = {
  table: string;
  primaryKey: string;
  conflictKey: string;
  updatedAtField: string;
  supportsSoftDelete: boolean;
  deletedAtField?: string;
  ownerField?: string;
  clubField?: string;
  mergeStrategy: SyncMergeStrategy;
  priority: SyncPriority;
};

const syncEntityConfigs: Record<string, SyncEntityConfig> = {
  profiles: {
    table: "profiles",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "id",
    clubField: "club_id",
    mergeStrategy: "fieldMerge",
    priority: "A",
  },
  training_plan_items: {
    table: "training_plan_items",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: true,
    deletedAtField: "deleted_at",
    ownerField: "owner_id",
    clubField: "club_id",
    mergeStrategy: "fieldMerge",
    priority: "A",
  },
  training_feedback: {
    table: "training_feedback",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "athlete_id",
    clubField: "club_id",
    mergeStrategy: "fieldMerge",
    priority: "A",
  },
  direct_messages: {
    table: "direct_messages",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "created_at",
    supportsSoftDelete: true,
    deletedAtField: "deleted_at",
    ownerField: "sender_id",
    clubField: "club_id",
    mergeStrategy: "appendOnly",
    priority: "A",
  },
  group_messages: {
    table: "group_messages",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "created_at",
    supportsSoftDelete: true,
    deletedAtField: "deleted_at",
    ownerField: "sender_id",
    clubField: "club_id",
    mergeStrategy: "appendOnly",
    priority: "A",
  },
  training_attendance: {
    table: "training_attendance",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "athlete_id",
    clubField: "club_id",
    mergeStrategy: "serverWins",
    priority: "A",
  },
  task_assignments: {
    table: "task_assignments",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "assigned_to",
    mergeStrategy: "serverWins",
    priority: "B",
  },
  tasks: {
    table: "tasks",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: true,
    deletedAtField: "deleted_at",
    ownerField: "created_by",
    clubField: "club_id",
    mergeStrategy: "fieldMerge",
    priority: "B",
  },
  training_groups: {
    table: "training_groups",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "coach_user_id",
    clubField: "club_id",
    mergeStrategy: "serverWins",
    priority: "B",
  },
  group_members: {
    table: "group_members",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "athlete_id",
    clubField: "club_id",
    mergeStrategy: "serverWins",
    priority: "B",
  },
  group_memberships: {
    table: "group_memberships",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "user_id",
    clubField: "club_id",
    mergeStrategy: "serverWins",
    priority: "B",
  },
  external_connections: {
    table: "external_connections",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "user_id",
    mergeStrategy: "serverWins",
    priority: "B",
  },
  external_training_sessions: {
    table: "external_training_sessions",
    primaryKey: "id",
    conflictKey: "provider,provider_activity_id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "user_id",
    clubField: "club_id",
    mergeStrategy: "manual",
    priority: "B",
  },
  polar_training_imports: {
    table: "polar_training_imports",
    primaryKey: "id",
    conflictKey: "user_id,provider_activity_id",
    updatedAtField: "updated_at",
    supportsSoftDelete: false,
    ownerField: "user_id",
    mergeStrategy: "manual",
    priority: "B",
  },
  notifications: {
    table: "notifications",
    primaryKey: "id",
    conflictKey: "id",
    updatedAtField: "created_at",
    supportsSoftDelete: false,
    ownerField: "user_id",
    mergeStrategy: "serverWins",
    priority: "A",
  },
};

export const getSyncEntityConfig = (table: string): SyncEntityConfig => syncEntityConfigs[table] ?? {
  table,
  primaryKey: "id",
  conflictKey: table === "club_settings" ? "club_id" : "id",
  updatedAtField: "updated_at",
  supportsSoftDelete: false,
  mergeStrategy: "serverWins",
  priority: "C",
};

export const getSyncEntityConfigs = (): SyncEntityConfig[] => Object.values(syncEntityConfigs);

export const toSoftDeletePayload = (
  table: string,
  payload: Record<string, unknown>,
  deletedAt = new Date().toISOString(),
): Record<string, unknown> => {
  const config = getSyncEntityConfig(table);
  if (!config.supportsSoftDelete || !config.deletedAtField) return payload;

  return {
    ...payload,
    [config.deletedAtField]: payload[config.deletedAtField] ?? deletedAt,
    [config.updatedAtField]: payload[config.updatedAtField] ?? deletedAt,
  };
};
