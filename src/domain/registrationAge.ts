export const REGISTRATION_MINIMUM_AGE = 16;

export const isAtLeastAge = (birthDate: string, minimumAge = REGISTRATION_MINIMUM_AGE, today = new Date()): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return false;

  const threshold = new Date(Date.UTC(today.getFullYear() - minimumAge, today.getMonth(), today.getDate()));
  return parsed <= threshold;
};
