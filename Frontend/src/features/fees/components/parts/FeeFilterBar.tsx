import { useState, useEffect } from 'react';
import { Select } from '@/features/shared/components';
import { academicService } from '@/lib/api';
import { MONTH_OPTIONS, YEAR_OPTIONS, STATUS_OPTIONS } from './helpers';

interface FeeFilterBarProps {
  schoolId: string;
  month: string;
  year: string;
  status: string;
  classId: string;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onClassChange: (v: string) => void;
}

export default function FeeFilterBar({ schoolId, month, year, status, classId, onMonthChange, onYearChange, onStatusChange, onClassChange }: FeeFilterBarProps) {
  const now = new Date();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    academicService.getClassesBySchool(schoolId)
      .then((data) => setClasses(data.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, [schoolId]);

  const isDefault = month === String(now.getMonth() + 1) && year === String(now.getFullYear()) && !status && !classId;
  const activeCount = (status ? 1 : 0) + (classId ? 1 : 0) + (month !== String(now.getMonth() + 1) ? 1 : 0) + (year !== String(now.getFullYear()) ? 1 : 0);

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Filters</p>
            {activeCount > 0 && <p className="text-[10px] text-primary-500 font-medium">{activeCount} active</p>}
          </div>
        </div>

        <div className="h-px sm:h-8 sm:w-px bg-gray-100" />

        {/* Filter selects */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Month</span>
            <Select options={MONTH_OPTIONS} value={month} onChange={(e) => onMonthChange(e.target.value)} className="w-32 !h-9 !text-xs !rounded-xl !border-gray-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Year</span>
            <Select options={YEAR_OPTIONS} value={year} onChange={(e) => onYearChange(e.target.value)} className="w-24 !h-9 !text-xs !rounded-xl !border-gray-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Class</span>
            <Select options={[{ value: '', label: 'All Classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]} value={classId} onChange={(e) => onClassChange(e.target.value)} className="w-36 !h-9 !text-xs !rounded-xl !border-gray-200" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Status</span>
            <Select options={[{ value: '', label: 'All' }, ...STATUS_OPTIONS]} value={status} onChange={(e) => onStatusChange(e.target.value)} className="w-32 !h-9 !text-xs !rounded-xl !border-gray-200" />
          </div>
        </div>

        {/* Reset */}
        {!isDefault && (
          <button onClick={() => { onMonthChange(String(now.getMonth() + 1)); onYearChange(String(now.getFullYear())); onStatusChange(''); onClassChange(''); }}
            className="flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl transition-all duration-150 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {!isDefault && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 border-t border-gray-50 pt-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active:</span>
          {month !== String(now.getMonth() + 1) && (
            <Pill label={MONTH_OPTIONS.find((o) => o.value === month)?.label ?? month} onRemove={() => onMonthChange(String(now.getMonth() + 1))} />
          )}
          {year !== String(now.getFullYear()) && (
            <Pill label={year} onRemove={() => onYearChange(String(now.getFullYear()))} />
          )}
          {classId && (
            <Pill label={classes.find((c) => c.id === classId)?.name ?? 'Class'} onRemove={() => onClassChange('')} />
          )}
          {statusLabel && (
            <Pill label={statusLabel} variant="warning" onRemove={() => onStatusChange('')} />
          )}
        </div>
      )}
    </div>
  );
}

function Pill({ label, variant, onRemove }: { label: string; variant?: string; onRemove: () => void }) {
  const cls = variant === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-primary-50 text-primary-700 border-primary-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70 ml-0.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
