'use client';

import { useEffect, useState } from 'react';
import { academicService, type Section, type Class } from '@/lib/api/academicService';
import type { AudienceValue } from './ptmFormTypes';
import { cn } from '@/lib/utils';
import PTMClassPicker from './PTMClassPicker';

interface PTMClassRangeFieldsProps {
  classes: Class[];
  value: AudienceValue;
  onChange: (next: Partial<AudienceValue>) => void;
}

export default function PTMClassRangeFields({ classes, value, onChange }: PTMClassRangeFieldsProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  const fromIdx = classes.findIndex((c) => c.id === value.classFromId);
  // To Class is limited to classes after the From Class (same class allowed — single-class scenario)
  const toClasses = fromIdx >= 0 ? classes.slice(fromIdx) : classes;
  const singleClass = Boolean(value.classFromId && value.classFromId === value.classToId);

  useEffect(() => {
    if (!singleClass || !value.classFromId) {
      setSections([]);
      return;
    }
    let alive = true;
    setLoadingSections(true);
    academicService
      .getSectionsByClass(value.classFromId)
      .then((rows) => { if (alive) setSections(rows); })
      .catch(() => { if (alive) setSections([]); })
      .finally(() => { if (alive) setLoadingSections(false); });
    return () => { alive = false; };
  }, [singleClass, value.classFromId]);

  const handleFromChange = (id: string) => {
    const nextFromIdx = classes.findIndex((c) => c.id === id);
    const toStillValid = classes.findIndex((c) => c.id === value.classToId) >= nextFromIdx;
    const patch: Partial<AudienceValue> = { classFromId: id };
    if (!toStillValid) {
      patch.classToId = '';
      patch.sectionIds = [];
    }
    onChange(patch);
  };

  const toggleSection = (id: string, label: string) => {
    const has = value.sectionIds.includes(id);
    onChange({
      sectionIds: has ? value.sectionIds.filter((s) => s !== id) : [...value.sectionIds, id],
      sectionLabels: has ? value.sectionLabels : { ...value.sectionLabels, [id]: label },
    });
  };

  return (
    <div className="space-y-3">
      <PTMClassPicker label="Start class" classes={classes} value={value.classFromId} onChange={handleFromChange} />
      <PTMClassPicker label="End class" classes={toClasses} value={value.classToId}
        disabled={!value.classFromId} onChange={(classToId) => onChange({ classToId })} />

      {singleClass && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            Narrow further? Pick specific sections of this class (optional — leave empty for all):
          </p>
          <div className="flex flex-wrap gap-1.5 min-h-[30px] max-h-24 overflow-y-auto rounded-lg bg-white/70 p-1">
            {sections.map((sec) => (
              <button key={sec.id} type="button" onClick={() => toggleSection(sec.id, sec.name)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                  value.sectionIds.includes(sec.id)
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300')}>
                {sec.name}
              </button>
            ))}
            {!loadingSections && sections.length === 0 && (
              <span className="text-xs text-gray-400 py-1">No sections found in this class.</span>
            )}
          </div>
          {loadingSections && <p className="text-xs text-gray-400 mt-1">Loading sections…</p>}
          {value.sectionIds.length > 0 && (
            <p className="mt-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
              Selected ({value.sectionIds.length}): {value.sectionIds.map((id) => value.sectionLabels[id] ?? '').join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
