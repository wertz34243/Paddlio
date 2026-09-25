import type { UserRole } from "./types";

const diagnosticRoles: UserRole[] = ["admin", "clubAdmin", "teamAdmin"];

export const canViewDevelopmentDiagnostics = (role: UserRole, isDevelopmentBuild: boolean): boolean =>
  isDevelopmentBuild && diagnosticRoles.includes(role);
