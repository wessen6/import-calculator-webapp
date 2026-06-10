import mammoth from "mammoth";
import * as XLSX from "xlsx";

function normalizeCell(cell: unknown) {
  return String(cell).replace(/\s+/g, " ").trim();
}

function formatSheetAsText(sheet: XLSX.WorkSheet, sheetName: string) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
  const lines = rows
    .map((row) => row.map(normalizeCell).join("\t"))
    .filter((line) => line.replace(/\t/g, "").length > 0);

  if (lines.length === 0) {
    return "";
  }

  return `Sheet: ${sheetName}\n${lines.join("\n")}`;
}

export function isOfficeDocument(file: File) {
  const name = file.name.toLowerCase();

  return (
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".xlsx") ||
    name.endsWith(".docx")
  );
}

export async function extractTextFromOfficeDocument(file: File) {
  const bytes = await file.arrayBuffer();
  const name = file.name.toLowerCase();

  if (name.endsWith(".xlsx") || file.type.includes("spreadsheetml")) {
    const workbook = XLSX.read(bytes, { type: "array" });
    const parts = workbook.SheetNames.map((sheetName) =>
      formatSheetAsText(workbook.Sheets[sheetName], sheetName)
    ).filter(Boolean);

    return parts.join("\n\n").trim();
  }

  if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(bytes)
    });

    return result.value.trim();
  }

  throw new Error("Неподдерживаемый формат office-документа.");
}
