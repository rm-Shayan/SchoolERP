'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Card, EmptyState } from '@/features/shared/components';
import StudyMaterialCard from '@/features/shared/components/parts/StudyMaterialCard';
import { TYPE_CONFIG } from '@/features/shared/components/parts/studyMaterialHelpers';
import { portalDataService } from '@/lib/api/portalDataService';
import type { StudyMaterial } from '@/lib/api/studyMaterialService';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'DOCUMENT', label: 'Documents' },
  { key: 'VIDEO', label: 'Videos' },
  { key: 'IMAGE', label: 'Images' },
  { key: 'LINK', label: 'Links' },
];

export default function StudyMaterialsTab() {
  const { organization, school } = useAppSelector((s) => s.auth);
  const themeColor = organization?.themeColor || undefined;
  const [items, setItems] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    portalDataService
      .getStudyMaterials()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === 'ALL' ? items : items.filter((i) => i.type === filter)),
    [items, filter],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState title="No study materials" description="Your teachers haven't uploaded any materials yet." />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={
              filter === f.key
                ? { backgroundColor: themeColor || undefined, color: themeColor ? '#fff' : undefined }
                : { backgroundColor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.6)' }
            }
          >
            {f.label}
            {f.key !== 'ALL' && (
              <span className="ml-1 opacity-70">
                {items.filter((i) => i.type === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8">
          <EmptyState title={`No ${TYPE_CONFIG[filter]?.label.toLowerCase() ?? ''} materials`} description="Nothing here yet for this category." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <StudyMaterialCard key={item.id} item={item} showActions={false} />
          ))}
        </div>
      )}
    </div>
  );
}
