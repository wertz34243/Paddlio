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
