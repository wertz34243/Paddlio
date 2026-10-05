import { describe, expect, it } from "vitest";
import { analyzeWorkbook, executeImport } from "./engine";
import { seedData } from "../../data/seed";
import { protectSpreadsheetValue, sanitizeRowForSpreadsheet } from "./exportBuilder";
import { detectTargetField, requiredFieldsFor } from "./mappings";
import type { ParsedWorkbook } from "./types";
import type { PlanEntry, User } from "../../domain/types";
import { detectFileFormat } from "./parser";

describe("import mapping and validation", () => {
  it("detects common German competition result columns", () => {
    expect(detectTargetField("Fahrzeit", "competition_results").field).toBe("rawTime");
    expect(detectTargetField("Strafsekunden", "competition_results").field).toBe("penaltySeconds");
    expect(detectTargetField("Teilnehmer", "competition_results").field).toBe("fullName");
  });

  it("keeps required fields explicit per import type", () => {
    expect(requiredFieldsFor("training_plans")).toEqual(["date", "durationMinutes"]);
    expect(requiredFieldsFor("competition_results")).toEqual(["date", "fullName", "title", "rawTime"]);
    expect(requiredFieldsFor("groups")).toEqual(["group"]);
  });

  it("imports groups into the actual group collection", () => {
    const user = makeUser();
    const workbook: ParsedWorkbook = {
      fileName: "gruppen.csv", fileFormat: "csv", warnings: [],
      sheets: [{ name: "Gruppen", rows: [["Gruppe", "Fokus"], ["U18", "Technik"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 2 }],
    };
    const result = executeImport(analyzeWorkbook(workbook, "groups"), { ...seedData, coachGroups: [] }, user);
    expect(result.report.createdRows).toBe(1);
    expect(result.data.coachGroups[0]).toMatchObject({ name: "U18", trainingFocus: "Technik", coachUserId: user.userId });
  });

  it("imports athlete and club-member rows as pending management records", () => {
    const user = makeUser();
    const workbook: ParsedWorkbook = {
      fileName: "personen.csv", fileFormat: "csv", warnings: [],
      sheets: [{ name: "Personen", rows: [["Name", "Verein", "E-Mail"], ["Fiktive Person", "MKC Monheim", "fiktiv@example.test"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 3 }],
    };
    for (const type of ["athletes", "club_members"] as const) {
      const result = executeImport(analyzeWorkbook(workbook, type), { ...seedData, coachAthletes: [] }, user);
      expect(result.report.createdRows).toBe(1);
      expect(result.data.coachAthletes[0]).toMatchObject({ name: "Fiktive Person", invitationStatus: "einladung_offen" });
    }
  });

  it("imports a plan into the calendar source with its supplied local time", () => {
    const user = makeUser();
    const workbook: ParsedWorkbook = {
      fileName: "plan.xlsx", fileFormat: "xlsx", warnings: [],
      sheets: [{ name: "Plan", rows: [["Datum", "Uhrzeit", "Titel", "Dauer"], ["2026-10-02", "18:15", "GA1 Test", "60"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 4 }],
    };
    const result = executeImport(analyzeWorkbook(workbook, "training_plans"), { ...seedData, plan: [] }, user);
    expect(result.data.plan[0]).toMatchObject({ date: "2026-10-02", startTime: "18:15", title: "GA1 Test" });
  });

  it("imports a result for the matching own profile and prevents a duplicate", () => {
    const user = makeUser();
    const workbook: ParsedWorkbook = {
      fileName: "ergebnis.xls", fileFormat: "xls", warnings: [],
      sheets: [{ name: "Ergebnis", rows: [["Datum", "Name", "Wettkampf", "Fahrzeit", "Strafsekunden"], ["2026-10-02", "Coach Test", "Fiktiver Cup", "95.4", "2"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 5 }],
    };
    const first = executeImport(analyzeWorkbook(workbook, "competition_results"), { ...seedData, competitions: [] }, user);
    const second = executeImport(analyzeWorkbook(workbook, "competition_results"), first.data, user);
    expect(first.data.competitions[0]).toMatchObject({ athleteId: user.userId, name: "Fiktiver Cup", run1PenaltySeconds: 2 });
    expect(second.report.skippedRows).toBe(1);
    expect(second.data.competitions).toHaveLength(1);
  });

  it("imports material into material management and skips the same item twice", () => {
    const user = makeUser();
    const workbook: ParsedWorkbook = {
      fileName: "material.csv", fileFormat: "csv", warnings: [],
      sheets: [{ name: "Material", rows: [["Materialtyp", "Materialname", "Zustand"], ["Boot", "Fiktives K1", "gut"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 3 }],
    };
    const first = executeImport(analyzeWorkbook(workbook, "materials"), { ...seedData, material: [] }, user);
    const second = executeImport(analyzeWorkbook(workbook, "materials"), first.data, user);
    expect(first.data.material[0]).toMatchObject({ name: "Fiktives K1", note: "gut" });
    expect(second.report.skippedRows).toBe(1);
  });

  it("accepts the three advertised import file extensions", () => {
    expect(detectFileFormat("test.csv")).toBe("csv");
    expect(detectFileFormat("test.xlsx")).toBe("xlsx");
    expect(detectFileFormat("test.xls")).toBe("xls");
  });

  it("imports completed sessions into the journal source of truth", () => {
    const user = makeUser();
    const workbook: ParsedWorkbook = {
      fileName: "einheiten.xlsx", fileFormat: "xlsx", warnings: [],
      sheets: [{ name: "Training", rows: [["Datum", "Dauer", "Fokus"], ["2026-09-10", "75", "Technik"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 3 }],
    };
    const result = executeImport(analyzeWorkbook(workbook, "training_sessions"), { ...seedData, training: [], journal: [] }, user);
    expect(result.data.training).toHaveLength(1);
    expect(result.data.journal).toHaveLength(1);
    expect(result.data.journal[0]).toMatchObject({
      completionStatus: "completed",
      actualDurationMinutes: 75,
      title: "Technik",
    });
    expect(result.data.journal[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(result.data.journal[0].trainingId).toBe(result.data.journal[0].id);

    const afterReload = executeImport(analyzeWorkbook(workbook, "training_sessions"), {
      ...seedData,
      training: [],
      journal: result.data.journal,
    }, user);
    expect(afterReload.report.skippedRows).toBe(1);
    expect(afterReload.data.journal).toHaveLength(1);
  });

  it("keeps second-run competition values in run two", () => {
    const user = makeUser();
    const workbook: ParsedWorkbook = {
      fileName: "lauf-zwei.csv", fileFormat: "csv", warnings: [],
      sheets: [{ name: "Ergebnis", rows: [["Datum", "Name", "Wettkampf", "Lauf", "Fahrzeit", "Strafsekunden"], ["2026-10-02", "Coach Test", "Fiktiver Cup", "2", "94.2", "4"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 6 }],
    };
    const result = executeImport(analyzeWorkbook(workbook, "competition_results"), { ...seedData, competitions: [] }, user);
    expect(result.data.competitions[0]).toMatchObject({
      run1TimeSeconds: 0,
      run2TimeSeconds: 94.2,
      run2PenaltySeconds: 4,
      bestTotalSeconds: 98.2,
    });
    expect(result.data.competitions[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("associates start-list rows with an existing competition instead of creating athletes", () => {
    const user = makeUser();
    const competition = { ...seedData.competitions[0], id: "competition-1", name: "Herbst-Cup", date: "2026-09-10" };
    const workbook: ParsedWorkbook = {
      fileName: "startliste.csv", fileFormat: "csv", warnings: [],
      sheets: [{ name: "Startliste", rows: [["Wettkampf", "Name", "Startnummer", "Boot"], ["Herbst-Cup", "Mia Test", "17", "K1"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 4 }],
    };
    const result = executeImport(analyzeWorkbook(workbook, "start_lists"), { ...seedData, competitions: [competition], competitionStartEntries: [], coachAthletes: [] }, user);
    expect(result.report.createdRows).toBe(1);
    expect(result.data.competitionStartEntries[0]).toMatchObject({ competitionId: "competition-1", startNumber: 17, displayName: "Mia Test" });
    expect(result.data.coachAthletes).toHaveLength(0);
  });

  it("reports a start-list row whose competition cannot be resolved", () => {
    const user = makeUser();
    const workbook: ParsedWorkbook = {
      fileName: "startliste.csv", fileFormat: "csv", warnings: [],
      sheets: [{ name: "Startliste", rows: [["Wettkampf", "Name", "Startnummer"], ["Unbekannt", "Mia Test", "17"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 3 }],
    };
    const result = executeImport(analyzeWorkbook(workbook, "start_lists"), { ...seedData, competitions: [], competitionStartEntries: [] }, user);
    expect(result.report.status).toBe("failed");
    expect(result.report.errors[0]?.message).toContain("Wettkampf wurde nicht gefunden");
  });

  it("requires a date when a start-list name matches multiple competitions", () => {
    const user = makeUser();
    const competitions = [
      { ...seedData.competitions[0], id: "competition-1", name: "Herbst-Cup", date: "2026-09-10" },
      { ...seedData.competitions[0], id: "competition-2", name: "Herbst-Cup", date: "2026-09-11" },
    ];
    const workbook: ParsedWorkbook = {
      fileName: "startliste.csv", fileFormat: "csv", warnings: [],
      sheets: [{ name: "Startliste", rows: [["Wettkampf", "Name", "Startnummer"], ["Herbst-Cup", "Mia Test", "17"]], detectedHeaderRow: 0, rowCount: 2, columnCount: 3 }],
    };
    const result = executeImport(analyzeWorkbook(workbook, "start_lists"), { ...seedData, competitions, competitionStartEntries: [] }, user);
    expect(result.report.status).toBe("failed");
    expect(result.report.errors[0]?.message).toContain("Bitte das Datum ergänzen");
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
            ["Datum", "Name", "Wettkampf", "Fahrzeit", "Strafsekunden"],
            ["2026-07-14", "Trst Hallo", "Test-Cup", "95,42", "-2"],
          ],
          detectedHeaderRow: 0,
          rowCount: 2,
          columnCount: 5,
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
