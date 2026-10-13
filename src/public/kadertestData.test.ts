import { describe, expect, it } from "vitest";
import {
  athleticNorms,
  biologicalAges,
  calendarAges,
  getTechniqueAge,
  getTechniqueComparison,
  includesCanoe,
  includesKayak,
  techniqueNorms,
} from "./kadertestData";
import { buildSections } from "./KadertestPage";

describe("kadertest norms", () => {
  it("covers every calendar and biological age published by the manual", () => {
    expect(calendarAges).toEqual(["11.0", "11.5", "12.0", "12.5", "13.0", "13.5", "14.0", "14.5", "15.0", "15.5", "16.0", "16.5", "17.0", "18.0"]);
    expect(biologicalAges).toEqual(["10.0", "10.5", ...calendarAges]);
  });

  it("uses the published male kayak and canoe values", () => {
    expect(athleticNorms.male["13.5"]).toMatchObject({ pullUps: 9, relativeStrength: 150, kayakSprint: 7.95, canoeEndurance: 290 });
    expect(athleticNorms.male["18.0"]).toMatchObject({ coreStrength: 180, relativeStrength: 241, kayakSprint: 6, canoeSprint: 7.5 });
  });

  it("uses the separate published female norms", () => {
    expect(athleticNorms.female["13.0"]).toMatchObject({ sitAndReach: 101, coreStrength: 60, pullUps: 6, kayakSprint: 8.4, canoeSprint: 11 });
    expect(athleticNorms.female["18.0"]).toMatchObject({ sitAndReach: 108, relativeStrength: 193, canoeEndurance: 265 });
  });

  it("does not invent half-year technique norms", () => {
    expect(getTechniqueAge("13.5")).toBeNull();
    expect(getTechniqueComparison("13.5", "kayak")).toBe("13 Jahre 1,5 / 14 Jahre 1,4");
    expect(getTechniqueComparison("13.5", "canoe")).toBe("13 Jahre 1,77 / 14 Jahre 1,60");
  });

  it("selects only the techniques tested in the selected age class", () => {
    expect(Object.keys(techniqueNorms.canoe[11])).not.toContain("Aufwärtstor Staken");
    expect(techniqueNorms.canoe[11].tasks).not.toHaveProperty("Aufwärtstor Staken");
    expect(techniqueNorms.canoe[15].tasks).toHaveProperty("Aufwärtstor Staken", 2);
    expect(techniqueNorms.canoe[14].tasks).toHaveProperty("Abwärtstor verkanten", 2);
    expect(techniqueNorms.kayak[15].tasks).not.toHaveProperty("Bogenschlag vorwärts/rückwärts");
  });

  it("switches the official strength station without inventing a transition", () => {
    const age13 = buildSections("13.0", "13.0", "male", "kayak").find((section) => section.id === "strength");
    const age135 = buildSections("13.5", "13.5", "male", "kayak").find((section) => section.id === "strength");
    const age14 = buildSections("14.0", "14.0", "male", "kayak").find((section) => section.id === "strength");
    expect(age13?.tasks.map((task) => task.name)).toEqual(["Klimmzüge", "Liegestütze"]);
    expect(age135?.tasks).toHaveLength(4);
    expect(age135?.note).toContain("Saison-Altersklasse");
    expect(age14?.tasks.map((task) => task.name)).toEqual(["Bankziehen", "Bankdrücken"]);
  });

  it("selects discipline-specific content", () => {
    expect(includesKayak("both")).toBe(true);
    expect(includesCanoe("both")).toBe(true);
    expect(includesCanoe("kayak")).toBe(false);
  });
});
