import { describe, expect, it } from "vitest";
import { parseImportFile } from "./parser";

describe("import file parser", () => {
  it("reads quoted CSV rows and detects the delimiter", async () => {
    const file = new File(["Titel;Beschreibung\nTest;\"Technik; ruhig\""], "training.csv", { type: "text/csv" });
    const workbook = await parseImportFile(file);
    expect(workbook.fileFormat).toBe("csv");
    expect(workbook.sheets[0].rows[1]).toEqual(["Test", "Technik; ruhig"]);
  });

  it.each(["xlsx", "xls"] as const)("reads a real %s workbook", async (extension) => {
    const XLSX = await import("@e965/xlsx");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ["Datum", "Titel", "Dauer"],
      ["2026-10-02", "Fiktives Training", 60],
    ]), "Training");
    const output = XLSX.write(workbook, { type: "array", bookType: extension });
    const mime = extension === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/vnd.ms-excel";
    const file = new File([output], `training.${extension}`, { type: mime });
    const parsed = await parseImportFile(file);
    expect(parsed.fileFormat).toBe(extension);
    expect(parsed.sheets[0].rows[1]).toEqual(["2026-10-02", "Fiktives Training", "60"]);
  });
});
