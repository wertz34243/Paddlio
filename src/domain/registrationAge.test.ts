import { describe, expect, it } from "vitest";
import { isAtLeastAge } from "./registrationAge";

describe("registration age policy", () => {
  const today = new Date("2026-10-06T12:00:00+02:00");

  it("accepts a person on their sixteenth birthday", () => {
    expect(isAtLeastAge("2010-10-06", 16, today)).toBe(true);
  });

  it("rejects a person younger than sixteen", () => {
    expect(isAtLeastAge("2010-10-07", 16, today)).toBe(false);
  });

  it("rejects invalid dates", () => {
    expect(isAtLeastAge("2010-02-31", 16, today)).toBe(false);
  });
});
