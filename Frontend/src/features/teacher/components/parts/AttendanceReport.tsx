'use client';

import type { StaffAttendanceRecord } from '@/lib/api/staffAttendanceService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_COLOR: Record<string, string> = {
  PRESENT: '#10b981', LATE: '#f59e0b', ABSENT: '#ef4444', LEAVE: '#0ea5e9', HALF_DAY: '#f97316',
};

interface ReportData {
  staffName: string;
  month: number;
  year: number;
  records: StaffAttendanceRecord[];
  summary: Record<string, number>;
  workingDays: number;
}

export function openAttendanceReport(data: ReportData) {
  const present = (data.summary['PRESENT'] ?? 0) + (data.summary['LATE'] ?? 0);
  const rate = data.workingDays > 0 ? Math.round((present / data.workingDays) * 100) : 0;
  const monthName = MONTHS[data.month - 1];

  const rows = data.records
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r) => {
      const d = new Date(r.date);
      const day = d.toLocaleDateString('en-PK', { weekday: 'short' });
      const date = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
      const inTime = r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—';
      const color = STATUS_COLOR[r.status] ?? '#6b7280';
      return `<tr>
        <td>${day}</td><td>${date}</td>
        <td style="color:${color};font-weight:600">${r.status}</td>
        <td>${inTime}</td>
        <td>${r.remarks || ''}</td>
      </tr>`;
    }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Attendance Report — ${monthName} ${data.year}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;padding:40px;color:#1f2937}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #e5e7eb;padding-bottom:16px}
  .header h1{font-size:22px;font-weight:700}
  .header p{font-size:13px;color:#6b7280;margin-top:4px}
  .stats{display:flex;gap:24px;margin-bottom:24px}
  .stat{text-align:center;padding:12px 20px;border:1px solid #e5e7eb;border-radius:8px}
  .stat .val{font-size:24px;font-weight:700}
  .stat .lbl{font-size:11px;color:#6b7280;text-transform:uppercase;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f9fafb;text-align:left;padding:8px 12px;font-weight:600;border-bottom:2px solid #e5e7eb}
  td{padding:8px 12px;border-bottom:1px solid #f3f4f6}
  tr:nth-child(even){background:#f9fafb}
  .footer{margin-top:24px;font-size:11px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:12px}
  @media print{body{padding:20px}.no-print{display:none}}
</style></head><body>
<div class="no-print" style="text-align:right;margin-bottom:12px">
  <button onclick="window.print()" style="padding:8px 16px;background:#6366f1;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨️ Print / Save as PDF</button>
</div>
<div class="header">
  <div><h1>Monthly Attendance Report</h1><p>${data.staffName} — ${monthName} ${data.year}</p></div>
  <div style="text-align:right"><p style="font-size:20px;font-weight:700;color:${rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444'}">${rate}%</p><p style="font-size:11px;color:#6b7280">Attendance Rate</p></div>
</div>
<div class="stats">
  ${['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HALF_DAY'].map((s) =>
    `<div class="stat"><div class="val" style="color:${STATUS_COLOR[s]}">${data.summary[s] ?? 0}</div><div class="lbl">${s.replace('_', ' ')}</div></div>`
  ).join('')}
  <div class="stat"><div class="val">${data.workingDays}</div><div class="lbl">Working Days</div></div>
</div>
<table><thead><tr><th>Day</th><th>Date</th><th>Status</th><th>Check In</th><th>Remarks</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer">Generated on ${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • School ERP</div>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export function downloadAttendanceCSV(data: ReportData) {
  const sorted = [...data.records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const header = 'Day,Date,Status,Check In,Remarks';
  const rows = sorted.map((r) => {
    const d = new Date(r.date);
    const day = d.toLocaleDateString('en-PK', { weekday: 'short' });
    const date = d.toISOString().slice(0, 10);
    const inTime = r.checkIn ? new Date(r.checkIn).toISOString().slice(11, 16) : '';
    const remarks = (r.remarks ?? '').replace(/"/g, '""');
    return [day, date, r.status, inTime, remarks].join(',');
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-${MONTHS[data.month - 1].toLowerCase()}-${data.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
