import type { PaddleMotionData, User } from "../../domain/types";
import { todayDateKey } from "../../lib/dateOnly";
import type { ExportType, ImportFileFormat } from "./types";

export const exportTypeLabels: Record<ExportType, string> = {
  training_plans: "Trainingspläne",
  training_journal: "Trainingstagebuch",
  training_analysis: "Trainingsanalyse",
  athletes: "Sportlerliste",
  club_members: "Mitglieder",
  groups: "Gruppen",
  attendance: "Anwesenheit",
  competitions: "Wettkämpfe",
  start_lists: "Startlisten",
  competition_results: "Ergebnisse",
  materials: "Material",
  goals: "Ziele",
  records: "Rekorde",
  academy_progress: "Akademie-Fortschritt",
};

export type ExportDataset = {
  fileName: string;
  rows: Record<string, unknown>[];
};

export function buildExportDataset(exportType: ExportType, data: PaddleMotionData, user: User): ExportDataset {
  const prefix = exportTypeLabels[exportType].replace(/\s+/g, "-").toLowerCase();
  const fileName = `paddlio-${prefix}-${todayDateKey()}`;

  if (exportType === "training_plans") {
    return {
      fileName,
      rows: data.plan.map((entry) => ({
        Datum: entry.date,
        Uhrzeit: entry.time || entry.startTime,
        Titel: entry.title,
        Bereich: entry.area,
        Trainingsart: entry.trainingType,
        Dauer: entry.durationMinutes,
        Fokus: entry.focus,
        Beschreibung: entry.description,
        Status: entry.status,
        Sportler: entry.assignedAthleteId || entry.athleteId,
        Gruppe: entry.assignedGroupId,
      })),
    };
  }

  if (exportType === "training_journal" || exportType === "training_analysis") {
    return {
      fileName,
      rows: data.training.map((session) => ({
        Datum: session.date,
        Typ: session.type,
        Dauer: session.durationMinutes,
        RPE: session.rpe,
        Fokus: session.focus,
        Notiz: session.note,
        Sportler: session.athleteId,
      })),
    };
  }

  if (exportType === "athletes" || exportType === "club_members") {
    return {
      fileName,
      rows: data.coachAthletes.map((athlete) => ({
        Name: athlete.name,
        Vorname: athlete.firstName,
        Nachname: athlete.lastName,
        EMail: athlete.email,
        Verein: athlete.club,
        Bootsklassen: athlete.boatClasses.join(", "),
        Altersklasse: athlete.ageClass,
        Status: athlete.status,
      })),
    };
  }

  if (exportType === "groups") {
    return {
      fileName,
      rows: data.coachGroups.map((group) => ({
        Gruppe: group.name,
        Beschreibung: group.description,
        Altersklasse: group.ageCategory,
        Fokus: group.trainingFocus,
        Sportler: group.athleteIds.length,
        Status: group.status,
      })),
    };
  }

  if (exportType === "competitions" || exportType === "competition_results" || exportType === "start_lists") {
    return {
      fileName,
      rows: data.competitions.map((competition) => ({
        Datum: competition.date,
        Wettkampf: competition.name,
        Ort: competition.location,
        Gewässer: competition.courseName || competition.course,
        Ebene: competition.level,
        Bootsklasse: competition.boatClass,
        Fahrzeit: competition.run1TimeSeconds,
        Strafsekunden: competition.run1PenaltySeconds,
        Gesamtzeit: competition.run1TotalSeconds ?? competition.bestTotalSeconds,
        Platz: competition.rank,
        Notiz: competition.note,
      })),
    };
  }

  if (exportType === "materials") {
    return {
      fileName,
      rows: data.material.map((item) => ({
        Typ: item.category,
        Name: item.name,
        Status: item.status,
        Bewertung: item.rating,
        Gewicht: item.weightKg,
        Länge: item.lengthCm,
        Notiz: item.note,
      })),
    };
  }

  if (exportType === "goals") {
    return {
      fileName,
      rows: data.goals.map((goal) => ({
        Titel: goal.title,
        Kategorie: goal.category,
        Status: goal.status,
        Aktuell: goal.currentValueOverride,
        Zielwert: goal.targetValue,
        Einheit: goal.unit,
        Fällig: goal.dueDate,
      })),
    };
  }

  if (exportType === "records") {
    return {
      fileName,
      rows: data.personalBests.map((best) => ({
        Bootsklasse: best.boatClass,
        Strecke: best.courseName,
        Ort: best.location,
        Bestzeit: best.bestTimeSeconds,
        Datum: best.achievedAt,
      })),
    };
  }

  if (exportType === "academy_progress") {
    return {
      fileName,
      rows: data.academyProgress
        .filter((progress) => user.role === "admin" || progress.userId === user.userId)
        .map((progress) => ({
          Nutzer: progress.userId,
          Lektion: progress.lessonId,
          Status: progress.status,
          Fortschritt: progress.progressPercent,
          Gestartet: progress.startedAt,
          Abgeschlossen: progress.completedAt,
        })),
    };
  }

  return { fileName, rows: [] };
}

export async function downloadExport(exportType: ExportType, format: Extract<ImportFileFormat, "csv" | "xlsx">, data: PaddleMotionData, user: User): Promise<number> {
  const dataset = buildExportDataset(exportType, data, user);
  if (format === "csv") {
    const csv = rowsToCsv(dataset.rows);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${dataset.fileName}.csv`);
    return dataset.rows.length;
  }

  const XLSX = await import("@e965/xlsx");
  const sheet = XLSX.utils.json_to_sheet(dataset.rows.map(sanitizeRowForSpreadsheet));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Paddlio Export");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${dataset.fileName}.xlsx`);
  return dataset.rows.length;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = [
    columns.map(escapeCsv).join(";"),
    ...rows.map((row) => columns.map((column) => escapeCsv(protectSpreadsheetValue(row[column]))).join(";")),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function sanitizeRowForSpreadsheet(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, protectSpreadsheetValue(value)]));
}

export function protectSpreadsheetValue(value: unknown): unknown {
  if (typeof value !== "string") return value ?? "";
  const trimmed = value.trimStart();
  return /^[=+\-@]/.test(trimmed) ? `'${value}` : value;
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
