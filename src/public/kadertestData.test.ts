import { describe, expect, it } from "vitest";
import { biologicalNorms, calendarNorms, includesCanoe, includesKayak, techniqueComparison } from "./kadertestData";

describe("kadertest norms", () => {
  it("uses calendar age only for mobility, core and technique", () => {
    expect(calendarNorms["13.5"]).toEqual({ sitAndReach: "101 cm", coreStrength: "88 s" });
    expect(calendarNorms["14.0"].kayakTechnique).toBe("Mittelwert 1,40");
  });

  it("uses biological age for strength, sprint and endurance", () => {
    expect(biologicalNorms["13.5"]).toMatchObject({ pullUps: "9", relativeStrength: "150 %", kayakSprint: "7,95 s", canoeEndurance: "290 s / 4:50 min" });
  });

  it("does not invent a 13.5 technique norm", () => {
    expect(calendarNorms["13.5"].kayakTechnique).toBeUndefined();
    expect(calendarNorms["13.5"].canoeTechnique).toBeUndefined();
    expect(techniqueComparison("kayak")).toBe("13 Jahre 1,50 / 14 Jahre 1,40");
  });

  it("selects discipline-specific content", () => {
    expect(includesKayak("both")).toBe(true);
    expect(includesCanoe("both")).toBe(true);
    expect(includesCanoe("kayak")).toBe(false);
  });
});
