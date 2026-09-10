import { describe, expect, it } from "vitest";
import { getActiveRegistrationClubs, isUuid, toRegistrationClub } from "./registrationClubs";

describe("registration clubs", () => {
  it("keeps the Supabase club uuid as canonical registration value", () => {
    const club = toRegistrationClub({
      id: "11111111-1111-4111-8111-111111111111",
      name: "MKC Monheim",
      short_name: "MKC",
      city: "Monheim",
      contact_name: null,
      contact_email: null,
      website: null,
      logo_url: null,
      primary_color: null,
      secondary_color: null,
      status: "active",
      created_at: "2026-09-10T10:00:00.000Z",
      updated_at: "2026-09-10T10:00:00.000Z",
    });

    expect(isUuid(club.clubId)).toBe(true);
    expect(club.clubId).toBe("11111111-1111-4111-8111-111111111111");
    expect(club.name).toBe("MKC Monheim");
  });

  it("only offers active clubs in deterministic order", () => {
    expect(
      getActiveRegistrationClubs([
        { clubId: "club-b", name: "Zweiter Club", shortName: "", city: "", status: "active", createdAt: "", updatedAt: "" },
        { clubId: "club-a", name: "Erster Club", shortName: "", city: "", status: "active", createdAt: "", updatedAt: "" },
        { clubId: "club-c", name: "Alter Club", shortName: "", city: "", status: "inactive", createdAt: "", updatedAt: "" },
      ]).map((club) => club.name),
    ).toEqual(["Erster Club", "Zweiter Club"]);
  });
});
