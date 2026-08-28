'use client';

import { useState, useEffect } from 'react';
import { academicService, type Class, type Section } from '@/lib/api/academicService';
import { Select, Button } from '@/features/shared/components';

interface PTMFilterBarProps {
  classes: Class[];
  selectedClassId: string;
  selectedSectionId: string;
  onClassChange: (id: string) => void;
  onSectionChange: (id: string) => void;
  onClear: () => void;
}

export default function PTMFilterBar({ classes, selectedClassId, selectedSectionId, onClassChange, onSectionChange, onClear }: PTMFilterBarProps) {
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (!selectedClassId) { setSections([]); return; }
    academicService.getSectionsByClass(selectedClassId).then(setSections).catch(() => setSections([]));
  }, [selectedClassId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Select
        label="Class"
        placeholder="All classes"
        options={classes.map((c) => ({ value: c.id, label: c.name }))}
        value={selectedClassId}
        onChange={(e) => onClassChange(e.target.value)}
      />
      <Select
        label="Section"
        placeholder={selectedClassId ? 'All sections' : 'Select class first'}
        options={sections.map((s) => ({ value: s.id, label: s.name }))}
        value={selectedSectionId}
        onChange={(e) => onSectionChange(e.target.value)}
        disabled={!selectedClassId}
      />
      <div className="flex items-end">
        {(selectedClassId || selectedSectionId) && (
          <Button variant="ghost" size="sm" onClick={onClear}>Clear filters</Button>
        )}
      </div>
    </div>
  );
}
