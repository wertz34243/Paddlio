import { useEffect, useMemo, useState } from "react";
import { createId } from "../data/storage";
import { analyzeWorkbook, executeImport, importTypeLabels, updateAnalysisMapping } from "../features/importExport/engine";
import { downloadExport, exportTypeLabels } from "../features/importExport/exportBuilder";
import { parseImportFile } from "../features/importExport/parser";
import type { ExportJob, ExportType, ImportAnalysis, ImportField, ImportFileFormat, ImportProfile, ImportReport, ImportType, ParsedWorkbook } from "../features/importExport/types";
import { requiredFieldsFor, supportedImportTypes, targetFieldLabels } from "../features/importExport/mappings";
import type { PaddleMotionData, User } from "../domain/types";
import { listCloudImportJobs, listCloudImportProfiles, upsertCloudExportJob, upsertCloudImportJob, upsertCloudImportProfile, upsertCloudImportRow } from "../services/importExportService";

type ImportExportViewProps = {
  data: PaddleMotionData;
  user: User;
  onDataChange: (updater: (current: PaddleMotionData) => PaddleMotionData) => void;
};

type Panel = "import" | "export" | "history" | "profiles" | "help";

const importSteps = ["Datei", "Zuordnung", "Prüfung", "Import", "Bericht"];
const previewLimit = 20;
const storableRowLimit = 100;

const exportTypes: ExportType[] = [
  "training_plans",
  "training_journal",
  "athletes",
  "club_members",
  "groups",
  "competitions",
  "competition_results",
  "materials",
  "goals",
  "records",
  "academy_progress",
];

