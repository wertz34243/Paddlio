import { describe, expect, it } from "vitest";
import { getDeviceClassFromWidth, getFeatureMode, getResponsiveCapabilities } from "./deviceCapabilities";

describe("device capabilities", () => {
  it("classifies viewport widths into phone, tablet and desktop", () => {
    expect(getDeviceClassFromWidth(390)).toBe("phone");
    expect(getDeviceClassFromWidth(768)).toBe("tablet");
    expect(getDeviceClassFromWidth(1199)).toBe("tablet");
    expect(getDeviceClassFromWidth(1200)).toBe("desktop");
  });

  it("detects iPadOS separately from macOS when touch is available", () => {
    const capabilities = getResponsiveCapabilities({
      width: 1024,
      pointer: "coarse",
      hover: false,
      platform: "MacIntel",
      userAgent: "Mozilla/5.0",
    });

    expect(capabilities.deviceClass).toBe("tablet");
    expect(capabilities.isIPadOS).toBe(true);
    expect(capabilities.isMacOS).toBe(false);
    expect(capabilities.supportsSplitLayout).toBe(true);
  });

  it("keeps full admin features on desktop and limits them on phone", () => {
    expect(getFeatureMode("adminArea", "admin", "desktop")).toBe("full");
    expect(getFeatureMode("adminArea", "admin", "phone")).toBe("limited");
    expect(getFeatureMode("adminArea", "coach", "desktop")).toBe("hidden");
  });

  it("keeps daily athlete features available on phone", () => {
    expect(getFeatureMode("trainingSessions", "athlete", "phone")).toBe("full");
    expect(getFeatureMode("trainingJournal", "athlete", "phone")).toBe("full");
    expect(getFeatureMode("team", "athlete", "phone")).toBe("full");
    expect(getFeatureMode("integrations", "athlete", "phone")).toBe("limited");
  });
});
