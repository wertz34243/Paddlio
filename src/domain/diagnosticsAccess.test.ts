import { describe, expect, it } from "vitest";
import { canViewDevelopmentDiagnostics } from "./diagnosticsAccess";

describe("development diagnostics access", () => {
  it("allows administrative roles in development", () => {
    expect(canViewDevelopmentDiagnostics("admin", true)).toBe(true);
    expect(canViewDevelopmentDiagnostics("clubAdmin", true)).toBe(true);
    expect(canViewDevelopmentDiagnostics("teamAdmin", true)).toBe(true);
  });

  it("keeps coach and athlete diagnostics hidden", () => {
    expect(canViewDevelopmentDiagnostics("coach", true)).toBe(false);
    expect(canViewDevelopmentDiagnostics("athlete", true)).toBe(false);
  });

  it("hides diagnostics outside development", () => {
    expect(canViewDevelopmentDiagnostics("admin", false)).toBe(false);
  });
});
