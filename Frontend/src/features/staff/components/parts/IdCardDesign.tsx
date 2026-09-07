'use client';

import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { documentsApi } from '@/lib/api/documents';

interface Props {
  member: User;
  school: any;
  org: any;
}

export default function IdCardDesign({ member, school, org }: Props) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    documentsApi
      .staffQr(member.id)
      .then((d: string) => active && setQr(d))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [member.id]);

  const initials = member.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="id-card relative w-[3.375in] h-[2.125in] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col print:shadow-none print:border print:w-[85.6mm] print:h-[54mm] print:rounded print:border-slate-300 font-sans">
      <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-1.5 flex items-center gap-2">
        {(school?.logoUrl || org?.logoUrl) && (
          <img src={school?.logoUrl || org?.logoUrl} alt="Logo" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/30" />
        )}
        <div className="min-w-0">
          <p className="text-white font-bold text-[10px] leading-tight tracking-tight truncate">
            {org?.name || 'School'}
          </p>
          <p className="text-slate-300 text-[8px] leading-tight truncate">{school?.name || ''}</p>
        </div>
      </div>

      <div className="flex-1 flex gap-2.5 px-3 py-2">
        <div className="w-[1.05in] h-[1.05in] rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-slate-400">{initials}</span>
          )}
        </div>

        <div className="relative flex-1 min-w-0 flex flex-col pb-[0.95in]">
          <p className="font-bold text-slate-900 text-[13px] leading-tight tracking-tight truncate">{member.name}</p>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-700">{member.role}</p>
          <div className="mt-1 space-y-[2px] text-[8px] text-slate-500">
            <p>
              <span className="font-semibold text-slate-600">ID:</span> {member.username || 'N/A'}
            </p>
            {member.phone && (
              <p>
                <span className="font-semibold text-slate-600">Ph:</span> {member.phone}
              </p>
            )}
            <p className="truncate">
              <span className="font-semibold text-slate-600">Email:</span> {member.email}
            </p>
          </div>

          <div className="absolute right-0 bottom-0 w-[0.85in] h-[0.85in] rounded-md border border-slate-200 bg-white p-1 flex items-center justify-center">
            {qr ? (
              <img src={qr} alt="QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded animate-pulse" />
            )}
            <span className="absolute -bottom-[9px] left-0 right-0 text-center text-[5px] font-semibold tracking-wide text-slate-400">
              SCAN TO CHECK-IN
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-100 px-3 py-1 flex justify-between items-center">
        <p className="text-[7px] font-medium text-slate-400">VALID: 2026-2027</p>
        <p className="text-[7px] font-mono text-slate-400">{member.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  );
}
