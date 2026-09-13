/**
 * Shared Excel (.xlsx/.csv) export builder — consistent, styled sheets for
 * every export. The header row is ALWAYS written (even with zero data), so
 * an export never produces a null/empty workbook.
 */
import xlsx from "xlsx-js-style";

const HEADER_FILL = "4F46E5"; // indigo — brand accent
const HEADER_FONT = { bold: true, sz: 11, color: { rgb: "FFFFFF" } };
const HEADER_ALIGN = { horizontal: "center", vertical: "center" };
const BODY_ALIGN = { vertical: "top" };
const MAX_COL = 48;

function toCell(v) {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return String(v);
}

/**
 * @param {object} opts
 * @param {string} opts.sheetName  sheet tab name
 * @param {string[]} opts.columns  ordered header labels
 * @param {object[]|array[]} opts.rows  data rows (objects keyed by column label, or arrays)
 * @param {"xlsx"|"csv"} [opts.bookType]  output format (default xlsx)
 */
export function buildExcelBuffer({ sheetName, columns = [], rows = [], bookType = "xlsx" }) {
  const data = rows.map((row) =>
    Array.isArray(row)
      ? columns.map((_, i) => toCell(row[i]))
      : columns.map((col) => toCell(row[col]))
  );

  const ws = xlsx.utils.aoa_to_sheet([columns, ...data]);

  ws["!cols"] = columns.map((label, i) => {
    const width = data.reduce((m, r) => Math.max(m, String(r[i] ?? "").length), label.length);
    return { wch: Math.min(Math.max(width + 2, 12), MAX_COL) };
  });

  for (let c = 0; c < columns.length; c++) {
    const addr = xlsx.utils.encode_cell({ r: 0, c });
    ws[addr] = {
      ...(ws[addr] || { t: "s", v: columns[c] }),
      s: { font: HEADER_FONT, fill: { fgColor: { rgb: HEADER_FILL } }, alignment: HEADER_ALIGN },
    };
  }

  ws["!rows"] = [{ hpt: 22 }];
  for (let r = 1; r <= data.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const addr = xlsx.utils.encode_cell({ r, c });
      if (ws[addr]) ws[addr].s = { alignment: BODY_ALIGN };
    }
  }

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  return xlsx.write(wb, { type: "buffer", bookType });
}