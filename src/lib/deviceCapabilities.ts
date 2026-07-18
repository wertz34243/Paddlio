import type { PageId, UserRole } from "../domain/types";

export type DeviceClass = "phone" | "tablet" | "desktop";
export type FeatureMode = "full" | "simplified" | "readOnly" | "limited" | "hidden";

export type ResponsiveCapabilities = {
  deviceClass: DeviceClass;
  isTouch: boolean;
  hasHover: boolean;
  supportsSplitLayout: boolean;
  supportsDenseTables: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isIPadOS: boolean;
  isMacOS: boolean;
};

export type FeatureId =
  | "today"
  | "trainingOverview"
  | "trainingCalendar"
  | "trainingPlan"
  | "trainingSessions"
  | "trainingJournal"
  | "analysis"
  | "team"
  | "academyLearning"
  | "academyEditing"
  | "clubAdministration"
  | "coachArea"
  | "adminArea"
  | "competitions"
  | "equipment"
  | "goals"
  | "records"
  | "notifications"
  | "integrations"
  | "feedback"
  | "settings"
  | "beta";

type FeatureCapability = {
  roles: UserRole[];
  phone: FeatureMode;
  tablet: FeatureMode;
  desktop: FeatureMode;
};

const allRoles: UserRole[] = ["athlete", "coach", "teamAdmin", "clubAdmin", "admin"];
const coachRoles: UserRole[] = ["coach", "teamAdmin", "clubAdmin", "admin"];
const adminRoles: UserRole[] = ["admin"];
const clubAdminRoles: UserRole[] = ["clubAdmin", "admin"];

export const featureCapabilities: Record<FeatureId, FeatureCapability> = {
  today: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  trainingOverview: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  trainingCalendar: { roles: allRoles, phone: "simplified", tablet: "full", desktop: "full" },
  trainingPlan: { roles: allRoles, phone: "simplified", tablet: "full", desktop: "full" },
  trainingSessions: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  trainingJournal: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  analysis: { roles: allRoles, phone: "simplified", tablet: "full", desktop: "full" },
  team: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  academyLearning: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  academyEditing: { roles: coachRoles, phone: "hidden", tablet: "limited", desktop: "full" },
  clubAdministration: { roles: clubAdminRoles, phone: "limited", tablet: "limited", desktop: "full" },
  coachArea: { roles: coachRoles, phone: "simplified", tablet: "full", desktop: "full" },
  adminArea: { roles: adminRoles, phone: "limited", tablet: "limited", desktop: "full" },
  competitions: { roles: allRoles, phone: "simplified", tablet: "full", desktop: "full" },
  equipment: { roles: allRoles, phone: "simplified", tablet: "full", desktop: "full" },
  goals: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  records: { roles: allRoles, phone: "readOnly", tablet: "full", desktop: "full" },
  notifications: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  integrations: { roles: allRoles, phone: "limited", tablet: "limited", desktop: "full" },
  feedback: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  settings: { roles: allRoles, phone: "full", tablet: "full", desktop: "full" },
  beta: { roles: adminRoles, phone: "limited", tablet: "limited", desktop: "full" },
};

export const pageFeatureMap: Partial<Record<PageId, FeatureId>> = {
  dashboard: "today",
  training: "trainingOverview",
  analysis: "analysis",
  communication: "team",
  more: "settings",
  academy: "academyLearning",
  club: "clubAdministration",
  competitions: "competitions",
  equipment: "equipment",
  goals: "goals",
  records: "records",
  profile: "settings",
  plan: "trainingPlan",
  season: "analysis",
};

export function getFeatureMode(feature: FeatureId, role: UserRole, deviceClass: DeviceClass): FeatureMode {
  const capability = featureCapabilities[feature];
  if (!capability.roles.includes(role)) {
    return "hidden";
  }

  return capability[deviceClass];
}

export function isFeatureAvailable(feature: FeatureId, role: UserRole, deviceClass: DeviceClass): boolean {
  return getFeatureMode(feature, role, deviceClass) !== "hidden";
}

export function getDeviceClassFromWidth(width: number): DeviceClass {
  if (width < 768) {
    return "phone";
  }

  if (width < 1200) {
    return "tablet";
  }

  return "desktop";
}

export function getResponsiveCapabilities(input: {
  width: number;
  pointer?: "coarse" | "fine" | "none";
  hover?: boolean;
  standalone?: boolean;
  platform?: string;
  userAgent?: string;
}): ResponsiveCapabilities {
  const platform = input.platform ?? "";
  const userAgent = input.userAgent ?? "";
  const isIOS = /iPhone|iPod/.test(platform) || /iPhone|iPod/.test(userAgent);
  const isIPadOS =
    /iPad/.test(platform) ||
    /iPad/.test(userAgent) ||
    (platform === "MacIntel" && input.pointer === "coarse");
  const isMacOS = /Mac/.test(platform) && !isIPadOS;
  const isTouch = input.pointer === "coarse";
  const hasHover = Boolean(input.hover);
  const deviceClass = getDeviceClassFromWidth(input.width);

  return {
    deviceClass,
    isTouch,
    hasHover,
    supportsSplitLayout: deviceClass !== "phone",
    supportsDenseTables: deviceClass === "desktop" && hasHover,
    isStandalone: Boolean(input.standalone),
    isIOS,
    isIPadOS,
    isMacOS,
  };
}
