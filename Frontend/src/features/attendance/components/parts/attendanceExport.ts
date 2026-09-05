import { downloadBlob } from '@/lib/utils';
import type { AttendanceRecord } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: '#22c55e', LATE: '#f59e0b', ABSENT: '#ef4444',
  LEAVE: '#3b82f6', HALF_DAY: '#0891b2', MANUAL_OVERRIDE: '#a855f7',
};

/** Generate a simple CSV from attendance records */
export function exportToCsv(records: AttendanceRecord[], filename: string) {
  const header = ['Student Name', 'Roll #', 'Date', 'Status', 'Check In', 'Check Out', 'Remarks'];
  const rows = records.map((r) => [
    `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.trim(),
    String(r.student?.rollNumber ?? ''),
    new Date(r.date).toLocaleDateString('en-PK'),
    r.status.replace('_', ' '),
    r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '',
    r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '',
    r.remarks ?? '',
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

/** Generate an HTML-table-based Excel file (no xlsx dependency needed) */
export function exportToExcel(records: AttendanceRecord[], filename: string, sectionLabel: string) {
  const rows = records.map((r) => ({
    name: `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.trim(),
    roll: r.student?.rollNumber ?? '',
    date: new Date(r.date).toLocaleDateString('en-PK'),
    status: r.status.replace('_', ' '),
    checkIn: r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—',
    checkOut: r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—',
    remarks: r.remarks ?? '',
  }));

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8">
<style>td{mso-number-format:"\\@"}th{background:#1e3a8a;color:#fff;font-weight:700;padding:6px 10px;border:1px solid #ccc}td{padding:5px 10px;border:1px solid #ddd}.present{color:#16a34a}.late{color:#d97706}.absent{color:#dc2626}.leave{color:#2563eb}.half_day{color:#0891b2}.manual_override{color:#9333ea}</style>
</head><body><h2>${sectionLabel} — Attendance Report</h2>
<table><tr><th>Student</th><th>Roll #</th><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Remarks</th></tr>
${rows.map((r) => `<tr><td>${r.name}</td><td>${r.roll}</td><td>${r.date}</td><td class="${r.status.toLowerCase()}">${r.status}</td><td>${r.checkIn}</td><td>${r.checkOut}</td><td>${r.remarks}</td></tr>`).join('')}
</table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${filename}.xls`);
}

export { STATUS_COLORS };
