import type { ExportJob, ImportProfile, ImportReport, ImportRowStatus } from "../features/importExport/types";
import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload } from "./cloudIds";
import { enqueueSyncChange } from "./syncService";

const tableUpsert = async (tableName: string, payload: Record<string, unknown>): Promise<void> => {
  const cloudPayload = sanitizeCloudPayload(payload);
  const client = getSupabaseClient();
  if (!client || !navigator.onLine) {
    enqueueSyncChange({ tableName, action: "upsert", payload: cloudPayload });
    return;
  }
  const { error } = await (client.from(tableName) as any).upsert(cloudPayload, { onConflict: "id" });
  if (error) throw error;
};

const tableList = async <T,>(tableName: string, mapper: (row: any) => T): Promise<T[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from(tableName) as any).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapper);
};

export const upsertCloudImportJob = (report: ImportReport): Promise<void> =>
  tableUpsert("import_jobs", {
    id: report.id,
    user_id: report.userId,
    club_id: report.clubId || null,
    import_type: report.importType,
    source_type: report.sourceType,
    file_name: report.fileName,
    file_format: report.fileFormat,
    status: report.status,
    total_rows: report.totalRows,
    valid_rows: report.validRows,
    warning_rows: report.warningRows,
    error_rows: report.errorRows,
    created_rows: report.createdRows,
    updated_rows: report.updatedRows,
    skipped_rows: report.skippedRows,
    errors: report.errors,
    warnings: report.warnings,
    started_at: report.startedAt,
    completed_at: report.completedAt,
    created_at: report.startedAt,
  });

export const listCloudImportJobs = (): Promise<ImportReport[]> =>
  tableList("import_jobs", (row) => ({
    id: row.id,
    userId: row.user_id,
    clubId: row.club_id ?? "",
    importType: row.import_type,
    sourceType: row.source_type ?? "file",
    fileName: row.file_name ?? "",
    fileFormat: row.file_format ?? "unknown",
    status: row.status ?? "imported",
    totalRows: row.total_rows ?? 0,
    validRows: row.valid_rows ?? 0,
    warningRows: row.warning_rows ?? 0,
    errorRows: row.error_rows ?? 0,
    createdRows: row.created_rows ?? 0,
    updatedRows: row.updated_rows ?? 0,
    skippedRows: row.skipped_rows ?? 0,
    errors: row.errors ?? [],
    warnings: row.warnings ?? [],
    startedAt: row.started_at ?? row.created_at,
    completedAt: row.completed_at ?? row.created_at,
  }));

export const upsertCloudImportProfile = (profile: ImportProfile): Promise<void> =>
  tableUpsert("import_profiles", {
    id: profile.id,
    user_id: profile.userId,
    club_id: profile.clubId || null,
    name: profile.name,
    import_type: profile.importType,
    file_format: profile.fileFormat,
    sheet_name: profile.sheetName,
    header_row: profile.headerRow,
    mapping: profile.mapping,
    transformations: profile.transformations,
    defaults: profile.defaults,
    conflict_rules: profile.conflictRules,
    is_system: profile.isSystem,
    is_active: profile.isActive,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  });

export const listCloudImportProfiles = (): Promise<ImportProfile[]> =>
  tableList("import_profiles", (row) => ({
    id: row.id,
    userId: row.user_id,
    clubId: row.club_id ?? "",
    name: row.name,
    importType: row.import_type,
    fileFormat: row.file_format ?? "unknown",
    sheetName: row.sheet_name ?? "",
    headerRow: row.header_row ?? 0,
    mapping: row.mapping ?? [],
    transformations: row.transformations ?? {},
    defaults: row.defaults ?? {},
    conflictRules: row.conflict_rules ?? {},
    isSystem: Boolean(row.is_system),
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

export const upsertCloudImportRow = (payload: {
  id: string;
  importJobId: string;
  rowNumber: number;
  status: ImportRowStatus;
  sourceData: Record<string, unknown>;
  transformedData: Record<string, unknown>;
  errors: unknown[];
  warnings: unknown[];
  targetTable?: string;
  targetId?: string;
  createdAt: string;
}): Promise<void> =>
  tableUpsert("import_rows", {
    id: payload.id,
    import_job_id: payload.importJobId,
    row_number: payload.rowNumber,
    status: payload.status,
    source_data: payload.sourceData,
    transformed_data: payload.transformedData,
    errors: payload.errors,
    warnings: payload.warnings,
    target_table: payload.targetTable || null,
    target_id: payload.targetId || null,
    created_at: payload.createdAt,
  });

export const upsertCloudExportJob = (job: ExportJob): Promise<void> =>
  tableUpsert("export_jobs", {
    id: job.id,
    user_id: job.userId,
    club_id: job.clubId || null,
    export_type: job.exportType,
    format: job.format,
    filters: job.filters,
    selected_columns: job.selectedColumns,
    status: job.status,
    row_count: job.rowCount,
    file_name: job.fileName,
    created_at: job.createdAt,
    completed_at: job.completedAt,
  });
