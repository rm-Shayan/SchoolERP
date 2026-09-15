'use client';

import { useEffect, useMemo, useState } from 'react';
import { ptmService } from '@/lib/api';
import type { PTMEvent } from '@/lib/api/ptmService';
import { Select } from '@/features/shared/components';

interface Props {
  schoolId?: string;
  sectionId?: string;
  studentId?: string;
  value?: string;
  onChange: (value: string) => void;
}

const isInScope = (ptm: PTMEvent, sectionId?: string, studentId?: string) => {
  if (ptm.scope === 'WHOLE_SCHOOL') return true;
  if (ptm.scope === 'STUDENT') return !!studentId && ptm.studentId === studentId;
  return !!sectionId && ptm.sectionIds.includes(sectionId);
};

export default function PTMPicker({ schoolId, sectionId, studentId, value, onChange }: Props) {
  const [sessions, setSessions] = useState<PTMEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!schoolId) { setSessions([]); return; }
    setLoading(true);
    ptmService.getBySchool(schoolId)
      .then((items) => setSessions([...items].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const options = useMemo(() => {
    const valid = sessions.filter((ptm) => isInScope(ptm, sectionId, studentId));
    return valid.map((ptm) => ({
      value: ptm.id,
      label: `${ptm.title} · ${new Date(ptm.scheduledAt).toLocaleDateString()}`,
    }));
  }, [sessions, sectionId, studentId]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading PTM sessions…</p>;
  }

  if (options.length === 0) {
    return <p className="text-xs text-gray-400">No PTM session found for this student — remark will not be linked to a PTM.</p>;
  }

  return (
    <Select
      label="Link to PTM (optional)"
      placeholder="No PTM (standalone remark)"
      options={options}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}