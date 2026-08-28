'use client';

import { useEffect, useState } from 'react';
import { academicService } from '@/lib/api';

export interface SectionOption {
  id: string;
  label: string;
}

/** School ki saari classes ke sections — `Class — Section` labels ke sath flatten. */
export default function useSectionOptions(schoolId?: string | null) {
  const [sections, setSections] = useState<SectionOption[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    // Backend listClassesBySchool nested sections include karta hai — ek hi request
    academicService
      .getClassesBySchool(schoolId)
      .then((classes) => {
        if (cancelled) return;
        const opts: SectionOption[] = [];
        for (const c of classes) {
          (c.sections ?? []).forEach((s) => opts.push({ id: s.id, label: `${c.name} — ${s.name}` }));
        }
        setSections(opts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  return sections;
}
