import { describe, expect, it } from "vitest";
import { buildCloudRoles, normalizeCloudRoles } from "./profileService";

describe("cloud role trust boundary", () => {
  it("does not grant roles from user-editable auth metadata", () => {
    expect(buildCloudRoles("person@example.test", { roles: ["Admin"] }, ["Athlete"])).toEqual(["Athlete"]);
  });

  it("does not grant roles from a special email address", () => {
    expect(buildCloudRoles("dev.admin@paddlio.test", null, ["Athlete"])).toEqual(["Athlete"]);
  });

  it("preserves roles already loaded from the protected profile row", () => {
    expect(normalizeCloudRoles(["Athlete", "Coach"])).toEqual(["Athlete", "Coach"]);
  });
});
