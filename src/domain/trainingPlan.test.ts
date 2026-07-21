import { describe, expect, it } from "vitest";
import { expandTrainingRepeatDates } from "./trainingPlan";

describe("trainingPlan repeat expansion", () => {
  it("creates weekly repeats including the start date and end date", () => {
    expect(expandTrainingRepeatDates("2026-07-14", "weekly", "2026-07-28")).toEqual([
      "2026-07-14",
      "2026-07-21",
      "2026-07-28",
    ]);
  });

  it("respects the maximum appointment count", () => {
    expect(expandTrainingRepeatDates("2026-07-14", "daily", "2026-07-20", 3)).toEqual([
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
    ]);
  });

  it("keeps a single appointment when no repeat end date is selected", () => {
    expect(expandTrainingRepeatDates("2026-07-14", "weekly")).toEqual(["2026-07-14"]);
  });

  it("creates biweekly repeat dates", () => {
    expect(expandTrainingRepeatDates("2026-07-14", "biweekly", "2026-08-11")).toEqual([
      "2026-07-14",
      "2026-07-28",
      "2026-08-11",
    ]);
  });

  it("creates monthly repeat dates without UTC date shifting", () => {
    expect(expandTrainingRepeatDates("2026-01-15", "monthly", "2026-03-15")).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
    ]);
  });
});
