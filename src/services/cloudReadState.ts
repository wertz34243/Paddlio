const failedCloudValues = new WeakSet<object>();

export const markCloudReadFailed = <T,>(fallback: T): T => {
  if (fallback !== null && (typeof fallback === "object" || typeof fallback === "function")) {
    failedCloudValues.add(fallback as object);
  }
  return fallback;
};

export const didCloudReadFail = (value: unknown): boolean =>
  value !== null && (typeof value === "object" || typeof value === "function") && failedCloudValues.has(value as object);

export const cloudValueOrCached = <T,>(cloudValue: T | undefined, cachedValue: T): T =>
  cloudValue === undefined || didCloudReadFail(cloudValue) ? cachedValue : cloudValue;

export const mapCloudRead = <T, U>(value: T[], mapper: (item: T) => U): U[] => {
  const mapped = value.map(mapper);
  return didCloudReadFail(value) ? markCloudReadFailed(mapped) : mapped;
};
