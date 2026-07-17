import { dateKeyFromLocalDate, dateKeyToLocalDate } from "../lib/dateOnly";
import type { TrainingSession, User, UserProfile } from "./types";

export const getActiveUser = (users: User[], activeUserId: string): User => {
  const activeUser = users.find((user) => user.id === activeUserId);

  if (!activeUser) {
    throw new Error("Active user not found");
  }

  return activeUser;
};

export const getDisplayName = (profile: UserProfile): string => {
  if (profile.nickname.trim()) {
    return profile.nickname.trim();
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  return fullName || "Athlet";
};

export const getInitials = (profile: UserProfile): string => {
  const source = `${profile.firstName} ${profile.lastName}`.trim() || profile.nickname || "A";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export const getAge = (birthDate: string, referenceDate = new Date()): number | undefined => {
  if (!birthDate) {
    return undefined;
  }

  const date = dateKeyToLocalDate(birthDate);
  if (Number.isNaN(date.getTime()) || dateKeyFromLocalDate(date) !== birthDate) {
    return undefined;
  }

  let age = referenceDate.getFullYear() - date.getFullYear();
  const monthDifference = referenceDate.getMonth() - date.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && referenceDate.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
};

export const getBoatClassSummary = (profile: UserProfile): string => {
  const classes = profile.boatClasses;
  return classes.length > 0 ? classes.join(", ") : "Keine Bootsklasse";
};

export const getSportProfileSummary = (profile: UserProfile): string => {
  const ageClass = profile.ageClass || "Keine Altersklasse";
  const boats = profile.boatClasses.length > 0 ? profile.boatClasses.join(" + ") : "Keine Bootsklasse";
  return `${ageClass} • ${boats}`;
};

const toLocalDateKey = dateKeyFromLocalDate;

export const getTrainingStreak = (sessions: TrainingSession[], referenceDate = new Date()): number => {
  const trainingDates = new Set(sessions.map((session) => session.date));
  let cursor = new Date(referenceDate);
  cursor.setHours(0, 0, 0, 0);

  if (!trainingDates.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (trainingDates.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export const getGreeting = (name: string, date = new Date()): string => {
  const hour = date.getHours();

  if (hour < 11) {
    return `Guten Morgen ${name}`;
  }

  if (hour < 18) {
    return `Hallo ${name}`;
  }

  return `Guten Abend ${name}`;
};
