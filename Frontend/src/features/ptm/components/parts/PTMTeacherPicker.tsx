'use client';

import { useEffect, useState } from 'react';
import { staffService } from '@/lib/api';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

interface PTMTeacherPickerProps {
  schoolId: string;
  value: string[];
  onChange: (ids: string[]) => void;
}

/** Multi-select list of the school's active teachers — who will attend the PTM. */
export default function PTMTeacherPicker({ schoolId, value, onChange }: PTMTeacherPickerProps) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    staffService.getAll({ schoolId, pageSize: 500 })
      .then((res) => {
        if (!alive) return;
        setTeachers(res.items.filter((u) => u.role === 'TEACHER' && u.isActive));
      })
      .catch(() => alive && setTeachers([]))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [schoolId]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  const selectAll = () =>
    onChange(value.length === teachers.length ? [] : teachers.map((t) => t.id));

  return (
    <div>
      <div className="flex items-center justify-end mb-1">
        {!loading && teachers.length > 0 && (
          <button type="button" onClick={selectAll} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            {value.length === teachers.length ? 'Clear all' : `Select all (${teachers.length})`}
          </button>
        )}
      </div>
      {loading ? (
        <div className="h-20 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
      ) : teachers.length === 0 ? (
        <p className="text-xs text-gray-400 rounded-xl border border-dashed border-gray-200 px-3 py-3">No active teachers found in this branch.</p>
      ) : (
        <ul className="max-h-32 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white">
          {teachers.map((t) => (
            <li key={t.id}>
              <label className={cn('flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm', value.includes(t.id) && 'bg-primary-50/70')}>
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={value.includes(t.id)} onChange={() => toggle(t.id)} />
                <span className="truncate">{t.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {value.length > 0 && <p className="mt-1 text-xs text-primary-700 font-medium">{value.length} teacher(s) selected</p>}
    </div>
  );
}
