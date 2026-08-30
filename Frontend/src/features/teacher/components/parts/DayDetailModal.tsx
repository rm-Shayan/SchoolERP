'use client';

import { memo } from 'react';
import type { StaffAttendanceRecord } from '@/lib/api/staffAttendanceService';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  PRESENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✅' },
  LATE: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⏰' },
  ABSENT: { bg: 'bg-rose-50', text: 'text-rose-700', icon: '❌' },
  LEAVE: { bg: 'bg-sky-50', text: 'text-sky-700', icon: '🏖️' },
  HALF_DAY: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🔸' },
};

interface DayDetailModalProps {
  record: StaffAttendanceRecord | null;
  dateStr: string;
  onClose: () => void;
}

const DayDetailModal = memo(function DayDetailModal({ record, dateStr, onClose }: DayDetailModalProps) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = d.toLocaleDateString('en-PK', { weekday: 'long' });
  const dateFormatted = d.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  const config = record ? STATUS_CONFIG[record.status] : null;

  const inTime = record?.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('px-5 py-4', config?.bg ?? 'bg-gray-50')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{dayName}</p>
              <p className="text-sm font-semibold text-gray-900">{dateFormatted}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {record ? (
            <>
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config?.icon}</span>
                <div>
                  <p className={cn('text-lg font-bold', config?.text)}>{record.status.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-400">Status</p>
                </div>
              </div>

              {/* Times */}
              <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Check In</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{inTime ?? '—'}</p>
              </div>

              {/* Remarks */}
              {record.remarks && (
                <div className="rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Remarks</p>
                  <p className="text-sm text-gray-600 mt-0.5">{record.remarks}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <span className="text-3xl">📭</span>
              <p className="text-sm text-gray-500 mt-2">No attendance recorded</p>
              <p className="text-xs text-gray-400">This day has no record yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default DayDetailModal;
