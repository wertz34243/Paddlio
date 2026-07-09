import type { UserRole } from "./types";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export const canSeeSystemPrivateData = (role: UserRole): boolean => role === "admin";

export const canSeeClubPrivateData = (role: UserRole): boolean =>
  role === "admin" || role === "clubAdmin";

export const maskEmail = (value?: string): string => {
  if (!value) return "";
  const [name = "", domain = ""] = value.split("@");
  if (!domain) return "E-Mail geschützt";
  const visible = name.slice(0, 1) || "*";
  return `${visible}***@${domain}`;
};

export const sanitizePrivateText = (value: string, canReveal: boolean): string =>
  canReveal ? value : value.replace(emailPattern, (match) => maskEmail(match));

export const displayNameOrFallback = (name: string | undefined, fallback = "Nutzer"): string =>
  name?.trim() || fallback;
