import { describe, expect, it } from "vitest";
// The Vercel server helper is JavaScript and intentionally outside the client TS build.
// @ts-expect-error No declaration file is required for this focused server regression test.
import { normalizePolarExercise, normalizePolarStartedAt } from "../../api/_polar.js";

describe("Polar server date normalization", () => {
  it("converts Polar local start time with its UTC offset", () => {
    expect(normalizePolarStartedAt({
      start_time: "2026-07-14T16:00:00",
      start_time_utc_offset: 120,
    })).toBe("2026-07-14T14:00:00.000Z");
  });

  it("keeps timestamps that already contain a timezone", () => {
    expect(normalizePolarStartedAt({
      start_time: "2026-07-14T16:00:00+02:00",
      start_time_utc_offset: 60,
    })).toBe("2026-07-14T14:00:00.000Z");
  });

  it("uses the supplied fallback for invalid Polar dates", () => {
    const fallback = "2026-07-15T08:30:00.000Z";
    expect(normalizePolarStartedAt({ start_time: "not-a-date" }, fallback)).toBe(fallback);
    expect(normalizePolarExercise({ id: "activity-1", start_time: "not-a-date" }, "user-1").started_at)
      .toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
