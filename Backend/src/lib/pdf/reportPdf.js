import PDFDocument from "pdfkit";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const FONT = "Helvetica";

/**
 * Streaming helpers — "download" (Content-Disposition attachment) sirf render
 * karta hai, koi browser print dialog nahi. Client blob ke taur par save karta hai.
 */
export function streamPdf(res, filename, build) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);
  build(doc);
  doc.end();
}

function header(doc, title, subtitle) {
  doc.font(FONT).fontSize(18).fillColor("#111827").text(title, { align: "center" });
  const now = new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });
  doc.fontSize(10).fillColor("#6b7280").text(subtitle || now, { align: "center" });
  doc.moveDown(0.2);
  doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
  doc.moveDown(0.4);
}

function rowHeight(doc, cells, colWidths, padding) {
  let h = padding * 2;
  cells.forEach((cell, i) => {
    const text = cell == null ? "" : String(cell);
    const th = doc.heightOfString(text, { width: colWidths[i] - padding * 2 });
    h = Math.max(h, th + padding * 2);
  });
  return h;
}

function drawTable(doc, headers, colWidths, rows, opts = {}) {
  const { headerFill = "#f3f4f6", altFill = "#fafafa", padding = 5, headerColor = "#374151" } = opts;
  const pageWidth = doc.page.width - 80;
  const total = colWidths.reduce((a, b) => a + b, 0);

  let y = doc.y;
  const startX = 40;
  const scale = pageWidth / total;
  const widths = colWidths.map((w) => w * scale);

  doc.font(FONT).fontSize(9);
  // Header row
  headers.forEach((h, i) => {
    doc.rect(startX + widths.slice(0, i).reduce((a, b) => a + b, 0), y, widths[i], 20)
      .fill(headerFill);
  });
  doc.fontSize(9).fillColor(headerColor).font(FONT);
  headers.forEach((h, i) => {
    const x = startX + widths.slice(0, i).reduce((a, b) => a + b, 0) + padding;
    doc.text(h, x, y + 5, { width: widths[i] - padding * 2 });
  });
  y += 20;

  rows.forEach((row, rIdx) => {
    const h = rowHeight(doc, row, widths, padding);
    if (y + h > doc.page.height - 60) {
      doc.addPage();
      y = 40;
      // re-draw header
      doc.font(FONT).fontSize(9).fillColor(headerColor).font(FONT);
      headers.forEach((hh, i) => {
        doc.rect(startX + widths.slice(0, i).reduce((a, b) => a + b, 0), y, widths[i], 20).fill(headerFill);
      });
      headers.forEach((hh, i) => {
        const x = startX + widths.slice(0, i).reduce((a, b) => a + b, 0) + padding;
        doc.text(hh, x, y + 5, { width: widths[i] - padding * 2 });
      });
      y += 20;
    }
    const fill = rIdx % 2 === 1 ? altFill : "#ffffff";
    doc.rect(startX, y, pageWidth, h).fill(fill);
    row.forEach((cell, i) => {
      const x = startX + widths.slice(0, i).reduce((a, b) => a + b, 0) + padding;
      const text = cell == null ? "—" : String(cell);
      doc.fillColor("#111827").fontSize(9).font(FONT);
      doc.text(text, x, y + padding, { width: widths[i] - padding * 2 });
    });
    doc.strokeColor("#e5e7eb").lineWidth(0.6)
      .moveTo(startX, y + h).lineTo(startX + pageWidth, y + h).stroke();
    y += h;
  });
  doc.y = y + 6;
}

/**
 * Exam date sheet: paper-wise table (Date | Class | Section | Subject | Time | Room | Marks).
 */
export function buildExamDateSheetPdf(doc, exam, schoolName, papers) {
  header(doc, exam.name || "Date Sheet", `${schoolName} · ${exam.term?.academicYear?.name || ""} · ${exam.term?.name || ""}`);
  const sorted = [...(papers || [])].sort((a, b) => new Date(a.date) - new Date(b.date) || (a.subject?.name || "").localeCompare(b.subject?.name || ""));
  const headers = ["Date", "Day", "Class", "Section", "Subject", "Time", "Room", "Max Marks"];
  const widths = [70, 80, 90, 60, 190, 90, 70, 70];
  const rows = sorted.map((p) => {
    const d = new Date(p.date);
    const day = DAY_NAMES[d.getDay()] || "";
    const time = p.startTime ? `${p.startTime}${p.endTime ? " – " + p.endTime : ""}` : "—";
    return [
      d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
      day,
      p.class?.name || "—",
      p.section?.name || "—",
      p.subject?.name || "—",
      time,
      p.roomNumber || "—",
      p.maxMarks != null ? String(Number(p.maxMarks)) : "—",
    ];
  });
  if (rows.length === 0) {
    doc.fontSize(11).fillColor("#6b7280").text("No papers assigned yet.", 40, doc.y + 10);
    return;
  }
  drawTable(doc, headers, widths, rows);
}

/**
 * Weekly timetable: days as columns, time slots as rows.
 */
export function buildTimetablePdf(doc, title, subtitle, slots) {
  header(doc, title, subtitle);
  const times = new Map();
  slots.forEach((s) => {
    const k = `${s.startTime}-${s.endTime}`;
    if (!times.has(k)) times.set(k, { start: s.startTime, end: s.endTime });
  });
  const timeRows = Array.from(times.values()).sort((a, b) => a.start.localeCompare(b.start));
  const cols = [1, 2, 3, 4, 5, 6, 7];
  const grid = new Map();
  slots.forEach((s) => grid.set(`${s.startTime}-${s.endTime}-${s.dayOfWeek}`, s));

  const headers = ["Time", ...cols.map((d) => DAY_NAMES[d] || "")];
  const widths = [90, 96, 96, 96, 96, 96, 96, 96];
  const rows = timeRows.map((t) => [
    `${t.start} – ${t.end}`,
    ...cols.map((d) => {
      const slot = grid.get(`${t.start}-${t.end}-${d}`);
      return slot ? `${slot.subject?.name || "—"}\n${slot.section?.class?.name || ""} ${slot.section?.name || ""}`.trim() : "";
    }),
  ]);
  if (rows.length === 0) {
    doc.fontSize(11).fillColor("#6b7280").text("No slots in this timetable.", 40, doc.y + 10);
    return;
  }
  drawTable(doc, headers, widths, rows);
}

export default { streamPdf, buildExamDateSheetPdf, buildTimetablePdf };