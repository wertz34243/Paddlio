import { describe, expect, it } from "vitest";
import {
  getPaddlioOneDensity,
  getPaddlioOneShellMode,
  getPaddlioOneThemeFromSystem,
  normalizePaddlioOneTheme,
} from "./paddlioOneTheme";

describe("paddlio one theme foundation", () => {
  it("normalizes supported themes and falls back safely", () => {
    expect(normalizePaddlioOneTheme("dark")).toBe("dark");
    expect(normalizePaddlioOneTheme("light")).toBe("light");
    expect(normalizePaddlioOneTheme("highContrast")).toBe("highContrast");
    expect(normalizePaddlioOneTheme("unknown", "light")).toBe("light");
  });

  it("maps device classes to density levels", () => {
    expect(getPaddlioOneDensity("phone")).toBe("comfortable");
    expect(getPaddlioOneDensity("tablet")).toBe("balanced");
    expect(getPaddlioOneDensity("desktop")).toBe("compact");
  });

  it("detects shell modes without relying on user agent", () => {
    expect(getPaddlioOneShellMode(390, "phone")).toBe("phone");
    expect(getPaddlioOneShellMode(1024, "tablet")).toBe("tablet");
    expect(getPaddlioOneShellMode(1366, "desktop")).toBe("desktop");
    expect(getPaddlioOneShellMode(1920, "desktop")).toBe("ultrawide");
  });

  it("respects stored theme before system preferences", () => {
    expect(getPaddlioOneThemeFromSystem({ storedTheme: "light", prefersHighContrast: true })).toBe("light");
    expect(getPaddlioOneThemeFromSystem({ prefersHighContrast: true })).toBe("highContrast");
    expect(getPaddlioOneThemeFromSystem({ prefersLight: true })).toBe("light");
    expect(getPaddlioOneThemeFromSystem({})).toBe("dark");
  });
});
