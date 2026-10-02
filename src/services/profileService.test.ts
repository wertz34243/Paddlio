import { describe, expect, it } from "vitest";
import type { CloudProfile } from "./profileService";
import { buildCloudRoles, mergeVisibleContactProfiles, normalizeCloudRoles } from "./profileService";

const profile = (id: string, displayName: string): CloudProfile => ({
  id,
  email: `${id}@paddlio.test`,
  first_name: displayName.split(" ")[0] ?? "",
  last_name: displayName.split(" ")[1] ?? "",
  display_name: displayName,
  club_id: "11111111-1111-4111-8111-111111111111",
  roles: ["Athlete"],
  status: "active",
  avatar_url: null,
  age_category: null,
  boat_classes: ["K1"],
  paddle_side: null,
  profile_data: {},
  created_at: "2026-10-02T06:00:00.000Z",
  updated_at: "2026-10-02T06:00:00.000Z",
});

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

describe("visible contact directory", () => {
  it("adds related contacts without exposing their email", () => {
    const viewer = profile("viewer", "Dev Athlete");
    const result = mergeVisibleContactProfiles([viewer], [{
      id: "coach",
      first_name: "Dev",
      last_name: "Coach",
      display_name: "Dev Coach",
      club_id: viewer.club_id,
      roles: ["Coach"],
    }], viewer);

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({ id: "coach", display_name: "Dev Coach", email: "", roles: ["Coach"] });
  });

  it("keeps the complete profile when the contact directory contains the same user", () => {
    const viewer = profile("viewer", "Dev Athlete");
    const known = profile("coach", "Known Coach");
    const result = mergeVisibleContactProfiles([viewer, known], [{
      id: "coach",
      first_name: "Fallback",
      last_name: "Name",
      display_name: "Fallback Name",
      club_id: viewer.club_id,
      roles: ["Coach"],
    }], viewer);

    expect(result.find((item) => item.id === "coach")?.display_name).toBe("Known Coach");
    expect(result.find((item) => item.id === "coach")?.email).toBe("coach@paddlio.test");
  });
});
