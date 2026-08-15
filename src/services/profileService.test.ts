import { describe, expect, it } from "vitest";
import { buildCloudRoles, getCloudRolesFromMetadata, getDevelopmentTestRolesForEmail } from "./profileService";

describe("profile role normalization", () => {
  it("reads safe cloud roles from auth metadata", () => {
    expect(getCloudRolesFromMetadata({ roles: ["Coach", "Invalid", "Athlete"] })).toEqual(["Coach", "Athlete"]);
    expect(getCloudRolesFromMetadata({ role: "Admin" })).toEqual(["Admin"]);
  });

  it("repairs a coach profile that only has the athlete fallback role", () => {
    expect(buildCloudRoles("dev.coach@paddlio.test", {}, ["Athlete"])).toEqual(["Athlete", "Coach"]);
    expect(buildCloudRoles("dev.coach@paddlio.test", { roles: ["Coach"] }, ["Athlete"])).toEqual(["Athlete", "Coach"]);
  });

  it("keeps exact development test accounts role-capable without relying on auth metadata", () => {
    expect(getDevelopmentTestRolesForEmail("DEV.CLUBADMIN@PADDLIO.TEST")).toEqual(["ClubAdmin"]);
    expect(buildCloudRoles("dev.clubadmin@paddlio.test", {}, ["Athlete"])).toEqual(["Athlete", "ClubAdmin"]);
  });

  it("keeps the development admin account admin-capable", () => {
    expect(buildCloudRoles("dev.admin@paddlio.test", {}, ["Athlete"])).toEqual(["Athlete", "Admin", "Coach"]);
  });
});
