'use client';

import type { ReactNode } from 'react';
import type { Student } from '@/types';

interface RowProps {
  label: string;
  children: ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <tr>
      <td className="w-36 px-4 py-2.5 align-top text-xs font-medium uppercase tracking-wide text-gray-400 sm:w-44">
        {label}
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-800 break-words">{children}</td>
    </tr>
  );
}

// Student info ek clean table me — labels left, values right, subtle dividers.
export function StudentDetailsTable({ student }: { student: Student }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full">
        <tbody className="divide-y divide-gray-100">
          <Row label="QR / Identifier">
            <code className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700">{student.identifierCode}</code>
          </Row>
          <Row label="Class / Section">
            {student.section?.class?.name ? `${student.section.class.name} — ${student.section.name}` : '—'}
          </Row>
          <Row label="Roll Number">{student.rollNumber || '—'}</Row>
          {student.gender && <Row label="Gender"><span className="capitalize">{student.gender.toLowerCase()}</span></Row>}
          {student.dob && <Row label="Date of Birth">{student.dob.slice(0, 10)}</Row>}
          <Row label="Parent">{student.parent?.name || '—'}</Row>
          <Row label="WhatsApp">{student.parent?.whatsappNo || '—'}</Row>
          <Row label="Phone">{student.parent?.phone || '—'}</Row>
          <Row label="Email">{student.parent?.email || '—'}</Row>
          {student.parent?.address && <Row label="Address">{student.parent.address}</Row>}
        </tbody>
      </table>
    </div>
  );
}
