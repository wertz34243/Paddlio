import type { DeviceClass } from "./deviceCapabilities";

export type PaddlioOneTheme = "dark" | "light" | "highContrast";
export type PaddlioOneDensity = "comfortable" | "balanced" | "compact";
export type PaddlioOneShellMode = "phone" | "tablet" | "desktop" | "ultrawide";

export const paddlioOneThemes: PaddlioOneTheme[] = ["dark", "light", "highContrast"];

export function normalizePaddlioOneTheme(value: unknown, fallback: PaddlioOneTheme = "dark"): PaddlioOneTheme {
  if (value === "light" || value === "highContrast" || value === "dark") {
    return value;
  }

  return fallback;
}

export function getPaddlioOneDensity(deviceClass: DeviceClass): PaddlioOneDensity {
  if (deviceClass === "phone") return "comfortable";
  if (deviceClass === "tablet") return "balanced";
  return "compact";
}

export function getPaddlioOneShellMode(width: number, deviceClass: DeviceClass): PaddlioOneShellMode {
  if (width >= 1680) return "ultrawide";
  if (deviceClass === "desktop") return "desktop";
  if (deviceClass === "tablet") return "tablet";
  return "phone";
}

export function getPaddlioOneThemeFromSystem(input: {
  storedTheme?: string | null;
  prefersHighContrast?: boolean;
  prefersLight?: boolean;
}): PaddlioOneTheme {
  const stored = normalizePaddlioOneTheme(input.storedTheme, "dark");
  if (input.storedTheme) return stored;
  if (input.prefersHighContrast) return "highContrast";
  if (input.prefersLight) return "light";
  return "dark";
}
