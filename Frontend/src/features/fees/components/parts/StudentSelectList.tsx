'use client';

import { useState, useMemo } from 'react';
import type { Student } from '@/types';

interface Props {
  students: Student[];
  selected: Set<string>;
  loading: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
}

export default function StudentSelectList({ students, selected, loading, onToggle, onToggleAll, allSelected, someSelected }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      String(s.rollNumber).includes(q)
    );
  }, [students, search]);

  const filteredSelected = useMemo(() => filtered.filter((s) => selected.has(s.id)).length, [filtered, selected]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Search + select-all header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected; }}
            onChange={onToggleAll}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span className="text-sm font-medium text-gray-700">
            {loading ? 'Loading...' : search
              ? `${filteredSelected}/${filtered.length} shown (${selected.size}/${students.length} total)`
              : `${selected.size} / ${students.length} students`}
          </span>
        </label>
        {students.length > 5 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or roll #..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
        )}
      </div>

      {/* Student list */}
      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
        {filtered.map((s) => (
          <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={selected.has(s.id)} onChange={() => onToggle(s.id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-gray-900 truncate">{s.firstName} {s.lastName}</span>
            <span className="text-xs text-gray-400 ml-auto shrink-0">#{s.rollNumber}</span>
          </label>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="px-3 py-4 text-sm text-gray-400 text-center">
            {search ? 'No students match your search' : 'No active students in this class'}
          </p>
        )}
      </div>
    </div>
  );
}
