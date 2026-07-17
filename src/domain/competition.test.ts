import { describe, expect, it } from "vitest";
import { calculateCompetitionTotalTime } from "./competition";

describe("competition timing", () => {
  it("adds penalty seconds to raw drive time", () => {
    expect(calculateCompetitionTotalTime(95.42, 4)).toBe(99.42);
  });

  it("treats empty or invalid penalties as zero", () => {
    expect(calculateCompetitionTotalTime(95.42, undefined as unknown as number)).toBe(95.42);
    expect(calculateCompetitionTotalTime(95.42, Number.NaN)).toBe(95.42);
  });

  it("does not allow negative penalties to reduce total time", () => {
    expect(calculateCompetitionTotalTime(95.42, -4)).toBe(95.42);
  });
});
