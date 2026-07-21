import { describe, expect, it } from "vitest";
import { expandTrainingRepeatDates, getTrainingRepeatSeriesEntries } from "./trainingPlan";
import type { PlanEntry } from "./types";

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

  it("finds all entries of a repeat series by series id", () => {
    const base = makePlanEntry({ repeatSeriesId: "series-1" });
    const entries = [
      base,
      makePlanEntry({ id: "plan-2", date: "2026-07-21", repeatSeriesId: "series-1" }),
      makePlanEntry({ id: "plan-3", date: "2026-07-21", repeatSeriesId: "series-2" }),
    ];

    expect(getTrainingRepeatSeriesEntries(entries, base).map((entry) => entry.id)).toEqual(["plan-1", "plan-2"]);
  });

  it("does not group unrelated non-repeat entries", () => {
    const base = makePlanEntry({ repeat: "none", repeatUntil: "", repeatSeriesId: "" });
    const entries = [
      base,
      makePlanEntry({ id: "plan-2", date: "2026-07-21", repeat: "none", repeatUntil: "", repeatSeriesId: "" }),
    ];

    expect(getTrainingRepeatSeriesEntries(entries, base).map((entry) => entry.id)).toEqual(["plan-1"]);
  });
});

const makePlanEntry = (overrides: Partial<PlanEntry> = {}): PlanEntry => ({
  id: "plan-1",
  ownerUserId: "coach-1",
  athleteId: "athlete-1",
  clubId: "club-1",
  assignedType: "athlete",
  assignedAthleteIds: ["athlete-1"],
  assignedGroupIds: [],
  title: "GA1",
  date: "2026-07-14",
  weekday: "Dienstag",
  time: "17:30",
  startTime: "17:30",
  endTime: "",
  durationMinutes: 60,
  area: "Ausdauer",
  trainingType: "GA1",
  boatClass: "K1",
  goal: "",
  focus: "",
  description: "",
  intensity: "locker",
  note: "",
  notes: "",
  status: "planned",
  repeat: "weekly",
  repeatUntil: "2026-07-28",
  repeatSeriesId: "series-1",
  createdByUserId: "coach-1",
  assignedAthleteId: "athlete-1",
  assignedGroupId: "",
  feedbackNote: "",
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  ...overrides,
});
