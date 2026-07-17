import type { ImportFileFormat, ParsedSheet, ParsedWorkbook } from "./types";
import { dateKeyFromLocalDate } from "../../lib/dateOnly";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function detectFileFormat(fileName: string): ImportFileFormat {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "csv") return "csv";
  if (extension === "xlsx") return "xlsx";
  if (extension === "xls") return "xls";
  if (extension === "ods") return "ods";
  return "unknown";
}

export async function parseImportFile(file: File): Promise<ParsedWorkbook> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Die Datei ist größer als 25 MB und wird aus Sicherheitsgründen blockiert.");
  }

  const fileFormat = detectFileFormat(file.name);
  if (fileFormat === "unknown" || fileFormat === "ods") {
    throw new Error("Dieses Dateiformat wird aktuell noch nicht unterstützt. Bitte XLSX, XLS oder CSV verwenden.");
  }

  const warnings: string[] = [];
  if (fileFormat === "csv") {
    return {
      fileName: file.name,
      fileFormat,
      sheets: [await parseCsvSheet(file, warnings)],
      warnings,
    };
  }

  const buffer = await file.arrayBuffer();
  const XLSX = await import("@e965/xlsx");
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const raw = XLSX.utils.sheet_to_json<Array<string | number | boolean | Date | null>>(sheet, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: "",
    });
    const rows = normalizeRows(raw.map((row) => row.map(formatCell)));
    return toParsedSheet(name, rows);
  });

  return { fileName: file.name, fileFormat, sheets, warnings };
}

async function parseCsvSheet(file: File, warnings: string[]): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  const utf8 = decodeBuffer(buffer, "utf-8");
  const cp1252 = decodeBuffer(buffer, "windows-1252");
  const text = looksLikeMojibake(utf8) && !looksLikeMojibake(cp1252) ? cp1252 : utf8;
  if (text !== utf8) warnings.push("Die Datei wurde als Windows-1252 gelesen, damit Umlaute korrekt bleiben.");

  const delimiter = detectDelimiter(text);
  const rows = normalizeRows(parseDelimitedText(text.replace(/^\uFEFF/, ""), delimiter));
  return toParsedSheet("CSV", rows);
}

function decodeBuffer(buffer: ArrayBuffer, encoding: string) {
  return new TextDecoder(encoding, { fatal: false }).decode(buffer);
}

function looksLikeMojibake(value: string) {
  return /Ã.|ï¿½|�/.test(value);
}

function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 10).join("\n");
  const candidates = [";", ",", "\t"];
  return candidates
    .map((delimiter) => ({ delimiter, count: sample.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ";";
}

function parseDelimitedText(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeRows(rows: string[][]): string[][] {
  const width = Math.max(0, ...rows.map((row) => row.length));
  return rows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => Array.from({ length: width }, (_, index) => row[index]?.trim() ?? ""));
}

function toParsedSheet(name: string, rows: string[][]): ParsedSheet {
  return {
    name,
    rows,
    rowCount: rows.length,
    columnCount: Math.max(0, ...rows.map((row) => row.length)),
    detectedHeaderRow: detectHeaderRow(rows),
  };
}

function detectHeaderRow(rows: string[][]): number {
  const candidates = rows.slice(0, 12).map((row, index) => {
    const filled = row.filter(Boolean).length;
    const textCells = row.filter((cell) => /[a-zA-ZÄÖÜäöüß]/.test(cell)).length;
    const unique = new Set(row.filter(Boolean).map((cell) => cell.toLowerCase())).size;
    const next = rows[index + 1] ?? [];
    const nextFilled = next.filter(Boolean).length;
    return { index, score: textCells * 2 + unique + (nextFilled >= Math.max(2, filled - 1) ? 3 : 0) - (filled <= 1 ? 5 : 0) };
  });
  return candidates.sort((a, b) => b.score - a.score)[0]?.index ?? 0;
}

function formatCell(value: string | number | boolean | Date | null): string {
  if (value instanceof Date) return dateKeyFromLocalDate(value);
  if (value === null || value === undefined) return "";
  return String(value).trim();
}
