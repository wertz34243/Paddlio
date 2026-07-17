import { createId } from "../../data/storage";
import { formatLocalDateOnly, getWeekdayFromDate, parseLocalDateOnly } from "../../domain/trainingPlan";
import type {
  BoatClass,
  CoachAthlete,
  Competition,
  MaterialCategory,
  PaddleMotionData,
  PlanEntry,
  TrainingArea,
  TrainingIntensity,
  TrainingPlanType,
  TrainingSession,
  User,
} from "../../domain/types";
import { detectTargetField, importTypeLabels, requiredFieldsFor } from "./mappings";
import type { ColumnMapping, ImportAnalysis, ImportField, ImportIssue, ImportPreviewRow, ImportReport, ImportType, ParsedSheet, ParsedWorkbook } from "./types";

export function analyzeWorkbook(workbook: ParsedWorkbook, importType: ImportType, sheetName?: string, headerRow?: number): ImportAnalysis {
  const sheet = workbook.sheets.find((item) => item.name === sheetName) ?? workbook.sheets[0];
  const resolvedHeaderRow = headerRow ?? sheet.detectedHeaderRow;
  const headers = (sheet.rows[resolvedHeaderRow] ?? []).map((header, index) => header || `Spalte ${index + 1}`);
  const dataRows = sheet.rows.slice(resolvedHeaderRow + 1).filter((row) => row.some(Boolean));
  const mappings = buildMappings(headers, dataRows, importType);
  const previewRows = dataRows.map((row, index) => buildPreviewRow(row, index + resolvedHeaderRow + 2, headers, mappings, importType));
  const validRows = previewRows.filter((row) => row.status === "valid").length;
  const warningRows = previewRows.filter((row) => row.status === "warning").length;
  const errorRows = previewRows.filter((row) => row.status === "error").length;
  const confidence = mappings.length ? mappings.reduce((sum, item) => sum + item.confidence, 0) / mappings.length : 0;

  return {
    importType,
    fileName: workbook.fileName,
    fileFormat: workbook.fileFormat,
    sheetName: sheet.name,
    headerRow: resolvedHeaderRow,
    headers,
    dataRows,
    mappings,
    previewRows,
    totalRows: previewRows.length,
    validRows,
    warningRows,
    errorRows,
    confidence,
    warnings: workbook.warnings,
  };
}

export function updateAnalysisMapping(analysis: ImportAnalysis, sourceIndex: number, targetField: ImportField): ImportAnalysis {
  const mappings = analysis.mappings.map((mapping) => mapping.sourceIndex === sourceIndex ? { ...mapping, targetField, confidence: targetField === "ignore" ? 0 : 1 } : mapping);
  const previewRows = analysis.dataRows.map((row, index) => buildPreviewRow(row, index + analysis.headerRow + 2, analysis.headers, mappings, analysis.importType));
  return {
    ...analysis,
    mappings,
    previewRows,
    validRows: previewRows.filter((row) => row.status === "valid").length,
    warningRows: previewRows.filter((row) => row.status === "warning").length,
    errorRows: previewRows.filter((row) => row.status === "error").length,
  };
}

function buildMappings(headers: string[], rows: string[][], importType: ImportType): ColumnMapping[] {
  return headers.map((header, index) => {
    const detection = detectTargetField(header, importType);
    return {
      sourceIndex: index,
      sourceHeader: header,
      targetField: detection.field,
      confidence: detection.confidence,
      sampleValues: rows.slice(0, 3).map((row) => row[index] ?? "").filter(Boolean),
    };
  });
}

function buildPreviewRow(row: string[], rowNumber: number, headers: string[], mappings: ColumnMapping[], importType: ImportType): ImportPreviewRow {
  const original = headers.reduce<Record<string, string>>((acc, header, index) => ({ ...acc, [header]: row[index] ?? "" }), {});
  const transformed: Record<string, unknown> = {};
  mappings.forEach((mapping) => {
    if (mapping.targetField === "ignore") return;
    const value = cleanValue(row[mapping.sourceIndex] ?? "");
    if (!value) return;
    transformed[mapping.targetField] = transformField(mapping.targetField, value);
  });

  normalizeNameFields(transformed);
  const issues = validateTransformed(importType, transformed);
  const status = issues.some((issue) => issue.severity === "error") ? "error" : issues.some((issue) => issue.severity === "warning") ? "warning" : "valid";
  return { rowNumber, original, transformed, issues, status };
}

function cleanValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function transformField(field: ImportField, value: string): unknown {
  if (field === "date" || field === "birthDate") return parseDateValue(value);
  if (field === "durationMinutes") return parseDurationMinutes(value);
  if (field === "rawTime") return parseTimeSeconds(value);
  if (field === "penaltySeconds" || field === "rank" || field === "startNumber" || field === "run") return parseInteger(value);
  if (field === "boatClass") return normalizeBoatClass(value);
  return value;
}

function normalizeNameFields(transformed: Record<string, unknown>) {
  const fullName = String(transformed.fullName ?? "").trim();
  if (fullName && (!transformed.firstName || !transformed.lastName)) {
    if (fullName.includes(",")) {
      const [lastName, firstName] = fullName.split(",").map((part) => part.trim());
      transformed.firstName = transformed.firstName || firstName || "";
      transformed.lastName = transformed.lastName || lastName || "";
    } else {
      const parts = fullName.split(" ");
      transformed.firstName = transformed.firstName || parts.slice(0, -1).join(" ") || parts[0] || "";
      transformed.lastName = transformed.lastName || parts.slice(-1)[0] || "";
    }
  }
}

function validateTransformed(importType: ImportType, transformed: Record<string, unknown>): ImportIssue[] {
  const issues: ImportIssue[] = [];
  requiredFieldsFor(importType).forEach((field) => {
    if (!transformed[field] && transformed[field] !== 0) {
      issues.push({ severity: "error", field, message: `Pflichtfeld fehlt: ${field}` });
    }
  });
  const email = String(transformed.email ?? "");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push({ severity: "warning", field: "email", message: "E-Mail wirkt ungültig." });
  const duration = Number(transformed.durationMinutes ?? 0);
  if (duration > 360) issues.push({ severity: "warning", field: "durationMinutes", message: "Ungewöhnlich lange Dauer." });
  const penalty = Number(transformed.penaltySeconds ?? 0);
  if (penalty < 0) issues.push({ severity: "error", field: "penaltySeconds", message: "Strafsekunden dürfen nicht negativ sein." });
  return issues;
}

export function executeImport(analysis: ImportAnalysis, data: PaddleMotionData, user: User): { data: PaddleMotionData; report: ImportReport } {
  const timestamp = new Date().toISOString();
  const validRows = analysis.previewRows.filter((row) => row.status !== "error");
  let createdRows = 0;
  let skippedRows = 0;
  let nextData = data;

  validRows.forEach((row) => {
    const result = applyRow(analysis.importType, row, nextData, user, timestamp);
    nextData = result.data;
    if (result.created) createdRows += 1;
    if (result.skipped) skippedRows += 1;
  });

  return {
    data: nextData,
    report: {
      id: createId("import-job"),
      userId: user.userId,
      clubId: user.profile.club || "",
      importType: analysis.importType,
      sourceType: "file",
      fileName: analysis.fileName,
      fileFormat: analysis.fileFormat,
      status: "imported",
      totalRows: analysis.totalRows,
      validRows: analysis.validRows,
      warningRows: analysis.warningRows,
      errorRows: analysis.errorRows,
      createdRows,
      updatedRows: 0,
      skippedRows,
      errors: analysis.previewRows.flatMap((row) => row.issues.filter((issue) => issue.severity === "error")),
      warnings: analysis.previewRows.flatMap((row) => row.issues.filter((issue) => issue.severity === "warning")),
      startedAt: timestamp,
      completedAt: new Date().toISOString(),
    },
  };
}