export function ImportExportView({ data, user, onDataChange }: ImportExportViewProps) {
  const [panel, setPanel] = useState<Panel>("import");
  const [importType, setImportType] = useState<ImportType>("athletes");
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [headerRow, setHeaderRow] = useState(0);
  const [fileError, setFileError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profiles, setProfiles] = useState<ImportProfile[]>([]);
  const [history, setHistory] = useState<ImportReport[]>([]);
  const [exportType, setExportType] = useState<ExportType>("training_plans");
  const [exportFormat, setExportFormat] = useState<Extract<ImportFileFormat, "csv" | "xlsx">>("xlsx");
  const [lastExportRows, setLastExportRows] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([listCloudImportJobs(), listCloudImportProfiles()])
      .then(([jobs, cloudProfiles]) => {
        setHistory(jobs);
        setProfiles(cloudProfiles.filter((profile) => profile.isActive));
      })
      .catch((error) => console.warn("Import-/Exporthistorie konnte nicht geladen werden.", error));
  }, []);

  const criticalErrors = useMemo(
    () => analysis?.previewRows.reduce((sum, row) => sum + row.issues.filter((issue) => issue.severity === "error").length, 0) ?? 0,
    [analysis],
  );
  const warnings = useMemo(
    () => analysis?.previewRows.reduce((sum, row) => sum + row.issues.filter((issue) => issue.severity === "warning").length, 0) ?? 0,
    [analysis],
  );

  const currentStep = report ? 4 : confirmed ? 3 : analysis ? (criticalErrors > 0 ? 2 : 2) : workbook ? 1 : 0;

  const refreshAnalysis = (nextWorkbook = workbook, nextImportType = importType, nextSheet = sheetName, nextHeader = headerRow) => {
    if (!nextWorkbook) return;
    const nextAnalysis = analyzeWorkbook(nextWorkbook, nextImportType, nextSheet || undefined, nextHeader);
    setAnalysis(nextAnalysis);
    setSheetName(nextAnalysis.sheetName);
    setHeaderRow(nextAnalysis.headerRow);
    setConfirmed(false);
    setReport(null);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setFileError("");
    setReport(null);
    setConfirmed(false);
    try {
      const parsed = await parseImportFile(file);
      setWorkbook(parsed);
      const nextAnalysis = analyzeWorkbook(parsed, importType);
      setAnalysis(nextAnalysis);
      setSheetName(nextAnalysis.sheetName);
      setHeaderRow(nextAnalysis.headerRow);
    } catch (error) {
      setWorkbook(null);
      setAnalysis(null);
      setFileError(error instanceof Error ? error.message : "Die Datei konnte nicht gelesen werden.");
    }
  };

  const saveProfile = async () => {
    if (!analysis || !profileName.trim()) return;
    const timestamp = new Date().toISOString();
    const profile: ImportProfile = {
      id: createId("import-profile"),
      userId: user.userId,
      clubId: user.profile.club,
      name: profileName.trim(),
      importType: analysis.importType,
      fileFormat: analysis.fileFormat,
      sheetName: analysis.sheetName,
      headerRow: analysis.headerRow,
      mapping: analysis.mappings,
      transformations: {},
      defaults: {},
      conflictRules: {},
      isSystem: false,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setProfiles((items) => [profile, ...items]);
    setProfileName("");
    await upsertCloudImportProfile(profile).catch((error) => console.warn("Importprofil konnte nicht synchronisiert werden.", error));
  };

  const runImport = async () => {
    if (!analysis || criticalErrors > 0 || !confirmed) return;
    const result = executeImport(analysis, data, user);
    onDataChange(() => result.data);
    setReport(result.report);
    setHistory((items) => [result.report, ...items]);
    await upsertCloudImportJob(result.report).catch((error) => console.warn("Importbericht konnte nicht synchronisiert werden.", error));
    await Promise.all(
      analysis.previewRows.slice(0, storableRowLimit).map((row) =>
        upsertCloudImportRow({
          id: createId("import-row"),
          importJobId: result.report.id,
          rowNumber: row.rowNumber,
          status: row.status,
          sourceData: row.original,
          transformedData: row.transformed,
          errors: row.issues.filter((issue) => issue.severity === "error"),
          warnings: row.issues.filter((issue) => issue.severity === "warning"),
          createdAt: result.report.completedAt,
        }).catch((error) => console.warn("Importzeile konnte nicht synchronisiert werden.", error)),
      ),
    );
  };

  const runExport = async () => {
    const rowCount = await downloadExport(exportType, exportFormat, data, user);
    const timestamp = new Date().toISOString();
    const job: ExportJob = {
      id: createId("export-job"),
      userId: user.userId,
      clubId: user.profile.club,
      exportType,
      format: exportFormat,
      filters: {},
      selectedColumns: [],
      status: "created",
      rowCount,
      fileName: `${exportTypeLabels[exportType]} ${timestamp.slice(0, 10)}`,
      createdAt: timestamp,
      completedAt: timestamp,
    };
    setLastExportRows(rowCount);
    await upsertCloudExportJob(job).catch((error) => console.warn("Exportbericht konnte nicht synchronisiert werden.", error));
  };

  return (
    <section className="import-export-view stack">
      <header className="import-export-hero">
        <div>
          <p className="eyebrow">Integrationen</p>
          <h2>Import & Export</h2>
          <p>Excel- und CSV-Dateien zuerst prüfen, sicher zuordnen und erst nach Bestätigung übernehmen.</p>
        </div>
        <div className="import-export-status">
          <strong>Keine Überschreibung ohne Bestätigung</strong>
          <span>XLSX, XLS und CSV</span>
        </div>
      </header>

      <nav className="import-export-tabs" aria-label="Import und Export">
        {(["import", "export", "history", "profiles", "help"] as Panel[]).map((item) => (
          <button className={panel === item ? "active" : ""} key={item} type="button" onClick={() => setPanel(item)}>
            {panelLabel(item)}
          </button>
        ))}
      </nav>

      {panel === "import" ? (
        <div className="import-export-panel">
          <ol className="import-stepper" aria-label="Import-Schritte">
            {importSteps.map((step, index) => (
              <li className={index <= currentStep ? "active" : ""} key={step}>
                <span>{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          <section className="import-grid">
            <div className="import-card">
              <p className="eyebrow">1. Importart</p>
              <select value={importType} onChange={(event) => {
                const nextType = event.target.value as ImportType;
                setImportType(nextType);
                refreshAnalysis(workbook, nextType, sheetName, headerRow);
              }}>
                {supportedImportTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
              <p className="muted">Pflichtfelder: {requiredFieldsFor(importType).map((field) => targetFieldLabels[field]).join(", ") || "keine"}</p>
            </div>

            <div className="import-card">
              <p className="eyebrow">2. Datei</p>
              <label className="file-drop">
                <input accept=".xlsx,.xls,.csv" type="file" onChange={(event) => void handleFile(event.target.files?.[0] ?? null)} />
                <strong>Datei auswählen</strong>
                <span>Maximal 25 MB. CSV-Trennzeichen und Umlaute werden automatisch geprüft.</span>
              </label>
              {fileError ? <p className="error-text">{fileError}</p> : null}
            </div>
          </section>

          {workbook && analysis ? (
            <>
              <section className="import-card">
                <div className="import-card-header">
                  <div>
                    <p className="eyebrow">Dateianalyse</p>
                    <h3>{analysis.fileName}</h3>
                    <p>{analysis.totalRows} Datenzeilen, {analysis.headers.length} Spalten, Erkennung {Math.round(analysis.confidence * 100)}%</p>
                  </div>
                  <div className="import-summary-pills">
                    <span className="ok">{analysis.validRows} gültig</span>
                    <span className="warn">{analysis.warningRows} Warnungen</span>
                    <span className="danger">{analysis.errorRows} Fehler</span>
                  </div>
                </div>
                <div className="import-controls">
                  <label>
                    Tabellenblatt
                    <select value={sheetName} onChange={(event) => {
                      setSheetName(event.target.value);
                      refreshAnalysis(workbook, importType, event.target.value, headerRow);
                    }}>
                      {workbook.sheets.map((sheet) => <option key={sheet.name} value={sheet.name}>{sheet.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Kopfzeile
                    <input min={1} type="number" value={headerRow + 1} onChange={(event) => {
                      const next = Math.max(0, Number(event.target.value) - 1);
                      setHeaderRow(next);
                      refreshAnalysis(workbook, importType, sheetName, next);
                    }} />
                  </label>
                </div>
                {analysis.warnings.length ? <p className="warning-text">{analysis.warnings.join(" ")}</p> : null}
              </section>

              <section className="import-card">
                <div className="import-card-header">
                  <div>
                    <p className="eyebrow">Spaltenzuordnung</p>
                    <h3>Excel-Spalten zu Paddlio-Feldern</h3>
                  </div>
                  <div className="profile-save">
                    <input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Profilname, z. B. MKC Mitgliederliste" />
                    <button type="button" onClick={() => void saveProfile()} disabled={!profileName.trim()}>Profil speichern</button>
                  </div>
                </div>
                <div className="mapping-list">
                  {analysis.mappings.map((mapping) => (
                    <div className="mapping-row" key={mapping.sourceIndex}>
                      <div>
                        <strong>{mapping.sourceHeader}</strong>
                        <small>{mapping.sampleValues.slice(0, 2).join(" · ") || "keine Beispiele"}</small>
                      </div>
                      <select value={mapping.targetField} onChange={(event) => setAnalysis(updateAnalysisMapping(analysis, mapping.sourceIndex, event.target.value as ImportField))}>
                        {Object.entries(targetFieldLabels).map(([field, label]) => (
                          <option key={field} value={field}>{label}</option>
                        ))}
                      </select>
                      <span>{Math.round(mapping.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="import-card">
                <div className="import-card-header">
                  <div>
                    <p className="eyebrow">Vorschau & Validierung</p>
                    <h3>Vor dem Import prüfen</h3>
                  </div>
                  <p>{criticalErrors > 0 ? "Kritische Fehler blockieren den Import." : "Keine kritischen Fehler gefunden."}</p>
                </div>
                <div className="preview-table-wrap">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Zeile</th>
                        <th>Status</th>
                        <th>Daten</th>
                        <th>Hinweise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.previewRows.slice(0, previewLimit).map((row) => (
                        <tr className={`status-${row.status}`} key={row.rowNumber}>
                          <td>{row.rowNumber}</td>
                          <td>{row.status}</td>
                          <td>{Object.entries(row.transformed).map(([key, value]) => `${targetFieldLabels[key as ImportField] ?? key}: ${String(value)}`).join(" · ")}</td>
                          <td>{row.issues.map((issue) => issue.message).join(" · ") || "ok"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <label className="confirm-row">
                  <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={criticalErrors > 0} />
                  Ich habe Vorschau, Warnungen und Konflikte geprüft. Bestehende Daten werden nicht automatisch gelöscht.
                </label>
                <button className="primary-action" type="button" onClick={() => void runImport()} disabled={!confirmed || criticalErrors > 0}>
                  Jetzt importieren
                </button>
                {report ? <ImportReportSummary report={report} /> : null}
              </section>
            </>
          ) : null}
        </div>
      ) : null}

      {panel === "export" ? (
        <section className="import-export-panel import-card">
          <p className="eyebrow">Export-Assistent</p>
          <h3>Datenbereich auswählen</h3>
          <div className="import-controls">
            <label>
              Bereich
              <select value={exportType} onChange={(event) => setExportType(event.target.value as ExportType)}>
                {exportTypes.map((type) => <option key={type} value={type}>{exportTypeLabels[type]}</option>)}
              </select>
            </label>
            <label>
              Format
              <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as Extract<ImportFileFormat, "csv" | "xlsx">)}>
                <option value="xlsx">XLSX</option>
                <option value="csv">CSV</option>
              </select>
            </label>
          </div>
          <p className="muted">CSV- und Excel-Exports schützen Werte, die sonst als Formel interpretiert werden könnten.</p>
          <button className="primary-action" type="button" onClick={() => void runExport()}>Export erstellen</button>
          {lastExportRows !== null ? <p className="success-text">{lastExportRows} Datensätze exportiert.</p> : null}
        </section>
      ) : null}

      {panel === "history" ? (
        <section className="import-export-panel import-card">
          <p className="eyebrow">Importhistorie</p>
          <h3>Nachvollziehbare Importe</h3>
          <div className="history-list">
            {history.length ? history.map((item) => <ImportReportSummary key={item.id} report={item} compact />) : <p className="empty-text">Noch keine Importe.</p>}
          </div>
        </section>
      ) : null}

      {panel === "profiles" ? (
        <section className="import-export-panel import-card">
          <p className="eyebrow">Importprofile</p>
          <h3>Gespeicherte Zuordnungen</h3>
          <div className="history-list">
            {profiles.length ? profiles.map((profile) => (
              <article className="history-item" key={profile.id}>
                <strong>{profile.name}</strong>
                <span>{importTypeLabels[profile.importType]} · {profile.mapping.length} Spalten · Kopfzeile {profile.headerRow + 1}</span>
              </article>
            )) : <p className="empty-text">Noch keine Importprofile gespeichert.</p>}
          </div>
        </section>
      ) : null}

      {panel === "help" ? (
        <section className="import-export-panel import-card">
          <p className="eyebrow">Hilfe</p>
          <h3>So bereitest du Dateien vor</h3>
          <ul className="help-list">
            <li>Kopfzeilen klar benennen, zum Beispiel Name, Vorname, Nachname, Datum, Bootsklasse.</li>
            <li>Datumswerte als TT.MM.JJJJ oder JJJJ-MM-TT speichern.</li>
            <li>Bei Ergebnissen Fahrzeit und Strafsekunden getrennt führen.</li>
            <li>Warnungen prüfen, kritische Fehler vor dem Import korrigieren.</li>
            <li>Importprofile für wiederkehrende Vereinslisten speichern.</li>
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function ImportReportSummary({ report, compact }: { report: ImportReport; compact?: boolean }) {
  return (
    <article className="history-item">
      <strong>{importTypeLabels[report.importType]} · {report.fileName}</strong>
      <span>{report.totalRows} verarbeitet · {report.createdRows} neu · {report.skippedRows} übersprungen · {report.errorRows} Fehler</span>
      {!compact ? <span>Abgeschlossen: {new Date(report.completedAt).toLocaleString("de-DE")}</span> : null}
    </article>
  );
}

function panelLabel(panel: Panel) {
  if (panel === "import") return "Import";
  if (panel === "export") return "Export";
  if (panel === "history") return "Historie";
  if (panel === "profiles") return "Profile";
  return "Hilfe";
}
