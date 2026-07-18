import { describe, expect, it } from "vitest";
import { analyzeWorkbook, executeImport } from "./engine";
import { seedData } from "../../data/seed";
import { protectSpreadsheetValue, sanitizeRowForSpreadsheet } from "./exportBuilder";
import { detectTargetField, requiredFieldsFor } from "./mappings";
import type { ParsedWorkbook } from "./types";
import type { PlanEntry, User } from "../../domain/types";

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

  it("skips duplicate imported training plans instead of creating another row", () => {
    const user = makeUser();
    const existingEntry: PlanEntry = {
      id: "plan-1",
      ownerUserId: user.userId,
      athleteId: "",
      clubId: "MKC Monheim",
      assignedType: "self",
      assignedAthleteIds: [],
      assignedGroupIds: [],
      title: "GA1",
      date: "2026-07-14",
      weekday: "Dienstag",
      time: "17:00",
      startTime: "17:00",
      endTime: "",
      durationMinutes: 60,
      area: "Ausdauer",
      trainingType: "GA1",
      boatClass: "K1",
      goal: "",
      focus: "",
      description: "",
      intensity: "mittel",
      note: "",
      notes: "",
      status: "planned",
      repeat: "none",
      repeatUntil: "",
      createdByUserId: user.userId,
      assignedAthleteId: "",
      assignedGroupId: "",
      feedbackNote: "",
      createdAt: "2026-07-14T10:00:00.000Z",
      updatedAt: "2026-07-14T10:00:00.000Z",
    };
    const data = {
      ...seedData,
      activeUserId: user.userId,
      plan: [existingEntry],
    };
    const workbook: ParsedWorkbook = {
      fileName: "training.csv",
      fileFormat: "csv",
      warnings: [],
      sheets: [
        {
          name: "Training",
          rows: [
            ["Datum", "Uhrzeit", "Titel", "Dauer"],
            ["2026-07-14", "17:00", "GA1", "60"],
          ],
          detectedHeaderRow: 0,
          rowCount: 2,
          columnCount: 4,
        },
      ],
    };

    const analysis = analyzeWorkbook(workbook, "training_plans");
    const result = executeImport(analysis, data, user);
    expect(result.data.plan).toHaveLength(1);
    expect(result.report.skippedRows).toBe(1);
  });

  it("protects spreadsheet exports from formula injection", () => {
    expect(protectSpreadsheetValue("=IMPORTXML(\"https://example.com\")")).toBe("'=IMPORTXML(\"https://example.com\")");
    expect(protectSpreadsheetValue("+SUM(1,2)")).toBe("'+SUM(1,2)");
    expect(sanitizeRowForSpreadsheet({ Name: "@bad", Dauer: 60 })).toEqual({ Name: "'@bad", Dauer: 60 });
  });
});

function makeUser(): User {
  return {
    id: "user-1",
    userId: "user-1",
    role: "coach",
    profile: {
      firstName: "Coach",
      lastName: "Test",
      nickname: "",
      birthDate: "",
      gender: "keine_angabe",
      heightCm: 0,
      weightKg: 0,
      club: "MKC Monheim",
      federation: "",
      coach: "",
      licenseNumber: "",
      boatClasses: ["K1"],
      ageClass: "Leistungsklasse",
      paddleSide: "rechts",
      trainingYears: 0,
      competitionExperience: "",
      longTermGoal: "",
      seasonGoal: "",
      personalNotes: "",
      profileImageDataUrl: "",
      darkMode: true,
      measurementUnit: "metrisch",
      language: "de",
    },
    createdAt: "2026-07-14T10:00:00.000Z",
    updatedAt: "2026-07-14T10:00:00.000Z",
  };
}