function applyRow(importType: ImportType, row: ImportPreviewRow, data: PaddleMotionData, user: User, timestamp: string): { data: PaddleMotionData; created?: boolean; skipped?: boolean } {
  const value = row.transformed;
  if (importType === "athletes" || importType === "club_members" || importType === "start_lists") {
    const email = String(value.email ?? "").toLowerCase();
    const name = String(value.fullName ?? `${value.firstName ?? ""} ${value.lastName ?? ""}`).trim();
    const exists = data.coachAthletes.some((athlete) => (email && athlete.email.toLowerCase() === email) || athlete.name.toLowerCase() === name.toLowerCase());
    if (exists) return { data, skipped: true };
    const athlete: CoachAthlete = {
      id: createId("athlete-import"),
      coachUserId: user.userId,
      clubId: user.profile.club,
      firstName: String(value.firstName ?? ""),
      lastName: String(value.lastName ?? ""),
      email,
      name,
      birthDate: String(value.birthDate ?? ""),
      ageClass: String(value.ageClass ?? "") as CoachAthlete["ageClass"],
      club: String(value.club ?? user.profile.club ?? ""),
      boatClasses: normalizeBoatClasses(value.boatClass),
      paddleSide: "rechts",
      groupId: "",
      groupIds: [],
      goals: "",
      trainerNotes: "",
      notes: "",
      status: "aktiv",
      invitationStatus: "einladung_offen",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return { data: { ...data, coachAthletes: [athlete, ...data.coachAthletes] }, created: true };
  }

  if (importType === "training_plans") {
    const date = String(value.date ?? formatLocalDateOnly(new Date()));
    const entry: PlanEntry = {
      id: createId("plan-import"),
      ownerUserId: user.userId,
      athleteId: "",
      clubId: user.profile.club,
      assignedType: "self",
      assignedAthleteIds: [],
      assignedGroupIds: [],
      title: String(value.title ?? value.focus ?? "Importiertes Training"),
      date,
      weekday: getWeekdayFromDate(date),
      time: String(value.time ?? ""),
      startTime: String(value.time ?? ""),
      endTime: "",
      durationMinutes: Number(value.durationMinutes ?? 60),
      area: inferTrainingArea(String(value.trainingType ?? value.focus ?? "")),
      trainingType: inferTrainingType(String(value.trainingType ?? value.focus ?? "")),
      boatClass: normalizeTrainingBoatClass(value.boatClass),
      goal: String(value.focus ?? ""),
      focus: String(value.focus ?? ""),
      description: String(value.description ?? ""),
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
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return { data: { ...data, plan: [entry, ...data.plan] }, created: true };
  }

  if (importType === "training_sessions") {
    const session: TrainingSession = {
      id: createId("training-import"),
      athleteId: user.userId,
      date: String(value.date ?? formatLocalDateOnly(new Date())),
      type: inferSessionType(String(value.trainingType ?? value.focus ?? "")),
      durationMinutes: Number(value.durationMinutes ?? 0),
      rpe: 5,
      focus: String(value.focus ?? ""),
      note: String(value.description ?? ""),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return { data: { ...data, training: [session, ...data.training] }, created: true };
  }

  if (importType === "competition_results") {
    const rawTime = Number(value.rawTime ?? 0);
    const penalty = Math.max(0, Number(value.penaltySeconds ?? 0));
    const competition: Competition = {
      id: createId("competition-import"),
      athleteId: user.userId,
      clubId: user.profile.club,
      name: String(value.title ?? "Importiertes Ergebnis"),
      date: String(value.date ?? formatLocalDateOnly(new Date())),
      location: "",
      course: "",
      courseName: "",
      level: "general",
      boatClass: normalizeBoatClasses(value.boatClass)[0] ?? "K1",
      run1TimeSeconds: rawTime,
      run1PenaltySeconds: penalty,
      run1TotalSeconds: rawTime + penalty,
      run2TimeSeconds: 0,
      run2PenaltySeconds: 0,
      run2TotalSeconds: 0,
      bestTotalSeconds: rawTime + penalty,
      rank: Number(value.rank ?? 0),
      gapToWinnerSeconds: 0,
      feeling: 3,
      note: String(value.description ?? ""),
      source: "file",
      sourceType: "file",
      createdBy: user.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return { data: { ...data, competitions: [competition, ...data.competitions] }, created: true };
  }

  if (importType === "materials") {
    return { data: { ...data, material: [{ id: createId("material-import"), athleteId: user.userId, category: inferMaterialCategory(String(value.materialType ?? "")), name: String(value.materialName ?? "Importiertes Material"), weightKg: 0, lengthCm: 0, imageDataUrl: "", status: "pruefen", rating: 3, note: String(value.condition ?? ""), createdAt: timestamp, updatedAt: timestamp }, ...data.material] }, created: true };
  }

  return { data, skipped: true };
}

function parseDateValue(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (match) {
    const [, day, month, year] = match;
    const fullYear = Number(year.length === 2 ? `20${year}` : year);
    return formatLocalDateOnly(new Date(fullYear, Number(month) - 1, Number(day)));
  }
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && numeric > 20000) {
    const excelEpoch = new Date(1899, 11, 30);
    excelEpoch.setDate(excelEpoch.getDate() + numeric);
    return formatLocalDateOnly(excelEpoch);
  }
  const parsed = parseLocalDateOnly(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed : formatLocalDateOnly(parsed);
}

function parseDurationMinutes(value: string): number {
  const trimmed = value.replace(",", ".").trim();
  const time = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (time) return Number(time[1]) * 60 + Number(time[2]);
  return Math.round(Number(trimmed.replace(/[^\d.]/g, "")) || 0);
}

function parseTimeSeconds(value: string): number {
  const trimmed = value.replace(",", ".").trim();
  const parts = trimmed.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(trimmed.replace(/[^\d.]/g, "")) || 0;
}

function parseInteger(value: string): number {
  return Math.round(Number(value.replace(",", ".").replace(/[^\d.-]/g, "")) || 0);
}

function normalizeBoatClass(value: string): BoatClass | "" {
  const upper = value.toUpperCase();
  if (upper.includes("C2")) return "C2";
  if (upper.includes("C1")) return "C1";
  if (upper.includes("K1")) return "K1";
  return "";
}

function normalizeBoatClasses(value: unknown): BoatClass[] {
  const normalized = normalizeBoatClass(String(value ?? ""));
  return normalized ? [normalized] : ["K1"];
}

function normalizeTrainingBoatClass(value: unknown): PlanEntry["boatClass"] {
  const text = String(value ?? "").toUpperCase();
  if (text.includes("K1") && text.includes("C1")) return "K1+C1";
  if (text.includes("C1")) return "C1";
  if (text.includes("K1")) return "K1";
  return "none";
}

function inferTrainingArea(value: string): TrainingArea {
  const normalized = value.toLowerCase();
  if (normalized.includes("kraft")) return "Krafttraining";
  if (normalized.includes("regeneration")) return "Regeneration";
  if (normalized.includes("wettkampf")) return "Wettkampf";
  if (normalized.includes("trainer")) return "Trainerarbeit";
  if (normalized.includes("ausdauer") || normalized.includes("ga")) return "Ausdauer";
  return "Wassertraining";
}

function inferTrainingType(value: string): TrainingPlanType {
  const normalized = value.toLowerCase();
  if (normalized.includes("ga2")) return "GA2";
  if (normalized.includes("ga1")) return "GA1";
  if (normalized.includes("kraft")) return "Kraftausdauer";
  if (normalized.includes("regeneration")) return "Regeneration";
  if (normalized.includes("wettkampf")) return "Wettkampfsimulation";
  return "K1 Technik";
}

function inferSessionType(value: string): TrainingSession["type"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("kraft")) return "Kraft";
  if (normalized.includes("ausdauer") || normalized.includes("ga")) return "Ausdauer";
  if (normalized.includes("regeneration")) return "Pause";
  return "Technik";
}

function inferMaterialCategory(value: string): MaterialCategory {
  const normalized = value.toLowerCase();
  if (normalized.includes("paddel")) return "Paddel";
  if (normalized.includes("zubeh")) return "Zubehör";
  return "Boot";
}

export { importTypeLabels };
