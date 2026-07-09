const CLOUD_ID_MAP_KEY = "paddlio_cloud_id_map";

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const readCloudIdMap = (): Record<string, string> => {
  try {
    const raw = window.localStorage.getItem(CLOUD_ID_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const writeCloudIdMap = (map: Record<string, string>): void => {
  window.localStorage.setItem(CLOUD_ID_MAP_KEY, JSON.stringify(map));
};

export const toCloudUuid = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (isUuid(value)) return value;

  const map = readCloudIdMap();
  if (!map[value]) {
    map[value] = crypto.randomUUID();
    writeCloudIdMap(map);
  }
  return map[value];
};

export const toCloudUuidOrNull = (value: string | null | undefined): string | null =>
  value && isUuid(value) ? value : null;

const uuidColumns = new Set([
  "id",
  "user_id",
  "athlete_id",
  "owner_id",
  "club_id",
  "coach_id",
  "sender_id",
  "receiver_id",
  "group_id",
  "author_id",
  "created_by",
  "assigned_to",
  "task_id",
  "training_id",
  "competition_id",
  "result_id",
  "owner_user_id",
  "created_for_user_id",
  "assigned_athlete_id",
  "assigned_group_id",
  "target_group_id",
  "target_user_id",
  "related_training_id",
  "related_competition_id",
  "related_entity_id",
  "training_plan_item_id",
  "uploaded_by",
  "checked_by",
  "linked_training_id",
  "reviewed_by",
  "requested_by",
  "trainer_user_id",
  "athlete_user_id",
  "recipient_user_id",
  "sender_user_id",
  "uploaded_by_user_id",
]);

const textIdColumns = new Set([
  "external_id",
  "provider_user_id",
  "provider_activity_id",
  "source_id",
]);

export const sanitizeCloudPayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized: Record<string, unknown> = { ...payload };

  for (const [key, value] of Object.entries(sanitized)) {
    if (textIdColumns.has(key)) continue;

    if (uuidColumns.has(key)) {
      sanitized[key] = typeof value === "string" && value ? toCloudUuid(value) : null;
    }

    if (key.endsWith("_ids") && Array.isArray(value)) {
      sanitized[key] = value.map((item) => (typeof item === "string" ? toCloudUuid(item) : item)).filter(Boolean);
    }
  }

  return sanitized as T;
};
