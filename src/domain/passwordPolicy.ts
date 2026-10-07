export const PASSWORD_MIN_LENGTH = 10;

export const passwordMeetsRequirements = (password: string): boolean =>
  password.length >= PASSWORD_MIN_LENGTH
  && /[A-Z]/.test(password)
  && /[a-z]/.test(password)
  && /\d/.test(password)
  && /[^A-Za-z0-9]/.test(password);

export const PASSWORD_REQUIREMENTS_TEXT =
  "Mindestens 10 Zeichen mit Großbuchstabe, Kleinbuchstabe, Zahl und Sonderzeichen.";
