import { describe, expect, it } from "vitest";
import { canManageAdminArea, canUseCoachArea, getGroupsForCurrentUser, isAdminRole, isCoachLikeRole } from "./accessControl";
import type { UserRole } from "./types";

describe("role gates", () => {
  const roles: UserRole[] = ["athlete", "coach", "teamAdmin", "clubAdmin", "admin"];

  it("keeps admin-only access limited to admin", () => {
    const allowed = roles.filter(canManageAdminArea);
    expect(allowed).toEqual(["admin"]);
  });

  it("allows coach areas for coach-like roles and admin", () => {
    const allowed = roles.filter(canUseCoachArea);
    expect(allowed).toEqual(["coach", "teamAdmin", "clubAdmin", "admin"]);
  });

  it("separates coach-like and system admin roles", () => {
    expect(isCoachLikeRole("coach")).toBe(true);
    expect(isCoachLikeRole("clubAdmin")).toBe(true);
    expect(isCoachLikeRole("admin")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("clubAdmin")).toBe(false);
  });

  it("hides inactive coach groups from role-scoped views", () => {
    const user = {
      userId: "coach-1",
      role: "coach",
      profile: { club: "MKC Monheim" },
    };
    const data = {
      coachGroups: [
        { id: "group-active", groupId: "group-active", coachUserId: "coach-1", coachId: "coach-1", clubId: "club-1", status: "active" },
        { id: "group-inactive", groupId: "group-inactive", coachUserId: "coach-1", coachId: "coach-1", clubId: "club-1", status: "inactive" },
      ],
    };

    expect(getGroupsForCurrentUser(data as any, user as any, ["club-1"]).map((group) => group.id)).toEqual(["group-active"]);
  });
});
