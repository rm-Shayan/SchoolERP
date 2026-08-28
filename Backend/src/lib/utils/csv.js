/**
 * Shared CSV helpers — ek hi escaping rule har export ke liye
 * (student, admission, fee, promotion, auth users).
 */

/** CSV cell escape: quotes/commas/newlines wali values double-quote mein wrap. */
export function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Header + row arrays se poora CSV string banao. */
export function buildCsv(header, rows) {
  const lines = [header.join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  return { csv: lines.join("\n"), total: rows.length };
}

/** Controller helper: CSV response headers set karke body bhejo. */
export function sendCsv(res, csv, filename) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csv);
}
