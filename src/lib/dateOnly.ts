export type DateKey = `${number}-${number}-${number}`;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const dateKeyToLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const parseDateKey = dateKeyToLocalDate;

export const dateKeyFromLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateKey = dateKeyFromLocalDate;

export const isValidDateKey = (value: string): boolean => {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const date = dateKeyToLocalDate(value);
  return dateKeyFromLocalDate(date) === value;
};

export const normalizeDateKey = (value: string, fallback = todayDateKey()): string => {
  if (isValidDateKey(value)) return value;
  const parsedTimestamp = Date.parse(value);
  return Number.isNaN(parsedTimestamp) ? fallback : dateKeyFromLocalDate(new Date(parsedTimestamp));
};

export const compareDateKeys = (left: string, right: string): number =>
  left.localeCompare(right);

export const addDaysToDateKey = (value: string, days: number): string => {
  const date = dateKeyToLocalDate(value);
  date.setDate(date.getDate() + days);
  return dateKeyFromLocalDate(date);
};

export const todayDateKey = (date = new Date()): string => dateKeyFromLocalDate(date);

export const startOfWeekDateKey = (value: string): string => {
  const date = dateKeyToLocalDate(value);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return dateKeyFromLocalDate(date);
};

export const endOfWeekDateKey = (value: string): string =>
  addDaysToDateKey(startOfWeekDateKey(value), 7);

export const getLocalWeekdayLabel = (value: string): string =>
  dateKeyToLocalDate(value).toLocaleDateString("de-DE", { weekday: "long" });

export const formatDateKeyForDisplay = (value: string): string =>
  dateKeyToLocalDate(value).toLocaleDateString("de-DE");
