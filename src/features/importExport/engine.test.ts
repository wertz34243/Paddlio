import { describe, expect, it } from "vitest";
import { analyzeWorkbook } from "./engine";
import { detectTargetField, requiredFieldsFor } from "./mappings";
import type { ParsedWorkbook } from "./types";

describe("import mapping and validation", () => {
  it("detects common German competition result columns", () => {
    expect(detectTargetField("Fahrzeit", "competition_results").field).toBe("rawTime");
    expect(detectTargetField("Strafsekunden", "competition_results").field).toBe("penaltySeconds");
    expect(detectTargetField("Teilnehmer", "competition_results").field).toBe("fullName");
  });

  it("keeps required fields explicit per import type", () => {
    expect(requiredFieldsFor("training_plans")).toEqual(["date", "durationMinutes"]);
    expect(requiredFieldsFor("competition_results")).toEqual(["date", "fullName", "rawTime"]);
  });

  it("flags negative penalties before import execution", () => {
    const workbook: ParsedWorkbook = {
      fileName: "results.csv",
      fileFormat: "csv",
      warnings: [],
      sheets: [
        {
          name: "Ergebnisse",
          rows: [
            ["Datum", "Name", "Fahrzeit", "Strafsekunden"],
            ["2026-07-14", "Trst Hallo", "95,42", "-2"],
          ],
          detectedHeaderRow: 0,
          rowCount: 2,
          columnCount: 4,
        },
      ],
    };

    const analysis = analyzeWorkbook(workbook, "competition_results");
    expect(analysis.errorRows).toBe(1);
    expect(analysis.previewRows[0].issues.some((issue) => issue.field === "penaltySeconds")).toBe(true);
  });
});
