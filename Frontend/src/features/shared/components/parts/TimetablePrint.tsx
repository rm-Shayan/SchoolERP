'use client';

import type { TimetableSlot } from '@/lib/api/timetableService';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function openTimetablePrint(slots: TimetableSlot[], title: string) {
  const cols = [1, 2, 3, 4, 5, 6, 7];
  const times = new Map<string, { start: string; end: string }>();
  slots.forEach((s) => {
    const k = `${s.startTime}-${s.endTime}`;
    if (!times.has(k)) times.set(k, { start: s.startTime, end: s.endTime });
  });
  const timeRows = Array.from(times.values()).sort((a, b) => a.start.localeCompare(b.start));
  const grid = new Map<string, TimetableSlot>();
  slots.forEach((s) => grid.set(`${s.startTime}-${s.endTime}-${s.dayOfWeek}`, s));

  const rows = timeRows.map((tr) => {
    const cells = cols.map((d) => {
      const slot = grid.get(`${tr.start}-${tr.end}-${d}`);
      return slot ? `<td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:13px"><b>${slot.subject?.name ?? '—'}</b><br/><span style="font-size:11px;color:#6b7280">${slot.section?.class?.name ?? ''} ${slot.section?.name ?? ''}</span></td>` : '<td style="padding:6px 8px;border:1px solid #e5e7eb;color:#d1d5db;text-align:center">—</td>';
    }).join('');
    return `<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:12px;font-weight:600;color:#6b7280;white-space:nowrap">${tr.start} – ${tr.end}</td>${cells}</tr>`;
  }).join('');

  const headerCells = cols.map((d) => `<th style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280">${DAY_NAMES[d]}</th>`).join('');

  const html = `<!DOCTYPE html><html><head><title>${title}</title>
<style>@media print { body { margin: 0; } }</style></head>
<body style="font-family:system-ui,sans-serif;padding:24px">
<h2 style="margin:0 0 4px;font-size:18px">${title}</h2>
<p style="margin:0 0 16px;font-size:12px;color:#9ca3af">Generated ${new Date().toLocaleDateString()}</p>
<table style="width:100%;border-collapse:collapse">
<thead><tr><th style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;width:100px">Time</th>${headerCells}</tr></thead>
<tbody>${rows}</tbody>
</table>
<div style="margin-top:20px;text-align:center"><button onclick="window.print()" style="padding:8px 24px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;font-size:13px">🖨️ Print / Save as PDF</button></div>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}
