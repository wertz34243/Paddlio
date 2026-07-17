export type ImportType =
  | "athletes"
  | "training_plans"
  | "training_sessions"
  | "start_lists"
  | "competition_results"
  | "club_members"
  | "groups"
  | "materials";

export type ExportType =
  | "training_plans"
  | "training_journal"
  | "training_analysis"
  | "athletes"
  | "club_members"
  | "groups"
  | "attendance"
  | "competitions"
  | "start_lists"
  | "competition_results"
  | "materials"
  | "goals"
  | "records"
  | "academy_progress";

export type ImportSourceType = "file" | "polar" | "garmin" | "gpx" | "fit" | "api" | "manual";
export type ImportFileFormat = "csv" | "xlsx" | "xls" | "ods" | "unknown";
export type ImportSeverity = "info" | "warning" | "error";
export type ImportRowStatus = "valid" | "warning" | "error" | "ignored";
export type ImportJobStatus = "draft" | "preview" | "validated" | "imported" | "failed";
export type ConflictMode = "create" | "update" | "skip" | "merge" | "manual";

export type ParsedWorkbook = {
  fileName: string;
  fileFormat: ImportFileFormat;
  sheets: ParsedSheet[];
  warnings: string[];
};

export type ParsedSheet = {
  name: string;
  rows: string[][];
  rowCount: number;
  columnCount: number;
  detectedHeaderRow: number;
};

export type ImportField =
  | "ignore"
  | "fullName"
  | "firstName"
  | "lastName"
  | "email"
  | "birthDate"
  | "club"
  | "boatClass"
  | "ageClass"
  | "date"
  | "time"
  | "durationMinutes"
  | "title"
  | "focus"
  | "description"
  | "trainingType"
  | "group"
  | "athlete"
  | "startNumber"
  | "rank"
  | "run"
  | "rawTime"
  | "penaltySeconds"
  | "materialType"
  | "materialName"
  | "condition"
  | "inventoryNumber";

export type ColumnMapping = {
  sourceIndex: number;
  sourceHeader: string;
  targetField: ImportField;
  confidence: number;
  sampleValues: string[];
};

export type ImportIssue = {
  severity: ImportSeverity;
  field?: ImportField;
  message: string;
};

export type ImportPreviewRow = {
  rowNumber: number;
  original: Record<string, string>;
  transformed: Record<string, unknown>;
  status: ImportRowStatus;
  issues: ImportIssue[];
  conflict?: {
    mode: ConflictMode;
    message: string;
    existingId?: string;
  };
};

export type ImportAnalysis = {
  importType: ImportType;
  fileName: string;
  fileFormat: ImportFileFormat;
  sheetName: string;
  headerRow: number;
  headers: string[];
  dataRows: string[][];
  mappings: ColumnMapping[];
  previewRows: ImportPreviewRow[];
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  confidence: number;
  warnings: string[];
};

export type ImportProfile = {
  id: string;
  userId: string;
  clubId: string;
  name: string;
  importType: ImportType;
  fileFormat: ImportFileFormat;
  sheetName: string;
  headerRow: number;
  mapping: ColumnMapping[];
  transformations: Record<string, unknown>;
  defaults: Record<string, unknown>;
  conflictRules: Record<string, ConflictMode>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ImportReport = {
  id: string;
  userId: string;
  clubId: string;
  importType: ImportType;
  sourceType: ImportSourceType;
  fileName: string;
  fileFormat: ImportFileFormat;
  status: ImportJobStatus;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  startedAt: string;
  completedAt: string;
};

export type ExportJob = {
  id: string;
  userId: string;
  clubId: string;
  exportType: ExportType;
  format: "csv" | "xlsx";
  filters: Record<string, unknown>;
  selectedColumns: string[];
  status: "created" | "failed";
  rowCount: number;
  fileName: string;
  createdAt: string;
  completedAt: string;
};
