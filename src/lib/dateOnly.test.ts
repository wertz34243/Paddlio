import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  compareDateKeys,
  dateKeyFromLocalDate,
  dateKeyToLocalDate,
  endOfWeekDateKey,
  getLocalWeekdayLabel,
  isValidDateKey,
  normalizeDateKey,
  startOfWeekDateKey,
  todayDateKey,
} from "./dateOnly";

describe("dateOnly", () => {
  it("keeps 2026-07-14 as Dienstag", () => {
    expect(getLocalWeekdayLabel("2026-07-14")).toBe("Dienstag");
  });

  it("parses and formats local calendar days without UTC shift", () => {
    const date = dateKeyToLocalDate("2026-07-14");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(14);
    expect(dateKeyFromLocalDate(date)).toBe("2026-07-14");
  });

  it("handles week boundaries from Sunday to Monday", () => {
    expect(startOfWeekDateKey("2026-07-19")).toBe("2026-07-13");
    expect(endOfWeekDateKey("2026-07-19")).toBe("2026-07-20");
  });

  it("handles month and year changes", () => {
    expect(addDaysToDateKey("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysToDateKey("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles leap years", () => {
    expect(isValidDateKey("2028-02-29")).toBe(true);
    expect(isValidDateKey("2027-02-29")).toBe(false);
    expect(addDaysToDateKey("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("normalizes valid and invalid values", () => {
    expect(normalizeDateKey("2026-07-14", "2026-01-01")).toBe("2026-07-14");
    expect(normalizeDateKey("kein-datum", "2026-01-01")).toBe("2026-01-01");
  });

  it("compares date keys lexically in calendar order", () => {
    expect(compareDateKeys("2026-07-14", "2026-07-15")).toBeLessThan(0);
    expect(compareDateKeys("2026-07-14", "2026-07-14")).toBe(0);
  });

  it("formats today from a local Date object", () => {
    expect(todayDateKey(new Date(2026, 6, 14, 23, 30))).toBe("2026-07-14");
  });
});
