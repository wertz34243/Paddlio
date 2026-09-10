const LOGIN_ALLOWED_MESSAGE_PATTERNS = [
  /E-Mail-Adresse bestätigt/i,
  /Bitte melde dich/i,
  /Bestätigungsmail/i,
  /Passwort/i,
  /Reset-Link/i,
];

const TECHNICAL_LOGIN_MESSAGE_PATTERNS = [
  /Cloud eingeschränkt/i,
  /Cloud-Synchronisation/i,
  /Profil-Sync/i,
  /Profil konnte nicht bestätigt/i,
  /Rolle (?:ist )?lokal/i,
  /lokaler Cache/i,
  /lokal abgeleitet/i,
  /Supabase/i,
  /RLS/i,
  /row-level security/i,
  /optionale Module/i,
  /Zusatzfunktionen/i,
];

export const PROFILE_SYNC_RETRY_MESSAGE = "Dein Profil konnte gerade nicht vollständig geladen werden. Bitte versuche es erneut.";

export const isUserVisibleLoginMessage = (value = ""): boolean => {
  const message = value.trim();
  if (!message) return false;
  if (TECHNICAL_LOGIN_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))) return false;
  return LOGIN_ALLOWED_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
};
