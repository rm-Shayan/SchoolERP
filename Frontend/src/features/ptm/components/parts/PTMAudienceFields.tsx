'use client';

import { useEffect, useState } from 'react';
import { academicService, type Section } from '@/lib/api/academicService';
import { studentService } from '@/lib/api/studentService';
import type { Student } from '@/types';
import type { PTMScope } from '@/lib/api/ptmService';
import type { Class } from '@/lib/api/academicService';
import { Input, Select } from '@/features/shared/components';
import { useDebouncedValue } from '@/lib/utils';
import type { AudienceValue } from './ptmFormTypes';
import { cn } from '@/lib/utils';
import PTMClassRangeFields from './PTMClassRangeFields';

interface PTMAudienceFieldsProps {
  schoolId: string;
  classes: Class[];
  scope: PTMScope;
  value: AudienceValue;
  onChange: (next: Partial<AudienceValue>) => void;
}

const classOptions = (classes: Class[]) => classes.map((c) => ({ value: c.id, label: c.name }));

export default function PTMAudienceFields({ schoolId, classes, scope, value, onChange }: PTMAudienceFieldsProps) {
  const [activeClassId, setActiveClassId] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    if (!activeClassId) { setSections([]); return; }
    academicService.getSectionsByClass(activeClassId).then(setSections).catch(() => setSections([]));
  }, [activeClassId]);

  useEffect(() => {
    if (scope !== 'STUDENT' || debouncedQuery.trim().length < 2) { setResults([]); return; }
    let alive = true;
    setSearching(true);
    studentService.getAll({ schoolId, search: debouncedQuery.trim(), pageSize: 20 })
      .then((items) => { if (alive) setResults(items); })
      .catch(() => { if (alive) setResults([]); })
      .finally(() => { if (alive) setSearching(false); });
    return () => { alive = false; };
  }, [debouncedQuery, schoolId, scope]);

  if (scope === 'CLASS_RANGE') {
    return <PTMClassRangeFields classes={classes} value={value} onChange={onChange} />;
  }

  if (scope === 'SECTIONS') {
    const toggle = (id: string, label: string) => {
      const has = value.sectionIds.includes(id);
      onChange({
        sectionIds: has ? value.sectionIds.filter((s) => s !== id) : [...value.sectionIds, id],
        sectionLabels: has ? value.sectionLabels : { ...value.sectionLabels, [id]: label },
      });
    };
    return (
      <div className="space-y-3">
        <Select label="Browse Class" placeholder="Select a class to load its sections"
          options={classOptions(classes)} value={activeClassId} onChange={(e) => setActiveClassId(e.target.value)} />
        <div className="flex flex-wrap gap-1.5 min-h-[34px]">
          {sections.length > 0 ? sections.map((sec) => (
            <button key={sec.id} type="button" onClick={() => toggle(sec.id, sec.name)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                value.sectionIds.includes(sec.id)
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300')}>
              {sec.name}
            </button>
          )) : <span className="text-xs text-gray-400 py-1">Load a class above, then tap its sections.</span>}
        </div>
        {value.sectionIds.length > 0 && (
          <p className="text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
            Selected ({value.sectionIds.length}): {value.sectionIds.map((id) => value.sectionLabels[id] ?? id.slice(0, 8)).join(', ')}
          </p>
        )}
      </div>
    );
  }

  if (scope === 'STUDENT') {
    return (
      <div className="space-y-2">
        <Input label="Student" name="studentSearch" placeholder="Type at least 2 letters of the name…"
          value={query} onChange={(e) => setQuery(e.target.value)} />
        {value.student && (
          <p className="text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
            Picked: {value.student.label}
            <button type="button" className="ml-2 underline hover:no-underline" onClick={() => onChange({ student: null })}>change</button>
          </p>
        )}
        {!value.student && results.length > 0 && (
          <ul className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
            {results.map((st) => (
              <li key={st.id}>
                <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50/60"
                  onClick={() => { onChange({ student: { id: st.id, label: `${st.firstName} ${st.lastName}` } }); setQuery(''); setResults([]); }}>
                  <span className="font-medium">{st.firstName} {st.lastName}</span>
                  <span className="ml-2 text-xs text-gray-500">Roll {st.rollNumber}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {searching && <p className="text-xs text-gray-400">Searching…</p>}
      </div>
    );
  }
  return null;
}
