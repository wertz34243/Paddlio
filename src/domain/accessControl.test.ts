import { describe, expect, it } from "vitest";
import { canManageAdminArea, canUseCoachArea, isAdminRole, isCoachLikeRole } from "./accessControl";
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
});
