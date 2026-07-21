import { describe, expect, it } from "vitest";
import {
  createCalendarQuickTemplates,
  seasonPlanningBlocks,
  weeklyPlanningTemplates,
} from "./planningBlocks";

describe("planningBlocks", () => {
  it("provides calendar quick templates beyond the seven main templates", () => {
    const templates = createCalendarQuickTemplates("club-1");
    expect(templates.map((template) => template.title)).toContain("K1 Technik");
    expect(templates.map((template) => template.title)).toContain("Individueller Termin");
    expect(templates.every((template) => template.createdByUserId === "paddlio-system")).toBe(true);
  });

  it("defines usable weekly templates with dated items", () => {
    expect(weeklyPlanningTemplates.length).toBeGreaterThanOrEqual(4);
    expect(weeklyPlanningTemplates.every((template) => template.items.length > 0)).toBe(true);
    expect(weeklyPlanningTemplates.flatMap((template) => template.items).every((item) => item.dayOffset >= 0 && item.dayOffset <= 6)).toBe(true);
  });

  it("keeps season blocks linked to existing weekly templates", () => {
    const weeklyIds = new Set(weeklyPlanningTemplates.map((template) => template.id));
    expect(seasonPlanningBlocks.length).toBeGreaterThan(0);
    expect(seasonPlanningBlocks.flatMap((block) => block.weeklyTemplateIds).every((weeklyTemplateId) => weeklyIds.has(weeklyTemplateId))).toBe(true);
  });
});
